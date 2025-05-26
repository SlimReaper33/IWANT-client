// utils/cards.js

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { enqueueCard } from './offline';
import { customFetch } from './auth';
import { compressImage } from './mediaUtils';
import { ENDPOINTS } from './config';

const CARDS_BASE  = ENDPOINTS.CARDS;
const GLOBAL_BASE = ENDPOINTS.GLOBAL;

function isRemote(uri) {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function makePublicUri(relOrAbs) {
  if (isRemote(relOrAbs)) return relOrAbs;
  return `${ENDPOINTS.BASE}${relOrAbs}`;
}

/** Личные карточки */
export async function getCards(token, section, page) {
  const url = `${CARDS_BASE}?section=${encodeURIComponent(section)}&page=${page}`;
  const res = await customFetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  const { cards } = await res.json();
  return cards.map((c) => ({
    id:           c._id,
    title:        c.title,
    title_ru:     c.title_ru,
    title_en:     c.title_en,
    title_kk:     c.title_kk,
    section:      c.section,
    line:         c.line,
    page:         c.page,
    imageUri:     makePublicUri(c.imageUri),
    thumbnailUri: c.thumbnailUri ? makePublicUri(c.thumbnailUri) : makePublicUri(c.imageUri),
    audio_kk:     c.audio_kk   ? makePublicUri(c.audio_kk)   : undefined,
    user:         c.user,
  }));
}

export async function addCard(
  title,
  imageUri,
  section,
  line,
  page,
  token
) {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    const offlineId = `offline-${Date.now()}`;
    await enqueueCard({ action: 'add', payload: { id: offlineId, title, imageUri, section, line, page } });
    return {
      offline: true,
      card: {
        id:           offlineId,
        title,
        section,
        line,
        page,
        imageUri,
        thumbnailUri: imageUri,
      },
    };
  }

  let local = imageUri;
  if (!isRemote(local)) local = await compressImage(local);

  const form = new FormData();
  form.append('title',   title);
  form.append('section', section);
  form.append('line',    String(line));
  form.append('page',    String(page));
  if (!isRemote(local)) {
    form.append(
      'image',
      Platform.OS === 'web'
        ? new File([await (await fetch(local)).blob()], 'photo.jpg', { type: 'image/jpeg' })
        : { uri: local, name: 'photo.jpg', type: 'image/jpeg' }
    );
  }

  const res = await customFetch(CARDS_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`POST ${CARDS_BASE} failed:`, data.message);
    return null;
  }
  const c = data.card;
  return {
    id:           c._id,
    title:        c.title,
    title_ru:     c.title_ru,
    title_en:     c.title_en,
    title_kk:     c.title_kk,
    section:      c.section,
    line:         c.line,
    page:         c.page,
    imageUri:     makePublicUri(c.imageUri),
    thumbnailUri: c.thumbnailUri ? makePublicUri(c.thumbnailUri) : makePublicUri(c.imageUri),
    audio_kk:     c.audio_kk   ? makePublicUri(c.audio_kk)   : undefined,
    offline:      false,
  };
}

export async function updateCard(
  id,
  title,
  imageUri,
  audioUri,
  token
) {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    await enqueueCard({ action: 'update', payload: { id, title, imageUri, audioUri } });
    return { offline: true, card: { id, title, imageUri, thumbnailUri: imageUri, audio_kk: audioUri } };
  }

  let local = imageUri;
  if (local && !isRemote(local)) local = await compressImage(local);

  const form = new FormData();
  form.append('title', title);
  if (local && !isRemote(local)) {
    form.append(
      'image',
      Platform.OS === 'web'
        ? new File([await (await fetch(local)).blob()], 'photo.jpg', { type: 'image/jpeg' })
        : { uri: local, name: 'photo.jpg', type: 'image/jpeg' }
    );
  }
  if (audioUri && !isRemote(audioUri)) {
    form.append(
      'audio_kk',
      Platform.OS === 'web'
        ? new File([await (await fetch(audioUri)).blob()], 'recording.m4a', { type: 'audio/m4a' })
        : { uri: audioUri, name: 'recording.m4a', type: 'audio/m4a' }
    );
  }

  const res = await customFetch(`${CARDS_BASE}/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const { card: c } = await res.json();
  return {
    id:           c._id,
    title:        c.title,
    title_ru:     c.title_ru,
    title_en:     c.title_en,
    title_kk:     c.title_kk,
    section:      c.section,
    line:         c.line,
    page:         c.page,
    imageUri:     makePublicUri(c.imageUri),
    thumbnailUri: c.thumbnailUri ? makePublicUri(c.thumbnailUri) : makePublicUri(c.imageUri),
    audio_kk:     c.audio_kk   ? makePublicUri(c.audio_kk)   : undefined,
    offline:      false,
  };
}

export async function deleteCard(cardId, token) {
  const res = await customFetch(`${CARDS_BASE}/${cardId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`DELETE failed:`, err);
    throw new Error('DELETE failed');
  }
  return (await res.json()).message;
}

