import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';

export default function MoreScreen() {
  const router = useRouter();
  const { jobsites, jobsite, setJobsite, pendingCount, conflicts, syncNow, resolveConflict, simulateConflict, online } =
    useFieldOps();

  return (
    <Screen>
      <Text style={type.title}>Jobsite & sync</Text>
      <Card>
        {jobsites.map((site) => (
          <Pressable
            key={site.id}
            onPress={() => setJobsite(site.id)}
            style={[styles.site, site.id === jobsite?.id && styles.siteOn]}>
            <Text style={styles.siteName}>{site.name}</Text>
            <Text style={type.meta}>{site.address}</Text>
          </Pressable>
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={type.label}>OFFLINE SYNC</Text>
        <Text style={type.body}>
          {online ? 'Connected.' : 'No connection.'} {pendingCount} record{pendingCount === 1 ? '' : 's'} waiting.
          Conflicts use last-write checks and let you keep field or office.
        </Text>
        <PrimaryButton
          label="Sync now"
          onPress={async () => {
            const result = await syncNow();
            Alert.alert('Sync complete', `Pushed ${result.pushed} · Pulled ${result.pulled} · Conflicts ${result.conflicts}`);
          }}
        />
        <SecondaryButton
          label="Simulate office conflict"
          onPress={async () => {
            await simulateConflict();
            Alert.alert('Conflict queued', 'An office edit was applied to a punch item. Sync to see the conflict.');
          }}
        />
      </Card>

      {conflicts.map((conflict) => (
        <Card key={conflict.id} style={{ gap: 10 }}>
          <Text style={type.label}>CONFLICT</Text>
          <Text style={type.body}>Field and office both changed {conflict.collection.replace('_', ' ')}.</Text>
          <PrimaryButton label="Keep field copy" onPress={() => resolveConflict(conflict.id, 'local')} />
          <SecondaryButton label="Keep office copy" onPress={() => resolveConflict(conflict.id, 'remote')} />
        </Card>
      ))}

      <Text style={type.label}>OTHER MODULES</Text>
      <ModuleLink label="Equipment, fleet & assets" onPress={() => router.push('/equipment')} />
      <ModuleLink label="Estimating & job costing" onPress={() => router.push('/costing')} />
      <ModuleLink label="Labor, dispatch & subs" onPress={() => router.push('/labor')} />
      <ModuleLink label="Safety, compliance & drawings" onPress={() => router.push('/safety')} />
    </Screen>
  );
}

function ModuleLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.link}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  site: { paddingVertical: 10 },
  siteOn: { backgroundColor: '#F3E7D8', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10 },
  siteName: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  link: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkLabel: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  chev: { fontSize: 28, color: colors.muted, marginTop: -4 },
});
