// app/screens/ResetPassword.tsx
import React, { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { resetPassword } from '../utils/auth';
import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';
import styles from '../styles/AuthScreen.styles';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    setError('');
    setMessage('');

    if (!token) {
      setError(t('missingTokenError'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('passwordMinLengthError'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordsMismatchError'));
      return;
    }

    setLoading(true);
    try {
      // функция теперь возвращает { ok, message }
      const result = await resetPassword(token as string, newPassword);
      if (result.ok) {
        setMessage(result.message);
        // после успешного сброса — через 3 сек на логин
        setTimeout(() => router.replace('/login'), 3000);
      } else {
        setError(result.message);
      }
    } catch (e) {
      console.error('Reset password error:', e);
      setError(t('resetRequestError'));
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LocalizedText style={styles.title}>{t('resetPasswordTitle')}</LocalizedText>

      <TextInput
        style={styles.input}
        placeholder={t('newPasswordPlaceholder')}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TextInput
        style={styles.input}
        placeholder={t('confirmPasswordPlaceholder')}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {loading && <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />}
      {message && <LocalizedText style={styles.message}>{message}</LocalizedText>}
      {error   && <LocalizedText style={styles.error}>{error}</LocalizedText>}

      <Pressable
        style={styles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        <LocalizedText style={styles.buttonText}>{t('resetButton')}</LocalizedText>
      </Pressable>
    </View>
  );
}