/** Глобальные карточки (админ) */
export async function createGlobalCard(
  payload,
  imageUri,
  audioUri,
  token
) {
  // аналогично addCard, но на ENDPOINTS.ADMIN
  const form = new FormData();
  if (payload.title) form.append('title', payload.title);
  if (payload.title_ru) form.append('title_ru', payload.title_ru);
  if (payload.title_en) form.append('title_en', payload.title_en);
  if (payload.title_kk) form.append('title_kk', payload.title_kk);
  if (payload.section) form.append('section', payload.section);
  if (payload.line != null) form.append('line', String(payload.line));
  if (payload.page != null) form.append('page', String(payload.page));

  form.append(
    'image',
    Platform.OS === 'web'
      ? new File([await (await fetch(imageUri)).blob()], 'photo.jpg', { type: 'image/jpeg' })
      : { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' }
  );
  if (audioUri) {
    form.append(
      'audio_kk',
      Platform.OS === 'web'
        ? new File([await (await fetch(audioUri)).blob()], 'recording.m4a', { type: 'audio/m4a' })
        : { uri: audioUri, name: 'recording.m4a', type: 'audio/m4a' }
    );
  }

  const res = await customFetch(`${ENDPOINTS.ADMIN}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error creating global card');
  }
  const { card: c } = await res.json();
  return {
    _id:       c._id,
    title:     c.title,
    title_ru:  c.title_ru,
    title_en:  c.title_en,
    title_kk:  c.title_kk,
    section:   c.section,
    line:      c.line,
    page:      c.page,
    imageUri:  makePublicUri(c.imageUri),
    audio_kk:  c.audio_kk ? makePublicUri(c.audio_kk) : undefined,
  };
}

export async function updateGlobalCard(
  id,
  payload,
  imageUri,
  audioUri,
  token
) {
  const form = new FormData();
  if (payload.title)    form.append('title', payload.title);
  if (payload.title_ru) form.append('title_ru', payload.title_ru);
  if (payload.title_en) form.append('title_en', payload.title_en);
  if (payload.title_kk) form.append('title_kk', payload.title_kk);
  if (payload.section)  form.append('section', payload.section);
  if (payload.line != null) form.append('line', String(payload.line));
  if (payload.page != null) form.append('page', String(payload.page));

  if (imageUri) {
    form.append(
      'image',
      Platform.OS === 'web'
        ? new File([await (await fetch(imageUri)).blob()], 'photo.jpg', { type: 'image/jpeg' })
        : { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' }
    );
  }
  if (audioUri) {
    form.append(
      'audio_kk',
      Platform.OS === 'web'
        ? new File([await (await fetch(audioUri)).blob()], 'recording.m4a', { type: 'audio/m4a' })
        : { uri: audioUri, name: 'recording.m4a', type: 'audio/m4a' }
    );
  }

  const res = await customFetch(`${ENDPOINTS.ADMIN}/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error updating global card');
  }
  const { card: c } = await res.json();
  return {
    _id:       c._id,
    title:     c.title,
    title_ru:  c.title_ru,
    title_en:  c.title_en,
    title_kk:  c.title_kk,
    section:   c.section,
    line:      c.line,
    page:      c.page,
    imageUri:  makePublicUri(c.imageUri),
    audio_kk:  c.audio_kk ? makePublicUri(c.audio_kk) : undefined,
  };
}

export async function hideGlobalCard(cardId, token) {
  const res = await customFetch(`${GLOBAL_BASE}/hide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cardId }),
  });
  if (!res.ok) throw new Error(`Hide failed: ${res.status}`);
  return res.json();
}

export async function unhideGlobalCard(cardId, token) {
  const res = await customFetch(`${GLOBAL_BASE}/unhide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cardId }),
  });
  if (!res.ok) throw new Error(`Unhide failed: ${res.status}`);
  return res.json();
}

export async function getGlobalCards(token) {
  const res = await customFetch(ENDPOINTS.GLOBAL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${ENDPOINTS.GLOBAL} failed`);
  const { cards } = await res.json();
  return cards.map(c => ({
    id:           c._id,
    title:        c.title,
    title_ru:     c.title_ru,
    title_en:     c.title_en,
    title_kk:     c.title_kk,
    section:      c.section,
    line:         c.line,
    page:         c.page,
    imageUri:     c.thumbnailUri || c.imageUri, // сразу thumbnail, если есть
    thumbnailUri: c.thumbnailUri || c.imageUri,
    audio_kk:     c.audio_kk,
  }));
}