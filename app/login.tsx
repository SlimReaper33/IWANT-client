// screens/LoginScreen.tsx

import React, { useState } from 'react';
import styles from '../styles/LoginScreen.styles';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../features/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const validateInputs = () => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('invalidEmailError'));
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError('');
    if (!validateInputs()) return;
    setLoading(true);

    const ok = await login(email, password);
    setLoading(false);

    if (ok) {
      router.replace('/');  // успешный логин
    } else {
      setError(t('invalidCredentialsError'));
    }
  };

  return (
    <View style={styles.container}>
      <LocalizedText style={styles.title}>{t('loginTitle')}</LocalizedText>
      <TextInput
        style={styles.input}
        placeholder={t('emailPlaceholder')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={t('passwordPlaceholder')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error.length > 0 && (
        <LocalizedText style={styles.error}>{error}</LocalizedText>
      )}
      <Pressable
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <LocalizedText style={styles.buttonText}>{t('loginButton')}</LocalizedText>
        }
      </Pressable>

      {/* Ссылки на регистрацию и восстановление пароля */}
      <Pressable onPress={() => router.push('/register')}>
        <LocalizedText style={styles.link}>{t('noAccountRegister')}</LocalizedText>
      </Pressable>
      <Pressable onPress={() => router.push('/forgot-password')}>
        <LocalizedText style={styles.link}>{t('forgotPasswordLink')}</LocalizedText>
      </Pressable>
    </View>
  );
}
