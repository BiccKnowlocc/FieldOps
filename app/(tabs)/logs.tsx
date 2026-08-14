import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { weatherLabel } from '@/lib/catalog';
import { formatDay } from '@/lib/dates';

export default function LogsScreen() {
  const router = useRouter();
  const { logs, crew } = useFieldOps();

  return (
    <Screen
      footer={<PrimaryButton label="New daily log" onPress={() => router.push('/log/new')} />}>
      {logs.length === 0 ? (
        <Text style={type.body}>No logs yet. Start today’s report from the field in under a minute.</Text>
      ) : (
        logs.map((log) => (
          <Pressable key={log.id} onPress={() => router.push(`/log/${log.id}`)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{formatDay(log.logDate)}</Text>
              <Text style={type.meta}>
                {weatherLabel(log.weather)} · {log.tempF}°F · {log.crewIds.length}/{crew.length} on site
              </Text>
              <Text style={styles.work} numberOfLines={2}>
                {log.workChips.join(' · ') || log.workNotes || 'No work tagged'}
              </Text>
            </View>
            {log.delays.length > 0 ? <View style={styles.flag}><Text style={styles.flagText}>Delay</Text></View> : null}
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  work: { marginTop: 6, color: colors.ink, fontWeight: '600' },
  flag: { backgroundColor: '#F8E2DF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  flagText: { color: colors.red, fontWeight: '800', fontSize: 12 },
});
