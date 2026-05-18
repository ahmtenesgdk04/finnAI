import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, FlatList, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { marketplaceAPI } from '../../services/api';

const CATEGORIES = [
  'Tekstil', 'Gıda & İçecek', 'İnşaat Malzemesi', 'Elektronik',
  'Hammadde', 'Lojistik & Taşımacılık', 'Kimya & Plastik',
  'Ambalaj', 'Makine & Ekipman', 'Tarım & Hayvancılık', 'Diğer',
];

const UNITS = ['Adet', 'Kg', 'Ton', 'Metre', 'Koli', 'Palet', 'Litre', 'Kutu', 'Rulo'];

const CURRENCIES = ['TL', 'USD', 'EUR'];

const DELIVERY_METHODS = ['Alıcı teslim alır', 'Kargoya verilir', 'Nakliye dahil'];

const PAYMENT_TERMS = ['Peşin', '30 gün vadeli', '60 gün vadeli', 'Anlaşmaya göre'];

const CONTACT_OPTIONS = ['Uygulama içi mesaj', 'Telefon', 'E-posta'];

// ---- Dropdown Modal ----
function DropdownModal({
  visible, title, options, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={styles.modalOptionText}>{item}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

// ---- Chip Group (tek seçim) ----
function ChipGroup({
  options, selected, onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, selected === opt && styles.chipActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ---- Chip Group (çoklu seçim) ----
function MultiChipGroup({
  options, selected, onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(opt)}
          >
            {active && <Ionicons name="checkmark" size={13} color="#fff" />}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---- Ana Ekran ----
export default function IlanVerScreen({ navigation }: { navigation: any }) {
  // Temel
  const [baslik, setBaslik] = useState('');
  const [kategori, setKategori] = useState('');
  const [aciklama, setAciklama] = useState('');

  // Fiyat & Miktar
  const [birimFiyat, setBirimFiyat] = useState('');
  const [paraBirimi, setParaBirimi] = useState('TL');
  const [minSiparis, setMinSiparis] = useState('');
  const [birim, setBirim] = useState('');
  const [stokMiktari, setStokMiktari] = useState('');

  // Koşullar
  const [teslimatSuresi, setTeslimatSuresi] = useState('');
  const [teslimatSekli, setTeslimatSekli] = useState('');
  const [odemeKosulu, setOdemeKosulu] = useState('');

  // İletişim
  const [iletisimTercih, setIletisimTercih] = useState<string[]>([]);
  const [sehir, setSehir] = useState('');

  // Görsel
  const [fotograf, setFotograf] = useState<string | null>(null);

  // Dropdown modals
  const [kategoriModal, setKategoriModal] = useState(false);
  const [birimModal, setBirimModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const toggleIletisim = (val: string) => {
    setIletisimTercih((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setFotograf(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) return Alert.alert('Hata', 'İlan başlığı zorunludur.');
    if (!kategori) return Alert.alert('Hata', 'Kategori seçiniz.');
    if (!birimFiyat || parseFloat(birimFiyat) <= 0) return Alert.alert('Hata', 'Geçerli bir birim fiyat girin.');
    if (!minSiparis || parseInt(minSiparis) <= 0) return Alert.alert('Hata', 'Minimum sipariş miktarı girin.');
    if (!birim) return Alert.alert('Hata', 'Birim seçiniz.');
    if (!sehir.trim()) return Alert.alert('Hata', 'Konum/şehir zorunludur.');
    if (iletisimTercih.length === 0) return Alert.alert('Hata', 'En az bir iletişim tercihi seçin.');

    setLoading(true);
    try {
      await marketplaceAPI.create({
        title: baslik.trim(),
        category: kategori,
        description: aciklama.trim() || undefined,
        unitPrice: parseFloat(birimFiyat.replace(',', '.')),
        currency: paraBirimi,
        minOrderQty: parseInt(minSiparis),
        unit: birim,
        totalStock: stokMiktari ? parseInt(stokMiktari) : undefined,
        deliveryTime: teslimatSuresi.trim() || undefined,
        deliveryMethod: teslimatSekli || undefined,
        paymentTerms: odemeKosulu || undefined,
        contactPreference: iletisimTercih,
        city: sehir.trim(),
      });
      Alert.alert('Başarılı', 'İlanınız yayına alındı!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Hata', 'İlan yayınlanırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DropdownModal
        visible={kategoriModal}
        title="Kategori Seç"
        options={CATEGORIES}
        onSelect={setKategori}
        onClose={() => setKategoriModal(false)}
      />
      <DropdownModal
        visible={birimModal}
        title="Birim Seç"
        options={UNITS}
        onSelect={setBirim}
        onClose={() => setBirimModal(false)}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>İlan Ver</Text>
            <Text style={styles.subtitle}>Ürün veya hizmetini toplu sat</Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="add-circle-outline" size={28} color={colors.business} />
          </View>
        </View>

        {/* ---- Temel Bilgiler ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

          <Text style={styles.label}>İlan Başlığı *</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Toptan Pamuklu Kumaş — 5. Nesil"
            value={baslik}
            onChangeText={setBaslik}
            maxLength={80}
          />

          <Text style={styles.label}>Kategori *</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setKategoriModal(true)}>
            <Text style={[styles.selectBtnText, !kategori && styles.placeholder]}>
              {kategori || 'Kategori seçin...'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Ürünün özellikleri, kalite standardı, kullanım alanları..."
            value={aciklama}
            onChangeText={setAciklama}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ---- Fiyat & Miktar ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiyat & Miktar</Text>

          <Text style={styles.label}>Para Birimi</Text>
          <ChipGroup options={CURRENCIES} selected={paraBirimi} onSelect={setParaBirimi} />

          <Text style={[styles.label, { marginTop: 12 }]}>Birim Fiyat *</Text>
          <TextInput
            style={styles.input}
            placeholder={`0,00 ${paraBirimi}`}
            value={birimFiyat}
            onChangeText={setBirimFiyat}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Min. Sipariş Miktarı *</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                value={minSiparis}
                onChangeText={setMinSiparis}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Birim *</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setBirimModal(true)}>
                <Text style={[styles.selectBtnText, !birim && styles.placeholder]}>
                  {birim || 'Seç...'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Toplam Stok Miktarı</Text>
          <TextInput
            style={styles.input}
            placeholder={`Mevcut stok (${birim || 'birim'})`}
            value={stokMiktari}
            onChangeText={setStokMiktari}
            keyboardType="numeric"
          />
        </View>

        {/* ---- Koşullar ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Koşullar</Text>

          <Text style={styles.label}>Teslimat Süresi</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 3-5 iş günü"
            value={teslimatSuresi}
            onChangeText={setTeslimatSuresi}
          />

          <Text style={styles.label}>Teslimat Şekli</Text>
          <ChipGroup options={DELIVERY_METHODS} selected={teslimatSekli} onSelect={setTeslimatSekli} />

          <Text style={[styles.label, { marginTop: 12 }]}>Ödeme Koşulları</Text>
          <ChipGroup options={PAYMENT_TERMS} selected={odemeKosulu} onSelect={setOdemeKosulu} />
        </View>

        {/* ---- İletişim ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim</Text>

          <Text style={styles.label}>İletişim Tercihi * (birden fazla seçilebilir)</Text>
          <MultiChipGroup options={CONTACT_OPTIONS} selected={iletisimTercih} onToggle={toggleIletisim} />

          <Text style={[styles.label, { marginTop: 12 }]}>Konum / Şehir *</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: İstanbul, Bursa, İzmir"
            value={sehir}
            onChangeText={setSehir}
          />
        </View>

        {/* ---- Görsel ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotoğraf</Text>
          <Text style={styles.labelSub}>Ürünün görseli ilanınızı öne çıkarır</Text>

          {fotograf ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: fotograf }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.imageRemove} onPress={() => setFotograf(null)}>
                <Ionicons name="close-circle" size={26} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color={colors.text.muted} />
              <Text style={styles.imagePickerText}>Fotoğraf Seç</Text>
              <Text style={styles.imagePickerSub}>Galeriden seç veya çek</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ---- Gönder ---- */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          )}
          <Text style={styles.submitBtnText}>
            {loading ? 'İlan Yayınlanıyor...' : 'İlanı Yayınla'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 48 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  section: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },

  label: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  labelSub: { fontSize: 12, color: colors.text.muted, marginTop: -4 },

  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  textarea: { height: 100, paddingTop: 12 },

  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  selectBtnText: { fontSize: 15, color: colors.text.primary },
  placeholder: { color: colors.text.muted },

  row: { flexDirection: 'row', gap: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.business, borderColor: colors.business },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.text.secondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  imagePicker: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
  },
  imagePickerText: { fontSize: 15, fontWeight: '600', color: colors.text.secondary },
  imagePickerSub: { fontSize: 12, color: colors.text.muted },

  imagePreviewWrap: { position: 'relative' },
  imagePreview: { width: '100%', height: 180, borderRadius: theme.borderRadius.md },
  imageRemove: { position: 'absolute', top: 8, right: 8 },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.business,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    shadowColor: colors.business,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: { fontSize: 15, color: colors.text.primary },
});
