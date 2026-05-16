import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, Image, ActionSheetIOS, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';
import Button from '../../components/common/Button';

const PHOTO_KEY = 'profile_photo_uri';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PHOTO_KEY).then((uri) => {
      if (uri) setPhotoUri(uri);
    });
  }, []);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni verilmedi');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await AsyncStorage.setItem(PHOTO_KEY, uri);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera izni verilmedi');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await AsyncStorage.setItem(PHOTO_KEY, uri);
    }
  };

  const handlePhotoPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['İptal', 'Galeriden Seç', 'Fotoğraf Çek'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) pickFromGallery();
          if (index === 2) pickFromCamera();
        }
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
    if (!newName.trim()) {
      Alert.alert('Hata', 'İsim boş olamaz');
      return;
    }
    setSavingName(true);
    try {
      const { data } = await authAPI.updateProfile(newName.trim());
      updateUser({ name: data.user.name });
      Alert.alert('Başarılı', 'İsmin güncellendi');
      setShowNameModal(false);
      setNewName('');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message || 'İsim değiştirilemedi');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldur');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Başarılı', 'Şifren güncellendi');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar Kartı */}
      <View style={styles.avatarCard}>
        <TouchableOpacity onPress={handlePhotoPress} style={styles.avatarWrap} activeOpacity={0.8}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>
            {user?.mode === 'personal' ? 'Bireysel Mod' : 'İşletme Modu'}
          </Text>
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
          <View style={[styles.iconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="pencil-outline" size={20} color="#0284C7" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>İsim Değiştir</Text>
            <Text style={styles.rowDesc}>Görünen adını güncelle</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => setShowPasswordModal(true)} activeOpacity={0.7}>
          <View style={[styles.iconWrap, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.personal} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Şifre Değiştir</Text>
            <Text style={styles.rowDesc}>Hesap şifreni güncelle</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* Uygulama Bilgisi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uygulama</Text>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="information-circle-outline" size={20} color="#16A34A" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Versiyon</Text>
            <Text style={styles.rowDesc}>FinnAI v1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Çıkış */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Oturumu Kapat</Text>
      </TouchableOpacity>

      {/* İsim Değiştir Modal */}
      <Modal visible={showNameModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>İsim Değiştir</Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Yeni İsim"
              placeholderTextColor={colors.text.muted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Button title="Kaydet" onPress={handleChangeName} loading={savingName} />
            <Button title="İptal" onPress={() => setShowNameModal(false)} variant="outline" />
          </View>
        </View>
      </Modal>

      {/* Şifre Değiştir Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Mevcut Şifre"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Yeni Şifre"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Yeni Şifre (Tekrar)"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Button title="Kaydet" onPress={handleChangePassword} loading={savingPassword} />
            <Button title="İptal" onPress={() => setShowPasswordModal(false)} variant="outline" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40, gap: 20 },

  avatarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...theme.shadow.card,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.personal,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.personal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.personal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  userName: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
  userEmail: { fontSize: 14, color: colors.text.secondary },
  modeBadge: {
    backgroundColor: '#EDE9FE',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  modeText: { fontSize: 12, fontWeight: '600', color: colors.personal },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  rowDesc: { fontSize: 12, color: colors.text.muted, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.danger },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: { ...theme.typography.h3, color: colors.text.primary },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.text.primary,
  },
});
