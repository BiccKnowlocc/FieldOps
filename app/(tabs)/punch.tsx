import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, ChipGroup, PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { statusLabel, tradeLabel } from '@/lib/catalog';
import type { PunchStatus } from '@/lib/types';

const FILTERS: { id: 'all' | PunchStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'ready_for_review', label: 'Review' },
  { id: 'closed', label: 'Closed' },
];

export default function PunchScreen() {
  const router = useRouter();
  const { punchItems } = useFieldOps();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const items = useMemo(
    () => punchItems.filter((item) => (filter === 'all' ? true : item.status === filter)),
    [filter, punchItems],
  );

  return (
    <Screen footer={<PrimaryButton label="New punch item" onPress={() => router.push('/punch/new')} />}>
      <ChipGroup>
        {FILTERS.map((item) => (
          <Chip key={item.id} label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />
        ))}
      </ChipGroup>
      {items.length === 0 ? (
        <Text style={type.body}>No punch items in this filter.</Text>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/punch/${item.id}`)} style={styles.row}>
            <View style={[styles.bar, styles[item.priority]]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={type.meta}>
                {tradeLabel(item.trade)} · {item.company || item.assignee} · {statusLabel(item.status)}
              </Text>
              <Text style={type.meta}>Due {item.dueDate} · {item.locationNote || 'No location'}</Text>
            </View>
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
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    gap: 12,
  },
  bar: { width: 8, borderRadius: 4 },
  low: { backgroundColor: colors.muted },
  medium: { backgroundColor: colors.blue },
  high: { backgroundColor: colors.orange },
  critical: { backgroundColor: colors.red },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 4 },
});
