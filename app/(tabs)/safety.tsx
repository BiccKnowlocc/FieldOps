import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip, ChipGroup, PrimaryButton } from '@/components/kit';
import { Gate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { certKindLabel, disciplineLabel } from '@/lib/catalog';
import { formatDay, todayISO } from '@/lib/dates';
import { certStatus, certSummary } from '@/lib/safety';

const PANES = [
  { id: 'talks', label: 'Talks' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'sheets', label: 'Sheets' },
  { id: 'certs', label: 'Certs' },
] as const;

export default function SafetyScreen() {
  const router = useRouter();
  const { can } = useAuth();
  const { talks, incidents, drawings, certifications, allCrew } = useFieldOps();
  const [pane, setPane] = useState<(typeof PANES)[number]['id']>('talks');
  const today = todayISO();
  const todayTalk = talks.find((talk) => talk.date === today);
  const dueCerts = certifications.filter((cert) => certStatus(cert.expiresOn) !== 'ok');
  const currentSheets = useMemo(
    () => drawings.filter((drawing) => drawing.current).sort((a, b) => a.sheetNumber.localeCompare(b.sheetNumber)),
    [drawings],
  );

  if (!can('safety')) return <Gate feature="safety">{null}</Gate>;

  return (
    <Screen
      footer={
        pane === 'talks' ? (
          <PrimaryButton label="New toolbox talk" onPress={() => router.push('/talk/new' as never)} />
        ) : pane === 'incidents' ? (
          <PrimaryButton label="Log incident / near miss" onPress={() => router.push('/incident/new' as never)} />
        ) : null
      }>
      <Text style={type.title}>Safety</Text>
      <Text style={type.meta}>
        {todayTalk ? `${todayTalk.attendeeIds.length} signed in today` : 'No toolbox talk today'}
        {dueCerts.length > 0 ? ` · ${dueCerts.length} tickets due` : ''}
      </Text>
      <ChipGroup>
        {PANES.map((item) => (
          <Chip key={item.id} label={item.label} selected={pane === item.id} onPress={() => setPane(item.id)} />
        ))}
      </ChipGroup>

      {pane === 'talks'
        ? talks
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((talk) => (
              <Pressable key={talk.id} onPress={() => router.push(`/talk/${talk.id}` as never)} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{talk.topic}</Text>
                  <Text style={type.meta}>
                    {formatDay(talk.date)} · {talk.attendeeIds.length} signed in
                    {talk.date === today ? ' · today' : ''}
                  </Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))
        : null}

      {pane === 'incidents'
        ? incidents
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/incident/${item.id}` as never)} style={styles.row}>
                <View style={[styles.bar, item.severity === 'high' || item.severity === 'critical' ? styles.hot : styles.mid]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={type.meta}>
                    {item.kind === 'near_miss' ? 'Near miss' : 'Incident'} · {item.locationNote}
                  </Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))
        : null}

      {pane === 'sheets'
        ? currentSheets.map((drawing) => (
            <Pressable key={drawing.id} onPress={() => router.push(`/drawing/${drawing.id}` as never)} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {drawing.sheetNumber} · {drawing.title}
                </Text>
                <Text style={type.meta}>
                  {disciplineLabel(drawing.discipline)} · Rev {drawing.revision} · current
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))
        : null}

      {pane === 'certs'
        ? certifications
            .slice()
            .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))
            .map((cert) => {
              const level = certStatus(cert.expiresOn);
              const member = allCrew.find((item) => item.id === cert.crewId);
              return (
                <View key={cert.id} style={styles.row}>
                  <View style={[styles.bar, level === 'expired' ? styles.hot : level === 'soon' ? styles.mid : styles.ok]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{cert.crewName}</Text>
                    <Text style={type.meta}>
                      {certKindLabel(cert.kind)} · {cert.number}
                      {member ? ` · ${member.role}` : ''}
                    </Text>
                    <Text style={level === 'ok' ? type.meta : styles.due}>{certSummary(cert)}</Text>
                  </View>
                </View>
              );
            })
        : null}

      {pane === 'talks' && talks.length === 0 ? <Text style={type.meta}>No talks yet.</Text> : null}
      {pane === 'incidents' && incidents.length === 0 ? <Text style={type.meta}>No incidents logged.</Text> : null}
      {pane === 'sheets' && currentSheets.length === 0 ? <Text style={type.meta}>No current sheets.</Text> : null}
      {pane === 'certs' && certifications.length === 0 ? <Text style={type.meta}>Cert locker is empty.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  chev: { fontSize: 28, color: colors.muted, marginTop: -4 },
  bar: { width: 8, height: 36, borderRadius: 4 },
  hot: { backgroundColor: colors.red },
  mid: { backgroundColor: colors.gold },
  ok: { backgroundColor: colors.green },
  due: { color: colors.red, fontWeight: '800' },
});
