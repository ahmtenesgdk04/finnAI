import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, Image, ActionSheetIOS, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';

const PHOTO_KEY = 'business_profile_photo_uri';

type NavRow = {
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  screen: string;
};

const TOOL_SECTIONS: { title: string; items: NavRow[] }[] = [
  {
    title: 'İşletme Araçları',
    items: [
      { label: 'Rehber', desc: 'Müşteri ve tedarikçi kişileri', icon: 'people-outline', iconBg: '#EFF6FF', iconColor: colors.business, screen: 'Rehber' },
      { label: 'Belgelerim', desc: 'Fatura ve evrak kasası', icon: 'folder-outline', iconBg: '#FEF3C7', iconColor: '#D97706', screen: 'Belgelerim' },
      { label: 'Ajanda', desc: 'Görevler ve hatırlatıcılar', icon: 'calendar-outline', iconBg: '#F0FDF4', iconColor: '#16A34A', screen: 'Takvim' },
      { label: 'Gelir / Gider', desc: 'Detaylı gelir-gider kaydı', icon: 'stats-chart-outline', iconBg: '#EDE9FE', iconColor: '#7C3AED', screen: 'GelirGider' },
      { label: 'Hesap Makinesi', desc: 'Finansal hesaplama araçları', icon: 'calculator-outline', iconBg: '#FFF7ED', iconColor: '#EA580C', screen: 'HesapMakinesi' },
    ],
  },
  {
    title: 'Analiz & Güvenlik',
    items: [
      { label: 'Finansal Sağlık', desc: 'İşletme finansal sağlık skoru', icon: 'heart-outline', iconBg: '#FEE2E2', iconColor: colors.danger, screen: 'FinansalSaglik' },
      { label: 'Döviz Kurları', desc: 'Güncel kur ve pariteler', icon: 'cash-outline', iconBg: '#ECFDF5', iconColor: colors.secondary, screen: 'DovizKurlari' },
    ],
  },
];

export default function AyarlarScreen({ navigation }: { navigation: any }) {
  const { user, logout, updateUser } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PHOTO_KEY).then(uri => { if (uri) setPhotoUri(uri); });
  }, []);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeriye erişim izni verilmedi'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await AsyncStorage.setItem(PHOTO_KEY, uri);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Kamera izni verilmedi'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await AsyncStorage.setItem(PHOTO_KEY, uri);
    }
  };

  const handlePhotoPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['İptal', 'Galeriden Seç', 'Fotoğraf Çek'], cancelButtonIndex: 0 },
        (index) => { if (index === 1) pickFromGallery(); if (index === 2) pickFromCamera(); }
      );
    } else {
      Alert.alert('Fotoğraf Ekle', 'Kaynak seç', [
        { text: 'Galeriden Seç', onPress: pickFromGallery },
        { text: 'Fotoğraf Çek', onPress: pickFromCamera },
        { text: 'İptal', style: 'cancel' },
      ]);
    }
  };

  const handleChangeName = async () => {
    if (!newName.trim()) { Alert.alert('Hata', 'İsim boş olamaz'); return; }
    setSavingName(true);
    try {
      const { data } = await authAPI.updateProfile(newName.trim());
      updateUser({ name: data.user.name });
      Alert.alert('Başarılı', 'Firma adı güncellendi');
      setShowNameModal(false);
      setNewName('');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message || 'İsim değiştirilemedi');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Hata', 'Tüm alanları doldur'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Hata', 'Yeni şifreler eşleşmiyor'); return; }
    if (newPassword.length < 6) { Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır'); return; }
    setSavingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Başarılı', 'Şifren güncellendi');
      setShowPasswordModal(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message || 'Şifre değiştirilemedi');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Oturumu Kapat', 'Çıkış yapmak istediğinden emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await authAPI.deleteAccount();
              await AsyncStorage.removeItem(PHOTO_KEY);
              logout();
            } catch (err: any) {
              Alert.alert('Hata', err?.response?.data?.message || 'Hesap silinemedi');
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profil Kartı */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handlePhotoPress} style={styles.avatarWrap} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>

          <View style={styles.modeBadge}>
            <Text style={styles.modeText}>İşletme Modu</Text>
          </View>
        </View>

        {/* Hesap Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Ayarları</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => { setNewName(user?.name || ''); setShowNameModal(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="pencil-outline" size={20} color={colors.business} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Firma Adı Değiştir</Text>
              <Text style={styles.rowDesc}>Görünen firma adını güncelle</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => setShowPasswordModal(true)} activeOpacity={0.7}>
            <View style={[styles.iconWrap, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#7C3AED" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Şifre Değiştir</Text>
              <Text style={styles.rowDesc}>Hesap şifreni güncelle</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Araçlar & Analiz Bölümleri */}
        {TOOL_SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map(item => (
              <TouchableOpacity
                key={item.screen}
                style={styles.row}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Uygulama */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama</Text>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#16A34A" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Versiyon</Text>
              <Text style={styles.rowDesc}>FinnAI v1.0.0 — İşletme Modu</Text>
            </View>
          </View>
        </View>

        {/* Çıkış & Sil */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#B45309" />
          <Text style={styles.logoutText}>Oturumu Kapat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          activeOpacity={0.7}
        >
          {deletingAccount ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>Hesabı Sil</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Firma Adı Modal */}
      <Modal visible={showNameModal} transparent animationType="slide" onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Firma Adı Değiştir</Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Yeni firma adı"
              placeholderTextColor={colors.text.muted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, savingName && styles.modalBtnDisabled]}
              onPress={handleChangeName}
              disabled={savingName}
            >
              {savingName ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Kaydet</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowNameModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Şifre Değiştir Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Mevcut Şifre" placeholderTextColor={colors.text.muted} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
            <TextInput style={styles.input} placeholder="Yeni Şifre" placeholderTextColor={colors.text.muted} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TextInput style={styles.input} placeholder="Yeni Şifre (Tekrar)" placeholderTextColor={colors.text.muted} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity
              style={[styles.modalBtn, savingPassword && styles.modalBtnDisabled]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Kaydet</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topHeaderTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary },

  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 20 },

  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: { position: 'relative' },
  avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.business },
  avatarFallback: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.business,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.business,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.card,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  profileEmail: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  modeBadge: {
    backgroundColor: colors.businessLight,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  modeText: { fontSize: 11, fontWeight: '600', color: colors.business },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  rowDesc: { fontSize: 12, color: colors.text.muted, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF9C3', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#FDE047',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#B45309' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  deleteText: { fontSize: 13, fontWeight: '600', color: colors.danger },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 12,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, fontSize: 15, color: colors.text.primary,
  },
  modalBtn: {
    backgroundColor: colors.business, borderRadius: 12,
    padding: 15, alignItems: 'center', justifyContent: 'center',
  },
  modalBtnDisabled: { opacity: 0.6 },
  modalBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalCancelBtn: { alignItems: 'center', padding: 10 },
  modalCancelText: { fontSize: 15, color: colors.text.secondary, fontWeight: '500' },
});
