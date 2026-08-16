import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Chip, ChipGroup, PrimaryButton, SecondaryButton } from '@/components/kit';
import { Gate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { GANTT_HOURS, TASK_CODES, workOrderStatusLabel } from '@/lib/catalog';
import { addDaysISO, formatClock, formatDay, todayISO } from '@/lib/dates';
import { geofenceStatus, readGps } from '@/lib/geo';
import { formatM } from '@/lib/units';
import { createId } from '@/lib/id';
import { dayHoursFor, entryHours, formatHours, hourLabel, openEntryFor, splitOt } from '@/lib/labor';
import type { CrewMember, Jobsite, Shift, TimeEntry } from '@/lib/types';

const PANES = [
  { id: 'clock', label: 'Clock' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'subs', label: 'Subs' },
] as const;

export default function LaborScreen() {
  const router = useRouter();
  const { can } = useAuth();
  const { jobsite, jobsites, allCrew, assets, timeEntries, shifts, workOrders, saveTimeEntry, saveShift } = useFieldOps();
  const [pane, setPane] = useState<(typeof PANES)[number]['id']>('clock');
  const [taskCode, setTaskCode] = useState(TASK_CODES[0]);
  const [day, setDay] = useState(todayISO());
  const [now, setNow] = useState(Date.now());
  const [fix, setFix] = useState<{ meters: number | null; inside: boolean } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!jobsite) return;
    let cancelled = false;
    (async () => {
      const gps = await readGps();
      if (cancelled) return;
      setFix(geofenceStatus({ siteLat: jobsite.lat, siteLng: jobsite.lng, radiusM: jobsite.geofenceRadiusM, ...gps }));
    })();
    return () => {
      cancelled = true;
    };
  }, [jobsite]);

  const dayShifts = useMemo(
    () => shifts.filter((shift) => shift.date === day).sort((a, b) => a.startHour - b.startHour),
    [shifts, day],
  );
  const openCount = timeEntries.filter((entry) => entry.clockOut == null).length;
  const waiting = workOrders.filter((order) => order.status === 'offered').length;

  async function clockIn(member: CrewMember) {
    if (!jobsite) return;
    const open = openEntryFor(timeEntries, member.id);
    if (open) {
      Alert.alert('Already on the clock', `${member.name} needs to clock out first.`);
      return;
    }
    const gps = await readGps();
    const fence = geofenceStatus({
      siteLat: jobsite.lat,
      siteLng: jobsite.lng,
      radiusM: jobsite.geofenceRadiusM,
      ...gps,
    });
    setFix(fence);
    if (!fence.inside) {
      const ok = await ask(
        gps.lat == null ? 'No GPS' : 'Outside the fence',
        gps.lat == null
          ? `Clock ${member.name} at ${jobsite.name} without a location fix?`
          : `${member.name} is ${fence.meters} m from the pin (fence ${formatM(jobsite.geofenceRadiusM)}). Clock in anyway?`,
      );
      if (!ok) return;
    }
    await saveTimeEntry({
      id: createId(),
      jobsiteId: jobsite.id,
      crewId: member.id,
      crewName: member.name,
      taskCode,
      clockIn: Date.now(),
      clockOut: null,
      lat: gps.lat,
      lng: gps.lng,
      accuracyM: gps.accuracyM ?? null,
      insideGeofence: fence.inside,
    });
  }

  async function clockOut(entry: TimeEntry) {
    const hours = entryHours({ ...entry, clockOut: Date.now() });
    const ot = splitOt(hours);
    await saveTimeEntry({ ...entry, clockOut: Date.now() });
    Alert.alert(
      'Clocked out',
      ot.overtime > 0
        ? `${formatHours(ot.regular)} regular · ${formatHours(ot.overtime)} OT`
        : formatHours(ot.total),
    );
  }

  if (!can('labor_clock') && !can('work_orders')) return <Gate feature="labor_clock">{null}</Gate>;

  return (
    <Screen
      footer={
        pane === 'dispatch' ? (
          <PrimaryButton label="Assign shift" onPress={() => router.push('/shift/new' as never)} />
        ) : pane === 'subs' ? (
          <PrimaryButton label="New work order" onPress={() => router.push('/work-order/new' as never)} />
        ) : null
      }>
      <Text style={type.title}>Labor</Text>
      <Text style={type.meta}>
        {openCount} on the clock · {waiting} work order{waiting === 1 ? '' : 's'} waiting
      </Text>
      <ChipGroup>
        {PANES.map((item) => (
          <Chip key={item.id} label={item.label} selected={pane === item.id} onPress={() => setPane(item.id)} />
        ))}
      </ChipGroup>

      {pane === 'clock' ? (
        <>
          <View style={styles.hero}>
            <Text style={type.label}>GEOFENCE</Text>
            <Text style={styles.heroValue}>{jobsite?.name ?? 'No site'}</Text>
            <Text style={styles.heroMeta}>
              {fix == null
                ? 'Getting location…'
                : fix.meters == null
                  ? `No GPS · fence ${formatM(jobsite?.geofenceRadiusM ?? 0)}`
                  : `${fix.inside ? 'Inside' : 'Outside'} · ${fix.meters} m from pin · ${formatM(jobsite?.geofenceRadiusM ?? 0)} fence`}
            </Text>
          </View>
          <Text style={type.label}>TASK CODE</Text>
          <ChipGroup>
            {TASK_CODES.map((code) => (
              <Chip key={code} label={code} selected={taskCode === code} onPress={() => setTaskCode(code)} />
            ))}
          </ChipGroup>
          {allCrew.map((member) => {
            const open = openEntryFor(timeEntries, member.id);
            const hours = dayHoursFor(timeEntries, member.id, todayISO(), now);
            const ot = splitOt(hours);
            return (
              <View key={member.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{member.name}</Text>
                  <Text style={type.meta}>
                    {member.role} · {member.company}
                    {open
                      ? ` · ${open.taskCode} since ${formatClock(open.clockIn)}${open.insideGeofence ? '' : ' · outside fence'}`
                      : hours > 0
                        ? ` · ${formatHours(hours)} today`
                        : ' · Off clock'}
                    {ot.overtime > 0 ? ` · ${formatHours(ot.overtime)} OT` : ''}
                  </Text>
                </View>
                {open ? (
                  <SecondaryButton label="Out" onPress={() => clockOut(open)} />
                ) : (
                  <PrimaryButton label="In" onPress={() => clockIn(member)} style={styles.clockBtn} />
                )}
              </View>
            );
          })}
        </>
      ) : null}

      {pane === 'dispatch' ? (
        <>
          <ChipGroup>
            {[0, 1, 2].map((offset) => {
              const iso = addDaysISO(todayISO(), offset);
              return (
                <Chip
                  key={iso}
                  label={offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : formatDay(iso)}
                  selected={day === iso}
                  onPress={() => setDay(iso)}
                />
              );
            })}
          </ChipGroup>
          <Card style={{ gap: 12 }}>
            <Text style={type.label}>{formatDay(day).toUpperCase()}</Text>
            <View style={styles.ganttHead}>
              <View style={styles.nameCol} />
              <View style={styles.track}>
                {GANTT_HOURS.filter((_, i) => i % 2 === 0).map((hour) => (
                  <Text key={hour} style={styles.ganttHour}>
                    {hourLabel(hour)}
                  </Text>
                ))}
              </View>
            </View>
            {dayShifts.length === 0 ? <Text style={type.meta}>Nobody assigned this day.</Text> : null}
            {dayShifts.map((shift) => (
              <GanttRow
                key={shift.id}
                shift={shift}
                site={jobsites.find((site) => site.id === shift.jobsiteId)}
                assetLabel={assets.find((asset) => asset.id === shift.assetId)?.unitNumber ?? null}
                onAlert={() => saveShift({ ...shift, alertSent: true })}
              />
            ))}
          </Card>
        </>
      ) : null}

      {pane === 'subs' ? (
        workOrders.length === 0 ? (
          <Text style={type.meta}>No work orders yet.</Text>
        ) : (
          workOrders
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((order) => (
              <Pressable key={order.id} onPress={() => router.push(`/work-order/${order.id}` as never)} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {order.number} · {order.title}
                  </Text>
                  <Text style={type.meta}>
                    {order.company} · {workOrderStatusLabel(order.status)}
                    {jobsites.find((site) => site.id === order.jobsiteId)
                      ? ` · ${jobsites.find((site) => site.id === order.jobsiteId)?.name}`
                      : ''}
                  </Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))
        )
      ) : null}
    </Screen>
  );
}

