import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { personalAPI } from '../../services/api';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

interface AnalysisResult {
  score: number;
  level: 'green' | 'yellow' | 'red';
  summary: string;
  layers: { name: string; result: string; status: 'ok' | 'warning' | 'danger' }[];
}

export default function ShopCheckScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      Alert.alert('Uyarı', 'Lütfen URL girin');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await personalAPI.analyzeShop(url.trim());
      setResult(data as AnalysisResult);
    } catch {
      Alert.alert('Hata', 'Analiz yapılamadı. Backend bağlantısını kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_ICON = {
    ok: { name: 'checkmark-circle' as const, color: colors.secondary },
    warning: { name: 'warning' as const, color: colors.warning },
    danger: { name: 'close-circle' as const, color: colors.danger },
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* URL Girişi */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Site URL'si</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="https://ornek.com"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Button
          title="Analiz Et"
          onPress={handleAnalyze}
          loading={loading}
          style={styles.analyzeBtn}
        />
      </View>

      {loading && (
        <View style={styles.loadingCard}>
          <LoadingSpinner text="5 katmanlı analiz çalışıyor..." />
          {['Alan adı kontrolü', 'SSL sertifikası', 'İtibar analizi', 'İçerik taraması', 'AI değerlendirmesi'].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Ionicons name="hourglass-outline" size={16} color={colors.text.muted} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {result && !loading && (
        <View style={styles.resultContainer}>
          {/* Skor */}
          <RiskBadge level={result.level} score={result.score} />

          {/* CTA */}
          <View style={[
            styles.ctaBanner,
            {
              backgroundColor: result.level === 'green'
                ? '#D1FAE5' : result.level === 'yellow' ? '#FEF3C7' : '#FEE2E2',
            },
          ]}>
            <Text style={[
              styles.ctaText,
              { color: result.level === 'green' ? '#065F46' : result.level === 'yellow' ? '#92400E' : '#991B1B' },
            ]}>
              {result.level === 'green' ? '✅ Güvenle Alışveriş Yapabilirsin'
                : result.level === 'yellow' ? '⚠️ Dikkatli Ol'
                  : '🚫 Bu Siteden Alışveriş Önerilmez'}
            </Text>
          </View>

          {/* Özet */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Analiz Özeti</Text>
            <Text style={styles.summaryText}>{result.summary}</Text>
          </View>

          {/* Katmanlar */}
          <Text style={styles.layersTitle}>Detaylı Analiz</Text>
          {result.layers?.map((layer, idx) => {
            const ic = STATUS_ICON[layer.status];
            return (
              <TouchableOpacity
                key={idx}
                style={styles.layerCard}
                onPress={() => setExpandedLayer(expandedLayer === idx ? null : idx)}
              >
                <View style={styles.layerHeader}>
                  <Ionicons name={ic.name} size={20} color={ic.color} />
                  <Text style={styles.layerName}>{layer.name}</Text>
                  <Ionicons
                    name={expandedLayer === idx ? 'chevron-up' : 'chevron-down'}
                    size={16} color={colors.text.secondary}
                    style={styles.layerChevron}
                  />
                </View>
                {expandedLayer === idx && (
                  <Text style={styles.layerResult}>{layer.result}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },
  inputCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  inputLabel: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  inputRow: { flexDirection: 'row', gap: theme.spacing.sm },
  input: {
    flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    fontSize: 14, color: colors.text.primary,
  },
  analyzeBtn: { marginTop: theme.spacing.xs },
  loadingCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, gap: theme.spacing.sm, alignItems: 'center', ...theme.shadow.card,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  stepText: { ...theme.typography.caption, color: colors.text.secondary },
  resultContainer: { gap: theme.spacing.md },
  ctaBanner: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  summaryCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  summaryTitle: { ...theme.typography.body, fontWeight: '700', color: colors.text.primary },
  summaryText: { ...theme.typography.body, color: colors.text.secondary, lineHeight: 22 },
  layersTitle: { ...theme.typography.h3, color: colors.text.primary },
  layerCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  layerHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  layerName: { flex: 1, ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  layerChevron: { marginLeft: 'auto' },
  layerResult: { ...theme.typography.body, color: colors.text.secondary, lineHeight: 20 },
});
