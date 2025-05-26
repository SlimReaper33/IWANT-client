// client/src/utils/sync.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchManifest, fetchChanges, fetchCardById, GlobalCard } from './api';
import { preloadImages } from './cache';
import type { CardType, SectionId } from '../features/cards/Card';

const KEY_VERSION = 'globalManifestVersion';
const KEY_TS      = 'globalLastSync';

/**
 * Синхронизирует глобальные карты:
 * 1) Проверяет manifest version
 * 2) Запрашивает изменения
 * 3) Скачивает новые/обновлённые карты и сохраняет в AsyncStorage
 * 4) Префетчит картинки
 * 5) Возвращает всё как CardType[]
 */
export async function syncGlobalCards(): Promise<CardType[]> {
  // 1) manifest
  const { version } = await fetchManifest();
  const storedVer = Number(await AsyncStorage.getItem(KEY_VERSION)) || 0;
  if (version === storedVer) {
    // нет изменений — вернём локальный кеш
    return loadLocalCards();
  }

  // 2) изменения с последней синхронизации
  const since = (await AsyncStorage.getItem(KEY_TS)) || '';
  const changes = await fetchChanges(since);

  const updated: GlobalCard[] = [];
  for (const ch of changes) {
    if (ch.action === 'add' || ch.action === 'update') {
      const card = await fetchCardById(ch.id);
      await AsyncStorage.setItem(`card:${card._id}`, JSON.stringify(card));
      updated.push(card);
    }
    if (ch.action === 'delete') {
      await AsyncStorage.removeItem(`card:${ch.id}`);
    }
  }

  // 3) сохраняем новую версию и timestamp
  await AsyncStorage.setItem(KEY_VERSION, String(version));
  await AsyncStorage.setItem(KEY_TS, new Date().toISOString());

  // 4) префетчим картинки обновлённых
  if (updated.length) {
    await preloadImages(updated);
  }

  // 5) возвращаем весь локальный набор, уже приведённый к CardType[]
  return loadLocalCards();
}

/**
 * Загружает из AsyncStorage все карты и преобразует их в CardType[]
 */
export async function loadLocalCards(): Promise<CardType[]> {
  const keys = await AsyncStorage.getAllKeys();
  const cardKeys = keys.filter(k => k.startsWith('card:'));
  const pairs = await AsyncStorage.multiGet(cardKeys);

  return pairs
    .map(([_, v]) => {
      if (!v) return null;
      const gc: GlobalCard = JSON.parse(v);
      // строим thumbnail по соглашению: в той же папке, префикс thumb_
      const parts = gc.imageUri.split('/');
      const filename = parts.pop() || '';
      const dir = parts.join('/');
      const thumbName = `thumb_${filename}`;
      const thumbnailUri = `${dir}/${thumbName}`;

      const ct: CardType = {
        id:           gc._id,
        title:        gc.title,
        title_ru:     gc.title_ru,
        title_en:     gc.title_en,
        title_kk:     gc.title_kk,
        section:      gc.section as SectionId,
        line:         gc.line,
        page:         gc.page,
        imageUri:     gc.imageUri,
        thumbnailUri,
        audio_kk:     gc.audio_kk,
      };
      return ct;
    })
    .filter((c): c is CardType => c !== null);
}
