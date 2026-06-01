import { useState } from 'react';
import {
  Alert,
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

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('admin@htu.edu.gh');
  const [password, setPassword] = useState('admin123');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { adminLogin, isLoading } = useAuthStore();
  const router = useRouter();

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email'); valid = false; }
    if (!password) { setPasswordError('Password is required'); valid = false; }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await adminLogin(email.trim().toLowerCase(), password);
    if (!result.success) {
      Alert.alert('Access Denied', result.error ?? 'Invalid admin credentials.');
    }
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
          {/* Hero */}
          <View style={styles.hero}>
            {/* Decorative circles */}
            <View style={styles.d1} />
            <View style={styles.d2} />
            <View style={styles.d3} />
            <View style={styles.d4} />
            <View style={styles.d5} />

            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.heroContent}>
              <ECSLogo size="md" variant="light" />
              <Text style={styles.portalLabel}>Admin Portal</Text>
              <Text style={styles.appName}>Expert HTU Cafeteria</Text>
            </View>
          </View>

          {/* Form sheet */}
          <View style={styles.sheet}>
            {/* Badge */}
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.badgeText}>Authorised Staff Only</Text>
            </View>

            <Text style={styles.heading}>Admin Sign In</Text>
            <Text style={styles.subheading}>
              Only cafeteria staff and administrators can access this portal.
            </Text>

            <View style={styles.form}>
              <Input
                label="Admin Email"
                placeholder="admin@htu.edu.gh"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
                leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={passwordError}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
              />
            </View>

            <Button
              title="Sign In to Dashboard"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />

            <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={14} color={Colors.textMuted} />
              <Text style={styles.backLinkText}>Back to student login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primaryDark },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: Colors.primaryDark,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: 40,
  },

  backBtn: {
    position: 'absolute', top: 16, left: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  d1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60,
  },
  d2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -50, left: -45,
  },
  d3: {
    position: 'absolute', width: 55, height: 55, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)', top: 50, left: 60,
  },
  d4: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.09)', top: 15, left: -25,
  },
  d5: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', bottom: 25, right: 40,
  },

  heroContent: { alignItems: 'center', gap: 6, zIndex: 1, marginTop: 16 },
  portalLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase', marginTop: 4,
  },
  appName: { fontSize: 18, fontWeight: '800', color: Colors.white },

  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    padding: 28,
    paddingTop: 28,
    gap: 14,
    marginTop: -22,
  },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.border,
  },
  badgeText: { fontSize: 11, color: Colors.primary, fontWeight: '700', letterSpacing: 0.5 },

  heading: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subheading: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: -4 },
  form: { gap: 14, marginTop: 4 },

  backLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10,
  },
  backLinkText: { fontSize: 13, color: Colors.textMuted },
});
