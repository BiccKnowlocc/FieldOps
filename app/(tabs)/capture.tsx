import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { capturePhoto, pickFromLibrary } from '@/lib/capture';
import { formatGps, formatStamp } from '@/lib/dates';

export default function CaptureScreen() {
  const router = useRouter();
  const { jobsite, media, saveMedia } = useFieldOps();

  async function take(kind: 'camera' | 'library') {
    if (!jobsite) return;
    const item = kind === 'camera'
      ? await capturePhoto({ jobsiteId: jobsite.id, tag: 'progress' })
      : await pickFromLibrary({ jobsiteId: jobsite.id, tag: 'progress' });
    if (!item) {
      Alert.alert('Photo not saved', 'Camera or library permission is required.');
      return;
    }
    await saveMedia(item);
    router.push(`/photo/${item.id}`);
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Take photo" onPress={() => take('camera')} />
          <SecondaryButton label="From library" onPress={() => take('library')} />
        </View>
      }>
      <Text style={type.body}>Photos are timestamped and GPS-tagged on device, then marked up before they sync.</Text>
      <View style={styles.grid}>
        {media.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/photo/${item.id}`)} style={styles.tile}>
            <Image source={{ uri: item.uri }} style={styles.image} contentFit="cover" />
            <View style={styles.meta}>
              <Text style={styles.metaText}>{formatStamp(item.capturedAt)}</Text>
              <Text style={styles.metaText} numberOfLines={1}>{formatGps(item.lat, item.lng)}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {media.length === 0 ? <Text style={type.meta}>No photos on this job yet.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.navy,
    minWidth: 150,
  },
  image: { width: '100%', height: 140 },
  meta: { padding: 8, gap: 2 },
  metaText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
