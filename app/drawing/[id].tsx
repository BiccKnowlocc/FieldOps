import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MarkupCanvas } from '@/components/MarkupCanvas';
import { SheetPlan } from '@/components/SheetPlan';
import { Chip, ChipGroup, PrimaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { disciplineLabel } from '@/lib/catalog';
import { formatDay } from '@/lib/dates';
import { punchesForDrawing } from '@/lib/safety';
import type { Drawing } from '@/lib/types';

export default function DrawingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDrawing } = useFieldOps();
  const drawing = getDrawing(id);

  if (!drawing) {
    return (
      <Screen>
        <Text style={type.body}>That sheet is not on this device.</Text>
      </Screen>
    );
  }

  return <DrawingBody drawing={drawing} />;
}

function DrawingBody({ drawing }: { drawing: Drawing }) {
  const router = useRouter();
  const { drawings, punchItems, saveDrawing } = useFieldOps();
  const [markup, setMarkup] = useState(drawing.markup);
  const revisions = drawings
    .filter((item) => item.sheetNumber === drawing.sheetNumber)
    .sort((a, b) => Number(b.revision) - Number(a.revision));
  const linked = punchesForDrawing(punchItems, drawing);

  async function makeCurrent() {
    for (const item of revisions) {
      await saveDrawing({
        ...item,
        current: item.id === drawing.id,
        markup: item.id === drawing.id ? markup : item.markup,
      });
    }
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton
            label="Save markup"
            onPress={async () => {
              await saveDrawing({ ...drawing, markup });
              router.back();
            }}
          />
          {drawing.current ? null : <PrimaryButton label="Make this revision current" onPress={makeCurrent} />}
        </View>
      }>
      <Text style={type.meta}>
        {disciplineLabel(drawing.discipline)} · issued {formatDay(drawing.issuedDate)}
      </Text>
      <Text style={type.title}>
        {drawing.sheetNumber} · {drawing.title}
      </Text>
      <Text style={type.body}>{drawing.current ? 'Current set' : 'Superseded — do not build from this sheet'}</Text>
      <Section title="Revision">
        <ChipGroup>
          {revisions.map((item) => (
            <Chip
              key={item.id}
              label={`Rev ${item.revision}${item.current ? ' · now' : ''}`}
              selected={item.id === drawing.id}
              onPress={() => router.replace(`/drawing/${item.id}` as never)}
            />
          ))}
        </ChipGroup>
      </Section>
      <View style={styles.stage}>
        <MarkupCanvas strokes={markup} onChange={setMarkup}>
          <SheetPlan sheetNumber={drawing.sheetNumber} />
        </MarkupCanvas>
      </View>
      <Section title="Linked punch items">
        {linked.length === 0 ? <Text style={type.meta}>None tied to this area.</Text> : null}
        {linked.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/punch/${item.id}` as never)}>
            <Text style={styles.link}>{item.title}</Text>
            <Text style={type.meta}>{item.locationNote}</Text>
          </Pressable>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { height: 400 },
  link: { fontWeight: '800', color: colors.ink, fontSize: 16 },
});
