import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/kit';
import { colors, type } from '@/constants/theme';

export function ModuleScreen({
  title,
  summary,
  features,
}: {
  title: string;
  summary: string;
  features: string[];
}) {
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={type.title}>{title}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <Card>
        <Text style={type.label}>COMING IN THIS MODULE</Text>
        <View style={{ height: 10 }} />
        {features.map((feature) => (
          <View key={feature} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.feature}>{feature}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 40, backgroundColor: colors.paper, flexGrow: 1 },
  summary: { ...type.body, color: colors.muted },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 8, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange, marginTop: 7 },
  feature: { flex: 1, fontSize: 16, color: colors.ink, fontWeight: '600' },
});
