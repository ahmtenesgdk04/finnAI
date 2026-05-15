import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('E-posta ve şifre zorunludur'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>FinnAI</Text>
        <Text style={styles.subtitle}>Finansal zekânızı keşfedin</Text>

        <View style={styles.form}>
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Giriş Yap" onPress={handleLogin} loading={loading} />
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Hesabın yok mu? Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: theme.spacing.lg },
  title: { fontSize: 40, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { ...theme.typography.body, color: colors.text.secondary, textAlign: 'center', marginBottom: theme.spacing.xl },
  form: { gap: theme.spacing.md },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  link: { ...theme.typography.body, color: colors.primary, textAlign: 'center', marginTop: theme.spacing.sm },
});
