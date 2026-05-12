import { StyleSheet, Text, View } from 'react-native';
import { Colors, STATUS_BG, STATUS_BORDER, STATUS_COLOR } from '@/lib/constants';
import { BodySystem } from '@/lib/types';

interface Props { systems: BodySystem[] }

export function BodyGrid({ systems }: Props) {
  return (
    <View style={styles.grid}>
      {systems.map(s => (
        <View key={s.name} style={[styles.cell, { backgroundColor: STATUS_BG[s.status], borderColor: STATUS_BORDER[s.status] }]}>
          <Text style={styles.emoji}>{s.emoji}</Text>
          <Text style={styles.name}>{s.name}</Text>
          <View style={[styles.dot, { backgroundColor: STATUS_COLOR[s.status] }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '30%', flexGrow: 1,
    borderWidth: 1.5, borderRadius: 12, padding: 10,
    alignItems: 'center',
  },
  emoji: { fontSize: 24 },
  name: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
});
