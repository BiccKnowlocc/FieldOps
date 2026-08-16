import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FieldOpsProvider, useFieldOps } from '@/context/FieldOpsProvider';
import { TenantProvider, useBrand } from '@/context/TenantContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  return (
    <TenantProvider>
      <AuthProvider>
        <FieldOpsProvider>
          <RootNavigator />
        </FieldOpsProvider>
      </AuthProvider>
    </TenantProvider>
  );
}

function RootNavigator() {
  const { ready, session } = useAuth();
  const { ready: dataReady } = useFieldOps();
  const { colors } = useBrand();
  const booting = !ready || Boolean(session && !dataReady);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.paper },
          headerRight: () => <MenuButton />,
        }}>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="log/new" options={{ title: 'Daily log' }} />
          <Stack.Screen name="log/[id]" options={{ title: 'Daily log' }} />
          <Stack.Screen name="punch/new" options={{ title: 'Punch item' }} />
          <Stack.Screen name="punch/[id]" options={{ title: 'Punch item' }} />
          <Stack.Screen name="photo/[id]" options={{ title: 'Photo markup' }} />
          <Stack.Screen name="asset/[id]" options={{ title: 'Equipment' }} />
          <Stack.Screen name="inspect/[id]" options={{ title: 'Pre-trip' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan unit' }} />
          <Stack.Screen name="takeoff" options={{ title: 'Takeoff' }} />
          <Stack.Screen name="change-order/new" options={{ title: 'Change order' }} />
          <Stack.Screen name="change-order/[id]" options={{ title: 'Change order' }} />
          <Stack.Screen name="receipt/new" options={{ title: 'Receipt' }} />
          <Stack.Screen name="shift/new" options={{ title: 'Assign shift' }} />
          <Stack.Screen name="work-order/new" options={{ title: 'Work order' }} />
          <Stack.Screen name="work-order/[id]" options={{ title: 'Work order' }} />
          <Stack.Screen name="talk/new" options={{ title: 'Toolbox talk' }} />
          <Stack.Screen name="talk/[id]" options={{ title: 'Toolbox talk' }} />
          <Stack.Screen name="incident/new" options={{ title: 'Safety report' }} />
          <Stack.Screen name="incident/[id]" options={{ title: 'Safety report' }} />
          <Stack.Screen name="drawing/[id]" options={{ title: 'Drawing' }} />
          <Stack.Screen name="intel/voice" options={{ title: 'Voice log' }} />
          <Stack.Screen name="intel/diff" options={{ title: 'Revision diff' }} />
          <Stack.Screen name="intel/telematics" options={{ title: 'Telematics' }} />
          <Stack.Screen name="intel/ocr" options={{ title: 'Ticket OCR' }} />
          <Stack.Screen name="intel/bim" options={{ title: 'BIM viewer' }} />
          <Stack.Screen name="intel/vision" options={{ title: 'CV inspect' }} />
          <Stack.Screen name="intel/weather" options={{ title: 'Weather / CPM' }} />
          <Stack.Screen name="intel/drone" options={{ title: 'Drone volumes' }} />
          <Stack.Screen name="intel/gate" options={{ title: 'BLE / NFC gate' }} />
          <Stack.Screen name="intel/billing" options={{ title: 'Progress billing' }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      {booting ? (
        <View style={[StyleSheet.absoluteFill, styles.boot, { backgroundColor: colors.navy }]}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  boot: { alignItems: 'center', justifyContent: 'center', zIndex: 100 },
});
