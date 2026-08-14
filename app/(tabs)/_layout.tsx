import { Tabs, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type IconName } from '@/components/AppIcon';
import { colors } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { useOfficeLayout } from '@/hooks/useOfficeLayout';

const FIELD_TABS = ['index', 'logs', 'punch', 'capture', 'more'] as const;

const NAV: { name: string; label: string; icon: IconName; href: string }[] = [
  { name: 'index', label: 'Today', icon: 'home', href: '/' },
  { name: 'logs', label: 'Logs', icon: 'logs', href: '/logs' },
  { name: 'punch', label: 'Punch', icon: 'punch', href: '/punch' },
  { name: 'capture', label: 'Photos', icon: 'camera', href: '/capture' },
  { name: 'more', label: 'More', icon: 'more', href: '/more' },
  { name: 'equipment', label: 'Equipment', icon: 'equipment', href: '/equipment' },
  { name: 'costing', label: 'Costing', icon: 'costing', href: '/costing' },
  { name: 'labor', label: 'Labor', icon: 'labor', href: '/labor' },
  { name: 'safety', label: 'Safety', icon: 'safety', href: '/safety' },
];

export default function TabLayout() {
  const office = useOfficeLayout();

  return (
    <View style={[styles.shell, office && styles.shellOffice]}>
      {office ? <OfficeSidebar /> : null}
      <View style={styles.tabs}>
        <Tabs
          tabBar={(props) => (office ? <EmptyBar /> : <FieldTabBar {...props} />)}
          screenOptions={{
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: '800' },
            headerShown: true,
          }}>
          <Tabs.Screen name="index" options={{ title: 'Today' }} />
          <Tabs.Screen name="logs" options={{ title: 'Daily logs' }} />
          <Tabs.Screen name="punch" options={{ title: 'Punch list' }} />
          <Tabs.Screen name="capture" options={{ title: 'Photos' }} />
          <Tabs.Screen name="more" options={{ title: 'More', href: office ? null : '/more' }} />
          <Tabs.Screen name="equipment" options={{ title: 'Equipment', href: null }} />
          <Tabs.Screen name="costing" options={{ title: 'Estimating', href: null }} />
          <Tabs.Screen name="labor" options={{ title: 'Labor', href: null }} />
          <Tabs.Screen name="safety" options={{ title: 'Safety', href: null }} />
        </Tabs>
      </View>
    </View>
  );
}

function EmptyBar() {
  return null;
}

function FieldTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) => FIELD_TABS.includes(route.name as (typeof FIELD_TABS)[number]));

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {routes.map((route) => {
        const meta = NAV.find((item) => item.name === route.name);
        if (!meta) return null;
        const focused = state.routes[state.index]?.name === route.name;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}>
            <AppIcon name={meta.icon} color={focused ? colors.orange : '#9AA8B5'} size={26} />
            <Text style={[styles.tabLabel, focused && styles.tabLabelOn]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OfficeSidebar() {
  const { jobsite, pendingCount, online } = useFieldOps();
  const pathname = usePathname();
  const router = useRouter();
  const officeNav = NAV.filter((item) => item.name !== 'more');

  return (
    <View style={styles.sidebar}>
      <Text style={styles.brand}>FieldOps</Text>
      <Text style={styles.site} numberOfLines={2}>
        {jobsite?.name ?? 'No jobsite'}
      </Text>
      <Text style={styles.syncMeta}>
        {online ? 'Online' : 'Offline'} · {pendingCount} pending
      </Text>
      <View style={{ height: 18 }} />
      {officeNav.map((item) => {
        const focused = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Pressable key={item.name} onPress={() => router.push(item.href as never)} style={[styles.sideItem, focused && styles.sideItemOn]}>
            <AppIcon name={item.icon} color={focused ? colors.white : '#C9D3DC'} size={20} />
            <Text style={[styles.sideLabel, focused && styles.sideLabelOn]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  shellOffice: { flexDirection: 'row' },
  tabs: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.navy,
    paddingTop: 8,
    borderTopWidth: 0,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4, minHeight: 56, justifyContent: 'center' },
  tabLabel: { color: '#9AA8B5', fontSize: 11, fontWeight: '700' },
  tabLabelOn: { color: colors.white },
  sidebar: {
    width: 260,
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 24,
  },
  brand: { color: colors.orange, fontSize: 22, fontWeight: '900', letterSpacing: 0.3 },
  site: { color: colors.white, fontSize: 15, fontWeight: '700', marginTop: 10 },
  syncMeta: { color: '#9AA8B5', marginTop: 6, fontWeight: '600' },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  sideItemOn: { backgroundColor: colors.navyMid },
  sideLabel: { color: '#C9D3DC', fontWeight: '700', fontSize: 15 },
  sideLabelOn: { color: colors.white },
});
