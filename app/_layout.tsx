import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FieldOpsProvider, useFieldOps } from '@/context/FieldOpsProvider';
import { colors } from '@/constants/theme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <FieldOpsProvider>
      <RootNav />
    </FieldOpsProvider>
  );
}

function RootNav() {
  const { ready } = useFieldOps();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.paper },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="log/new" options={{ title: 'Daily log' }} />
        <Stack.Screen name="log/[id]" options={{ title: 'Daily log' }} />
        <Stack.Screen name="punch/new" options={{ title: 'Punch item' }} />
        <Stack.Screen name="punch/[id]" options={{ title: 'Punch item' }} />
        <Stack.Screen name="photo/[id]" options={{ title: 'Photo markup' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
});
