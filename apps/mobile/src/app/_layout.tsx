import { CommentingProvider, createCommentingQueryClient } from '@commenting/core/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FreshCommentProvider } from '@/lib/fresh-comment';
import { AppLocaleProvider } from '@/lib/locale';
import { AppStack } from '@/lib/navigation';
import { createAppServices } from '@/lib/services';

export default function RootLayout() {
  // Created once per app session (D-2).
  const [queryClient] = useState(createCommentingQueryClient);
  const [services] = useState(createAppServices);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <CommentingProvider services={services}>
          <AppLocaleProvider>
            <FreshCommentProvider>
              <StatusBar style="light" />
              <AppStack />
            </FreshCommentProvider>
          </AppLocaleProvider>
        </CommentingProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