function GanttRow({
  shift,
  site,
  assetLabel,
  onAlert,
}: {
  shift: Shift;
  site?: Jobsite;
  assetLabel: string | null;
  onAlert: () => void;
}) {
  const span = 12;
  const left = (Math.max(6, shift.startHour) - 6) / span;
  const width = (Math.min(18, shift.endHour) - Math.max(6, shift.startHour)) / span;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.ganttHead}>
        <View style={styles.nameCol}>
          <Text style={styles.ganttName} numberOfLines={1}>
            {shift.crewName}
          </Text>
          <Text style={type.meta} numberOfLines={1}>
            {site?.name.replace('Riverside Warehouse — ', '') ?? 'Site'}
            {assetLabel ? ` · ${assetLabel}` : ''}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.bar, { left: `${left * 100}%`, width: `${width * 100}%` }]} />
        </View>
      </View>
      {shift.alertSent ? (
        <Text style={type.meta}>SMS / push queued</Text>
      ) : (
        <SecondaryButton label="Queue SMS / push" onPress={onAlert} />
      )}
    </View>
  );
}

function ask(title: string, message: string) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Clock in', onPress: () => resolve(true) },
    ]);
  });
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  heroValue: { color: colors.white, fontSize: 22, fontWeight: '800' },
  heroMeta: { color: '#C9D3DC', fontWeight: '600' },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  clockBtn: { minWidth: 72, paddingHorizontal: 12 },
  chev: { fontSize: 28, color: colors.muted, marginTop: -4 },
  ganttHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameCol: { width: 118 },
  ganttName: { fontWeight: '800', color: colors.ink },
  track: {
    flex: 1,
    height: 28,
    backgroundColor: '#EEE6D8',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  ganttHour: { flex: 1, fontSize: 11, color: colors.muted, fontWeight: '700' },
  bar: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: colors.orange,
    borderRadius: 6,
  },
});
