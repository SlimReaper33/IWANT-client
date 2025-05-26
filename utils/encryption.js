import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'audio_encryption_key';

async function getKey() {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString();
    await SecureStore.setItemAsync(KEY_NAME, key);
  }
  return key;
}

export async function encryptAudio(uri) {
  // On web, expo-file-system isn’t available — skip encryption
  if (Platform.OS === 'web') {
    return uri;
  }

  // Native: read file as Base64, encrypt, write out `.enc`
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const key = await getKey();
  const encrypted = CryptoJS.AES.encrypt(base64, key).toString();
  const encUri = uri.replace(/\.\w+$/, '.enc');
  await FileSystem.writeAsStringAsync(encUri, encrypted, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return encUri;
}

export async function decryptAudio(encUri) {
  if (Platform.OS === 'web') {
    return encUri;
  }
  const encrypted = await FileSystem.readAsStringAsync(encUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const key = await getKey();
  const decryptedWords = CryptoJS.AES.decrypt(encrypted, key);
  const decryptedBase64 = CryptoJS.enc.Base64.stringify(decryptedWords);
  const outUri = encUri.replace(/\.enc$/, '.m4a');
  await FileSystem.writeAsStringAsync(outUri, decryptedBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return outUri;
}
