// hooks/useLocalAudio.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'local_card_audio';

export function useLocalAudio() {
  const [map, setMap] = useState<Record<string,string>>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (json) setMap(JSON.parse(json));
    });
  }, []);

  const setLocal = async (cardId: string, uri: string) => {
    const upd = { ...map, [cardId]: uri };
    setMap(upd);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(upd));
  };

  return { map, setLocal };
}
