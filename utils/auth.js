// utils/auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ENDPOINTS } from './config';

const ACCESS_TOKEN_KEY    = 'userToken';
const REFRESH_TOKEN_KEY   = 'refreshToken';
const CARDS_CACHE_KEY     = 'cardsCache';
const GLOBAL_CACHE_KEY    = 'globalCardsCache';

export const BASE_URL   = ENDPOINTS.AUTH;   // e.g. https://.../api/auth
export const CARDS_BASE = ENDPOINTS.CARDS;  // e.g. https://.../api/cards

/**
 * Результат login:
 * - при успехе: { ok: true, accessToken, refreshToken, role }
 * - при неуспехе: { ok: false, message }
 */
export async function login(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok && data.accessToken && data.refreshToken) {
      // Сохраняем токены в AsyncStorage
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY,  data.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

      return {
        ok: true,
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        role:         data.role,
      };
    }

    return { ok: false, message: data.message || 'login_failed' };
  } catch (error) {
    console.error('❌ Login error:', error);
    return { ok: false, message: 'login_error' };
  }
}

export async function register(email, password, role = 'user') {
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
}

export async function verifyOtp(email, code) {
  try {
    const res = await fetch(`${BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    throw error;
  }
}

export async function resendVerificationEmail(email) {
  try {
    const res = await fetch(`${BASE_URL}/resend-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    console.error('❌ Resend email error:', error);
    throw error;
  }
}

export async function forgotPassword(email) {
  console.log('>>> [utils/auth] forgotPassword → fetch', `${BASE_URL}/forgot-password`, { email });
  try {
    const res = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    console.log('<<< [utils/auth] forgotPassword ответ:', data, 'status', res.status);
    return { ok: res.ok, message: data.message };
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    throw error;
  }
}

/**
 * Отправляем именно { token, newPassword } без email.
 */
export async function verifyResetCode(code, newPassword) {
  try {
    console.log('>>> [utils/auth] verifyResetCode отправляю код и новый пароль:', code);
    const res = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code, newPassword }),
    });
    const data = await res.json();
    console.log('<<< [utils/auth] verifyResetCode ответ:', data, 'status', res.status);
    return { ok: res.ok, message: data.message };
  } catch (error) {
    console.error('❌ Verify reset code error:', error);
    throw error;
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const res = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    return { ok: res.ok, message: data.message };
  } catch (error) {
    console.error('❌ Reset password error:', error);
    throw error;
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();

    if (res.ok && data.accessToken) {
      // Обновляем в хранилище
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      return data.accessToken;
    }

    // Если не ок — чистим всё
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    return null;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    return null;
  }
}

export async function customFetch(url, options = {}) {
  options = { ...options, headers: { ...(options.headers || {}) } };

  // Статика (картинки/аудио)
  if (url.includes('/uploads')) {
    return fetch(url, options);
  }

  // Проверяем, передали ли уже Authorization
  const passedAuth = options.headers.Authorization;
  let authToken;

  if (typeof passedAuth === 'string' && !passedAuth.endsWith('undefined')) {
    // Ваш токен в headers
    authToken = passedAuth.replace(/^Bearer\s*/, '');
  } else {
    // Берём из AsyncStorage
    authToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  if (authToken) {
    options.headers.Authorization = `Bearer ${authToken}`;
  }

  // Сеть
  const net = await NetInfo.fetch();
  const isOnline = net.isConnected && net.isInternetReachable;

  if (!isOnline) {
    // Offline-кэш
    if (url.includes('/api/cards')) {
      const cached = await AsyncStorage.getItem(CARDS_CACHE_KEY);
      if (cached) return new Response(cached, { status: 200 });
    }
    if (url.includes('/api/global/cards')) {
      const cached = await AsyncStorage.getItem(GLOBAL_CACHE_KEY);
      if (cached) return new Response(cached, { status: 200 });
    }
    return Promise.reject(new Error('No internet connection'));
  }

  // Первый fetch
  let response = await fetch(url, options);

  // Если 401 — пробуем рефреш
  if (response.status === 401) {
    const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
      const newToken = await refreshAccessToken(refresh);
      if (newToken) {
        options.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, options);
      }
    }
  }

  // Кэшировать карточки
  if (response.ok && url.includes('/api/cards')) {
    const text = await response.clone().text();
    await AsyncStorage.setItem(CARDS_CACHE_KEY, text);
  }
  if (response.ok && url.includes('/api/global/cards')) {
    const text = await response.clone().text();
    await AsyncStorage.setItem(GLOBAL_CACHE_KEY, text);
  }

  return response;
}

/** Удобный метод, чтобы достать токен из AsyncStorage */
export async function getAuthToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}
