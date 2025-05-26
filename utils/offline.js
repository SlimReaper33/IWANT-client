// utils/offline.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_CARDS_KEY = 'pendingCards';

// Добавляем в очередь оффлайн-действие с карточкой
export async function enqueueCard(card) {
  const raw = await AsyncStorage.getItem(PENDING_CARDS_KEY);
  const list = raw ? JSON.parse(raw) : [];
  list.push(card);
  await AsyncStorage.setItem(PENDING_CARDS_KEY, JSON.stringify(list));
}

// Получаем все ожидающие отправки
export async function getPendingCards() {
  const raw = await AsyncStorage.getItem(PENDING_CARDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Очищаем всю очередь после успешного синка
export async function clearPendingCards() {
  await AsyncStorage.removeItem(PENDING_CARDS_KEY);
}
