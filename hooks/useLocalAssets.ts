// hooks/useLocalAssets.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'local_card_assets';

export interface AssetMapEntry {
  image?: string;
  audio?: string;
}

// Хук для хранения локальных оверрайдов картинок и аудио
export function useLocalAssets() {
  const [map, setMap] = useState<Record<string, AssetMapEntry>>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (json) setMap(JSON.parse(json));
    });
  }, []);

  const setLocalImage = async (cardId: string, uri: string) => {
    const upd = { ...map, [cardId]: { ...map[cardId], image: uri } };
    setMap(upd);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(upd));
  };

  const setLocalAudio = async (cardId: string, uri: string) => {
    const upd = { ...map, [cardId]: { ...map[cardId], audio: uri } };
    setMap(upd);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(upd));
  };

  return { map, setLocalImage, setLocalAudio };
}
