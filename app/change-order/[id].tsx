import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { PrimaryButton, Section, Stepper } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { SignaturePad } from '@/components/SignaturePad';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { changeOrderAmount } from '@/lib/jobCost';
import { usd } from '@/lib/money';
import type { ChangeOrder } from '@/lib/types';

export default function ChangeOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getChangeOrder, saveChangeOrder, operatorName } = useFieldOps();
  const stored = getChangeOrder(id);
  const [order, setOrder] = useState<ChangeOrder | null>(stored ?? null);

  if (!order) {
    return (
      <Screen>
        <Text style={type.body}>That change order is not on this device.</Text>
      </Screen>
    );
  }

  const current = order;
  const signed = current.status === 'signed';

  return (
    <Screen
      footer={
        signed ? null : (
          <PrimaryButton
            label={`Collect signature · ${usd(changeOrderAmount(current))}`}
            onPress={async () => {
              if (current.signature.length === 0) {
                Alert.alert('Need a signature', 'Owner or super signs before extra work starts.');
                return;
              }
              const next: ChangeOrder = {
                ...current,
                status: 'signed',
                signedBy: operatorName,
                signedAt: Date.now(),
              };
              await saveChangeOrder(next);
              setOrder(next);
              Alert.alert('Signed', 'Added to contract value.');
              router.back();
            }}
          />
        )
      }>
      <Text style={type.title}>
        {current.number} · {current.title}
      </Text>
      <Text style={type.meta}>{signed ? `Signed by ${current.signedBy}` : 'Draft — do not start extra work yet'}</Text>
      <Text style={type.body}>{usd(changeOrderAmount(current))}</Text>
      {current.lines.map((line) => (
        <Text key={line.id} style={type.meta}>
          {line.qty} {line.unit} {line.description} · {line.costCode}
        </Text>
      ))}
      {!signed ? (
        <>
          <Section title="Labor hours">
            <Stepper
              value={current.laborHours}
              onChange={(laborHours) => setOrder({ ...current, laborHours })}
              suffix="hr"
              max={80}
            />
          </Section>
          <Section title="Client signature">
            <SignaturePad strokes={current.signature} onChange={(signature) => setOrder({ ...current, signature })} />
          </Section>
        </>
      ) : null}
    </Screen>
  );
}
