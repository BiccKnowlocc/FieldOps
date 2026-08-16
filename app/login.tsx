import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/kit';
import { useAuth } from '@/context/AuthContext';
import { useBrand, useTenant } from '@/context/TenantContext';
import { DEMO_USERS, listTenants } from '@/lib/api';
import { radius, tap } from '@/constants/theme';
import type { UserRole } from '@/lib/tenant';

const ROLES: { id: UserRole; label: string; hint: string }[] = [
  { id: 'foreman', label: 'Foreman', hint: 'Full jobsite, cost, dispatch, and approvals' },
  { id: 'employee', label: 'Employee', hint: 'Logs, clock, equipment, safety' },
  { id: 'vendor', label: 'Contractor / vendor', hint: 'Work orders, tickets, progress billing' },
];

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { setTenantCode } = useTenant();
  const { colors, companyName, logoText } = useBrand();
  const router = useRouter();
  const [code, setCode] = useState(listTenants()[0].code);
  const [role, setRole] = useState<UserRole>('foreman');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const roleMeta = ROLES.find((item) => item.id === role)!;
  const demo = DEMO_USERS.find((item) => item.role === role);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.navy }]}>
      <Text style={[styles.logo, { color: colors.orange }]}>{logoText}</Text>
      <Text style={styles.company}>{companyName}</Text>
      <Text style={styles.lead}>Sign in to open the job. Access follows your role and this company’s modules.</Text>

      <Text style={styles.label}>COMPANY</Text>
      <View style={styles.row}>
        {listTenants().map((tenant) => (
          <Pressable
            key={tenant.code}
            onPress={() => {
              setCode(tenant.code);
              setTenantCode(tenant.code);
            }}
            style={[styles.choice, code === tenant.code && { backgroundColor: colors.orange, borderColor: colors.orange }]}>
            <Text style={[styles.choiceLabel, code === tenant.code && styles.choiceOn]}>{tenant.code}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>I AM</Text>
      <View style={styles.row}>
        {ROLES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setRole(item.id)}
            style={[styles.choice, role === item.id && { backgroundColor: colors.orange, borderColor: colors.orange }]}>
            <Text style={[styles.choiceLabel, role === item.id && styles.choiceOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>{roleMeta.hint}</Text>

      <Text style={styles.label}>PIN</Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        placeholder={demo ? `Demo ${demo.pin}` : 'PIN'}
        placeholderTextColor="#9AA8B5"
        style={[styles.input, { borderColor: colors.orange }]}
      />

      <PrimaryButton
        label={busy ? 'Signing in…' : 'Sign in'}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          const error = await signIn({ companyCode: code, role, pin: pin || demo?.pin || '' });
          setBusy(false);
          if (error) {
            Alert.alert('Sign in failed', error);
            return;
          }
          router.replace('/');
        }}
      />
      <Pressable
        onPress={() => {
          if (demo) setPin(demo.pin);
        }}>
        <Text style={styles.demo}>
          Demo · Foreman Nick 4412 · Employee Ana 2200 · Vendor Volt 3300
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  logo: { fontSize: 36, fontWeight: '900' },
  company: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  lead: { color: '#C9D3DC', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  label: { color: '#9AA8B5', fontWeight: '800', letterSpacing: 0.4, marginTop: 8 },
  hint: { color: '#C9D3DC', fontWeight: '600' },
  input: {
    minHeight: tap.min,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  demo: { color: '#9AA8B5', textAlign: 'center', marginTop: 8, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C9D3DC',
    justifyContent: 'center',
  },
  choiceLabel: { color: '#FFFFFF', fontWeight: '700' },
  choiceOn: { color: '#FFFFFF' },
});
