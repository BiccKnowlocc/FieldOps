import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { colors, radius } from '@/constants/theme';
import { createId } from '@/lib/id';
import type { MarkupStroke, StrokePoint } from '@/lib/types';

export function SignaturePad({
  strokes,
  onChange,
}: {
  strokes: MarkupStroke[];
  onChange: (strokes: MarkupStroke[]) => void;
}) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const draft = useRef<MarkupStroke | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const point = normalize(evt.nativeEvent.locationX, evt.nativeEvent.locationY, size);
          draft.current = {
            id: createId(),
            kind: 'draw',
            color: '#102033',
            width: 3,
            points: [point],
          };
        },
        onPanResponderMove: (evt) => {
          if (!draft.current) return;
          const point = normalize(evt.nativeEvent.locationX, evt.nativeEvent.locationY, size);
          draft.current = { ...draft.current, points: [...draft.current.points, point] };
          onChange([...strokesRef.current.filter((s) => s.id !== draft.current?.id), draft.current]);
        },
        onPanResponderRelease: () => {
          if (draft.current) {
            onChange([...strokesRef.current.filter((s) => s.id !== draft.current?.id), draft.current]);
          }
          draft.current = null;
        },
      }),
    [onChange, size],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.pad} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)} {...responder.panHandlers}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {strokes.map((stroke) => (
            <Polyline
              key={stroke.id}
              points={stroke.points.map((p) => `${p.x * size.width},${p.y * size.height}`).join(' ')}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
        {strokes.length === 0 ? <Text style={styles.hint}>Sign here</Text> : null}
      </View>
      <Pressable onPress={() => onChange([])} style={styles.clear}>
        <Text style={styles.clearLabel}>Clear signature</Text>
      </Pressable>
    </View>
  );
}

function normalize(x: number, y: number, size: { width: number; height: number }): StrokePoint {
  return {
    x: Math.min(1, Math.max(0, x / size.width)),
    y: Math.min(1, Math.max(0, y / size.height)),
  };
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  pad: {
    height: 140,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  hint: { color: colors.muted, fontWeight: '700', textAlign: 'center', marginTop: 56 },
  clear: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearLabel: { color: colors.navy, fontWeight: '800' },
});
