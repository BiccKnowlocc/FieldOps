import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { SheetPlan } from '@/components/SheetPlan';
import { Chip, ChipGroup } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { A101_CHANGES } from '@/lib/blueprintDiff';

export default function DiffScreen() {
  return (
    <Gate feature="blueprint_diff">
      <DiffBody />
    </Gate>
  );
}

function DiffBody() {
  const [mix, setMix] = useState(0.55);
  const [mode, setMode] = useState<'overlay' | 'slider'>('overlay');
  const slider = useMemo(() => Math.round(mix * 100), [mix]);

  return (
    <Screen>
      <Text style={type.title}>Revision diff</Text>
      <Text style={type.meta}>A-101 Rev 2 → Rev 3. Gray = unchanged, red = removed, green = added. Aligns on grid D.</Text>
      <ChipGroup>
        <Chip label="Overlay" selected={mode === 'overlay'} onPress={() => setMode('overlay')} />
        <Chip label="Slider" selected={mode === 'slider'} onPress={() => setMode('slider')} />
      </ChipGroup>
      <View style={styles.stage}>
        <View style={[styles.layer, { opacity: mode === 'slider' ? 1 - mix : 0.45 }]}>
          <SheetPlan sheetNumber="A-101" />
          <View style={[styles.ghost, styles.removed]} />
        </View>
        <View style={[styles.layer, { opacity: mode === 'slider' ? mix : 1 }]}>
          <SheetPlan sheetNumber="E-301" />
          <View style={[styles.ghost, styles.added]} />
        </View>
      </View>
      <ChipGroup>
        {[0, 0.35, 0.55, 0.8, 1].map((value) => (
          <Chip key={value} label={`${Math.round(value * 100)}% new`} selected={slider === Math.round(value * 100)} onPress={() => setMix(value)} />
        ))}
      </ChipGroup>
      <Text style={type.label}>CHANGELOG</Text>
      {A101_CHANGES.map((change) => (
        <View key={change.id} style={styles.row}>
          <View style={[styles.dot, change.kind === 'added' ? styles.added : change.kind === 'removed' ? styles.removed : styles.dim]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{change.label}</Text>
            {change.from ? (
              <Text style={type.meta}>
                {change.from} → {change.to}
              </Text>
            ) : (
              <Text style={type.meta}>{change.kind}</Text>
            )}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { height: 280, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navy },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ghost: { position: 'absolute', width: 70, height: 36, borderRadius: 6 },
  added: { backgroundColor: 'rgba(47,111,78,0.85)', right: 16, top: 88 },
  removed: { backgroundColor: 'rgba(192,57,43,0.85)', left: 20, top: 48 },
  dim: { backgroundColor: colors.gold },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.line },
  rowTitle: { fontWeight: '800', color: colors.ink },
  dot: { width: 10, height: 36, borderRadius: 4 },
});
