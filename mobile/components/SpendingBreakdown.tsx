import { StyleSheet, Text, View } from 'react-native';
import { Colors, FOOD_GROUP_COLOR, FOOD_GROUP_EMOJI, FOOD_GROUP_LABEL } from '@/lib/constants';
import { SpendingGroup } from '@/lib/types';

interface Props { groups: SpendingGroup[] }

export function SpendingBreakdown({ groups }: Props) {
  const food = groups.filter(g => g.food_group !== 'non_food');

  return (
    <View>
      {/* Stacked proportion bar */}
      <View style={styles.stackBar}>
        {food.map(g => (
          <View
            key={g.food_group}
            style={[styles.stackSegment, {
              flex: g.percentage,
              backgroundColor: FOOD_GROUP_COLOR[g.food_group] || Colors.textMuted,
            }]}
          />
        ))}
      </View>

      {/* Itemised rows */}
      <View style={styles.rows}>
        {groups.map((g, i) => (
          <View key={g.food_group} style={[styles.row, i < groups.length - 1 && styles.rowBorder]}>
            <View style={[styles.dot, { backgroundColor: FOOD_GROUP_COLOR[g.food_group] || Colors.textMuted }]} />
            <Text style={styles.label}>
              {FOOD_GROUP_EMOJI[g.food_group]} {FOOD_GROUP_LABEL[g.food_group] || g.food_group}
            </Text>
            <View style={styles.barWrap}>
              <View style={[styles.bar, {
                width: `${g.percentage}%`,
                backgroundColor: FOOD_GROUP_COLOR[g.food_group] || Colors.textMuted,
              }]} />
            </View>
            <Text style={styles.pct}>{g.percentage}%</Text>
            <Text style={styles.amount}>${g.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackBar: {
    flexDirection: 'row', height: 10, borderRadius: 5,
    overflow: 'hidden', marginBottom: 20,
  },
  stackSegment: { height: '100%' },
  rows: {},
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  label: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  barWrap: { width: 60, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 3 },
  pct: { width: 36, fontSize: 12, color: Colors.textSecondary, textAlign: 'right' },
  amount: { width: 56, fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
});
