// client/src/utils/cache.ts
import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import type { GlobalCard } from './api';

export async function preloadImages(cards: GlobalCard[]) {
  // Expo-Asset
  await Promise.all(cards.map(c => Asset.fromURI(c.imageUri).downloadAsync()));
  // React Native
  await Promise.all(cards.map(c => Image.prefetch(c.imageUri)));
}
