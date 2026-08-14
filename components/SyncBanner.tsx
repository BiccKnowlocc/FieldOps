import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { colors, radius } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';

export function SyncBanner() {
  const { online, pendingCount, conflicts, syncNow } = useFieldOps();
  const conflictCount = conflicts.length;

  if (online && pendingCount === 0 && conflictCount === 0) {
    return (
      <View style={[styles.banner, styles.ok]}>
        <AppIcon name="cloud" color={colors.green} size={18} />
        <Text style={[styles.text, { color: colors.green }]}>All records synced</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={() => syncNow()} style={[styles.banner, !online ? styles.off : conflictCount ? styles.warn : styles.pending]}>
      <AppIcon name={online ? 'cloud' : 'offline'} color={!online ? colors.red : colors.navy} size={18} />
      <Text style={styles.text}>
        {!online
          ? `Offline · ${pendingCount} waiting to sync`
          : conflictCount
            ? `${conflictCount} sync conflict${conflictCount === 1 ? '' : 's'} — tap to review`
            : `${pendingCount} change${pendingCount === 1 ? '' : 's'} syncing`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  ok: { backgroundColor: '#E5F2EA' },
  off: { backgroundColor: '#F8E2DF' },
  pending: { backgroundColor: '#F8EBC6' },
  warn: { backgroundColor: '#F8EBC6' },
  text: { fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1 },
});
