import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Chip, ChipGroup, PrimaryButton, SecondaryButton, Section, Stepper } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { CHECKOUT_LOCATIONS } from '@/lib/catalog';
import {
  assetStatusLabel,
  hydDueAt,
  hydInterval,
  meterLabel,
  oilDueAt,
  oilInterval,
  serviceLevel,
  serviceSummary,
} from '@/lib/equipment';
import { createId } from '@/lib/id';
import type { Asset } from '@/lib/types';

const HOUR_CHIPS = [1, 2, 4, 8, 10];

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getAsset, saveAsset, saveMeterEntry, saveServiceLog, saveCheckout, crew, operatorName, jobsite } = useFieldOps();
  const stored = getAsset(id);
  const [asset, setAsset] = useState<Asset | null>(stored ?? null);
  const [hoursAdd, setHoursAdd] = useState(0);
  const [idleAdd, setIdleAdd] = useState(0);
  const [fuelAdd, setFuelAdd] = useState(0);
  const [operator, setOperator] = useState(operatorName);
  const [location, setLocation] = useState(CHECKOUT_LOCATIONS[0]);

  if (!asset) {
    return (
      <Screen>
        <Text style={type.body}>That unit is not on this device.</Text>
      </Screen>
    );
  }

  const current = asset;
  const unit = meterLabel(current);
  const nextMeter = current.hourMeter + hoursAdd;

  async function saveReading() {
    if (hoursAdd <= 0 && idleAdd <= 0 && fuelAdd <= 0) {
      Alert.alert('Nothing to log', 'Add hours, idle, or fuel first.');
      return;
    }
    const next: Asset = {
      ...current,
      hourMeter: nextMeter,
      idleHours: current.idleHours + idleAdd,
      fuelUsedLitres: current.fuelUsedLitres + fuelAdd,
    };
    await saveAsset(next);
    await saveMeterEntry({
      id: createId(),
      assetId: current.id,
      jobsiteId: jobsite?.id ?? current.jobsiteId,
      hourMeter: nextMeter,
      idleAdded: idleAdd,
      fuelAdded: fuelAdd,
      createdAt: Date.now(),
      createdBy: operatorName,
    });
    setAsset(next);
    setHoursAdd(0);
    setIdleAdd(0);
    setFuelAdd(0);
  }

  async function checkOut() {
    const next: Asset = {
      ...current,
      status: 'checked_out',
      assignedTo: operator,
      assignedLocation: location,
      jobsiteId: jobsite?.id ?? current.jobsiteId,
    };
    await saveAsset(next);
    await saveCheckout({
      id: createId(),
      assetId: current.id,
      action: 'out',
      operator,
      location,
      createdAt: Date.now(),
    });
    setAsset(next);
  }

  async function checkIn() {
    const next: Asset = {
      ...current,
      status: 'available',
      assignedTo: null,
      assignedLocation: 'This jobsite',
    };
    await saveAsset(next);
    await saveCheckout({
      id: createId(),
      assetId: current.id,
      action: 'in',
      operator: operatorName,
      location: 'This jobsite',
      createdAt: Date.now(),
    });
    setAsset(next);
  }

  async function completeService(kind: 'oil' | 'hyd') {
    const next: Asset = {
      ...current,
      lastOilHours: kind === 'oil' ? current.hourMeter : current.lastOilHours,
      lastHydHours: kind === 'hyd' ? current.hourMeter : current.lastHydHours,
      status: current.status === 'in_service' ? 'available' : current.status,
    };
    await saveAsset(next);
    await saveServiceLog({
      id: createId(),
      assetId: current.id,
      kind,
      hoursAtService: current.hourMeter,
      createdAt: Date.now(),
    });
    setAsset(next);
  }

  return (
    <Screen>
      <Text style={type.title}>{asset.name}</Text>
      <Text style={type.meta}>
        {asset.unitNumber} · QR {asset.qrCode} · {assetStatusLabel(asset.status)}
      </Text>
      {asset.assignedTo ? (
        <Text style={type.body}>
          With {asset.assignedTo} · {asset.assignedLocation}
        </Text>
      ) : null}
      <View style={styles.meterBox}>
        <Text style={type.label}>CURRENT METER</Text>
        <Text style={styles.meter}>
          {asset.hourMeter} {unit}
        </Text>
        {asset.kind !== 'tool' ? (
          <Text style={type.meta}>{asset.fuelUsedLitres} L used</Text>
        ) : null}
        <Text style={serviceLevel(asset) === 'ok' ? type.meta : styles.due}>{serviceSummary(asset)}</Text>
      </View>

      <Section title={`Log ${unit}`}>
        <ChipGroup>
          {HOUR_CHIPS.map((value) => (
            <Chip key={value} label={`+${value}`} selected={hoursAdd === value} onPress={() => setHoursAdd(value)} />
          ))}
        </ChipGroup>
        <Text style={type.meta}>
          Next reading: {nextMeter} {unit}
        </Text>
        {asset.kind !== 'tool' ? (
          <>
            <Text style={type.label}>IDLE</Text>
            <Stepper value={idleAdd} onChange={setIdleAdd} suffix="hr" max={24} />
            <Text style={type.label}>FUEL ADDED</Text>
            <Stepper value={fuelAdd} onChange={setFuelAdd} suffix="L" max={800} />
          </>
        ) : null}
        <PrimaryButton label="Save meter reading" onPress={saveReading} />
      </Section>

      <Section title="Pre-trip">
        <SecondaryButton label="Start circle check" onPress={() => router.push(`/inspect/${asset.id}` as never)} />
      </Section>

      <Section title="Check-out">
        {asset.status === 'checked_out' ? (
          <PrimaryButton label="Check in" onPress={checkIn} />
        ) : (
          <>
            <ChipGroup>
              {crew.map((member) => (
                <Chip key={member.id} label={member.name} selected={operator === member.name} onPress={() => setOperator(member.name)} />
              ))}
            </ChipGroup>
            <ChipGroup>
              {CHECKOUT_LOCATIONS.map((item) => (
                <Chip key={item} label={item} selected={location === item} onPress={() => setLocation(item)} />
              ))}
            </ChipGroup>
            <PrimaryButton label={`Check out to ${operator}`} onPress={checkOut} />
          </>
        )}
      </Section>

      {oilInterval(asset) || hydInterval(asset) ? (
        <Section title="Service">
          {oilInterval(asset) ? (
            <SecondaryButton
              label={`Complete ${oilInterval(asset)} ${unit} oil (${oilDueAt(asset)} due)`}
              onPress={() => completeService('oil')}
            />
          ) : null}
          {hydInterval(asset) ? (
            <SecondaryButton
              label={`Complete ${hydInterval(asset)} hr hyd filter (${hydDueAt(asset)} due)`}
              onPress={() => completeService('hyd')}
            />
          ) : null}
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meterBox: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  meter: { color: colors.white, fontSize: 36, fontWeight: '900' },
  due: { color: colors.gold, fontWeight: '700' },
});
