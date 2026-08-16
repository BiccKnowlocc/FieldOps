import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, tap, type } from '@/constants/theme';
import { useBrand } from '@/context/TenantContext';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useBrandSafe();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: colors.orange },
        pressed && { backgroundColor: colors.orangePress },
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress?: PressableProps['onPress'];
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}>
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone = 'default',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'danger' | 'warn';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        selected && tone === 'danger' && { backgroundColor: colors.red, borderColor: colors.red },
        selected && tone === 'warn' && { backgroundColor: colors.gold, borderColor: colors.gold },
      ]}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <View style={styles.chipGroup}>{children}</View>;
}

export function Stepper({
  value,
  onChange,
  suffix,
  min = 0,
  max = 200,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, roundStep(value - step, step)))}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>
        {value}
        {suffix ? ` ${suffix}` : ''}
      </Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, roundStep(value + step, step)))}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

function roundStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

function useBrandSafe() {
  try {
    return useBrand();
  } catch {
    return { colors };
  }
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={type.label}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: tap.min,
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryPressed: { backgroundColor: colors.orangePress },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800' },
  secondary: {
    minHeight: tap.min,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  secondaryPressed: { backgroundColor: colors.paper },
  secondaryLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipLabel: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  chipLabelSelected: { color: colors.white },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: colors.white, fontSize: 28, fontWeight: '700', marginTop: -2 },
  stepValue: { minWidth: 72, textAlign: 'center', fontSize: 22, fontWeight: '800', color: colors.ink },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  section: { gap: 10 },
});
