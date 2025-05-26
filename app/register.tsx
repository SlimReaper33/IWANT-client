// app/register.tsx
import React, { useState } from 'react'
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { register, verifyOtp, resendVerificationEmail } from '../utils/auth'
import { useTranslation } from 'react-i18next'
import LocalizedText from '../components/LocalizedText'
import styles from '../styles/AuthScreen.styles'

export default function RegisterScreen() {
  const { t } = useTranslation()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [otp, setOtp]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)

  const validate = () => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('invalidEmailError'))
      return false
    }
    if (password.length < 6) {
      setError(t('passwordMinLengthError'))
      return false
    }
    if (password !== confirm) {
      setError(t('passwordsMismatchError'))
      return false
    }
    return true
  }

  const handleRegister = async () => {
    setError('')
    setInfo('')
    if (!validate()) return

    setLoading(true)
    try {
      const { ok, data } = await register(email, password, 'user')
      if (ok) {
        setInfo(t('checkEmailForVerification'))
        setShowOtpInput(true)
      } else {
        setInfo(data.message)
        // если сервер вернул повторную отправку
        if (data.message === t('verification_resent')) {
          setShowOtpInput(true)
        }
      }
    } catch (e) {
      console.error(e)
      setError(t('registrationError'))
    }
    setLoading(false)
  }

  const handleVerify = async () => {
    setError('')
    setInfo('')
    if (!otp.trim()) {
      setError(t('enterOtpError'))  // нужно добавить в локализацию
      return
    }

    setLoading(true)
    try {
      const { ok, data } = await verifyOtp(email, otp)
      if (ok) {
        setInfo(t('email_verified'))
        // например, сразу перенаправить на логин:
        setTimeout(() => router.replace('/login'), 1000)
      } else {
        setError(data.message)
      }
    } catch (e) {
      console.error(e)
      setError(t('verificationError'))
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { ok, data } = await resendVerificationEmail(email)
      setInfo(data.message)
    } catch (e) {
      console.error(e)
      setError(t('resendError'))
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <LocalizedText style={styles.title}>{t('registerTitle')}</LocalizedText>

      {!showOtpInput && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
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
          <TextInput
            style={styles.input}
            placeholder={t('confirmPasswordPlaceholder')}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
        </>
      )}

      {showOtpInput && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('enterOtpPlaceholder')}  // например, "Введите код"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
        </>
      )}

      {!!error && <LocalizedText style={styles.error}>{error}</LocalizedText>}
      {!!info &&  <LocalizedText style={styles.info}>{info}</LocalizedText>}

      {!showOtpInput ? (
        <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#C3947A" />
            : <LocalizedText style={styles.buttonText}>{t('registerButton')}</LocalizedText>
          }
        </Pressable>
      ) : (
        <>
          <Pressable style={styles.button} onPress={handleVerify} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#C3947A" />
              : <LocalizedText style={styles.buttonText}>{t('confirmOtpButton')}</LocalizedText>
            }
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleResend} disabled={loading}>
            <LocalizedText style={styles.secondaryText}>{t('resendVerification')}</LocalizedText>
          </Pressable>
        </>
      )}

      <Pressable onPress={() => router.replace('/login')}>
        <LocalizedText style={styles.link}>{t('alreadyHaveAccount')}</LocalizedText>
      </Pressable>
    </View>
  )
}
