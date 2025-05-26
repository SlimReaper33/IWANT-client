import 'react-native-get-random-values';
import '../src/i18n';
import React, { useEffect, ReactNode } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHandler, Alert } from 'react-native';
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

function NavigationBlocker() {
  const { enabled } = useParentControl();
  useEffect(() => {
    const onBackPress = (): boolean => {
      if (enabled) {
        Alert.alert('Родительский контроль', 'Нельзя покинуть приложение.');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [enabled]);
  return null;
}

function RouterGuard() {
  const { userToken, userRole, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const seg0 = segments[0] || '';

  useEffect(() => {
    if (loading) return;
    const publicRoutes = ['welcomeScreen','login','register','forgot-password','reset-password'];
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

function SyncManager() {
  useEffect(() => {
    const unsub = NetInfo.addEventListener(async state => {
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ParentControlProvider>
          <PortalProvider>
            {/* Только PersistQueryClientProvider — он сам внутрь включает QueryClientProvider */}
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister: asyncStoragePersister, maxAge: THIRTY_DAYS }}
            >
              <GlobalSyncManager>
                <SafeAreaView style={{ flex: 1 }}>
                  <SyncManager />
                  <NavigationBlocker />
                  <RouterGuard />
                  <PortalHost name="root" />
                </SafeAreaView>
              </GlobalSyncManager>
            </PersistQueryClientProvider>
          </PortalProvider>
        </ParentControlProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
