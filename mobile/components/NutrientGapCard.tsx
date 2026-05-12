import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/lib/constants';
import { NutrientGap } from '@/lib/types';

interface Props { gap: NutrientGap }

export function NutrientGapCard({ gap }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{gap.label}</Text>
        <Text style={styles.lastSeen}>
          {gap.last_seen_days_ago != null
            ? `Last seen ${gap.last_seen_days_ago}d ago`
            : 'Not seen recently'}
        </Text>
      </View>

      <View style={styles.bodyParts}>
        {gap.body_parts.map(p => (
          <View key={p} style={styles.tag}>
            <Text style={styles.tagText}>{p}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.benefits}>{gap.health_benefits}</Text>
      <Text style={styles.sources}>Try: {gap.food_sources}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 4, borderLeftColor: Colors.red,
    padding: 14, marginBottom: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 15, fontWeight: '700', color: Colors.text },
  lastSeen: { fontSize: 12, color: Colors.textSecondary },
  bodyParts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: Colors.redLight, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.red },
  benefits: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 6 },
  sources: { fontSize: 13, fontWeight: '600', color: Colors.green },
});
