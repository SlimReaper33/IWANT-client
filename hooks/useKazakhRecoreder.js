// hooks/useKazakhRecorder.js

import { useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export function useKazakhRecorder() {
  // На web не поддерживаем запись/воспроизведение — возвращаем пустые методы
  if (Platform.OS === 'web') {
    return {
      recording: false,
      uri: null,
      start: async () => {},
      stop: async () => {},
      play: async (_uri) => {},
    };
  }

  const [recordingObj, setRecordingObj] = useState(null);
  const [uri, setUri] = useState(null);

  // Запрос прав и запуск записи
  const start = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') throw new Error('No microphone permission');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
    );
    setRecordingObj(recording);
  };

  // Остановка записи
  const stop = async () => {
    if (!recordingObj) return;
    await recordingObj.stopAndUnloadAsync();
    const uri = recordingObj.getURI();
    setUri(uri);
    setRecordingObj(null);
  };

  // Воспроизведение последней или переданной записи
  const play = async (playUri) => {
    const sound = new Audio.Sound();
    try {
      await sound.loadAsync({ uri: playUri || uri });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {
      // можно показать ошибку или проиграть TTS-заглушку
    }
  };

  return {
    recording: Boolean(recordingObj),
    uri,
    start,
    stop,
    play,
  };
}
