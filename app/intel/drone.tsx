import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { cellTone, demoGrid, volumeFromCells } from '@/lib/droneVolume';
import { createId } from '@/lib/id';
import { todayISO } from '@/lib/dates';

export default function DroneScreen() {
  return (
    <Gate feature="drone">
      <DroneBody />
    </Gate>
  );
}

function DroneBody() {
  const { jobsite, droneSurveys, saveRecord } = useFieldOps();
  const grid = demoGrid();
  const volume = volumeFromCells(grid);

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Save survey"
          onPress={async () => {
            if (!jobsite) return;
            const id = createId();
            await saveRecord(id, 'drone_surveys', {
              id,
              jobsiteId: jobsite.id,
              date: todayISO(),
              cutCy: Math.round(volume.cutCy),
              fillCy: Math.round(volume.fillCy),
              netCy: Math.round(volume.netCy),
              notes: 'Photogrammetry DEM vs grading plan (demo grid)',
              createdAt: Date.now(),
            });
            Alert.alert('Cut/fill', `${Math.round(volume.cutCy)} CY cut · ${Math.round(volume.fillCy)} CY fill`);
          }}
        />
      }>
      <Text style={type.title}>Drone volumes</Text>
      <Text style={type.meta}>DEM vs design in feet. Red = cut, green = fill. Cells are 20 ft × 20 ft until you wire DJI ingest.</Text>
      <View style={styles.heat}>
        {grid.map((cell) => {
          const tone = cellTone(cell);
          return (
            <Pressable
              key={`${cell.x}-${cell.y}`}
              style={[styles.cell, tone === 'cut' ? styles.cut : tone === 'fill' ? styles.fill : styles.ok]}
            />
          );
        })}
      </View>
      <Text style={styles.stat}>
        {Math.round(volume.cutCy)} CY cut · {Math.round(volume.fillCy)} CY fill
      </Text>
      <Text style={type.meta}>Last surveys: {droneSurveys.length || 'none yet'}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heat: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell: { width: '9%', aspectRatio: 1, borderRadius: 3 },
  cut: { backgroundColor: colors.red },
  fill: { backgroundColor: colors.green },
  ok: { backgroundColor: colors.gold },
  stat: { fontSize: 22, fontWeight: '800', color: colors.ink },
});
