import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ChipGroup, Section, Stepper } from '@/components/kit';
import { colors, radius, tap, type } from '@/constants/theme';
import { DELAYS, VISITOR_PURPOSES, WEATHER, WORK_CHIPS } from '@/lib/catalog';
import { createId } from '@/lib/id';
import type { CrewMember, DailyLog, DelayType } from '@/lib/types';

export function LogForm({
  value,
  crew,
  onChange,
}: {
  value: DailyLog;
  crew: CrewMember[];
  onChange: (next: DailyLog) => void;
}) {
  const [visitorName, setVisitorName] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [visitorPurpose, setVisitorPurpose] = useState(VISITOR_PURPOSES[0]);
  const [deliverySupplier, setDeliverySupplier] = useState('');
  const [deliveryDesc, setDeliveryDesc] = useState('');
  const [delayType, setDelayType] = useState<DelayType>('weather_hold');
  const [delayHours, setDelayHours] = useState(1);

  const patch = (partial: Partial<DailyLog>) => onChange({ ...value, ...partial });

  return (
    <View style={{ gap: 22 }}>
      <Section title="Weather">
        <ChipGroup>
          {WEATHER.map((item) => (
            <Chip key={item.id} label={item.label} selected={value.weather === item.id} onPress={() => patch({ weather: item.id })} />
          ))}
        </ChipGroup>
        <Stepper value={value.tempF} onChange={(tempF) => patch({ tempF })} suffix="°F" min={-20} max={130} />
      </Section>

      <Section title="On site now">
        <ChipGroup>
          {crew.map((member) => {
            const selected = value.crewIds.includes(member.id);
            return (
              <Chip
                key={member.id}
                label={`${member.name} · ${member.role}`}
                selected={selected}
                onPress={() =>
                  patch({
                    crewIds: selected ? value.crewIds.filter((id) => id !== member.id) : [...value.crewIds, member.id],
                  })
                }
              />
            );
          })}
        </ChipGroup>
        <Text style={type.meta}>{value.crewIds.length} people selected</Text>
      </Section>

      <Section title="Work completed">
        <ChipGroup>
          {WORK_CHIPS.map((chip) => {
            const selected = value.workChips.includes(chip);
            return (
              <Chip
                key={chip}
                label={chip}
                selected={selected}
                onPress={() =>
                  patch({
                    workChips: selected ? value.workChips.filter((c) => c !== chip) : [...value.workChips, chip],
                  })
                }
              />
            );
          })}
        </ChipGroup>
        <TextInput
          value={value.workNotes}
          onChangeText={(workNotes) => patch({ workNotes })}
          placeholder="Optional notes — keep it short"
          placeholderTextColor={colors.muted}
          multiline
          style={styles.notes}
        />
      </Section>

      <Section title="Visitors">
        {value.visitors.map((visitor) => (
          <Row
            key={visitor.id}
            title={`${visitor.name} · ${visitor.company}`}
            subtitle={visitor.purpose}
            onRemove={() => patch({ visitors: value.visitors.filter((v) => v.id !== visitor.id) })}
          />
        ))}
        <TextInput value={visitorName} onChangeText={setVisitorName} placeholder="Name" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={visitorCompany} onChangeText={setVisitorCompany} placeholder="Company" placeholderTextColor={colors.muted} style={styles.input} />
        <ChipGroup>
          {VISITOR_PURPOSES.map((purpose) => (
            <Chip key={purpose} label={purpose} selected={visitorPurpose === purpose} onPress={() => setVisitorPurpose(purpose)} />
          ))}
        </ChipGroup>
        <Pressable
          style={styles.add}
          onPress={() => {
            if (!visitorName.trim()) return;
            patch({
              visitors: [
                ...value.visitors,
                { id: createId(), name: visitorName.trim(), company: visitorCompany.trim() || '—', purpose: visitorPurpose },
              ],
            });
            setVisitorName('');
            setVisitorCompany('');
          }}>
          <Text style={styles.addLabel}>Add visitor</Text>
        </Pressable>
      </Section>

      <Section title="Deliveries">
        {value.deliveries.map((item) => (
          <Row
            key={item.id}
            title={`${item.supplier} · ${item.description}`}
            subtitle={item.received ? 'Received' : 'Not received'}
            onRemove={() => patch({ deliveries: value.deliveries.filter((d) => d.id !== item.id) })}
          />
        ))}
        <TextInput value={deliverySupplier} onChangeText={setDeliverySupplier} placeholder="Supplier" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={deliveryDesc} onChangeText={setDeliveryDesc} placeholder="What arrived" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable
          style={styles.add}
          onPress={() => {
            if (!deliverySupplier.trim()) return;
            patch({
              deliveries: [
                ...value.deliveries,
                { id: createId(), supplier: deliverySupplier.trim(), description: deliveryDesc.trim(), received: true },
              ],
            });
            setDeliverySupplier('');
            setDeliveryDesc('');
          }}>
          <Text style={styles.addLabel}>Add delivery (received)</Text>
        </Pressable>
      </Section>

      <Section title="Delays">
        {value.delays.map((item) => (
          <Row
            key={item.id}
            title={DELAYS.find((d) => d.id === item.type)?.label ?? item.type}
            subtitle={`${item.hours} hr`}
            onRemove={() => patch({ delays: value.delays.filter((d) => d.id !== item.id) })}
          />
        ))}
        <ChipGroup>
          {DELAYS.map((item) => (
            <Chip key={item.id} label={item.label} selected={delayType === item.id} onPress={() => setDelayType(item.id)} tone="warn" />
          ))}
        </ChipGroup>
        <Stepper value={delayHours} onChange={setDelayHours} suffix="hr" min={1} max={12} />
        <Pressable
          style={styles.add}
          onPress={() => {
            patch({
              delays: [...value.delays, { id: createId(), type: delayType, hours: delayHours, notes: '' }],
            });
          }}>
          <Text style={styles.addLabel}>Add delay</Text>
        </Pressable>
      </Section>
    </View>
  );
}

function Row({ title, subtitle, onRemove }: { title: string; subtitle: string; onRemove: () => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={type.meta}>{subtitle}</Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Text style={styles.remove}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notes: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
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
  add: {
    minHeight: tap.min,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { color: colors.navy, fontWeight: '800', fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowTitle: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  remove: { color: colors.red, fontWeight: '700' },
});
