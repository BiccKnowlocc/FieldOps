import { useLocalSearchParams } from 'expo-router';
import { Alert, Text } from 'react-native';

import { Chip, ChipGroup, PrimaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { formatDay } from '@/lib/dates';
import { exportTalkRoster } from '@/lib/safety';
import type { ToolboxTalk } from '@/lib/types';

export default function TalkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTalk } = useFieldOps();
  const talk = getTalk(id);

  if (!talk) {
    return (
      <Screen>
        <Text style={type.body}>That toolbox talk is not on this device.</Text>
      </Screen>
    );
  }

  return <TalkBody talk={talk} />;
}

function TalkBody({ talk }: { talk: ToolboxTalk }) {
  const { allCrew, jobsite, saveTalk } = useFieldOps();
  const names = allCrew.filter((member) => talk.attendeeIds.includes(member.id)).map((member) => member.name);

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Share / print roster"
          onPress={async () => {
            try {
              await exportTalkRoster({
                talk,
                siteName: jobsite?.name ?? 'Jobsite',
                names,
              });
            } catch {
              Alert.alert('Could not export', 'Try again or copy from the signed-in list.');
            }
          }}
        />
      }>
      <Text style={type.meta}>{formatDay(talk.date)}</Text>
      <Text style={type.title}>{talk.topic}</Text>
      <Text style={type.body}>
        {talk.attendeeIds.length} of {allCrew.length} signed in
      </Text>
      <Section title="Talking points">
        {talk.points.map((point) => (
          <Text key={point} style={type.body}>
            {point}
          </Text>
        ))}
      </Section>
      <Section title="Sign-in roster">
        <ChipGroup>
          {allCrew.map((member) => (
            <Chip
              key={member.id}
              label={member.name}
              selected={talk.attendeeIds.includes(member.id)}
              onPress={() => {
                const attendeeIds = talk.attendeeIds.includes(member.id)
                  ? talk.attendeeIds.filter((crewId) => crewId !== member.id)
                  : [...talk.attendeeIds, member.id];
                void saveTalk({ ...talk, attendeeIds });
              }}
            />
          ))}
        </ChipGroup>
      </Section>
    </Screen>
  );
}
