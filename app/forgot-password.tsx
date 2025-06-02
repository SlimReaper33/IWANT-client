// app/screens/ForgotPassword.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';
import styles from '../styles/AuthScreen.styles';
import { forgotPassword, verifyResetCode } from '../utils/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Шаг 1: ввод email
  // Шаг 2: ввод кода (token) и нового пароля
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError(t('invalidEmailError'));
      return false;
    }
    return true;
  };

  const handleSendCode = async () => {
    setError('');
    setMessage('');
    console.log('>>> [Client] forgotPassword вызывается с email =', email.trim());

    if (!validateEmail()) return;

    setLoading(true);
    try {
      const result = await forgotPassword(email.trim());
      if (result.ok) {
        setMessage(result.message); // например: "Код сброса отправлен"
        setStep(2);
        setCode('');
      } else {
        setError(result.message);
      }
    } catch (e) {
      console.error('Forgot password error:', e);
      setError(t('forgotPasswordRequestError'));
    }
    setLoading(false);
  };

  const validatePasswords = () => {
    if (newPassword.length < 6) {
      setError(t('passwordMinLengthError'));
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordsMismatchError'));
      return false;
    }
    if (!code.trim()) {
      setError(t('enterResetCodeError'));
      return false;
    }
    return true;
  };

  const handleVerifyCode = async () => {
    setError('');
    setMessage('');
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      console.log('>>> [Client] verifyResetCode with code =', code.trim());
      const { ok, message: srvMsg } = await verifyResetCode(
        code.trim(),
        newPassword
      );
      if (ok) {
        Alert.alert(
          t('passwordResetSuccess'),
          t('youCanNowLogin'),
          [
            {
              text: t('ok'),
              onPress: () => router.replace('/login'),
            },
          ]
        );
      } else {
        setError(srvMsg);
      }
    } catch (e) {
      console.error('Verify reset code error:', e);
      setError(t('resetPasswordError'));
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LocalizedText style={styles.title}>
        {t('forgotPasswordTitle')}
      </LocalizedText>

      {step === 1 && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('forgotPasswordPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {loading && (
            <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
          )}
          {!!message && (
            <LocalizedText style={styles.info}>{message}</LocalizedText>
          )}
          {!!error && (
            <LocalizedText style={styles.error}>{error}</LocalizedText>
          )}

          <Pressable
            style={styles.button}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#C3947A" />
            ) : (
              <LocalizedText style={styles.buttonText}>
                {t('sendResetCode')}
              </LocalizedText>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace('/login')}>
            <LocalizedText style={styles.link}>{t('backToLogin')}</LocalizedText>
          </Pressable>
        </>
      )}

      {step === 2 && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('enterResetCodePlaceholder')}
            keyboardType="default"
            autoCapitalize="none"
            value={code}
            onChangeText={setCode}
          />
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

          {loading && (
            <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
          )}
          {!!message && (
            <LocalizedText style={styles.info}>{message}</LocalizedText>
          )}
          {!!error && (
            <LocalizedText style={styles.error}>{error}</LocalizedText>
          )}

          <Pressable
            style={styles.button}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#C3947A" />
            ) : (
              <LocalizedText style={styles.buttonText}>
                {t('resetPasswordButton')}
              </LocalizedText>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setStep(1);
              setError('');
              setMessage('');
            }}
          >
            <LocalizedText style={styles.link}>{t('backToEmail')}</LocalizedText>
          </Pressable>
        </>
      )}
    </View>
  );
}
