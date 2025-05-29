import 'react-native-get-random-values';
import '../src/i18n';
import React, { useEffect, useState, useCallback } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Alert, BackHandler, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { ParentControlProvider, useParentControl } from '../features/auth/ParentControlContext';
import { getPendingCards, clearPendingCards } from '../utils/offline';
import { addCard as addCardUtil, updateCard as updateCardUtil } from '../utils/cards';
import { getAuthToken } from '../utils/auth';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalProvider, PortalHost } from '@gorhom/portal';
import GlobalSyncManager from '../components/GlobalSyncManager';

import * as ScreenOrientation from 'expo-screen-orientation';
import { isTablet } from '../utils/_responsive';
import { useTranslation } from 'react-i18next';

// 30 дней в миллисекундах
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

// Создаём QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: THIRTY_DAYS,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

function RouterGuard() {
  const { userToken, userRole, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const seg0 = segments[0] || '';

  useEffect(() => {
    if (loading) return;
    const publicRoutes = ['welcomeScreen', 'login', 'register', 'forgot-password', 'reset-password'];
    if (!userToken) {
      if (!publicRoutes.includes(seg0)) router.replace('/welcomeScreen');
    } else {
      if (publicRoutes.includes(seg0)) {
        router.replace(userRole === 'admin' ? '/admin' : '/');
      } else if (seg0 === 'admin' && userRole !== 'admin') {
        router.replace('/');
      } else if (seg0 !== 'admin' && userRole === 'admin') {
        router.replace('/admin');
      }
    }
  }, [loading, userToken, userRole, segments]);

  if (loading) return null;
  return <Slot />;
}

function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    Dimensions.get('window').height >= Dimensions.get('window').width ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const callback = ({ window }: { window: any }) => {
      setOrientation(window.height >= window.width ? 'portrait' : 'landscape');
    };

    const subscription = Dimensions.addEventListener('change', callback);

    return () => subscription.remove();
  }, []);

  return orientation;
}

function NavigationBlocker() {
  const { enabled } = useParentControl();
  const { t } = useTranslation();
  useEffect(() => {
    const onBackPress = (): boolean => {
      if (enabled) {
        Alert.alert(t('parentalControlActive'), t('parentalControlMessage'));
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [enabled]);
  return null;
}

function useBackHandler(modalVisible: boolean, closeModal: () => void) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const onBackPress = () => {
      if (modalVisible) {
        closeModal();
        return true; // закрываем модалку
      }
      if (router.canGoBack()) {
        router.back();
        return true; // навигация назад
      }
      Alert.alert(
        t('quit'),
        t('quitFromApp'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('exit'), onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [modalVisible, closeModal, router]);
}

function SyncManager() {
  useEffect(() => {
    const unsub = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        const pending = await getPendingCards();
        if (pending.length) {
          const token = await getAuthToken();
          for (const item of pending) {
            try {
              if (item.action === 'add') {
                const { title, section, line, page, imageUri } = item.payload;
                await addCardUtil(title, imageUri, section, line, page, token);
              } else if (item.action === 'update') {
                const { id, title, imageUri } = item.payload;
                await updateCardUtil(id, title, imageUri, token);
              }
            } catch (e) {
              console.warn('Sync failed for', item, e);
            }
          }
          await clearPendingCards();
        }
      }
    });
    return () => unsub();
  }, []);
  return null;
}


export default function RootLayout() {
  const orientation = useOrientation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false); // пример модалки (если есть)
  const closeModal = useCallback(() => setModalVisible(false), []);

  // Ограничиваем поворот только для планшетов
  useEffect(() => {
  async function manageOrientation() {
    console.log('Device is tablet?', isTablet);
    if (isTablet) {
      await ScreenOrientation.unlockAsync();
      console.log('Orientation unlocked for tablet');
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      console.log('Orientation locked to portrait for phone');
    }
  }
  manageOrientation();
}, []);

  // Используем кастомный back handler
  useBackHandler(modalVisible, closeModal);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ParentControlProvider>
          <PortalProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister: asyncStoragePersister, maxAge: THIRTY_DAYS }}
            >
              <GlobalSyncManager>
                <SafeAreaProvider>
                  <SafeAreaView
                    style={{
                      flex: 1,
                      backgroundColor: '#fff',
                    }}
                    edges={['top', 'left', 'right', 'bottom']} // покрываем всю safe area, включая снизу
                  >
                    <SyncManager />
                    <NavigationBlocker />
                    <RouterGuard />
                    <PortalHost name="root" />

                    {/* Для отладки ориентации и отступов */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: insets.bottom + 10,
                        left: 10,
                        padding: 4,
                        borderRadius: 4,
                        zIndex: 9999,
                      }}
                    >
                    </View>
                  </SafeAreaView>
                </SafeAreaProvider>
              </GlobalSyncManager>
            </PersistQueryClientProvider>
          </PortalProvider>
        </ParentControlProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
