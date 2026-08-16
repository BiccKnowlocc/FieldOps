import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip, ChipGroup, PrimaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { TOOLBOX_TOPICS } from '@/lib/catalog';
import { todayISO } from '@/lib/dates';
import { createId } from '@/lib/id';

export default function NewTalkScreen() {
  const router = useRouter();
  const { jobsite, saveTalk } = useFieldOps();
  const [topicId, setTopicId] = useState(TOOLBOX_TOPICS[0].id);
  const topic = TOOLBOX_TOPICS.find((item) => item.id === topicId) ?? TOOLBOX_TOPICS[0];

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Start talk"
          disabled={!jobsite}
          onPress={async () => {
            if (!jobsite) return;
            const id = createId();
            await saveTalk({
              id,
              jobsiteId: jobsite.id,
              date: todayISO(),
              topic: topic.title,
              points: topic.points,
              attendeeIds: [],
              createdAt: Date.now(),
            });
            router.replace(`/talk/${id}` as never);
          }}
        />
      }>
      <Text style={type.title}>Toolbox talk</Text>
      <Text style={type.meta}>Pick a topic from the library. Crew signs in on the next screen.</Text>
      <Section title="Topic">
        <ChipGroup>
          {TOOLBOX_TOPICS.map((item) => (
            <Chip key={item.id} label={item.title} selected={topicId === item.id} onPress={() => setTopicId(item.id)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Talking points">
        {topic.points.map((point) => (
          <Text key={point} style={type.body}>
            {point}
          </Text>
        ))}
      </Section>
    </Screen>
  );
}
