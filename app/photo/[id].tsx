import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { MarkupCanvas } from '@/components/MarkupCanvas';
import { Chip, ChipGroup, PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { formatGps, formatStamp } from '@/lib/dates';
import type { MediaTag } from '@/lib/types';

const TAGS: { id: MediaTag; label: string }[] = [
  { id: 'progress', label: 'Progress' },
  { id: 'defect', label: 'Defect' },
  { id: 'before', label: 'Before' },
  { id: 'after', label: 'After' },
  { id: 'delivery', label: 'Delivery' },
];

export default function PhotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getMedia, saveMedia, punchItems, logs } = useFieldOps();
  const stored = getMedia(id);
  const [item, setItem] = useState(stored);

  if (!item) {
    return (
      <Screen>
        <Text style={type.body}>Photo is not on this device.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Save markup"
          onPress={async () => {
            await saveMedia(item);
            router.back();
          }}
        />
      }>
      <View style={styles.stage}>
        <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <MarkupCanvas strokes={item.markup} onChange={(markup) => setItem({ ...item, markup })} />
      </View>
      <Text style={type.meta}>
        {formatStamp(item.capturedAt)} · {formatGps(item.lat, item.lng)}
        {item.accuracyM != null ? ` · ±${Math.round(item.accuracyM)}m` : ''}
      </Text>
      <ChipGroup>
        {TAGS.map((tag) => (
          <Chip key={tag.id} label={tag.label} selected={item.tag === tag.id} onPress={() => setItem({ ...item, tag: tag.id })} />
        ))}
      </ChipGroup>
      <TextInput
        value={item.caption}
        onChangeText={(caption) => setItem({ ...item, caption })}
        placeholder="Caption (optional)"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={type.label}>ATTACH TO</Text>
      <ChipGroup>
        <Chip
          label="Jobsite only"
          selected={!item.parentId}
          onPress={() => setItem({ ...item, parentType: 'jobsite', parentId: null })}
        />
        {logs.slice(0, 4).map((log) => (
          <Chip
            key={log.id}
            label={`Log ${log.logDate}`}
            selected={item.parentId === log.id}
            onPress={() => setItem({ ...item, parentType: 'daily_log', parentId: log.id })}
          />
        ))}
        {punchItems.slice(0, 6).map((punch) => (
          <Chip
            key={punch.id}
            label={punch.title}
            selected={item.parentId === punch.id}
            onPress={() => setItem({ ...item, parentType: 'punch_item', parentId: punch.id })}
          />
        ))}
      </ChipGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 360,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white,
  },
});
