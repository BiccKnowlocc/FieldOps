import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon, Polyline } from 'react-native-svg';

import { colors, radius } from '@/constants/theme';
import { createId } from '@/lib/id';
import type { MarkupStroke, StrokePoint } from '@/lib/types';

const TOOLS = [
  { id: 'draw' as const, label: 'Draw', color: '#E10600' },
  { id: 'arrow' as const, label: 'Arrow', color: '#E10600' },
  { id: 'highlight' as const, label: 'Highlight', color: '#F5C518' },
];

export function MarkupCanvas({
  strokes,
  onChange,
  children,
}: {
  strokes: MarkupStroke[];
  onChange: (strokes: MarkupStroke[]) => void;
  children?: ReactNode;
}) {
  const [tool, setTool] = useState<(typeof TOOLS)[number]['id']>('draw');
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
            kind: tool,
            color: tool === 'highlight' ? '#F5C518' : '#E10600',
            width: tool === 'highlight' ? 18 : 4,
            points: [point],
          };
        },
        onPanResponderMove: (evt) => {
          if (!draft.current) return;
          const point = normalize(evt.nativeEvent.locationX, evt.nativeEvent.locationY, size);
          if (tool === 'arrow') {
            draft.current = { ...draft.current, points: [draft.current.points[0], point] };
          } else {
            draft.current = { ...draft.current, points: [...draft.current.points, point] };
          }
          onChange([...strokesRef.current.filter((s) => s.id !== draft.current?.id), draft.current]);
        },
        onPanResponderRelease: () => {
          if (draft.current) {
            onChange([...strokesRef.current.filter((s) => s.id !== draft.current?.id), draft.current]);
          }
          draft.current = null;
        },
      }),
    [onChange, size, tool],
  );

  return (
    <View style={styles.wrap}>
      <View
        style={styles.canvas}
        onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}
        {...responder.panHandlers}>
        {children}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {strokes.map((stroke) =>
            stroke.kind === 'arrow' ? (
              <Arrow key={stroke.id} stroke={stroke} size={size} />
            ) : (
              <Polyline
                key={stroke.id}
                points={stroke.points.map((p) => `${p.x * size.width},${p.y * size.height}`).join(' ')}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={stroke.kind === 'highlight' ? 0.55 : 1}
              />
            ),
          )}
        </Svg>
      </View>
      <View style={styles.tools}>
        {TOOLS.map((item) => (
          <Pressable key={item.id} onPress={() => setTool(item.id)} style={[styles.tool, tool === item.id && styles.toolOn]}>
            <Text style={[styles.toolLabel, tool === item.id && styles.toolLabelOn]}>{item.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => onChange(strokes.slice(0, -1))} style={styles.tool}>
          <Text style={styles.toolLabel}>Undo</Text>
        </Pressable>
        <Pressable onPress={() => onChange([])} style={styles.tool}>
          <Text style={styles.toolLabel}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Arrow({ stroke, size }: { stroke: MarkupStroke; size: { width: number; height: number } }) {
  const a = stroke.points[0];
  const b = stroke.points[stroke.points.length - 1];
  if (!a || !b) return null;
  const x1 = a.x * size.width;
  const y1 = a.y * size.height;
  const x2 = b.x * size.width;
  const y2 = b.y * size.height;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 16;
  const p1 = `${x2},${y2}`;
  const p2 = `${x2 - head * Math.cos(angle - Math.PI / 6)},${y2 - head * Math.sin(angle - Math.PI / 6)}`;
  const p3 = `${x2 - head * Math.cos(angle + Math.PI / 6)},${y2 - head * Math.sin(angle + Math.PI / 6)}`;
  return (
    <>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke.color} strokeWidth={stroke.width} />
      <Polygon points={`${p1} ${p2} ${p3}`} fill={stroke.color} />
    </>
  );
}

function normalize(x: number, y: number, size: { width: number; height: number }): StrokePoint {
  return {
    x: Math.min(1, Math.max(0, x / size.width)),
    y: Math.min(1, Math.max(0, y / size.height)),
  };
}

const styles = StyleSheet.create({
  wrap: { gap: 10, flex: 1 },
  canvas: { flex: 1, minHeight: 280, borderRadius: radius.md, overflow: 'hidden' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tool: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  toolOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  toolLabel: { fontWeight: '700', color: colors.ink },
  toolLabelOn: { color: colors.white },
});
