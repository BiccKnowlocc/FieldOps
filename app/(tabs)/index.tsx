import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { SyncBanner } from '@/components/SyncBanner';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { useOfficeLayout } from '@/hooks/useOfficeLayout';
import { delayLabel, weatherLabel } from '@/lib/catalog';
import { formatDay, todayISO } from '@/lib/dates';

export default function TodayScreen() {
  const router = useRouter();
  const office = useOfficeLayout();
  const { jobsite, logs, punchItems, crew, media, operatorName } = useFieldOps();
  const today = todayISO();
  const todayLog = logs.find((log) => log.logDate === today);
  const openPunches = punchItems.filter((item) => item.status !== 'closed');
  const critical = openPunches.filter((item) => item.priority === 'critical' || item.priority === 'high');

  return (
    <Screen>
      <Text style={type.meta}>Good to go, {operatorName}</Text>
      <Text style={type.title}>{jobsite?.name ?? 'Select a jobsite'}</Text>
      <Text style={styles.address}>{jobsite?.address}</Text>
      <SyncBanner />

      <View style={office ? styles.grid : styles.stack}>
        <Card style={styles.tile}>
          <Text style={type.label}>TODAY’S LOG</Text>
          {todayLog ? (
            <>
              <Text style={styles.stat}>{weatherLabel(todayLog.weather)} · {todayLog.tempF}°F</Text>
              <Text style={styles.body}>{todayLog.crewIds.length} on site · {todayLog.workChips.join(', ') || 'No work tagged'}</Text>
              {todayLog.delays.length > 0 ? (
                <Text style={styles.delay}>
                  Delay: {todayLog.delays.map((d) => `${delayLabel(d.type)} ${d.hours}h`).join(', ')}
                </Text>
              ) : (
                <Text style={styles.body}>No delays logged</Text>
              )}
              <PrimaryButton label="Continue log" onPress={() => router.push(`/log/${todayLog.id}`)} />
            </>
          ) : (
            <>
              <Text style={styles.stat}>Not started</Text>
              <Text style={styles.body}>{formatDay(today)} — tap to log weather, crew, and work.</Text>
              <PrimaryButton label="Start today’s log" onPress={() => router.push('/log/new')} />
            </>
          )}
        </Card>

        <Card style={styles.tile}>
          <Text style={type.label}>PUNCH LIST</Text>
          <Text style={styles.stat}>{openPunches.length} open</Text>
          <Text style={styles.body}>{critical.length} high / critical · {crew.length} crew on roster</Text>
          <PrimaryButton label="Add punch item" onPress={() => router.push('/punch/new')} />
          <SecondaryButton label="Open list" onPress={() => router.push('/punch')} />
        </Card>
      </View>

      <View style={office ? styles.grid : styles.stack}>
        <QuickAction label="Capture progress photo" onPress={() => router.push('/capture')} />
        <QuickAction label={`${media.length} photos on this job`} onPress={() => router.push('/capture')} />
      </View>

      {openPunches.slice(0, office ? 8 : 4).length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={type.label}>NEEDS ATTENTION</Text>
          {openPunches.slice(0, office ? 8 : 4).map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/punch/${item.id}`)} style={styles.row}>
              <View style={[styles.priority, item.priority === 'critical' || item.priority === 'high' ? styles.hot : styles.mid]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={type.meta}>{item.company} · due {item.dueDate}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quick}>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  address: { ...type.meta, marginTop: -8 },
  grid: { flexDirection: 'row', gap: 12 },
  stack: { gap: 12 },
  tile: { flex: 1, gap: 10 },
  stat: { fontSize: 26, fontWeight: '800', color: colors.ink },
  body: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  delay: { color: colors.red, fontWeight: '700' },
  quick: {
    flex: 1,
    minHeight: 56,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  quickLabel: { color: colors.white, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  rowTitle: { fontWeight: '700', color: colors.ink, fontSize: 16 },
  priority: { width: 8, height: 36, borderRadius: 4 },
  hot: { backgroundColor: colors.red },
  mid: { backgroundColor: colors.gold },
});
