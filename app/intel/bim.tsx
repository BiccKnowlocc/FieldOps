import { GLView } from 'expo-gl';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { Chip, ChipGroup, PrimaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { createId } from '@/lib/id';

const TRADES = ['All', 'Structural', 'MEP', 'Arch'];

export default function BimScreen() {
  return (
    <Gate feature="bim">
      <BimBody />
    </Gate>
  );
}

function BimBody() {
  const { jobsite, bimPins, saveRecord } = useFieldOps();
  const [trade, setTrade] = useState('All');
  const [floor, setFloor] = useState(2);
  const visible = bimPins.filter((pin) => trade === 'All' || pin.trade === trade);

  return (
    <Screen>
      <Text style={type.title}>BIM viewer</Text>
      <Text style={type.meta}>Lightweight glTF/3D-tiles slot. WebGL cube is the live context; tap a 12 ft bay to pin a punch in space.</Text>
      <View style={styles.glWrap}>
        <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
      </View>
      <ChipGroup>
        {TRADES.map((item) => (
          <Chip key={item} label={item} selected={trade === item} onPress={() => setTrade(item)} />
        ))}
      </ChipGroup>
      <ChipGroup>
        {[1, 2, 3].map((level) => (
          <Chip key={level} label={`Level ${level}`} selected={floor === level} onPress={() => setFloor(level)} />
        ))}
      </ChipGroup>
      <View style={styles.grid}>
        {Array.from({ length: 16 }).map((_, index) => {
          const x = index % 4;
          const y = Math.floor(index / 4);
          return (
            <Pressable
              key={index}
              style={styles.cell}
              onPress={async () => {
                if (!jobsite) return;
                const id = createId();
                await saveRecord(id, 'bim_pins', {
                  id,
                  jobsiteId: jobsite.id,
                  x,
                  y,
                  z: floor,
                  trade: trade === 'All' ? 'Structural' : trade,
                  title: `Pin L${floor} ${x},${y}`,
                  createdAt: Date.now(),
                });
              }}>
              <Text style={styles.cellLabel}>{x},{y}</Text>
            </Pressable>
          );
        })}
      </View>
      <Section title="Spatial pins">
        {visible.length === 0 ? <Text style={type.meta}>Tap a bay to drop an issue on the I-beam line.</Text> : null}
        {visible.map((pin) => (
          <Text key={pin.id} style={type.body}>
            L{pin.z} · {pin.x},{pin.y} · {pin.trade} · {pin.title}
          </Text>
        ))}
      </Section>
      <PrimaryButton label="Measure 8 ft 4 in clearance (demo)" onPress={() => {}} />
    </Screen>
  );
}

function onContextCreate(gl: {
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  viewport: (x: number, y: number, w: number, h: number) => void;
  clearColor: (r: number, g: number, b: number, a: number) => void;
  clear: (mask: number) => void;
  COLOR_BUFFER_BIT: number;
  endFrameEXP: () => void;
}) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.04, 0.12, 0.2, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.endFrameEXP();
}

const styles = StyleSheet.create({
  glWrap: { height: 160, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navy },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: {
    width: '23%',
    minHeight: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: { color: colors.white, fontWeight: '700' },
});
