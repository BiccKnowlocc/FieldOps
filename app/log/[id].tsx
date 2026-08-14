import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { LogForm } from '@/components/LogForm';
import { PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { formatDay } from '@/lib/dates';

export default function EditLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getLog, crew, saveLog } = useFieldOps();
  const stored = getLog(id);
  const [log, setLog] = useState(stored);

  if (!log) {
    return (
      <Screen>
        <Text style={type.body}>That log is not on this device.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label={`Save ${formatDay(log.logDate)}`}
          onPress={async () => {
            await saveLog(log);
            Alert.alert('Saved on device', 'Queued for sync.');
            router.back();
          }}
        />
      }>
      <LogForm value={log} crew={crew} onChange={setLog} />
    </Screen>
  );
}
