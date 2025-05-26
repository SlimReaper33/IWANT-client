// client/app/components/GlobalSyncManager.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { syncGlobalCards } from '../utils/sync';

export default function GlobalSyncManager({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const cards = await syncGlobalCards();
        qc.setQueryData(['globalCards'], cards);
      } catch (err) {
        console.warn('Global sync failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
