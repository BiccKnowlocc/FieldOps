import { Alert, StyleSheet, Text, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { Card, PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { createId } from '@/lib/id';
import { applyCanFrame, DEMO_CAN, utilization } from '@/lib/telematics';
import { serviceSummary } from '@/lib/equipment';

export default function TelematicsScreen() {
  return (
    <Gate feature="telematics">
      <TelematicsBody />
    </Gate>
  );
}

function TelematicsBody() {
  const { assets, saveAsset, saveMeterEntry, saveServiceLog, operatorName, jobsite } = useFieldOps();

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Pull J1939 / OBD-II now"
          onPress={async () => {
            let dtcs = 0;
            for (const frame of DEMO_CAN) {
              const asset = assets.find((item) => item.id === frame.assetId);
              if (!asset || !jobsite) continue;
              const next = applyCanFrame(asset, frame);
              await saveAsset(next);
              await saveMeterEntry({
                id: createId(),
                assetId: asset.id,
                jobsiteId: jobsite.id,
                hourMeter: next.hourMeter,
                idleAdded: frame.idleAdded,
                fuelAdded: frame.fuelAdded,
                createdAt: Date.now(),
                createdBy: operatorName,
              });
              if (frame.dtc) dtcs += 1;
            }
            Alert.alert('CAN harvested', `${DEMO_CAN.length} units · ${dtcs} DTCs. Oil/hyd intervals follow the hour meter, not the calendar.`);
          }}
        />
      }>
      <Text style={type.title}>Telematics</Text>
      <Text style={type.meta}>Geotab / Samsara / CAT / Deere webhook slot. Demo frames write true hours, idle, fuel, and DTCs into the fleet.</Text>
      {DEMO_CAN.map((frame) => {
        const asset = assets.find((item) => item.id === frame.assetId);
        if (!asset) return null;
        const util = utilization(asset.hourMeter, asset.idleHours);
        return (
          <Card key={frame.assetId} style={{ gap: 6 }}>
            <Text style={styles.title}>{asset.name}</Text>
            <Text style={type.meta}>
              +{frame.hoursAdded} hr · idle +{frame.idleAdded} · fuel +{frame.fuelAdded} L · {util}% utilized
            </Text>
            <Text style={type.meta}>{serviceSummary(asset)}</Text>
            {frame.dtc ? (
              <Text style={frame.dtc.severity === 'stop' ? styles.stop : styles.warn}>
                {frame.dtc.code} · {frame.dtc.description}
              </Text>
            ) : (
              <Text style={styles.ok}>No active DTC</Text>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  ok: { color: colors.green, fontWeight: '800' },
  warn: { color: colors.gold, fontWeight: '800' },
  stop: { color: colors.red, fontWeight: '800' },
});
