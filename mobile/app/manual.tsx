import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { classifyItem, confirmReceipt } from '@/lib/api';
import { Colors, FOOD_GROUP_EMOJI, FOOD_GROUP_LABEL } from '@/lib/constants';
import { ReceiptItem } from '@/lib/types';

interface ManualItem extends ReceiptItem {
  key: string;
}

export default function ManualScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('');
  const [storeName, setStoreName] = useState('');

  const [classifying, setClassifying] = useState(false);
  const [classify, setClassify] = useState<{ food_group: string; nutrient_tags: string[] } | null>(null);

  const [items, setItems] = useState<ManualItem[]>([]);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onNameChange = (text: string) => {
    setName(text);
    setClassify(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setClassifying(true);
      try {
        const result = await classifyItem(text.trim());
        setClassify(result);
      } catch {
        // silent — user can still add manually
      } finally {
        setClassifying(false);
      }
    }, 600);
  };

  const addItem = () => {
    if (!name.trim() || !classify) return;
    const item: ManualItem = {
      key: `${Date.now()}-${Math.random()}`,
      name: name.trim(),
      price: parseFloat(price) || 0,
      quantity: parseFloat(qty) || 1,
      unit: unit.trim() || undefined,
      food_group: classify.food_group,
      nutrient_tags: classify.nutrient_tags,
      confidence: 'high',
    };
    setItems(prev => [...prev, item]);
    setName('');
    setPrice('');
    setQty('1');
    setUnit('');
    setClassify(null);
  };

  const removeItem = (key: string) => setItems(prev => prev.filter(i => i.key !== key));

  const saveAll = async () => {
    if (!items.length) return;
    setSaving(true);
    const total = items.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
    try {
      await confirmReceipt({
        store_name: storeName.trim() || 'Manual entry',
        purchased_at: new Date().toISOString().slice(0, 10),
        total_amount: parseFloat(total.toFixed(2)),
        items: items.map(({ key: _key, ...rest }) => rest),
      });
      Alert.alert('Saved!', 'Your items have been added to your nutrition log.', [
        { text: 'View dashboard', onPress: () => router.replace('/(tabs)/dashboard') },
        { text: 'Add more', onPress: () => setItems([]) },
      ]);
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canAdd = name.trim().length > 0 && classify !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Name input */}
        <View style={styles.card}>
          <Text style={styles.label}>Item name</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={onNameChange}
              placeholder="e.g. Almond milk, Salmon fillet…"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              autoCorrect={false}
            />
            {classifying && <ActivityIndicator size="small" color={Colors.green} style={{ marginLeft: 8 }} />}
          </View>

          {/* Classification badge */}
          {classify && (
            <View style={styles.classifyRow}>
              <View style={[styles.groupBadge, { backgroundColor: Colors.greenLight }]}>
                <Text style={[styles.groupBadgeText, { color: Colors.green }]}>
                  {FOOD_GROUP_EMOJI[classify.food_group]} {FOOD_GROUP_LABEL[classify.food_group] || classify.food_group}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tagsRow}>
                  {classify.nutrient_tags.slice(0, 4).map(t => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                  {classify.nutrient_tags.length > 4 && (
                    <Text style={styles.tagMore}>+{classify.nutrient_tags.length - 4}</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Price / qty / unit row */}
          <View style={styles.fieldsRow}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Price ($)</Text>
              <TextInput
                style={styles.fieldInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Qty</Text>
              <TextInput
                style={styles.fieldInput}
                value={qty}
                onChangeText={setQty}
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <TextInput
                style={styles.fieldInput}
                value={unit}
                onChangeText={setUnit}
                placeholder="kg/pcs"
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.addBtn, !canAdd && styles.addBtnDisabled, pressed && styles.addBtnPressed]}
            onPress={addItem}
            disabled={!canAdd}
          >
            <Text style={[styles.addBtnText, !canAdd && styles.addBtnTextDisabled]}>+ Add to list</Text>
          </Pressable>
        </View>

        {/* Running list */}
        {items.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items to save</Text>
              <Text style={styles.sectionCount}>{items.length}</Text>
            </View>

            <View style={styles.card}>
              {items.map((item, i) => (
                <View key={item.key} style={[styles.itemRow, i < items.length - 1 && styles.itemRowBorder]}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {FOOD_GROUP_EMOJI[item.food_group]} {FOOD_GROUP_LABEL[item.food_group] || item.food_group}
                      {item.unit ? ` · ${item.quantity}${item.unit}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>{item.price ? `$${item.price.toFixed(2)}` : '—'}</Text>
                  <Pressable onPress={() => removeItem(item.key)} hitSlop={8}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Store name input */}
            <View style={styles.card}>
              <Text style={styles.label}>Store / occasion <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={styles.input}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Farmers market, Home garden…"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={saveAll}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save all items</Text>
              }
            </Pressable>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },

  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  optional: { fontWeight: '400', color: Colors.textMuted },

  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.text,
    backgroundColor: Colors.bg,
  },

  classifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  groupBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  groupBadgeText: { fontSize: 13, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { backgroundColor: Colors.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 11, color: Colors.green, fontWeight: '500' },
  tagMore: { fontSize: 11, color: Colors.textSecondary, alignSelf: 'center' },

  fieldsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  fieldWrap: { flex: 1 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4, fontWeight: '500' },
  fieldInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: Colors.text,
    backgroundColor: Colors.bg,
  },

  addBtn: {
    marginTop: 14, backgroundColor: Colors.green, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnPressed: { opacity: 0.8 },
  addBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  addBtnTextDisabled: { color: Colors.textMuted },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sectionCount: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.text },
  removeBtn: { fontSize: 16, color: Colors.red, paddingHorizontal: 4 },

  saveBtn: {
    backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 8,
  },
  saveBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
