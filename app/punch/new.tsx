import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { PunchForm } from '@/components/PunchForm';
import { PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { addDaysISO, todayISO } from '@/lib/dates';
import { createId } from '@/lib/id';
import type { PunchItem } from '@/lib/types';

export default function NewPunchScreen() {
  const router = useRouter();
  const { jobsite, savePunch } = useFieldOps();
  const initial = useMemo<PunchItem>(
    () => ({
      id: createId(),
      jobsiteId: jobsite?.id ?? '',
      title: '',
      description: '',
      trade: 'general',
      assignee: '',
      company: '',
      priority: 'medium',
      status: 'open',
      dueDate: addDaysISO(todayISO(), 7),
      locationNote: '',
      beforeMediaIds: [],
      afterMediaIds: [],
      createdAt: Date.now(),
    }),
    [jobsite?.id],
  );
  const [item, setItem] = useState(initial);

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Save punch item"
          onPress={async () => {
            if (!item.title.trim()) {
              Alert.alert('Need a title', 'Pick a chip or type a short defect title.');
              return;
            }
            if (!jobsite) return;
            await savePunch({ ...item, jobsiteId: jobsite.id });
            router.back();
          }}
        />
      }>
      <PunchForm value={item} onChange={setItem} />
    </Screen>
  );
}
