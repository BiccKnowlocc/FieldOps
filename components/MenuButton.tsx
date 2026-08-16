import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/TenantContext';
import { MENU } from '@/lib/menu';

export function MenuButton() {
  const [open, setOpen] = useState(false);
  const { colors } = useBrand();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        onPress={() => setOpen(true)}
        style={styles.hit}>
        <View style={[styles.line, { backgroundColor: colors.white }]} />
        <View style={[styles.line, { backgroundColor: colors.white }]} />
        <View style={[styles.line, { backgroundColor: colors.white }]} />
      </Pressable>
      <AppMenu visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function AppMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, logoText, companyName } = useBrand();
  const { session, can, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openId, setOpenId] = useState<string | null>('field');
  const categories = MENU.map((category) => ({
    ...category,
    items: category.items.filter((item) => can(item.feature)),
  })).filter((category) => category.items.length > 0);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.panel, { backgroundColor: colors.navy, paddingTop: insets.top + 12 }]}>
          <Text style={[styles.brand, { color: colors.orange }]}>{logoText}</Text>
          <Text style={styles.meta}>
            {companyName}
            {session ? ` · ${session.name} · ${session.role}` : ''}
          </Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 28, gap: 4 }}>
            {categories.map((category) => {
              const expanded = openId === category.id;
              return (
                <View key={category.id}>
                  <Pressable
                    onPress={() => setOpenId(expanded ? null : category.id)}
                    style={styles.cat}>
                    <Text style={styles.catLabel}>{category.label}</Text>
                    <Text style={styles.chev}>{expanded ? '−' : '+'}</Text>
                  </Pressable>
                  {expanded
                    ? category.items.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            onClose();
                            router.push(item.href as never);
                          }}
                          style={styles.sub}>
                          <Text style={styles.subLabel}>{item.label}</Text>
                        </Pressable>
                      ))
                    : null}
                </View>
              );
            })}
            <Pressable
              onPress={async () => {
                onClose();
                await signOut();
                router.replace('/login');
              }}
              style={styles.cat}>
              <Text style={[styles.catLabel, { color: colors.orange }]}>Sign out</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hit: { width: 44, height: 44, justifyContent: 'center', gap: 5, paddingHorizontal: 10 },
  line: { height: 2, borderRadius: 2, width: '100%' },
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(11,31,51,0.45)' },
  dismiss: { flex: 1 },
  panel: { width: 320, maxWidth: '86%', paddingHorizontal: 16 },
  brand: { fontSize: 22, fontWeight: '900' },
  meta: { color: '#9AA8B5', fontWeight: '600', marginBottom: 16, marginTop: 4 },
  cat: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  chev: { color: '#C9D3DC', fontSize: 22, fontWeight: '700' },
  sub: { minHeight: 44, paddingLeft: 12, justifyContent: 'center' },
  subLabel: { color: '#C9D3DC', fontWeight: '700', fontSize: 15 },
});
