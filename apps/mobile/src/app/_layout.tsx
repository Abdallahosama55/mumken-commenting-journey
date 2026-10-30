import { CommentingProvider, createCommentingQueryClient } from '@commenting/core/react';
import { Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold, useFonts } from '@expo-google-fonts/cairo';
import { SplashScreen } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FreshCommentProvider } from '@/lib/fresh-comment';
import { AppLocaleProvider } from '@/lib/locale';
import { AppStack } from '@/lib/navigation';
import { createAppServices } from '@/lib/services';

// Keep the native splash up until Cairo (the design's typeface) is ready, so text never reflows.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Created once per app session (D-2).
  const [queryClient] = useState(createCommentingQueryClient);
  const [services] = useState(createAppServices);
  const [fontsLoaded, fontError] = useFonts({ Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // A font failure falls back to the system font rather than blocking the app.
  if (!ready) return null;

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
