// Web-only admin login — split layout: food photography left, form right,
// with a Login / Register tab switcher (register = "contact us to get set up").
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { ECSLogo } from '@/components/ECSLogo';
import { useAuthStore } from '@/store/authStore';

const SIDE_IMG = 'https://i.pinimg.com/1200x/22/a6/d3/22a6d392b01182374f572e13f5e45f81.jpg';
const SERIF = 'Georgia, "Times New Roman", serif';

type Tab = 'login' | 'register';

function UnderlineField({
  label, value, onChangeText, secure, error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.wrap}>
      <Text style={[f.label, focused && f.labelFocused]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[f.input, focused && f.inputFocused, error ? f.inputError : null, { outlineWidth: 0 } as any]}
      />
      {error ? <Text style={f.error}>{error}</Text> : null}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.3 },
  labelFocused: { color: Colors.primary },
  input: {
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
  },
  inputFocused: { borderBottomColor: Colors.primary },
  inputError: { borderBottomColor: Colors.error },
  error: { fontSize: 12, color: Colors.error },
});

export default function AdminLoginWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const { adminLogin, isLoading } = useAuthStore();

  const handleLogin = async () => {
    setEmailError(''); setPasswordError(''); setLoginError('');
    let valid = true;
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email'); valid = false; }
    if (!password) { setPasswordError('Password is required'); valid = false; }
    if (!valid) return;

    const result = await adminLogin(email.trim().toLowerCase(), password);
    if (!result.success) setLoginError(result.error ?? 'Invalid admin credentials.');
    // On success the root guard routes straight to the admin dashboard.
  };

  return (
    <View style={s.page}>
      {/* ── Left: photography with floating logo card ── */}
      {isWide && (
        <View style={s.left}>
          <Image source={{ uri: SIDE_IMG }} style={s.leftImg} contentFit="cover" transition={500} />
          <View style={s.leftShade} />
          <View style={s.logoCard}>
            <ECSLogo size="md" variant="dark" />
          </View>
          <View style={s.leftCaption}>
            <Text style={s.leftCaptionTitle}>HTU Cafeteria</Text>
            <Text style={s.leftCaptionSub}>Admin Portal · Expert Catering Services</Text>
          </View>
        </View>
      )}

      {/* ── Right: form panel ── */}
      <View style={[s.right, !isWide && s.rightFull]}>
        <View style={s.panel}>

          {/* Back to landing */}
          <TouchableOpacity style={s.backLink} onPress={() => router.push('/')} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={14} color={Colors.textMuted} />
            <Text style={s.backTxt}>Back to home</Text>
          </TouchableOpacity>

          {/* Tab switcher */}
          <View style={s.tabs}>
            <TouchableOpacity
              onPress={() => setTab('login')}
              style={[s.tabBtn, tab === 'login' && s.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, tab === 'login' && s.tabTxtActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('register')}
              style={[s.tabBtn, tab === 'register' && s.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, tab === 'register' && s.tabTxtActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {tab === 'login' ? (
            <>
              <Text style={s.welcome}>Welcome</Text>
              <Text style={s.welcomeSub}>Please enter your admin details.</Text>

              <View style={s.form}>
                <UnderlineField label="Email" value={email} onChangeText={setEmail} error={emailError} />
                <UnderlineField label="Password" value={password} onChangeText={setPassword} secure error={passwordError} />

                {loginError ? (
                  <View style={s.loginErrorBox}>
                    <Ionicons name="alert-circle" size={15} color={Colors.error} />
                    <Text style={s.loginErrorTxt}>{loginError}</Text>
                  </View>
                ) : null}

                <View style={s.formFooter}>
                  <TouchableOpacity
                    onPress={() => { setEmail('admin@htu.edu.gh'); setPassword('admin123'); }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.demoTxt}>
                      <Ionicons name="flash-outline" size={12} color={Colors.primary} /> Use demo credentials
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.submitBtn, isLoading && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.88}
                  >
                    <Text style={s.submitTxt}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
                    {!isLoading && <Ionicons name="arrow-forward" size={15} color={Colors.white} />}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={s.welcome}>Join the team</Text>
              <Text style={s.welcomeSub}>Admin accounts are created for you — no sign-up form needed.</Text>

              <View style={s.registerCard}>
                <View style={s.registerIcon}>
                  <Ionicons name="people-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={s.registerTitle}>Contact us to get set up</Text>
                <Text style={s.registerBody}>
                  Admin access to the HTU Cafeteria dashboard is provisioned by Expert
                  Catering Services. Reach out and we'll create your account, walk you
                  through the dashboard, and get you managing orders in minutes.
                </Text>

                <View style={s.contactRow}>
                  <Ionicons name="mail-outline" size={16} color={Colors.primary} />
                  <Text style={s.contactTxt}>cafeteria@htu.edu.gh</Text>
                </View>
                <View style={s.contactRow}>
                  <Ionicons name="call-outline" size={16} color={Colors.primary} />
                  <Text style={s.contactTxt}>+233 20 987 6543</Text>
                </View>
                <View style={s.contactRow}>
                  <Ionicons name="location-outline" size={16} color={Colors.primary} />
                  <Text style={s.contactTxt}>Cafeteria Office, HTU Campus, Ho</Text>
                </View>

                <TouchableOpacity
                  style={s.submitBtn}
                  onPress={() => setTab('login')}
                  activeOpacity={0.88}
                >
                  <Text style={s.submitTxt}>Already set up? Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, flexDirection: 'row', backgroundColor: Colors.white, minHeight: '100%' as any },

  // Left photography
  left: { flex: 1.1, position: 'relative', overflow: 'hidden' },
  leftImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  leftShade: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(50,3,22,0.28)',
  },
  logoCard: {
    position: 'absolute', top: '38%', alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24, padding: 18,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 24,
  },
  leftCaption: {
    position: 'absolute', bottom: 36, alignSelf: 'center', alignItems: 'center', gap: 4,
  },
  leftCaptionTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, fontFamily: SERIF },
  leftCaptionSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },

  // Right panel
  right: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  rightFull: { flex: 1 },
  panel: { width: '100%', maxWidth: 400, gap: 10 },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  backTxt: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  // Tabs
  tabs: {
    flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 8,
    marginBottom: 26,
  },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 22 },
  tabBtnActive: {
    backgroundColor: Colors.accent,
    shadowColor: 'rgba(250,166,19,0.4)',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10,
  },
  tabTxt: { fontSize: 13.5, fontWeight: '700', color: Colors.textMuted },
  tabTxtActive: { color: Colors.white },

  welcome: { fontSize: 36, fontWeight: '800', color: Colors.text, fontFamily: SERIF },
  welcomeSub: { fontSize: 13.5, color: Colors.textMuted, marginTop: -2 },

  form: { gap: 22, marginTop: 26 },
  formFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 6,
  },
  demoTxt: { fontSize: 12.5, fontWeight: '600', color: Colors.primary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 26, paddingVertical: 12, borderRadius: 24,
    alignSelf: 'flex-end',
    shadowColor: 'rgba(250,166,19,0.45)',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 14,
  },
  submitTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },

  loginErrorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight ?? '#FDECEC',
    borderRadius: 10, padding: 12,
  },
  loginErrorTxt: { flex: 1, fontSize: 13, color: Colors.error, fontWeight: '600' },

  // Register tab
  registerCard: {
    marginTop: 26, gap: 14,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  registerIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  registerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  registerBody: { fontSize: 13.5, lineHeight: 21, color: Colors.textSecondary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactTxt: { fontSize: 13.5, fontWeight: '600', color: Colors.text },
});
