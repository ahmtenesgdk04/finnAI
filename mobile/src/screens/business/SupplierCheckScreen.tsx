import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { businessAPI } from '../../services/api';

type Level = 'green' | 'yellow' | 'red';
type LayerStatus = 'ok' | 'warning' | 'danger';

interface Layer {
  name: string;
  result: string;
  status: LayerStatus;
}

interface SupplierResult {
  score: number;
  level: Level;
  summary: string;
  layers: Layer[];
  recommendation: string;
}

const levelConfig = {
  green: { color: colors.secondary, bg: colors.successLight, label: 'Güvenli', icon: 'shield-checkmark' as const },
  yellow: { color: colors.warning, bg: colors.warningLight, label: 'Dikkatli Ol', icon: 'shield-half' as const },
  red: { color: colors.danger, bg: colors.errorLight, label: 'Riskli', icon: 'shield' as const },
};

const statusIcon = (s: LayerStatus) => {
  if (s === 'ok') return { name: 'checkmark-circle' as const, color: colors.secondary };
  if (s === 'warning') return { name: 'alert-circle' as const, color: colors.warning };
  return { name: 'close-circle' as const, color: colors.danger };
};

export default function SupplierCheckScreen({ navigation }: { navigation: any }) {
  const [supplierName, setSupplierName] = useState('');
  const [productType, setProductType] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [result, setResult] = useState<SupplierResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!supplierName.trim()) return Alert.alert('Hata', 'Tedarikçi adı girin.');
    setLoading(true);
    try {
      const parsed = parseFloat(estimatedAmount.replace(',', '.'));
      const { data } = await businessAPI.analyzeSupplier({
        supplierName: supplierName.trim(),
        productType: productType.trim() || undefined,
        estimatedAmount: parsed > 0 ? parsed : undefined,
      });
      setResult(data);
    } catch {
      Alert.alert('Hata', 'Analiz yapılırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? levelConfig[result.level] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>GüvenliAlış</Text>
            <Text style={styles.subtitle}>5 katmanlı tedarikçi risk analizi</Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.secondary} />
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Tedarikçi / Satıcı Adı *</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Güneş Tekstil San. Tic."
            value={supplierName}
            onChangeText={setSupplierName}
          />

          <Text style={styles.inputLabel}>Alınacak Ürün / Hizmet</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Pamuklu kumaş, lojistik hizmet"
            value={productType}
            onChangeText={setProductType}
          />

          <Text style={styles.inputLabel}>Tahmini Tutar (TL)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0,00"
            value={estimatedAmount}
            onChangeText={setEstimatedAmount}
          />

          <TouchableOpacity
            style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
            onPress={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            )}
            <Text style={styles.analyzeBtnText}>
              {loading ? 'Analiz ediliyor...' : 'Tedarikçi Analiz Et'}
            </Text>
          </TouchableOpacity>
        </View>

        {!result && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>Tedarikçini analiz et</Text>
            <Text style={styles.emptySub}>
              Piyasa itibarı, fiyat analizi, ödeme riski, yasal uyumluluk ve alternatifleri yapay zeka ile değerlendir.
            </Text>
          </View>
        )}

        {result && cfg && (
          <>
            {/* Skor Kartı */}
            <View style={[styles.scoreCard, { backgroundColor: cfg.bg }]}>
              <View style={[styles.scoreCircle, { borderColor: cfg.color }]}>
                <Text style={[styles.scoreNumber, { color: cfg.color }]}>{result.score}</Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </View>
              <View style={styles.scoreInfo}>
                <View style={styles.levelRow}>
                  <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                  <Text style={[styles.levelLabel, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={styles.scoreSummary}>{result.summary}</Text>
              </View>
            </View>

            {/* 5 Katman */}
            <Text style={styles.sectionTitle}>Analiz Katmanları</Text>
            {result.layers.map((layer, i) => {
              const icon = statusIcon(layer.status);
              return (
                <View key={i} style={styles.layerCard}>
                  <Ionicons name={icon.name} size={22} color={icon.color} />
                  <View style={styles.layerInfo}>
                    <Text style={styles.layerName}>{layer.name}</Text>
                    <Text style={styles.layerResult}>{layer.result}</Text>
                  </View>
                </View>
              );
            })}

            {/* Öneri */}
            {result.recommendation && (
              <View style={[styles.recommendationCard, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.recommendationTitle, { color: cfg.color }]}>AI Tavsiyesi</Text>
                <Text style={styles.recommendationText}>{result.recommendation}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4 },
  title: { ...theme.typography.h2, color: colors.text.primary },
  subtitle: { ...theme.typography.caption, color: colors.text.secondary, marginTop: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  formCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text.primary,
    backgroundColor: colors.background,
  },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.secondary, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg, marginTop: 4, ...theme.shadow.elevated,
  },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { ...theme.typography.h3, color: colors.text.secondary },
  emptySub: { fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  scoreCard: {
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
  },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  scoreNumber: { fontSize: 24, fontWeight: '800' },
  scoreLabel: { fontSize: 11, color: colors.text.muted },
  scoreInfo: { flex: 1, gap: 6 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelLabel: { fontSize: 15, fontWeight: '700' },
  scoreSummary: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },

  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },

  layerCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, ...theme.shadow.card,
  },
  layerInfo: { flex: 1, gap: 3 },
  layerName: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  layerResult: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },

  recommendationCard: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: 6 },
  recommendationTitle: { fontSize: 13, fontWeight: '700' },
  recommendationText: { fontSize: 14, color: colors.text.primary, lineHeight: 21 },
});
