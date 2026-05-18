import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { authAPI } from '../../services/api';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('E-posta adresinizi girin'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          E-posta adresinize 6 haneli bir doğrulama kodu göndereceğiz.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-posta adresiniz"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Kod Gönder</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Giriş ekranına dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1, backgroundColor: colors.background,
    padding: theme.spacing.lg, paddingTop: 56,
  },
  back: {
    position: 'absolute', top: 56, left: theme.spacing.lg,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: {
    alignSelf: 'center', marginTop: 72, marginBottom: 20,
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text.primary, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: colors.text.secondary, textAlign: 'center',
    marginTop: 8, marginBottom: 32, lineHeight: 20,
  },
  form: { gap: theme.spacing.md },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  btn: {
    backgroundColor: colors.primary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: colors.primary, textAlign: 'center', marginTop: 4, fontSize: 14 },
});
