import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';
import { useMenuStore } from '@/store/menuStore';

export default function RootLayout() {
  const { user, hasSeenOnboarding } = useAuthStore();
  const loadMenu = useMenuStore((s) => s.loadMenu);
  const subscribeMenu = useMenuStore((s) => s.subscribeMenu);
  const router = useRouter();
  const segments = useSegments();

  // Pull the menu from Supabase on launch, then keep it live (availability, new items…).
  useEffect(() => {
    loadMenu();
    const unsub = subscribeMenu();
    return unsub;
  }, [loadMenu, subscribeMenu]);

  useEffect(() => {
    const root = segments[0] as string | undefined;
    const inAuth  = root === '(auth)';
    const inTabs  = root === '(tabs)';
    const inAdmin = root === '(admin)';
    // On the root "/" (onboarding) route Expo Router gives an empty segments tuple
    const inRoot  = root === undefined;

    // Web flow: the root route is the public landing page (index.web.tsx) —
    // no onboarding, and logged-out visitors may browse landing + auth screens.
    if (Platform.OS === 'web') {
      if (!user) {
        if (!inRoot && !inAuth) router.replace('/');
      } else if (user.isAdmin) {
        if (inRoot || inAuth || inTabs) router.replace('/(admin)/dashboard');
      } else {
        if (inRoot || inAuth || inAdmin) router.replace('/(tabs)');
      }
      return;
    }

    // Native (mobile) flow: onboarding → login → tabs/admin.
    if (!hasSeenOnboarding) {
      if (!inRoot) router.replace('/');
      return;
    }

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (user.isAdmin) {
      // Admins live in the admin area — bounce them out of student/auth/onboarding routes
      if (inRoot || inAuth || inTabs) router.replace('/(admin)/dashboard');
    } else {
      // Students may visit any non-admin route (tabs + food/[id], cart, checkout, order-success).
      // Only bounce them away from onboarding, auth, and admin screens.
      if (inRoot || inAuth || inAdmin) router.replace('/(tabs)');
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
