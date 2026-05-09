import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/lib/constants';
import { WeeklyTrendPoint } from '@/lib/types';

interface Props { weeks: WeeklyTrendPoint[] }

const BAR_MAX_HEIGHT = 100;

export function WeeklyTrend({ weeks }: Props) {
  if (!weeks.length) return null;

  const maxTotal = Math.max(...weeks.map(w => w.total), 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {weeks.map(w => {
          const h = Math.max((w.total / maxTotal) * BAR_MAX_HEIGHT, 4);
          return (
            <View key={w.week} style={styles.barCol}>
              <Text style={styles.barAmount}>${Math.round(w.total)}</Text>
              <View style={[styles.bar, { height: h }]} />
              <Text style={styles.barLabel}>{w.week}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: BAR_MAX_HEIGHT + 52 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barAmount: { fontSize: 9, color: Colors.textSecondary, marginBottom: 3 },
  bar: { width: '100%', backgroundColor: Colors.greenLight, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 1.5, borderBottomWidth: 0, borderColor: Colors.green },
  barLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 5, textAlign: 'center' },
});
