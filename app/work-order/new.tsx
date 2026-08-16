import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip, ChipGroup, PrimaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { SUB_COMPANIES, TRADES, WO_TITLES } from '@/lib/catalog';
import { createId } from '@/lib/id';
import type { Trade } from '@/lib/types';

export default function NewWorkOrderScreen() {
  const router = useRouter();
  const { jobsite, jobsites, workOrders, saveWorkOrder } = useFieldOps();
  const [siteId, setSiteId] = useState(jobsite?.id ?? jobsites[0]?.id ?? '');
  const [company, setCompany] = useState(SUB_COMPANIES[0]);
  const [trade, setTrade] = useState<Trade>('electrical');
  const [title, setTitle] = useState(WO_TITLES[0]);
  const nextNumber = `WO-${100 + workOrders.length + 1}`;

  return (
    <Screen
      footer={
        <PrimaryButton
          label={`Offer ${nextNumber}`}
          disabled={!siteId}
          onPress={async () => {
            await saveWorkOrder({
              id: createId(),
              jobsiteId: siteId,
              number: nextNumber,
              company,
              trade,
              title,
              scope: `${title}. Coordinate with the superintendent before mobilizing.`,
              status: 'offered',
              deliveries: [],
              invoiceUri: null,
              invoiceAmount: null,
              createdAt: Date.now(),
            });
            router.back();
          }}
        />
      }>
      <Text style={type.title}>Work order</Text>
      <Text style={type.meta}>Offer scope to a sub. They accept or decline from the same record — no separate login.</Text>
      <Section title="Jobsite">
        <ChipGroup>
          {jobsites.map((site) => (
            <Chip
              key={site.id}
              label={site.name.replace('Riverside Warehouse — ', '')}
              selected={siteId === site.id}
              onPress={() => setSiteId(site.id)}
            />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Company">
        <ChipGroup>
          {SUB_COMPANIES.map((item) => (
            <Chip key={item} label={item} selected={company === item} onPress={() => setCompany(item)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Trade">
        <ChipGroup>
          {TRADES.map((item) => (
            <Chip key={item.id} label={item.label} selected={trade === item.id} onPress={() => setTrade(item.id)} />
          ))}
        </ChipGroup>
      </Section>
      <Section title="Scope">
        <ChipGroup>
          {WO_TITLES.map((item) => (
            <Chip key={item} label={item} selected={title === item} onPress={() => setTitle(item)} />
          ))}
        </ChipGroup>
      </Section>
    </Screen>
  );
}
