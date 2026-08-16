import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip, ChipGroup, PrimaryButton, Section, Stepper } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { SignaturePad } from '@/components/SignaturePad';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { CO_TITLES, COST_CODES, LABOR_RATE } from '@/lib/catalog';
import { createId } from '@/lib/id';
import { changeOrderAmount } from '@/lib/jobCost';
import { usd } from '@/lib/money';
import type { ChangeOrder, MarkupStroke } from '@/lib/types';

export default function NewChangeOrderScreen() {
  const router = useRouter();
  const { jobsite, saveChangeOrder, operatorName, changeOrders } = useFieldOps();
  const [title, setTitle] = useState(CO_TITLES[0]);
  const [laborHours, setLaborHours] = useState(8);
  const [qty, setQty] = useState(4);
  const [costCode, setCostCode] = useState('03-300');
  const [signature, setSignature] = useState<MarkupStroke[]>([]);
  const [orderId] = useState(createId);
  const [lineId] = useState(createId);
  const code = COST_CODES.find((item) => item.code === costCode);
  const draft: ChangeOrder = {
    id: orderId,
    jobsiteId: jobsite?.id ?? '',
    number: `CO-${String(changeOrders.length + 1).padStart(3, '0')}`,
    title,
    laborHours,
    laborRate: LABOR_RATE,
    lines: [
      {
        id: lineId,
        description: title,
        qty,
        unit: code?.unit ?? 'ea',
        unitCost: code?.unitCost ?? 1,
        costCode,
      },
    ],
    status: 'draft',
    signature,
    signedBy: null,
    signedAt: null,
    createdAt: Date.now(),
  };

  return (
    <Screen
      footer={
        <PrimaryButton
          label={signature.length ? `Sign and lock ${usd(changeOrderAmount(draft))}` : `Save draft ${usd(changeOrderAmount(draft))}`}
          onPress={async () => {
            if (!jobsite) return;
            const signed = signature.length > 0;
            await saveChangeOrder({
              ...draft,
              jobsiteId: jobsite.id,
              status: signed ? 'signed' : 'draft',
              signedBy: signed ? operatorName : null,
              signedAt: signed ? Date.now() : null,
            });
            Alert.alert(signed ? 'Change order signed' : 'Draft saved', 'It stays on this device until sync.');
            router.back();
          }}
        />
      }>
      <Section title="What changed">
        <ChipGroup>
          {CO_TITLES.map((item) => (
            <Chip key={item} label={item} selected={title === item} onPress={() => setTitle(item)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Cost code">
        <ChipGroup>
          {COST_CODES.map((item) => (
            <Chip key={item.code} label={item.name} selected={costCode === item.code} onPress={() => setCostCode(item.code)} />
          ))}
        </ChipGroup>
        <Stepper value={qty} onChange={setQty} suffix={code?.unit} min={1} max={500} />
      </Section>
      <Section title="Extra labor">
        <Stepper value={laborHours} onChange={setLaborHours} suffix="hr" max={80} />
      </Section>
      <Section title="Client signature">
        <SignaturePad strokes={signature} onChange={setSignature} />
      </Section>
    </Screen>
  );
}
