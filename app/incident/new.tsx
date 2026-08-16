import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip, ChipGroup, PrimaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { INCIDENT_TITLES, PRIORITIES, ROOT_CAUSES } from '@/lib/catalog';
import { createId } from '@/lib/id';
import type { IncidentKind, IncidentSeverity, RootCause } from '@/lib/types';

const LOCATIONS = ['Level 2 corridor, grid D-8', 'Dock 3 ramp', 'Rooms 204–208', 'Laydown yard'];

export default function NewIncidentScreen() {
  const router = useRouter();
  const { jobsite, allCrew, saveIncident } = useFieldOps();
  const [kind, setKind] = useState<IncidentKind>('near_miss');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [title, setTitle] = useState(INCIDENT_TITLES[0]);
  const [locationNote, setLocationNote] = useState(LOCATIONS[0]);
  const [rootCauses, setRootCauses] = useState<RootCause[]>(['procedure']);
  const [involvedIds, setInvolvedIds] = useState<string[]>([]);

  function toggleCause(id: RootCause) {
    setRootCauses((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Save report"
          disabled={!jobsite}
          onPress={async () => {
            if (!jobsite) return;
            const id = createId();
            await saveIncident({
              id,
              jobsiteId: jobsite.id,
              kind,
              severity,
              title,
              description: `${kind === 'near_miss' ? 'Near miss' : 'Incident'} at ${locationNote}.`,
              locationNote,
              rootCauses,
              involvedIds,
              photoUris: [],
              createdAt: Date.now(),
            });
            router.replace(`/incident/${id}` as never);
          }}
        />
      }>
      <Text style={type.title}>Safety report</Text>
      <Text style={type.meta}>Near-miss or incident. Photos and root-cause tags stay on the device until sync.</Text>
      <Section title="Type">
        <ChipGroup>
          <Chip label="Near miss" selected={kind === 'near_miss'} onPress={() => setKind('near_miss')} />
          <Chip label="Incident" selected={kind === 'incident'} onPress={() => setKind('incident')} tone="danger" />
        </ChipGroup>
      </Section>
      <Section title="Severity">
        <ChipGroup>
          {PRIORITIES.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={severity === item.id}
              tone={item.id === 'critical' || item.id === 'high' ? 'danger' : 'default'}
              onPress={() => setSeverity(item.id)}
            />
          ))}
        </ChipGroup>
      </Section>
      <Section title="What happened">
        <ChipGroup>
          {INCIDENT_TITLES.map((item) => (
            <Chip key={item} label={item} selected={title === item} onPress={() => setTitle(item)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Where">
        <ChipGroup>
          {LOCATIONS.map((item) => (
            <Chip key={item} label={item} selected={locationNote === item} onPress={() => setLocationNote(item)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Root cause">
        <ChipGroup>
          {ROOT_CAUSES.map((item) => (
            <Chip key={item.id} label={item.label} selected={rootCauses.includes(item.id)} onPress={() => toggleCause(item.id)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="People involved">
        <ChipGroup>
          {allCrew.map((member) => (
            <Chip
              key={member.id}
              label={member.name}
              selected={involvedIds.includes(member.id)}
              onPress={() =>
                setInvolvedIds((current) =>
                  current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id],
                )
              }
            />
          ))}
        </ChipGroup>
      </Section>
    </Screen>
  );
}
