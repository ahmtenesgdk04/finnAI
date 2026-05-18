import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { authAPI } from '../../services/api';

type Step = 'otp' | 'password';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email: string = route.params?.email ?? '';

  const [step, setStep] = useState<Step>('otp');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('6 haneli kodu eksiksiz girin'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.verifyOtp(email, code);
      setResetToken(res.data.resetToken);
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kod hatalı veya süresi dolmuş');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError('Şifre en az 6 karakter olmalıdır'); return; }
    if (newPassword !== confirmPassword) { setError('Şifreler eşleşmiyor'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      Alert.alert('Başarılı', 'Şifreniz güncellendi. Giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') },
      ]);
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

        {step === 'otp' ? (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name="mail-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Kodu Girin</Text>
            <Text style={styles.subtitle}>
              <Text style={{ fontWeight: '700' }}>{email}</Text> adresine gönderilen{'\n'}6 haneli kodu girin.
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputs.current[i] = r; }}
                  style={[styles.otpInput, digit ? styles.otpFilled : null]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Doğrula</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Kodu yeniden gönder</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#16a34a" />
            </View>
            <Text style={styles.title}>Yeni Şifre</Text>
            <Text style={styles.subtitle}>En az 6 karakter içeren yeni şifrenizi belirleyin.</Text>

            <View style={styles.form}>
              <View style={styles.pwWrap}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="Yeni şifre"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Yeni şifre (tekrar)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPw}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, styles.btnGreen, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Şifremi Güncelle</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1, backgroundColor: colors.background,
    padding: theme.spacing.lg, paddingTop: 56,
    alignItems: 'center',
  },
  back: {
    position: 'absolute', top: 56, left: theme.spacing.lg,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: {
    marginTop: 72, marginBottom: 20,
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text.primary, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: colors.text.secondary, textAlign: 'center',
    marginTop: 8, marginBottom: 32, lineHeight: 20,
  },
  otpRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  otpInput: {
    width: 46, height: 56, borderWidth: 2, borderColor: colors.border,
    borderRadius: 10, fontSize: 24, fontWeight: '700',
    textAlign: 'center', backgroundColor: colors.card,
    color: colors.text.primary,
  },
  otpFilled: { borderColor: colors.primary },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  btn: {
    backgroundColor: colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 14, paddingHorizontal: 48, alignItems: 'center',
    marginTop: 4,
  },
  btnGreen: { backgroundColor: '#16a34a' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: colors.primary, textAlign: 'center', marginTop: 16, fontSize: 14 },
  form: { width: '100%', gap: theme.spacing.md },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 15,
    width: '100%',
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center' },
  pwInput: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 15,
  },
  eyeBtn: { position: 'absolute', right: 12 },
});
