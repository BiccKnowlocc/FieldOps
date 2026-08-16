import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

export function SheetPlan({ sheetNumber }: { sheetNumber: string }) {
  const lighting = sheetNumber.startsWith('E');
  const dock = sheetNumber.startsWith('S');

  return (
    <View style={styles.plan} pointerEvents="none">
      <View style={styles.dockRow}>
        {['Dock 1', 'Dock 2', 'Dock 3'].map((label) => (
          <View key={label} style={[styles.dock, dock && styles.hot]}>
            <Text style={styles.tiny}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.floor}>
        <Text style={styles.floorLabel}>{lighting ? 'Lighting layout · L2' : 'Warehouse floor'}</Text>
      </View>
      <View style={styles.corridor}>
        <Text style={styles.tiny}>L2 corridor · grid D</Text>
      </View>
      <View style={styles.rooms}>
        {['204', '205', '206', '207', '208'].map((room) => (
          <View key={room} style={[styles.room, lighting && styles.hot]}>
            <Text style={styles.tiny}>{room}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plan: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 8,
    backgroundColor: '#16324D',
  },
  dockRow: { flexDirection: 'row', gap: 8, height: 44 },
  dock: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#C9D3DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floor: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#C9D3DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorLabel: { color: '#C9D3DC', fontWeight: '800' },
  corridor: {
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rooms: { flexDirection: 'row', gap: 6, height: 52 },
  room: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E85D04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hot: { backgroundColor: 'rgba(232, 93, 4, 0.28)' },
  tiny: { color: colors.white, fontWeight: '700', fontSize: 11 },
});
