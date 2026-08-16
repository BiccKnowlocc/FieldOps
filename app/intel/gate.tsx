import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Gate } from '@/components/Gate';
import { Card, Chip, ChipGroup, PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, type } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { certKindLabel } from '@/lib/catalog';
import { blockingCerts } from '@/lib/gatekeep';
import { certStatus, certSummary } from '@/lib/safety';
import { formatM } from '@/lib/units';

export default function GateScreen() {
  return (
    <Gate feature="ble_gate">
      <GateBody />
    </Gate>
  );
}

function GateBody() {
  const router = useRouter();
  const { session } = useAuth();
  const { assets, certifications, allCrew, timeEntries, jobsite } = useFieldOps();
  const [beacon, setBeacon] = useState<string | null>(null);
  const onClock = timeEntries.filter((entry) => entry.clockOut == null);
  const heavy = assets.find((asset) => asset.kind === 'heavy' && asset.status !== 'down') ?? assets[0];
  const blocked = heavy
    ? blockingCerts({
        asset: heavy,
        certs: certifications,
        operatorName: session?.name ?? '',
        crew: allCrew,
      })
    : [];

  return (
    <Screen>
      <Text style={type.title}>BLE / NFC gate</Text>
      <Text style={type.meta}>
        Beacons on iron, digital ID on the phone. Certs must be live before check-out. Fence {formatM(jobsite?.geofenceRadiusM ?? 0)}.
      </Text>
      <ChipGroup>
        {assets.slice(0, 6).map((asset) => (
          <Chip key={asset.id} label={asset.qrCode} selected={beacon === asset.qrCode} onPress={() => setBeacon(asset.qrCode)} />
        ))}
      </ChipGroup>
      <PrimaryButton
        label={beacon ? `NFC tap ${beacon}` : 'Tap a unit beacon'}
        onPress={() => {
          if (!beacon) return;
          const asset = assets.find((item) => item.qrCode === beacon);
          if (!asset) return;
          const miss = blockingCerts({
            asset,
            certs: certifications,
            operatorName: session?.name ?? '',
            crew: allCrew,
          });
          if (miss.length && session?.role === 'employee') {
            Alert.alert('Interlock', `Missing live tickets: ${miss.map(certKindLabel).join(', ')}. Cannot start the walk-around.`);
            return;
          }
          if (miss.length) {
            Alert.alert('Override', `Foreman override. Missing ${miss.map(certKindLabel).join(', ')}.`);
          }
          router.push(`/inspect/${asset.id}` as never);
        }}
      />
      {blocked.length > 0 ? (
        <Text style={styles.hot}>
          {heavy?.unitNumber} wants {blocked.map(certKindLabel).join(', ')} before a non-foreman starts it.
        </Text>
      ) : null}
      <Card style={{ gap: 8 }}>
        <Text style={type.label}>MUSTER</Text>
        <Text style={styles.stat}>{onClock.length} verified inside the fence</Text>
        {onClock.map((entry) => (
          <Text key={entry.id} style={type.body}>
            {entry.crewName}
            {entry.insideGeofence ? '' : ' · GPS outside (still clocked)'}
          </Text>
        ))}
        <SecondaryButton label="Emergency roster snapshot" onPress={() => Alert.alert('Muster', `${onClock.length} on the clock. Evacuate list is this roster.`)} />
      </Card>
      <Text style={type.label}>TICKETS</Text>
      {certifications.map((cert) => (
        <Text key={cert.id} style={certStatus(cert.expiresOn) === 'ok' ? type.meta : styles.hot}>
          {cert.crewName} · {certKindLabel(cert.kind)} · {certSummary(cert)}
        </Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hot: { color: colors.red, fontWeight: '800' },
  stat: { fontSize: 22, fontWeight: '800', color: colors.ink },
});
