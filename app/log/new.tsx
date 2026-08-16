import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { LogForm } from '@/components/LogForm';
import { PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { createId } from '@/lib/id';
import { todayISO } from '@/lib/dates';
import type { DailyLog } from '@/lib/types';

export default function NewLogScreen() {
  const router = useRouter();
  const { jobsite, crew, logs, saveLog, operatorName } = useFieldOps();
  const existing = logs.find((log) => log.logDate === todayISO());

  const initial = useMemo<DailyLog>(
    () =>
      existing ?? {
        id: createId(),
        jobsiteId: jobsite?.id ?? '',
        logDate: todayISO(),
        weather: 'clear',
        tempC: 20,
        crewIds: [],
        workChips: [],
        workNotes: '',
        visitors: [],
        deliveries: [],
        delays: [],
        createdBy: operatorName,
        createdAt: Date.now(),
      },
    [existing, jobsite?.id, operatorName],
  );

  const [log, setLog] = useState(initial);

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Save log"
          onPress={async () => {
            if (!jobsite) return;
            await saveLog({ ...log, jobsiteId: jobsite.id });
            Alert.alert('Saved on device', 'This log will sync automatically when you have signal.');
            router.back();
          }}
        />
      }>
      <LogForm value={log} crew={crew} onChange={setLog} />
    </Screen>
  );
}
