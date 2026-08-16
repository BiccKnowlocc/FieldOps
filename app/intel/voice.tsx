import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Gate } from '@/components/Gate';
import { Chip, ChipGroup, PrimaryButton, SecondaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { createId } from '@/lib/id';
import { todayISO } from '@/lib/dates';
import { applyVoiceToLog, DEMO_VOICE_TAKE, parseVoiceLog } from '@/lib/voiceLog';

export default function VoiceLogScreen() {
  return (
    <Gate feature="voice_log">
      <VoiceBody />
    </Gate>
  );
}

function VoiceBody() {
  const router = useRouter();
  const { jobsite, crew, logs, saveLog, operatorName } = useFieldOps();
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const parsed = transcript.trim() ? parseVoiceLog(transcript, crew) : null;

  async function recordStub() {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setTranscript(DEMO_VOICE_TAKE);
      Alert.alert('Noise gate', 'DSP strip applied. Whisper slot is ready — demo take parsed on device.');
    }, 900);
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Write to today’s log"
          disabled={!parsed || !jobsite}
          onPress={async () => {
            if (!parsed || !jobsite) return;
            const today = logs.find((log) => log.logDate === todayISO());
            const base = today ?? {
              id: createId(),
              jobsiteId: jobsite.id,
              logDate: todayISO(),
              weather: 'clear' as const,
              tempC: 22,
              crewIds: [],
              workChips: [],
              workNotes: '',
              visitors: [],
              deliveries: [],
              delays: [],
              createdBy: operatorName,
              createdAt: Date.now(),
            };
            await saveLog(applyVoiceToLog(base, parsed, crew));
            if (parsed.draftChangeOrder) {
              Alert.alert('Escalation', parsed.draftChangeOrder);
            }
            router.push('/logs');
          }}
        />
      }>
      <Text style={type.title}>Voice log</Text>
      <Text style={type.meta}>Tap record (gloves on). We transcribe, map cost codes, and flag delays. Whisper wires in later.</Text>
      <View style={{ gap: 10 }}>
        <PrimaryButton label={recording ? 'Listening…' : 'Hold-free record'} onPress={recordStub} />
        <SecondaryButton label="Use demo take" onPress={() => setTranscript(DEMO_VOICE_TAKE)} />
      </View>
      <TextInput
        value={transcript}
        onChangeText={setTranscript}
        multiline
        placeholder="Or paste / type the take"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      {parsed ? (
        <>
          <Section title="Structured fields">
            <Text style={type.body}>{parsed.crewCount} on site · {parsed.workChips.join(', ')}</Text>
            {parsed.delays.map((delay) => (
              <Text key={delay.notes} style={styles.flag}>
                Delay {delay.hours}h · {delay.notes}
              </Text>
            ))}
            {parsed.deliveries.map((item) => (
              <Text key={item.description} style={type.body}>
                Delivery · {item.supplier} · {item.description}
              </Text>
            ))}
          </Section>
          <Section title="Cost codes">
            <ChipGroup>
              {parsed.costCodes.map((code) => (
                <Chip key={code} label={code} selected />
              ))}
            </ChipGroup>
          </Section>
          {parsed.flags.map((flag) => (
            <Text key={flag} style={styles.flag}>
              {flag}
            </Text>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
  flag: { color: colors.red, fontWeight: '800' },
});
