import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { useAuth } from '@/context/AuthContext';
import { inspectTemplate } from '@/lib/equipment';
import { blockingCerts } from '@/lib/gatekeep';
import { certKindLabel } from '@/lib/catalog';
import { createId } from '@/lib/id';
import type { InspectionItem } from '@/lib/types';

export default function InspectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getAsset, saveAsset, saveInspection, operatorName, jobsite, certifications, allCrew } = useFieldOps();
  const { session } = useAuth();
  const asset = getAsset(id);
  const [items, setItems] = useState<InspectionItem[]>(asset ? inspectTemplate(asset.kind) : []);

  if (!asset) {
    return (
      <Screen>
        <Text style={type.body}>That unit is not on this device.</Text>
      </Screen>
    );
  }

  const current = asset;

  function setOk(itemId: string, ok: boolean) {
    setItems((currentItems) => currentItems.map((item) => (item.id === itemId ? { ...item, ok } : item)));
  }

  async function save(tagOut: boolean) {
    const blocked = blockingCerts({
      asset: current,
      certs: certifications,
      operatorName: session?.name ?? operatorName,
      crew: allCrew,
    });
    if (blocked.length > 0 && session?.role === 'employee') {
      Alert.alert('Certification interlock', `Need live ${blocked.map(certKindLabel).join(', ')} before this unit.`);
      return;
    }
    if (items.some((item) => item.ok == null)) {
      Alert.alert('Finish the walk-around', 'Pass or fail every item.');
      return;
    }
    const failed = items.some((item) => item.ok === false);
    await saveInspection({
      id: createId(),
      assetId: current.id,
      jobsiteId: jobsite?.id ?? current.jobsiteId,
      createdAt: Date.now(),
      operator: operatorName,
      result: failed ? 'fail' : 'pass',
      items,
    });
    if (tagOut && failed) {
      await saveAsset({ ...current, status: 'down' });
    }
    Alert.alert(failed ? 'Inspection failed' : 'Good to run', failed ? 'Do not operate until it is cleared.' : 'Circle check saved on device.');
    router.back();
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Save inspection" onPress={() => save(false)} />
          <SecondaryButton label="Fail and tag out" onPress={() => save(true)} />
        </View>
      }>
      <Text style={type.title}>{asset.name}</Text>
      <Text style={type.meta}>Pre-trip · {asset.unitNumber}</Text>
      <PrimaryButton label="Mark all pass" onPress={() => setItems((current) => current.map((item) => ({ ...item, ok: true })))} />
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.toggles}>
            <Pressable onPress={() => setOk(item.id, true)} style={[styles.toggle, item.ok === true && styles.pass]}>
              <Text style={[styles.toggleText, item.ok === true && styles.toggleOn]}>Pass</Text>
            </Pressable>
            <Pressable onPress={() => setOk(item.id, false)} style={[styles.toggle, item.ok === false && styles.fail]}>
              <Text style={[styles.toggleText, item.ok === false && styles.toggleOn]}>Fail</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  label: { fontWeight: '700', color: colors.ink, fontSize: 16 },
  toggles: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  pass: { backgroundColor: colors.green, borderColor: colors.green },
  fail: { backgroundColor: colors.red, borderColor: colors.red },
  toggleText: { fontWeight: '800', color: colors.ink },
  toggleOn: { color: colors.white },
});
