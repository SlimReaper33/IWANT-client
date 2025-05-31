// app/screens/ForgotPassword.tsx
import React, { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { forgotPassword } from '../utils/auth';
import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';
import styles from '../styles/AuthScreen.styles';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    setMessage('');
    setError('');

    if (!email) {
      setError(t('enterEmailError'));
      return;
    }

    setLoading(true);
    try {
      // СѓС‚РёР»РёС‚Р° С‚РµРїРµСЂСЊ РІРѕР·РІСЂР°С‰Р°РµС‚ { ok, message }
      const result = await forgotPassword(email);
      if (result.ok) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (e) {
      console.error('Forgot password error:', e);
      setError(t('forgotPasswordRequestError'));
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LocalizedText style={styles.title}>{t('forgotPasswordTitle')}</LocalizedText>

      <TextInput
        style={styles.input}
        placeholder={t('forgotPasswordPlaceholder')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {loading && <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />}
      {message
        ? <LocalizedText style={styles.message}>{message}</LocalizedText>
        : null}
      {error
        ? <LocalizedText style={styles.error}>{error}</LocalizedText>
        : null}

      <Pressable
        style={styles.button}
        onPress={handleForgotPassword}
        disabled={loading}
      >
        <LocalizedText style={styles.buttonText}>{t('sendResetLink')}</LocalizedText>
      </Pressable>

      <Pressable onPress={() => router.push('/login')}>
        <LocalizedText style={styles.link}>{t('backToLogin')}</LocalizedText>
      </Pressable>
    </View>
  );
}

