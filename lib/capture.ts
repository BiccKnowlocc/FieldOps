import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { persistLocalFile } from '@/lib/files';
import { createId } from '@/lib/id';
import type { MediaItem, MediaTag } from '@/lib/types';

export async function capturePhoto(input: {
  jobsiteId: string;
  tag?: MediaTag;
  parentType?: MediaItem['parentType'];
  parentId?: string | null;
}): Promise<MediaItem | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!library.granted) return null;
    return pickFromLibrary(input);
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    exif: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return toMedia(result.assets[0].uri, input);
}

export async function pickFromLibrary(input: {
  jobsiteId: string;
  tag?: MediaTag;
  parentType?: MediaItem['parentType'];
  parentId?: string | null;
}): Promise<MediaItem | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return null;
  return toMedia(result.assets[0].uri, input);
}

async function toMedia(
  uri: string,
  input: {
    jobsiteId: string;
    tag?: MediaTag;
    parentType?: MediaItem['parentType'];
    parentId?: string | null;
  },
): Promise<MediaItem> {
  const stored = await persistLocalFile(uri);
  let lat: number | null = null;
  let lng: number | null = null;
  let accuracyM: number | null = null;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      accuracyM = pos.coords.accuracy;
    }
  } catch {
    // GPS is optional on poor coverage sites.
  }

  return {
    id: createId(),
    jobsiteId: input.jobsiteId,
    uri: stored,
    kind: 'photo',
    tag: input.tag ?? 'progress',
    capturedAt: Date.now(),
    lat,
    lng,
    accuracyM,
    parentType: input.parentType ?? null,
    parentId: input.parentId ?? null,
    markup: [],
    caption: '',
  };
}
