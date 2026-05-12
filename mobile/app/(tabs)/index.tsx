import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchReceipts, uploadReceipt } from '@/lib/api';
import { Colors } from '@/lib/constants';
import { store } from '@/lib/store';
import { Receipt } from '@/lib/types';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Reading your receipt…');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReceipts = useCallback(async () => {
    try {
      const data = await fetchReceipts();
      setReceipts(data.slice(0, 5));
    } catch {
      // silently fail — empty state handles it
    }
  }, []);

  useEffect(() => { loadReceipts(); }, [loadReceipts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  };

  const pickAndUpload = async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera access needed', 'Please allow camera access in your settings to scan receipts.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo library access needed', 'Please allow photo access in your settings.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
      });
    }

    if (result.canceled || !result.assets[0]) return;

    const image = result.assets[0];
    setLoadingText('Reading your receipt…');
    setLoading(true);

    try {
      const parsed = await uploadReceipt(
        image.uri,
        image.mimeType || 'image/jpeg',
      );
      store.setPendingReceipt(parsed);
      setLoading(false);
      router.push('/review');
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        'Couldn\'t read receipt',
        err.message || 'Try a photo with better lighting and less blur.',
        [{ text: 'OK' }],
      );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Loading modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.green} />
            <Text style={styles.loadingText}>{loadingText}</Text>
            <Text style={styles.loadingHint}>Claude is reading your receipt…</Text>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>What did you{'\n'}buy this week?</Text>
          <Text style={styles.heroSubtitle}>Upload a grocery receipt and we'll track your nutrition automatically.</Text>
        </View>

        {/* Upload zone */}
        <Pressable style={({ pressed }) => [styles.uploadZone, pressed && styles.uploadZonePressed]} onPress={() => pickAndUpload('gallery')}>
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadTitle}>Tap to upload a receipt</Text>
          <Text style={styles.uploadHint}>Or use the buttons below</Text>
        </Pressable>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <Pressable style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]} onPress={() => pickAndUpload('camera')}>
            <Text style={styles.btnSecondaryText}>📷  Take photo</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]} onPress={() => pickAndUpload('gallery')}>
            <Text style={styles.btnSecondaryText}>🖼️  Browse gallery</Text>
          </Pressable>
        </View>

        {/* Manual entry */}
        <Pressable style={({ pressed }) => [styles.manualBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/manual')}>
          <Text style={styles.manualBtnText}>✍️  No receipt? Add items manually</Text>
        </Pressable>

        {/* Recent receipts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent receipts</Text>
          {receipts.length === 0 ? (
            <View style={[styles.card, styles.emptyState]}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>No receipts yet</Text>
              <Text style={styles.emptyText}>Upload your first receipt to get started.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {receipts.map((r, i) => (
                <View key={r.id} style={[styles.receiptRow, i < receipts.length - 1 && styles.receiptRowBorder]}>
                  <View style={styles.receiptThumb}><Text style={{ fontSize: 20 }}>🧾</Text></View>
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptStore}>{r.store_name || 'Grocery shop'}</Text>
                    <Text style={styles.receiptDate}>{formatDate(r.purchased_at)}</Text>
                  </View>
                  <Text style={styles.receiptAmount}>
                    {r.total_amount ? `$${parseFloat(String(r.total_amount)).toFixed(2)}` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  scroll: { padding: 16, paddingBottom: 40 },

  loadingOverlay: {
    flex: 1, backgroundColor: 'rgba(250,250,248,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16,
    elevation: 8, width: 260,
  },
  loadingText: { fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  loadingHint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  hero: { marginBottom: 24, paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: Colors.text, lineHeight: 36 },
  heroSubtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8, lineHeight: 22 },

  uploadZone: {
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed', borderRadius: 20, padding: 40,
    alignItems: 'center', marginBottom: 12,
  },
  uploadZonePressed: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  uploadIcon: { fontSize: 44, marginBottom: 12 },
  uploadTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  uploadHint: { fontSize: 14, color: Colors.textSecondary },

  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  btn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', minHeight: 48,
  },
  btnSecondary: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  btnPressed: { opacity: 0.7 },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: Colors.text },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  receiptRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  receiptRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  receiptThumb: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  receiptInfo: { flex: 1 },
  receiptStore: { fontSize: 15, fontWeight: '600', color: Colors.text },
  receiptDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  receiptAmount: { fontSize: 15, fontWeight: '700', color: Colors.text },

  manualBtn: {
    alignItems: 'center', paddingVertical: 12, marginBottom: 24,
  },
  manualBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
});
