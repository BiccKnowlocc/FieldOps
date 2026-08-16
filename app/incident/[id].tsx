import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { capturePhoto, pickFromLibrary } from '@/lib/capture';
import { rootCauseLabel } from '@/lib/catalog';
import { formatStamp } from '@/lib/dates';
import type { Incident } from '@/lib/types';

export default function IncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getIncident } = useFieldOps();
  const incident = getIncident(id);

  if (!incident) {
    return (
      <Screen>
        <Text style={type.body}>That report is not on this device.</Text>
      </Screen>
    );
  }

  return <IncidentBody incident={incident} />;
}

function IncidentBody({ incident }: { incident: Incident }) {
  const router = useRouter();
  const { allCrew, drawings, saveIncident, saveMedia } = useFieldOps();
  const involved = allCrew.filter((member) => incident.involvedIds.includes(member.id));
  const sheet = drawings.find(
    (drawing) => drawing.current && incident.locationNote.toLowerCase().includes(drawing.linkHint.toLowerCase()),
  );

  async function snap(fromLibrary: boolean) {
    const media = fromLibrary
      ? await pickFromLibrary({
          jobsiteId: incident.jobsiteId,
          tag: 'incident',
          parentType: 'incident',
          parentId: incident.id,
        })
      : await capturePhoto({
          jobsiteId: incident.jobsiteId,
          tag: 'incident',
          parentType: 'incident',
          parentId: incident.id,
        });
    if (!media) {
      Alert.alert('No photo', 'Camera or library permission is required.');
      return;
    }
    await saveMedia(media);
    await saveIncident({ ...incident, photoUris: [...incident.photoUris, media.uri] });
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Snap photo" onPress={() => snap(false)} />
          <SecondaryButton label="From library" onPress={() => snap(true)} />
        </View>
      }>
      <Text style={type.meta}>{formatStamp(incident.createdAt)}</Text>
      <Text style={type.title}>{incident.title}</Text>
      <Text style={type.body}>
        {incident.kind === 'near_miss' ? 'Near miss' : 'Incident'} · {incident.severity}
      </Text>
      <Text style={type.meta}>{incident.locationNote}</Text>
      <Text style={type.body}>{incident.description}</Text>
      <Section title="Root cause">
        <Text style={type.body}>{incident.rootCauses.map(rootCauseLabel).join(' · ') || 'Not tagged'}</Text>
      </Section>
      <Section title="Involved">
        <Text style={type.body}>{involved.length ? involved.map((member) => member.name).join(', ') : 'Nobody named'}</Text>
      </Section>
      {sheet ? (
        <PrimaryButton label={`Open ${sheet.sheetNumber}`} onPress={() => router.push(`/drawing/${sheet.id}` as never)} />
      ) : null}
      {incident.photoUris.map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />
      ))}
      {sheet ? (
        <Pressable onPress={() => router.push(`/drawing/${sheet.id}` as never)}>
          <Text style={type.meta}>Linked sheet {sheet.sheetNumber} rev {sheet.revision}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.navy },
});
