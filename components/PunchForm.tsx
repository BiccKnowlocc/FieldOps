import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ChipGroup, Section } from '@/components/kit';
import { colors, radius, tap } from '@/constants/theme';
import { PRIORITIES, PUNCH_STATUS, TRADES } from '@/lib/catalog';
import type { PunchItem } from '@/lib/types';

const TITLE_CHIPS = [
  'Incomplete firestopping',
  'Damaged material',
  'Out of spec',
  'Safety hazard',
  'Missing install',
  'Finish punch',
];

export function PunchForm({ value, onChange }: { value: PunchItem; onChange: (next: PunchItem) => void }) {
  const patch = (partial: Partial<PunchItem>) => onChange({ ...value, ...partial });

  return (
    <View style={{ gap: 22 }}>
      <Section title="What's wrong">
        <ChipGroup>
          {TITLE_CHIPS.map((label) => (
            <Chip key={label} label={label} selected={value.title === label} onPress={() => patch({ title: label })} />
          ))}
        </ChipGroup>
        <TextInput
          value={value.title}
          onChangeText={(title) => patch({ title })}
          placeholder="Short title"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <TextInput
          value={value.description}
          onChangeText={(description) => patch({ description })}
          placeholder="Details (optional)"
          placeholderTextColor={colors.muted}
          multiline
          style={styles.notes}
        />
        <TextInput
          value={value.locationNote}
          onChangeText={(locationNote) => patch({ locationNote })}
          placeholder="Location — grid, room, elevation"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </Section>

      <Section title="Trade / assignee">
        <ChipGroup>
          {TRADES.map((item) => (
            <Chip key={item.id} label={item.label} selected={value.trade === item.id} onPress={() => patch({ trade: item.id })} />
          ))}
        </ChipGroup>
        <TextInput
          value={value.assignee}
          onChangeText={(assignee) => patch({ assignee })}
          placeholder="Assigned person"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <TextInput
          value={value.company}
          onChangeText={(company) => patch({ company })}
          placeholder="Company / sub"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </Section>

      <Section title="Priority">
        <ChipGroup>
          {PRIORITIES.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={value.priority === item.id}
              tone={item.id === 'critical' || item.id === 'high' ? 'danger' : 'default'}
              onPress={() => patch({ priority: item.id })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="Status">
        <ChipGroup>
          {PUNCH_STATUS.map((item) => (
            <Chip key={item.id} label={item.label} selected={value.status === item.id} onPress={() => patch({ status: item.id })} />
          ))}
        </ChipGroup>
        <Text style={styles.hint}>Closing a punch requires an after photo. In-progress should have a before photo.</Text>
      </Section>

      <Section title="Deadline">
        <TextInput
          value={value.dueDate}
          onChangeText={(dueDate) => patch({ dueDate })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: tap.min,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  notes: {
    minHeight: 88,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
  hint: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
