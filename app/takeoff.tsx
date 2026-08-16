import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip, ChipGroup, PrimaryButton, SecondaryButton, Section, Stepper } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { COST_CODES, DIM_FT, SLAB_IN, TAKEOFF_KINDS, WASTE_PCT, costCodeName } from '@/lib/catalog';
import { createId } from '@/lib/id';
import { defaultCostCode, defaultVendor, takeoffResult } from '@/lib/takeoff';
import { usdExact } from '@/lib/money';
import type { TakeoffKind } from '@/lib/types';

export default function TakeoffScreen() {
  const router = useRouter();
  const { jobsite, saveTakeoff, saveEstimateLine, savePurchaseOrder } = useFieldOps();
  const [kind, setKind] = useState<TakeoffKind>('concrete');
  const [lengthFt, setLengthFt] = useState(40);
  const [widthFt, setWidthFt] = useState(20);
  const [thickIn, setThickIn] = useState(6);
  const [heightFt, setHeightFt] = useState(8);
  const [ocIn, setOcIn] = useState(16);
  const [plates, setPlates] = useState(3);
  const [wastePct, setWastePct] = useState(10);
  const costCode = defaultCostCode(kind);
  const rate = COST_CODES.find((item) => item.code === costCode)?.unitCost ?? 1;
  const result = useMemo(
    () => takeoffResult(kind, { lengthFt, widthFt, thickIn, heightFt, ocIn, plates, wastePct }),
    [kind, lengthFt, widthFt, thickIn, heightFt, ocIn, plates, wastePct],
  );
  const total = result.qty * rate;

  async function persistTakeoff() {
    if (!jobsite) return null;
    const takeoff = {
      id: createId(),
      jobsiteId: jobsite.id,
      kind,
      qty: result.qty,
      unit: result.unit,
      wastePct,
      notes: `${lengthFt} ft × ${widthFt} ft`,
      createdAt: Date.now(),
    };
    await saveTakeoff(takeoff);
    return takeoff;
  }

  return (
    <Screen>
      <Text style={type.title}>Takeoff</Text>
      <ChipGroup>
        {TAKEOFF_KINDS.map((item) => (
          <Chip key={item.id} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
        ))}
      </ChipGroup>

      <Section title="Length">
        <ChipGroup>
          {DIM_FT.map((value) => (
            <Chip key={`l${value}`} label={`${value} ft`} selected={lengthFt === value} onPress={() => setLengthFt(value)} />
          ))}
        </ChipGroup>
        <Stepper value={lengthFt} onChange={setLengthFt} suffix="ft" min={1} max={400} />
      </Section>

      {kind !== 'framing' ? (
        <Section title="Width">
          <ChipGroup>
            {DIM_FT.map((value) => (
              <Chip key={`w${value}`} label={`${value} ft`} selected={widthFt === value} onPress={() => setWidthFt(value)} />
            ))}
          </ChipGroup>
          <Stepper value={widthFt} onChange={setWidthFt} suffix="ft" min={1} max={400} />
        </Section>
      ) : null}

      {kind === 'concrete' || kind === 'aggregate' ? (
        <Section title="Thickness">
          <ChipGroup>
            {SLAB_IN.map((value) => (
              <Chip key={`t${value}`} label={`${value}"`} selected={thickIn === value} onPress={() => setThickIn(value)} />
            ))}
          </ChipGroup>
        </Section>
      ) : null}

      {kind === 'framing' ? (
        <>
          <Section title="Wall height">
            <ChipGroup>
              {[8, 9, 10, 12].map((value) => (
                <Chip key={`h${value}`} label={`${value} ft`} selected={heightFt === value} onPress={() => setHeightFt(value)} />
              ))}
            </ChipGroup>
          </Section>
          <Section title="Stud spacing">
            <ChipGroup>
              {[16, 24].map((value) => (
                <Chip key={`oc${value}`} label={`${value}" oc`} selected={ocIn === value} onPress={() => setOcIn(value)} />
              ))}
            </ChipGroup>
          </Section>
          <Section title="Plates">
            <ChipGroup>
              {[2, 3].map((value) => (
                <Chip key={`p${value}`} label={`${value} plates`} selected={plates === value} onPress={() => setPlates(value)} />
              ))}
            </ChipGroup>
          </Section>
        </>
      ) : null}

      {kind === 'concrete' || kind === 'aggregate' || kind === 'drywall' ? (
        <Section title="Waste">
          <ChipGroup>
            {WASTE_PCT.map((value) => (
              <Chip key={`ws${value}`} label={`${value}%`} selected={wastePct === value} onPress={() => setWastePct(value)} />
            ))}
          </ChipGroup>
        </Section>
      ) : null}

      <View style={styles.result}>
        <Text style={type.label}>QUANTITY</Text>
        <Text style={styles.qty}>
          {result.qty} {result.unit}
        </Text>
        <Text style={type.meta}>
          {costCodeName(costCode)} @ {usdExact(rate)} = {usdExact(total)}
        </Text>
      </View>

      <PrimaryButton
        label="Add to estimate"
        onPress={async () => {
          if (!jobsite) return;
          const takeoff = await persistTakeoff();
          await saveEstimateLine({
            id: createId(),
            jobsiteId: jobsite.id,
            costCode,
            description: `${TAKEOFF_KINDS.find((item) => item.id === kind)?.label} takeoff`,
            qty: result.qty,
            unit: result.unit,
            unitCost: rate,
            source: 'takeoff',
            takeoffId: takeoff?.id ?? null,
            changeOrderId: null,
          });
          Alert.alert('On the estimate', `${result.qty} ${result.unit} tagged to ${costCode}.`);
          router.back();
        }}
      />
      <SecondaryButton
        label={`Create PO · ${defaultVendor(kind)}`}
        onPress={async () => {
          if (!jobsite) return;
          await persistTakeoff();
          await savePurchaseOrder({
            id: createId(),
            jobsiteId: jobsite.id,
            vendor: defaultVendor(kind),
            costCode,
            description: `${result.qty} ${result.unit}`,
            qty: result.qty,
            unit: result.unit,
            unitCost: rate,
            status: 'issued',
            createdAt: Date.now(),
          });
          Alert.alert('PO issued', `${defaultVendor(kind)} · ${usdExact(total)}. Syncs when you have signal.`);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  result: { gap: 4 },
  qty: { fontSize: 34, fontWeight: '900', color: colors.ink },
});
