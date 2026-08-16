import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, ChipGroup, PrimaryButton } from '@/components/kit';
import { Gate } from '@/components/Gate';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFieldOps } from '@/context/FieldOpsProvider';
import {
  assetStatusLabel,
  kindLabel,
  meterLabel,
  serviceLevel,
  serviceSummary,
} from '@/lib/equipment';
import type { Asset } from '@/lib/types';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'out', label: 'Checked out' },
  { id: 'due', label: 'Service due' },
  { id: 'down', label: 'Down' },
] as const;

export default function EquipmentScreen() {
  const router = useRouter();
  const { can } = useAuth();
  const { assets } = useFieldOps();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const dueCount = assets.filter((asset) => serviceLevel(asset) !== 'ok').length;
  const outCount = assets.filter((asset) => asset.status === 'checked_out').length;
  const items = useMemo(() => assets.filter((asset) => matchesFilter(asset, filter)), [assets, filter]);

  if (!can('equipment')) return <Gate feature="equipment">{null}</Gate>;

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Scan / check out" onPress={() => router.push('/scan')} />
        </View>
      }>
      <Text style={type.body}>
        {outCount} in the field · {dueCount} need service
      </Text>
      <ChipGroup>
        {FILTERS.map((item) => (
          <Chip key={item.id} label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />
        ))}
      </ChipGroup>
      {items.length === 0 ? (
        <Text style={type.meta}>Nothing in this filter.</Text>
      ) : (
        items.map((asset) => (
          <Pressable key={asset.id} onPress={() => router.push(`/asset/${asset.id}` as never)} style={styles.row}>
            <View style={[styles.bar, styles[serviceLevel(asset)], asset.status === 'down' && styles.overdue]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{asset.name}</Text>
              <Text style={type.meta}>
                {asset.unitNumber} · {kindLabel(asset.kind)} · {asset.hourMeter} {meterLabel(asset)}
                {asset.kind !== 'tool' ? ` · ${asset.fuelUsedLitres} L` : ''}
              </Text>
              <Text style={type.meta}>
                {assetStatusLabel(asset.status)}
                {asset.assignedTo ? ` · ${asset.assignedTo}` : ''}
              </Text>
              <Text style={serviceLevel(asset) === 'ok' ? type.meta : styles.due}>{serviceSummary(asset)}</Text>
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

function matchesFilter(asset: Asset, filter: (typeof FILTERS)[number]['id']) {
  if (filter === 'out') return asset.status === 'checked_out';
  if (filter === 'down') return asset.status === 'down';
  if (filter === 'due') return serviceLevel(asset) !== 'ok';
  return true;
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    gap: 12,
  },
  bar: { width: 8, borderRadius: 4, backgroundColor: colors.green },
  ok: { backgroundColor: colors.green },
  soon: { backgroundColor: colors.gold },
  overdue: { backgroundColor: colors.red },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  due: { color: colors.red, fontWeight: '700', marginTop: 4 },
});
