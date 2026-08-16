import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip, ChipGroup, PrimaryButton, Section } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { SHIFT_WINDOWS, TRADES } from '@/lib/catalog';
import { addDaysISO, formatDay, todayISO } from '@/lib/dates';
import { createId } from '@/lib/id';
import type { Trade } from '@/lib/types';

export default function NewShiftScreen() {
  const router = useRouter();
  const { allCrew, jobsites, jobsite, assets, saveShift } = useFieldOps();
  const [crewId, setCrewId] = useState(allCrew[0]?.id ?? '');
  const [siteId, setSiteId] = useState(jobsite?.id ?? jobsites[0]?.id ?? '');
  const [date, setDate] = useState(todayISO());
  const [windowId, setWindowId] = useState(SHIFT_WINDOWS[0].id);
  const [trade, setTrade] = useState<Trade>(allCrew[0]?.trade ?? 'general');
  const [assetId, setAssetId] = useState<string | null>(null);

  const member = allCrew.find((item) => item.id === crewId);
  const window = SHIFT_WINDOWS.find((item) => item.id === windowId) ?? SHIFT_WINDOWS[0];

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Save and queue alert"
          disabled={!crewId || !siteId}
          onPress={async () => {
            if (!member || !siteId) return;
            await saveShift({
              id: createId(),
              jobsiteId: siteId,
              date,
              crewId: member.id,
              crewName: member.name,
              trade,
              assetId,
              startHour: window.startHour,
              endHour: window.endHour,
              alertSent: true,
            });
            Alert.alert('Queued', 'SMS / push will go out when this device is online.');
            router.back();
          }}
        />
      }>
      <Text style={type.title}>Assign shift</Text>
      <Text style={type.meta}>Crew, site, window, optional iron. Alerts queue locally — no carrier required.</Text>

      <Section title="Crew">
        <ChipGroup>
          {allCrew.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              selected={crewId === item.id}
              onPress={() => {
                setCrewId(item.id);
                setTrade(item.trade);
              }}
            />
          ))}
        </ChipGroup>
      </Section>
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
      <Section title="Day">
        <ChipGroup>
          {[0, 1, 2].map((offset) => {
            const iso = addDaysISO(todayISO(), offset);
            return (
              <Chip
                key={iso}
                label={offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : formatDay(iso)}
                selected={date === iso}
                onPress={() => setDate(iso)}
              />
            );
          })}
        </ChipGroup>
      </Section>
      <Section title="Window">
        <ChipGroup>
          {SHIFT_WINDOWS.map((item) => (
            <Chip key={item.id} label={item.label} selected={windowId === item.id} onPress={() => setWindowId(item.id)} />
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
      <Section title="Equipment">
        <ChipGroup>
          <Chip label="None" selected={assetId == null} onPress={() => setAssetId(null)} />
          {assets
            .filter((asset) => asset.status !== 'down')
            .map((asset) => (
              <Chip
                key={asset.id}
                label={asset.unitNumber}
                selected={assetId === asset.id}
                onPress={() => setAssetId(asset.id)}
              />
            ))}
        </ChipGroup>
      </Section>
    </Screen>
  );
}
