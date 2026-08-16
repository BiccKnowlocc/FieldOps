import { Tabs } from 'expo-router';

import { MenuButton } from '@/components/MenuButton';
import { useBrand } from '@/context/TenantContext';

export default function TabLayout() {
  const { colors, logoText } = useBrand();

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '800' },
        headerRight: () => <MenuButton />,
        headerTitle: logoText,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="logs" options={{ title: 'Daily logs' }} />
      <Tabs.Screen name="punch" options={{ title: 'Punch list' }} />
      <Tabs.Screen name="capture" options={{ title: 'Photos' }} />
      <Tabs.Screen name="more" options={{ title: 'Jobsite & sync' }} />
      <Tabs.Screen name="equipment" options={{ title: 'Equipment', href: null }} />
      <Tabs.Screen name="costing" options={{ title: 'Estimating', href: null }} />
      <Tabs.Screen name="labor" options={{ title: 'Labor', href: null }} />
      <Tabs.Screen name="safety" options={{ title: 'Safety', href: null }} />
    </Tabs>
  );
}
