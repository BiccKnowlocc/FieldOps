import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { createId } from './id';

export async function persistLocalFile(sourceUri: string) {
  if (Platform.OS === 'web') {
    if (sourceUri.startsWith('data:') || sourceUri.startsWith('blob:')) {
      if (sourceUri.startsWith('blob:')) {
        const response = await fetch(sourceUri);
        const blob = await response.blob();
        return blobToDataUrl(blob);
      }
      return sourceUri;
    }
    return sourceUri;
  }

  const directory = `${FileSystem.documentDirectory}media/`;
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }
  const dest = `${directory}${createId()}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
