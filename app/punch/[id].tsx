import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PunchForm } from '@/components/PunchForm';
import { PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { capturePhoto } from '@/lib/capture';
import type { PunchItem } from '@/lib/types';

export default function PunchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPunch, getMedia, savePunch, saveMedia, jobsite } = useFieldOps();
  const stored = getPunch(id);
  const [item, setItem] = useState<PunchItem | null>(stored ?? null);

  if (!item) {
    return (
      <Screen>
        <Text style={type.body}>That punch item is not on this device.</Text>
      </Screen>
    );
  }

  const current = item;

  async function addPhoto(tag: 'before' | 'after') {
    if (!jobsite) return;
    const media = await capturePhoto({
      jobsiteId: jobsite.id,
      tag,
      parentType: 'punch_item',
      parentId: current.id,
    });
    if (!media) return;
    await saveMedia(media);
    const next: PunchItem =
      tag === 'before'
        ? { ...current, beforeMediaIds: [...current.beforeMediaIds, media.id] }
        : { ...current, afterMediaIds: [...current.afterMediaIds, media.id] };
    setItem(next);
    await savePunch(next);
    router.push(`/photo/${media.id}`);
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Save punch item"
          onPress={async () => {
            if (item.status === 'closed' && item.afterMediaIds.length === 0) {
              Alert.alert('After photo required', 'Close-out needs a verification photo.');
              return;
            }
            await savePunch(item);
            router.back();
          }}
        />
      }>
      <PunchForm value={item} onChange={setItem} />
      <Text style={type.label}>BEFORE / AFTER</Text>
      <View style={{ gap: 10 }}>
        <SecondaryButton label="Before photo" onPress={() => addPhoto('before')} />
        <SecondaryButton label="After photo" onPress={() => addPhoto('after')} />
      </View>
      <PhotoRow ids={item.beforeMediaIds} label="Before" getMedia={getMedia} onOpen={(mediaId) => router.push(`/photo/${mediaId}`)} />
      <PhotoRow ids={item.afterMediaIds} label="After" getMedia={getMedia} onOpen={(mediaId) => router.push(`/photo/${mediaId}`)} />
    </Screen>
  );
}

function PhotoRow({
  ids,
  label,
  getMedia,
  onOpen,
}: {
  ids: string[];
  label: string;
  getMedia: (id: string) => { uri: string } | undefined;
  onOpen: (id: string) => void;
}) {
  if (ids.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <Text style={type.meta}>{label}</Text>
      <View style={styles.photos}>
        {ids.map((mediaId) => {
          const media = getMedia(mediaId);
          if (!media) return null;
          return (
            <Pressable key={mediaId} onPress={() => onOpen(mediaId)}>
              <Image source={{ uri: media.uri }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 88, height: 88, borderRadius: radius.sm, backgroundColor: colors.navy },
});
