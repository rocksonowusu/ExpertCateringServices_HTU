import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { ECSLogo } from '@/components/ECSLogo';

export default function EmailEntryScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { loginWithEmail, isLoading } = useAuthStore();
  const router = useRouter();

  const handleContinue = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return; }
    await loginWithEmail(email.trim().toLowerCase());
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — red with decorative circles */}
          <View style={styles.hero}>
            <View style={styles.d1} />
            <View style={styles.d2} />
            <View style={styles.d3} />
            <View style={styles.d4} />
            <View style={styles.d5} />
            <View style={styles.d6} />

            <View style={styles.heroContent}>
              <ECSLogo size="lg" variant="light" />
              <Text style={styles.appName}>Expert HTU Cafeteria</Text>
              <Text style={styles.tagline}>Order food. Save time. Eat well.</Text>
            </View>
          </View>

          {/* Form — white rounded sheet */}
          <View style={styles.sheet}>
            <Text style={styles.heading}>Welcome 👋</Text>
            <Text style={styles.subheading}>
              Enter your email to start ordering. Your orders and activity will be linked to it.
            </Text>

            <Input
              label="Email Address"
              placeholder="yourname@htu.edu.gh"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error}
              leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
            />

            <Button
              title="Continue"
              onPress={handleContinue}
              loading={isLoading}
              fullWidth
              size="lg"
            />

            {/* Quick demo fill */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => setEmail('student@htu.edu.gh')}
              activeOpacity={0.7}
            >
              <Ionicons name="flash-outline" size={14} color={Colors.primary} />
              <Text style={styles.demoBtnText}>Use demo email</Text>
            </TouchableOpacity>
          </View>

          {/* Admin link — subtle, at the very bottom */}
          <TouchableOpacity
            style={styles.adminLink}
            onPress={() => router.push('/(auth)/admin-login')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.adminText}>Admin? Sign in here</Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.textMuted} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: Colors.primary,
    minHeight: 310,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: 48,
  },

  // Filled circles
  d1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -100, right: -80,
  },
  d2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -50, left: -55,
  },
  d3: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.06)', top: 55, left: 55,
  },
  // Ring outlines
  d4: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.11)', top: 20, left: -30,
  },
  d5: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.09)', bottom: 30, right: 35,
  },
  d6: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', top: 60, right: 70,
  },

  heroContent: { alignItems: 'center', gap: 10, zIndex: 1 },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    padding: 28,
    paddingTop: 30,
    gap: 16,
    marginTop: -22,
  },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subheading: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: -6 },

  demoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  demoBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  adminLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 18,
    backgroundColor: Colors.white,
  },
  adminText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
});
