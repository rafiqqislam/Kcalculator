import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmReceipt } from '@/lib/api';
import {
  Colors,
  FOOD_GROUP_BG,
  FOOD_GROUP_COLOR,
  FOOD_GROUP_EMOJI,
  FOOD_GROUP_LABEL,
  FOOD_GROUPS,
} from '@/lib/constants';
import { store } from '@/lib/store';
import { ParsedReceipt, ReceiptItem } from '@/lib/types';

export default function ReviewScreen() {
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState('produce');

  useEffect(() => {
    const pending = store.getPendingReceipt();
    if (!pending) { router.replace('/'); return; }
    setReceipt(pending);
    setItems([...pending.items]);
  }, []);

  const foodCount = items.filter(i => i.food_group !== 'non_food').length;
  const nonFoodCount = items.length - foodCount;

  const openPicker = (index: number) => {
    setEditingIndex(index);
    setPickerValue(items[index].food_group);
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    if (editingIndex !== null) {
      setItems(prev => prev.map((item, i) =>
        i === editingIndex ? { ...item, food_group: pickerValue } : item,
      ));
    }
    setPickerVisible(false);
    setEditingIndex(null);
  };

  const removeItem = (index: number) => {
    Alert.alert('Remove item', `Remove "${items[index].name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () =>
        setItems(prev => prev.filter((_, i) => i !== index))
      },
    ]);
  };

  const save = async () => {
    if (!receipt) return;
    setSaving(true);
    try {
      await confirmReceipt({
        store_name: receipt.store_name,
        purchased_at: receipt.purchased_at,
        total_amount: receipt.total_amount,
        image_url: receipt.image_url,
        items,
      });
      store.clearPendingReceipt();
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setSaving(false);
      Alert.alert('Couldn\'t save', err.message || 'Please check your connection and try again.');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  if (!receipt) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* Food group picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Change category</Text>
              <Pressable onPress={confirmPicker} style={styles.pickerDone}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            </View>
            <Picker
              selectedValue={pickerValue}
              onValueChange={v => setPickerValue(v)}
            >
              {FOOD_GROUPS.map(g => (
                <Picker.Item
                  key={g}
                  label={`${FOOD_GROUP_EMOJI[g]}  ${FOOD_GROUP_LABEL[g]}`}
                  value={g}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Meta bar */}
      <View style={styles.metaBar}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>STORE</Text>
          <Text style={styles.metaValue}>{receipt.store_name || 'Grocery shop'}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>DATE</Text>
          <Text style={styles.metaValue}>{formatDate(receipt.purchased_at)}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>TOTAL</Text>
          <Text style={styles.metaValue}>
            {receipt.total_amount ? `$${receipt.total_amount.toFixed(2)}` : '—'}
          </Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          Found <Text style={styles.summaryBold}>{items.length} items</Text>
          {' · '}{foodCount} food · {nonFoodCount} non-food
        </Text>
        <Text style={styles.summaryHint}>Fix anything that looks off, then save.</Text>
      </View>

      {/* Items list */}
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={[styles.itemCard, item.confidence === 'low' && styles.itemCardLow]}>
            <View style={styles.itemTop}>
              <View style={[styles.badge, { backgroundColor: FOOD_GROUP_BG[item.food_group] }]}>
                <Text style={[styles.badgeText, { color: FOOD_GROUP_COLOR[item.food_group] }]}>
                  {FOOD_GROUP_EMOJI[item.food_group]} {FOOD_GROUP_LABEL[item.food_group]}
                </Text>
              </View>
              {item.confidence === 'low' && (
                <Text style={styles.lowConfidence}>⚠️ Low confidence</Text>
              )}
            </View>
            <View style={styles.itemBottom}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : ''}
                </Text>
              </View>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.itemActions}>
              <Pressable style={styles.changeBtn} onPress={() => openPicker(index)}>
                <Text style={styles.changeBtnText}>Change category</Text>
              </Pressable>
              <Pressable style={styles.removeBtn} onPress={() => removeItem(index)}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Sticky save button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>✅  Looks good — Save receipt</Text>
          }
        </Pressable>
        <Text style={styles.footerHint}>Non-food items are excluded from your nutrition report.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  pickerOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  pickerDone: { paddingVertical: 6, paddingHorizontal: 12 },
  pickerDoneText: { fontSize: 16, fontWeight: '600', color: Colors.green },

  metaBar: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  metaItem: { flex: 1 },
  metaDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 12 },
  metaLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.text },

  summaryBar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bg },
  summaryText: { fontSize: 14, color: Colors.text },
  summaryBold: { fontWeight: '700' },
  summaryHint: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  list: { paddingHorizontal: 16, paddingTop: 4 },

  itemCard: {
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  itemCardLow: { borderLeftWidth: 3, borderLeftColor: Colors.amber },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  lowConfidence: { fontSize: 11, color: Colors.amber, fontWeight: '500' },
  itemBottom: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '500', color: Colors.text, lineHeight: 20 },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: Colors.text },
  itemActions: { flexDirection: 'row', gap: 8 },
  changeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5,
    borderColor: Colors.border, alignItems: 'center',
  },
  changeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  removeBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
    backgroundColor: Colors.redLight, alignItems: 'center',
  },
  removeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.red },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 16, paddingBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  saveBtn: {
    backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', minHeight: 52,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  footerHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
