import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { Chip, ChipGroup, PrimaryButton, SecondaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { capturePhoto, pickFromLibrary } from '@/lib/capture';
import { COST_CODES } from '@/lib/catalog';
import { createId } from '@/lib/id';
import { usd } from '@/lib/money';
import { DEMO_TICKET_TEXT, parseTicket, poVariance } from '@/lib/ocrTicket';

export default function OcrScreen() {
  return (
    <Gate feature="ocr">
      <OcrBody />
    </Gate>
  );
}

function OcrBody() {
  const router = useRouter();
  const { jobsite, saveReceipt, saveMedia, purchaseOrders } = useFieldOps();
  const [raw, setRaw] = useState(DEMO_TICKET_TEXT);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const parsed = parseTicket(raw);
  const amount = parsed.amount ?? 1847;
  const po = purchaseOrders[0];
  const ordered = po?.qty ?? 40;
  const variance = parsed.netTons != null ? poVariance(parsed.netTons, ordered) : null;

  async function snap(fromLibrary: boolean) {
    if (!jobsite) return;
    const media = fromLibrary
      ? await pickFromLibrary({ jobsiteId: jobsite.id, tag: 'receipt', parentType: 'receipt' })
      : await capturePhoto({ jobsiteId: jobsite.id, tag: 'receipt', parentType: 'receipt' });
    if (!media) {
      Alert.alert('No photo', 'Camera or library permission is required.');
      return;
    }
    await saveMedia(media);
    setPhotoUri(media.uri);
    setRaw(DEMO_TICKET_TEXT);
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label={`Post ${usd(amount)} to ledger`}
          onPress={async () => {
            if (!jobsite) return;
            await saveReceipt({
              id: createId(),
              jobsiteId: jobsite.id,
              vendor: parsed.vendor,
              costCode: parsed.material === 'Aggregate' ? '31-200' : '06-100',
              amount,
              photoUri,
              ocrNote: `Ticket ${parsed.ticketNo} · ${parsed.netTons ?? '?'} T net`,
              createdAt: Date.now(),
            });
            Alert.alert('Inventory', `${parsed.netTons ?? 0} t added to the material ledger. ERP push is the next wire.`);
            router.back();
          }}
        />
      }>
      <Text style={type.title}>Ticket OCR</Text>
      <Text style={type.meta}>Deskew, key-values, PO check. Demo parse runs on-device until the vision model is attached.</Text>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" /> : null}
      <View style={{ gap: 10 }}>
        <PrimaryButton label="Snap ticket" onPress={() => snap(false)} />
        <SecondaryButton label="From library" onPress={() => snap(true)} />
      </View>
      <TextInput value={raw} onChangeText={setRaw} multiline style={styles.input} />
      <Section title="Extracted">
        <Text style={type.body}>
          {parsed.vendor} · Ticket {parsed.ticketNo || '—'} · {parsed.material}
        </Text>
        <Text style={type.meta}>
          Net {parsed.netTons != null ? `${parsed.netTons} t` : '—'} · {parsed.amount != null ? usd(parsed.amount) : 'No total'} · Job {parsed.jobNumber ?? '—'}
        </Text>
        {variance ? <Text style={variance.ok ? styles.ok : styles.hot}>{variance.message}</Text> : null}
      </Section>
      <Section title="Cost code">
        <ChipGroup>
          {COST_CODES.map((item) => (
            <Chip key={item.code} label={item.code} selected={item.code === (parsed.material === 'Aggregate' ? '31-200' : '06-100')} />
          ))}
        </ChipGroup>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 160, borderRadius: radius.md, backgroundColor: colors.navy },
  input: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: 'monospace',
    color: colors.ink,
    backgroundColor: colors.white,
  },
  ok: { color: colors.green, fontWeight: '800' },
  hot: { color: colors.red, fontWeight: '800' },
});
