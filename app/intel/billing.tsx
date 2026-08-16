import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { Card, Chip, ChipGroup, PrimaryButton, SecondaryButton, Section, Stepper } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { SignaturePad } from '@/components/SignaturePad';
import { colors, type } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { createId } from '@/lib/id';
import { usd } from '@/lib/money';
import type { MarkupStroke } from '@/lib/types';

const LINES = ['Framing 100%', 'MEP rough-in 80%', 'Earthwork pay quantity'];

export default function BillingScreen() {
  return (
    <Gate feature="billing">
      <BillingBody />
    </Gate>
  );
}

function BillingBody() {
  const { session } = useAuth();
  const { jobsite, payApps, waivers, saveRecord } = useFieldOps();
  const [line, setLine] = useState(LINES[0]);
  const [pct, setPct] = useState(80);
  const [amount, setAmount] = useState(24000);
  const [signature, setSignature] = useState<MarkupStroke[]>([]);
  const isVendor = session?.role === 'vendor';
  const isForeman = session?.role === 'foreman';

  return (
    <Screen
      footer={
        isVendor || isForeman ? (
          <PrimaryButton
            label={isVendor ? 'Submit pay app' : 'Issue CCDC draft'}
            onPress={async () => {
              if (!jobsite) return;
              const id = createId();
              const number = `PA-${100 + payApps.length + 1}`;
              await saveRecord(id, 'pay_apps', {
                id,
                jobsiteId: jobsite.id,
                number,
                company: session?.name ?? 'Vendor',
                lineTitle: line,
                percentComplete: pct,
                amount,
                photoUris: [],
                status: isVendor ? 'submitted' : 'draft',
                createdAt: Date.now(),
              });
              Alert.alert(number, 'CCDC progress claim layout is generated. Photo evidence attaches on the next wire.');
            }}
          />
        ) : null
      }>
      <Text style={type.title}>Progress billing</Text>
      <Text style={type.meta}>Milestone + geo photo (next) → approve → conditional waiver → unconditional when funds clear.</Text>
      <Section title="Line">
        <ChipGroup>
          {LINES.map((item) => (
            <Chip key={item} label={item} selected={line === item} onPress={() => setLine(item)} />
          ))}
        </ChipGroup>
        <Stepper value={pct} onChange={setPct} min={10} max={100} step={5} suffix="%" />
        <Stepper value={amount} onChange={setAmount} min={500} max={200000} step={500} suffix="CAD" />
      </Section>
      {payApps.map((app) => {
        const waiver = waivers.find((item) => item.payAppId === app.id);
        return (
          <Card key={app.id} style={{ gap: 8 }}>
            <Text style={styles.title}>
              {app.number} · {app.lineTitle}
            </Text>
            <Text style={type.meta}>
              {app.company} · {app.percentComplete}% · {usd(app.amount)} · {app.status}
            </Text>
            {isForeman && app.status === 'submitted' ? (
              <PrimaryButton
                label="Approve"
                onPress={() => saveRecord(app.id, 'pay_apps', { ...app, status: 'approved' })}
              />
            ) : null}
            {isForeman && app.status === 'approved' && !waiver ? (
              <SecondaryButton
                label="Issue conditional waiver"
                onPress={async () => {
                  const id = createId();
                  await saveRecord(id, 'lien_waivers', {
                    id,
                    payAppId: app.id,
                    kind: 'conditional',
                    signedBy: session?.name ?? null,
                    signedAt: Date.now(),
                  });
                }}
              />
            ) : null}
            {waiver ? (
              <Text style={type.body}>
                {waiver.kind} waiver{waiver.signedBy ? ` · ${waiver.signedBy}` : ''}
              </Text>
            ) : null}
            {isForeman && waiver?.kind === 'conditional' ? (
              <PrimaryButton
                label="Funds cleared → unconditional"
                onPress={() =>
                  saveRecord(waiver.id, 'lien_waivers', { ...waiver, kind: 'unconditional', signedAt: Date.now() })
                }
              />
            ) : null}
          </Card>
        );
      })}
      <Section title="Sign CCDC claim">
        <SignaturePad strokes={signature} onChange={setSignature} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', color: colors.ink, fontSize: 16 },
});
