import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// URL/Blob polyfills are needed by supabase-js on React Native, but on web they
// can shadow the browser's own globals and break fetch ("Network request failed").
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

// .trim() guards against stray whitespace / CRLF carriage returns in .env,
// which would otherwise produce a malformed URL ("Network request failed").
const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// One-time startup diagnostic so we can confirm what the app actually loaded.
console.log(`[supabase] configured=${Boolean(url && anonKey)} url="${url}" keyLen=${anonKey.length}`);

/**
 * True only when both env vars are present. The app stays fully usable without
 * them (it falls back to local/in-memory data), so nothing crashes before the
 * Supabase project is wired up. See SETUP_SUPABASE.md.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

// During static web export the code runs in Node, where there is no window/
// localStorage — session persistence must be off there or the build crashes.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'public-anon-key',
  {
    auth: {
      // Native uses AsyncStorage; web uses supabase-js's default (localStorage).
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      detectSessionInUrl: false,
    },
  }
);
