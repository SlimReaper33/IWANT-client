// utils/mediaUtils.ts
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
/**
 * Сжимает изображение так, чтобы его ширина не превышала 800px,
 * а качество было примерно 70%. Возвращает URI нового файла.
 */
export async function compressImage(uri) {
  // На вебе ImageManipulator не поддерживается
  if (Platform.OS === 'web') return uri;

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
