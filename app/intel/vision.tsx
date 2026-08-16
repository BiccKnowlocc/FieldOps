import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Gate } from '@/components/Gate';
import { PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { capturePhoto, pickFromLibrary } from '@/lib/capture';
import { createId } from '@/lib/id';
import { scanPhoto, type VisionFinding } from '@/lib/visionScan';

export default function VisionScreen() {
  return (
    <Gate feature="cv_inspect">
      <VisionBody />
    </Gate>
  );
}

function VisionBody() {
  const router = useRouter();
  const { jobsite, saveMedia, savePunch } = useFieldOps();
  const [uri, setUri] = useState<string | null>(null);
  const [findings, setFindings] = useState<VisionFinding[]>([]);

  async function snap(fromLibrary: boolean) {
    if (!jobsite) return;
    const media = fromLibrary
      ? await pickFromLibrary({ jobsiteId: jobsite.id, tag: 'defect', parentType: 'jobsite' })
      : await capturePhoto({ jobsiteId: jobsite.id, tag: 'defect', parentType: 'jobsite' });
    if (!media) {
      Alert.alert('No photo', 'Camera or library permission is required.');
      return;
    }
    await saveMedia(media);
    setUri(media.uri);
    setFindings(scanPhoto(media.tag));
  }

  return (
    <Screen
      footer={
        findings.some((item) => item.kind === 'defect') ? (
          <PrimaryButton
            label="Open punch from defect"
            onPress={async () => {
              if (!jobsite) return;
              const defect = findings.find((item) => item.kind === 'defect');
              const id = createId();
              await savePunch({
                id,
                jobsiteId: jobsite.id,
                title: defect?.label ?? 'CV defect',
                description: 'Opened from computer-vision scan. Confirm in the field before cover-up.',
                trade: 'electrical',
                assignee: '',
                company: '',
                priority: 'high',
                status: 'open',
                dueDate: new Date().toISOString().slice(0, 10),
                locationNote: 'From site walk photo',
                beforeMediaIds: [],
                afterMediaIds: [],
                createdAt: Date.now(),
              });
              router.push(`/punch/${id}` as never);
            }}
          />
        ) : null
      }>
      <Text style={type.title}>CV inspect</Text>
      <Text style={type.meta}>Object detection on the walk. PPE, firestop, nail spacing — confirm before the next trade covers it.</Text>
      {uri ? <Image source={{ uri }} style={styles.photo} contentFit="cover" /> : null}
      <View style={{ gap: 10 }}>
        <PrimaryButton label="Scan site photo" onPress={() => snap(false)} />
        <SecondaryButton label="From library" onPress={() => snap(true)} />
      </View>
      {findings.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.kind}>{item.kind.toUpperCase()}</Text>
          <Text style={type.body}>{item.label}</Text>
          <Text style={type.meta}>{Math.round(item.confidence * 100)}% model confidence (demo weights)</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.navy },
  row: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 4 },
  kind: { fontWeight: '800', color: colors.orange, letterSpacing: 0.4 },
});
