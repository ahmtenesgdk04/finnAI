import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'personal' | 'business'>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Tüm alanlar zorunludur'); return; }
    setLoading(true); setError('');
    try {
      await register({ name, email, password, mode });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <Text style={styles.subtitle}>Hesabınızı oluşturun</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Ad Soyad" value={name} onChangeText={setName} />
          <TextInput
            style={styles.input} placeholder="E-posta"
            value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
          />
          <TextInput
            style={styles.input} placeholder="Şifre"
            value={password} onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.modeLabel}>Kullanım Modu</Text>
          <View style={styles.modeRow}>
            {(['personal', 'business'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === 'personal' ? 'Kişisel' : 'İşletme'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Kayıt Ol" onPress={handleRegister} loading={loading} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Hesabın var mı? Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: theme.spacing.lg },
  title: { fontSize: 32, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { ...theme.typography.body, color: colors.text.secondary, textAlign: 'center', marginBottom: theme.spacing.xl },
  form: { gap: theme.spacing.md },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 15,
  },
  modeLabel: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  modeRow: { flexDirection: 'row', gap: theme.spacing.sm },
  modeBtn: {
    flex: 1, padding: theme.spacing.md, borderRadius: theme.borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeBtnText: { fontSize: 15, fontWeight: '600', color: colors.text.secondary },
  modeBtnTextActive: { color: '#fff' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  link: { ...theme.typography.body, color: colors.primary, textAlign: 'center', marginTop: theme.spacing.sm },
});
