import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ChipGroup, PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, tap, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';

export default function ScanScreen() {
  const router = useRouter();
  const { assets, findAssetByCode } = useFieldOps();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  function openCode(raw: string) {
    const asset = findAssetByCode(raw);
    if (!asset) {
      setError(`No unit matches ${raw.trim() || 'that code'}.`);
      return;
    }
    setError('');
    router.replace(`/asset/${asset.id}` as never);
  }

  const showCamera = Platform.OS !== 'web' && permission?.granted && scanning;

  return (
    <Screen>
      <Text style={type.title}>Scan unit</Text>
      <Text style={type.body}>Point at a QR / barcode, or tap a code. Same flow for tools, trucks, and iron.</Text>

      {Platform.OS !== 'web' ? (
        showCamera ? (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'code93'] }}
              onBarcodeScanned={({ data }) => {
                setScanning(false);
                openCode(data);
              }}
            />
          </View>
        ) : (
          <SecondaryButton
            label={permission?.granted ? 'Open scanner' : 'Allow camera to scan'}
            onPress={async () => {
              if (!permission?.granted) await requestPermission();
              setScanning(true);
            }}
          />
        )
      ) : null}

      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="FO-EX12 or EX-12"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
        style={styles.input}
      />
      <PrimaryButton label="Open unit" onPress={() => openCode(code)} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={type.label}>ON THIS JOB</Text>
      <ChipGroup>
        {assets.map((asset) => (
          <Chip key={asset.id} label={asset.qrCode} onPress={() => openCode(asset.qrCode)} />
        ))}
      </ChipGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    height: 240,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  camera: { flex: 1 },
  input: {
    minHeight: tap.min,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    backgroundColor: colors.white,
  },
  error: { color: colors.red, fontWeight: '700' },
});
