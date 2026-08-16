import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ChipGroup, PrimaryButton, SecondaryButton, Section, Stepper } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, tap, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { capturePhoto, pickFromLibrary } from '@/lib/capture';
import { COST_CODES, VENDORS } from '@/lib/catalog';
import { createId } from '@/lib/id';
import { parseAmountsFromText, usd } from '@/lib/money';

export default function NewReceiptScreen() {
  const router = useRouter();
  const { jobsite, saveReceipt, saveMedia } = useFieldOps();
  const [vendor, setVendor] = useState(VENDORS[0]);
  const [costCode, setCostCode] = useState('06-100');
  const [amount, setAmount] = useState(48);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrNote, setOcrNote] = useState('');

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
    const guessed = parseAmountsFromText(media.caption || '');
    if (guessed) setAmount(Math.round(guessed));
    setOcrNote(guessed ? `Read ${usd(guessed)} from slip text` : 'Confirm the total from the photo');
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label={`Save ${usd(amount)} to ${costCode}`}
          onPress={async () => {
            if (!jobsite) return;
            await saveReceipt({
              id: createId(),
              jobsiteId: jobsite.id,
              vendor,
              costCode,
              amount,
              photoUri,
              ocrNote,
              createdAt: Date.now(),
            });
            router.back();
          }}
        />
      }>
      <Text style={type.title}>Receipt</Text>
      <Text style={type.meta}>Snap the slip, tag a cost code, confirm the total. Works offline.</Text>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" /> : null}
      <View style={{ gap: 10 }}>
        <PrimaryButton label="Snap slip" onPress={() => snap(false)} />
        <SecondaryButton label="From library" onPress={() => snap(true)} />
      </View>
      {ocrNote ? <Text style={type.meta}>{ocrNote}</Text> : null}

      <Section title="Vendor">
        <ChipGroup>
          {VENDORS.map((item) => (
            <Chip key={item} label={item} selected={vendor === item} onPress={() => setVendor(item)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Cost code">
        <ChipGroup>
          {COST_CODES.map((item) => (
            <Chip key={item.code} label={`${item.code} ${item.name}`} selected={costCode === item.code} onPress={() => setCostCode(item.code)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Amount">
        <ChipGroup>
          {[12, 28, 48, 86, 128, 247, 486].map((value) => (
            <Chip key={value} label={usd(value)} selected={amount === value} onPress={() => setAmount(value)} />
          ))}
        </ChipGroup>
        <Stepper value={amount} onChange={setAmount} min={1} max={20000} step={1} />
        <TextInput
          value={String(amount)}
          onChangeText={(text) => {
            const next = Number(text.replace(/[^0-9.]/g, ''));
            if (Number.isFinite(next)) {
              setAmount(Math.round(next));
              const parsed = parseAmountsFromText(text);
              if (parsed) setOcrNote(`Read ${usd(parsed)} from typed total`);
            }
          }}
          keyboardType="decimal-pad"
          placeholder="Total"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.navy },
  input: {
    minHeight: tap.min,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    backgroundColor: colors.white,
  },
});
