import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const { user, hasSeenOnboarding } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const root = segments[0] as string | undefined;
    const inAuth  = root === '(auth)';
    const inTabs  = root === '(tabs)';
    const inAdmin = root === '(admin)';
    // On the root "/" route Expo Router gives an empty-ish segments tuple
    const inRoot  = !inAuth && !inTabs && !inAdmin;

    if (!hasSeenOnboarding) {
      if (!inRoot) router.replace('/');
      return;
    }

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (user.isAdmin) {
      if (!inAdmin) router.replace('/(admin)/dashboard');
    } else {
      if (!inTabs) router.replace('/(tabs)');
    }
  }, [user, hasSeenOnboarding, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="food/[id]" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-success" />
      </Stack>
    </GestureHandlerRootView>
  );
}
