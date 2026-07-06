// Web-only landing page (replaces the mobile onboarding on web).
// Students are pointed to the APK download; admins log in to the web dashboard.
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { ECSLogo } from '@/components/ECSLogo';

// Point this at your hosted APK (GitHub Releases, Supabase Storage, etc.)
const APK_URL = process.env.EXPO_PUBLIC_APK_URL ?? '';

const IMG = {
  hero:   'https://i.pinimg.com/1200x/22/a6/d3/22a6d392b01182374f572e13f5e45f81.jpg', // jollof spread
  gobe:   'https://i.pinimg.com/1200x/1d/5c/97/1d5c97784ff0d314cfd2500415aab7de.jpg',
  kenkey: 'https://i.pinimg.com/736x/10/b3/e6/10b3e6ebb5be2c1066cc94c80270787f.jpg',
  tilapia:'https://i.pinimg.com/736x/b3/fe/44/b3fe44ddb27dc2783677efad95f6170b.jpg',
};

// Elegant serif for display headings — web-only file, so this is safe.
const SERIF = 'Georgia, "Times New Roman", serif';

/* ── Animation helpers ─────────────────────────────────────── */

// Fade + rise on mount (hero elements), staggered by delay.
function useEntrance(delay: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1, duration: 800, delay,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [v, delay]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  };
}

// Slow Ken Burns zoom loop for the hero photo.
function useKenBurns() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [v]);
  return { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] };
}

// Gentle perpetual float (phone mockup).
function useFloat(distance = 14, duration = 2600) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [v, duration]);
  return v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
}

// Hover lift/scale for buttons & cards (pointer devices).
function Hover({
  children, style, onPress, scaleTo = 1.05, lift = -3,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  scaleTo?: number;
  lift?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const go = (to: number) =>
    Animated.spring(v, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 7 }).start();
  return (
    <Animated.View
      style={{
        transform: [
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, lift] }) },
        ],
      }}
    >
      <TouchableOpacity
        style={style}
        onPress={onPress}
        activeOpacity={0.88}
        {...({ onPointerEnter: () => go(1), onPointerLeave: () => go(0) } as any)}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── "Coming soon" modal ───────────────────────────────────── */

function PulseRing({ delay }: { delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [v, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        m.ring,
        {
          opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
        },
      ]}
    />
  );
}

function ComingSoonModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      backdrop.setValue(0);
      card.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(card, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 9 }),
      ]).start();
      // Little icon wobble loop while open
      const w = Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: -1, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(1400),
        ])
      );
      w.start();
      return () => w.stop();
    }
  }, [visible, backdrop, card, wobble]);

  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(card, { toValue: 0, duration: 180, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[m.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <Animated.View
          style={[
            m.card,
            {
              opacity: card,
              transform: [
                { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
                { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) },
              ],
            },
          ]}
        >
          {/* Close */}
          <TouchableOpacity style={m.closeBtn} onPress={close} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Icon with pulse rings */}
          <View style={m.iconWrap}>
            <PulseRing delay={0} />
            <PulseRing delay={900} />
            <Animated.View
              style={[
                m.iconCircle,
                { transform: [{ rotate: wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] }) }] },
              ]}
            >
              <Ionicons name="logo-android" size={46} color={Colors.white} />
            </Animated.View>
          </View>

          <Text style={m.title}>Coming Soon!</Text>
          <Text style={m.body}>
            We're putting the finishing touches on the HTU Cafeteria Android app.
            Check back shortly — hot jollof is worth the wait. 😉
          </Text>

          <View style={m.hintRow}>
            <Ionicons name="sparkles-outline" size={17} color={Colors.accent} />
            <Text style={m.hintTxt}>Want early access? Ask at the cafeteria office.</Text>
          </View>

          <TouchableOpacity style={m.okBtn} onPress={close} activeOpacity={0.88}>
            <Text style={m.okTxt}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,2,12,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%', maxWidth: 560,
    backgroundColor: Colors.white,
    borderRadius: 30,
    padding: 48, paddingTop: 42,
    alignItems: 'center',
    gap: 16,
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 24 }, shadowOpacity: 1, shadowRadius: 48,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 5,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: { width: 160, height: 130, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2.5, borderColor: Colors.accent,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(250,166,19,0.5)',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20,
  },
  title: { fontSize: 40, fontWeight: '800', color: Colors.text, fontFamily: SERIF },
  body: { fontSize: 16.5, lineHeight: 27, color: Colors.textSecondary, textAlign: 'center', maxWidth: 440 },
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13,
    marginTop: 6,
  },
  hintTxt: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  okBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 56, paddingVertical: 16, borderRadius: 30,
    marginTop: 10,
    shadowColor: 'rgba(250,166,19,0.45)',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 14,
  },
  okTxt: { fontSize: 17, fontWeight: '800', color: Colors.white },
});

/* ── Mini tablet preview — the menu browse screen ──────────── */

function TabletPreview() {
  const cards = [
    { img: IMG.hero,    name: 'Jollof + Chicken', price: '₵35' },
    { img: IMG.gobe,    name: 'Red Red (Gobe)',   price: '₵18' },
    { img: IMG.kenkey,  name: 'Kenkey & Fish',    price: '₵22' },
    { img: IMG.tilapia, name: 'Banku + Tilapia',  price: '₵45' },
  ];
  return (
    <View style={t.frame}>
      <View style={t.camera} />
      <View style={t.screen}>
        {/* Mini menu header */}
        <View style={t.header}>
          <Text style={t.headerTitle}>Menu</Text>
          <Text style={t.headerSub}>What are you craving today?</Text>
          <View style={t.search}>
            <Ionicons name="search-outline" size={9} color="#B9AEB4" />
            <Text style={t.searchTxt}>Search meals, drinks...</Text>
          </View>
        </View>

        {/* Category chips */}
        <View style={t.chips}>
          {['All', 'Rice', 'Soups', 'Drinks'].map((c, i) => (
            <View key={c} style={[t.chip, i === 0 && t.chipActive]}>
              <Text style={[t.chipTxt, i === 0 && t.chipTxtActive]}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Food grid */}
        <View style={t.grid}>
          {cards.map((c) => (
            <View key={c.name} style={t.card}>
              <Image source={{ uri: c.img }} style={t.cardImg} contentFit="cover" />
              <View style={t.cardBody}>
                <Text style={t.cardName} numberOfLines={1}>{c.name}</Text>
                <View style={t.cardRow}>
                  <Text style={t.cardPrice}>{c.price}</Text>
                  <View style={t.addBtn}><Ionicons name="add" size={9} color={Colors.white} /></View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const t = StyleSheet.create({
  frame: {
    width: 366, height: 508,
    borderRadius: 32,
    backgroundColor: '#1C1C1E',
    padding: 13,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 30 }, shadowOpacity: 1, shadowRadius: 56,
  },
  camera: {
    position: 'absolute', top: 6, alignSelf: 'center',
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#3A3A3C', zIndex: 10,
  },
  screen: { flex: 1, borderRadius: 18, backgroundColor: '#FBF8F9', overflow: 'hidden' },

  header: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 3 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 7.5, color: 'rgba(255,255,255,0.7)' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.white, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 5,
  },
  searchTxt: { fontSize: 7.5, color: '#B9AEB4' },

  chips: { flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 9 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4.5, borderRadius: 10,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: '#EFE7EB',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt: { fontSize: 7.5, fontWeight: '700', color: '#8E8290' },
  chipTxtActive: { color: Colors.white },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 12 },
  card: {
    width: '47.8%',
    backgroundColor: Colors.white, borderRadius: 11, overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 6,
  },
  cardImg: { width: '100%', height: 72 },
  cardBody: { padding: 7, gap: 3 },
  cardName: { fontSize: 8, fontWeight: '700', color: Colors.text },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontSize: 9.5, fontWeight: '900', color: Colors.primary },
  addBtn: {
    width: 13, height: 13, borderRadius: 7, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});

/* ── Mini in-phone preview of the mobile app ───────────────── */

function PhonePreview() {
  return (
    <View style={p.frame}>
      <View style={p.notch} />
      <View style={p.screen}>
        {/* Mini header */}
        <View style={p.header}>
          <View style={p.avatar}><Text style={p.avatarTxt}>K</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={p.locLabel}>Location</Text>
            <Text style={p.locName}>📍 Expert Catering, HTU</Text>
          </View>
          <View style={p.bagBtn}><Ionicons name="bag-outline" size={12} color={Colors.primary} /></View>
        </View>

        {/* Promo card */}
        <View style={p.promo}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={p.promoTag}><Text style={p.promoTagTxt}>TODAY'S SPECIAL</Text></View>
            <Text style={p.promoTitle}>Smoky Jollof{'\n'}+ Chicken</Text>
            <Text style={p.promoPrice}>₵35</Text>
          </View>
          <Image source={{ uri: IMG.hero }} style={p.promoImg} contentFit="cover" />
        </View>

        {/* Section label */}
        <Text style={p.sectionLabel}>Hot Right Now 🔥</Text>

        {/* Food cards */}
        <View style={p.cardsRow}>
          {[
            { img: IMG.hero, name: 'Jollof + Chicken', price: '₵35' },
            { img: IMG.gobe, name: 'Red Red (Gobe)', price: '₵18' },
          ].map((c) => (
            <View key={c.name} style={p.card}>
              <Image source={{ uri: c.img }} style={p.cardImg} contentFit="cover" />
              <View style={p.cardBody}>
                <Text style={p.cardName} numberOfLines={1}>{c.name}</Text>
                <View style={p.cardRow}>
                  <Text style={p.cardPrice}>{c.price}</Text>
                  <View style={p.addBtn}><Ionicons name="add" size={10} color={Colors.white} /></View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom tab bar */}
        <View style={p.tabBar}>
          <Ionicons name="home" size={13} color={Colors.primary} />
          <Ionicons name="restaurant-outline" size={13} color="#B9AEB4" />
          <Ionicons name="receipt-outline" size={13} color="#B9AEB4" />
          <Ionicons name="person-outline" size={13} color="#B9AEB4" />
        </View>
      </View>
    </View>
  );
}

const p = StyleSheet.create({
  frame: {
    width: 230, height: 468,
    borderRadius: 36,
    backgroundColor: '#1C1C1E',
    padding: 8,
    shadowColor: 'rgba(0,0,0,0.55)',
    shadowOffset: { width: 0, height: 26 }, shadowOpacity: 1, shadowRadius: 48,
  },
  notch: {
    position: 'absolute', top: 18, alignSelf: 'center',
    width: 74, height: 16, borderRadius: 8, backgroundColor: '#1C1C1E', zIndex: 10,
  },
  screen: { flex: 1, borderRadius: 32, backgroundColor: '#FBF8F9', overflow: 'hidden' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.white, paddingHorizontal: 12, paddingTop: 30, paddingBottom: 10,
  },
  avatar: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 10, fontWeight: '800', color: Colors.white },
  locLabel: { fontSize: 6.5, color: Colors.textMuted },
  locName: { fontSize: 8.5, fontWeight: '700', color: Colors.text },
  bagBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#F4EDF0',
    alignItems: 'center', justifyContent: 'center',
  },

  promo: {
    flexDirection: 'row', margin: 10, borderRadius: 14, overflow: 'hidden',
    backgroundColor: Colors.primary, padding: 10, height: 96,
  },
  promoTag: { alignSelf: 'flex-start', backgroundColor: Colors.accent, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5 },
  promoTagTxt: { fontSize: 5.5, fontWeight: '800', color: Colors.white, letterSpacing: 0.4 },
  promoTitle: { fontSize: 11, fontWeight: '800', color: Colors.white, lineHeight: 14 },
  promoPrice: { fontSize: 13, fontWeight: '900', color: Colors.accent },
  promoImg: { width: 86, height: '100%', borderRadius: 10 },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: Colors.text, paddingHorizontal: 12, marginBottom: 6 },

  cardsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 10 },
  card: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 11, overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 6,
  },
  cardImg: { width: '100%', height: 64 },
  cardBody: { padding: 6, gap: 3 },
  cardName: { fontSize: 8, fontWeight: '700', color: Colors.text },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontSize: 9.5, fontWeight: '900', color: Colors.primary },
  addBtn: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: Colors.white, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0E8EC',
  },
});

/* ── Page ──────────────────────────────────────────────────── */

export default function WebLanding() {
  const router = useRouter();
  const { width, height: winH } = useWindowDimensions();
  const isWide = width >= 900;

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const jumpTo = (key: string) =>
    scrollRef.current?.scrollTo({ y: (sectionY.current[key] ?? 0) - 12, animated: true });

  /* Scroll-triggered reveals */
  const reveals = useRef<Record<string, Animated.Value>>({}).current;
  const fired = useRef<Set<string>>(new Set()).current;
  const getReveal = (key: string) => reveals[key] ?? (reveals[key] = new Animated.Value(0));
  const fire = (key: string) => {
    if (fired.has(key)) return;
    fired.add(key);
    Animated.spring(getReveal(key), { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 5 }).start();
  };
  const checkReveals = (scrollY: number) => {
    for (const [k, y] of Object.entries(sectionY.current)) {
      if (scrollY + winH * 0.88 > y) fire(k);
    }
  };
  const registerSection = (key: string) => (e: any) => {
    sectionY.current[key] = e.nativeEvent.layout.y;
    if (e.nativeEvent.layout.y < winH * 0.88) fire(key);
  };
  // Reveal style: fade + slide from a direction.
  const rev = (key: string, dir: 'up' | 'left' | 'right' = 'up', dist = 52) => {
    const v = getReveal(key);
    const from = dir === 'left' ? -dist : dist;
    return {
      opacity: v,
      transform:
        dir === 'up'
          ? [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dist, 0] }) }]
          : [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
    };
  };

  /* Hero entrance + Ken Burns + phone float */
  const navAnim    = useEntrance(80);
  const kickerAnim = useEntrance(260);
  const titleAnim  = useEntrance(420);
  const subAnim    = useEntrance(580);
  const btnsAnim   = useEntrance(740);
  const kenBurns   = useKenBurns();
  const floatY     = useFloat(16, 2800);
  const floatY2    = useFloat(12, 3400); // tablet drifts on a slower, offset rhythm

  const [comingSoon, setComingSoon] = useState(false);
  const handleDownloadFile = () => {
    if (APK_URL) Linking.openURL(APK_URL);
    else setComingSoon(true);
  };
  const goDownload = () => jumpTo('download');
  const goAdmin = () => router.push('/(auth)/admin-login');

  return (
    <ScrollView
      ref={scrollRef}
      style={s.page}
      contentContainerStyle={s.scroll}
      onScroll={(e) => checkReveals(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >

      {/* ══ HERO — full-bleed photography ══ */}
      <View style={s.heroCard}>
        <Animated.View style={[s.heroBg, kenBurns]}>
          <Image source={{ uri: IMG.hero }} style={{ flex: 1 }} contentFit="cover" transition={600} />
        </Animated.View>
        <View style={s.heroShade} />
        <View style={s.heroShadeLeft} />

        {/* Nav overlaid on the photo */}
        <Animated.View style={[s.nav, s.constrain, navAnim]}>
          <View style={s.brand}>
            <ECSLogo size="sm" variant="light" />
            <View>
              <Text style={s.brandName}>HTU Cafeteria</Text>
              <Text style={s.brandSub}>EXPERT CATERING SERVICES</Text>
            </View>
          </View>
          {isWide && (
            <View style={s.navLinks}>
              <TouchableOpacity onPress={() => jumpTo('featured')} activeOpacity={0.7}>
                <Text style={s.navLink}>Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => jumpTo('how')} activeOpacity={0.7}>
                <Text style={s.navLink}>How it works</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goDownload} activeOpacity={0.7}>
                <Text style={s.navLink}>Download</Text>
              </TouchableOpacity>
            </View>
          )}
          <Hover style={s.navAdminBtn} onPress={goAdmin} scaleTo={1.04} lift={-1}>
            <Text style={s.navAdminTxt}>Login to Admin Dashboard</Text>
          </Hover>
        </Animated.View>

        {/* Headline block — kept aligned to the centered column */}
        <View style={s.constrain}>
          <View style={[s.heroContent, !isWide && s.heroContentSm]}>
            <Animated.Text style={[s.heroKicker, kickerAnim]}>HO TECHNICAL UNIVERSITY</Animated.Text>
            <Animated.Text style={[s.heroTitle, !isWide && s.heroTitleSm, titleAnim]}>
              Campus Meals,{'\n'}Done Right.
            </Animated.Text>
            <Animated.Text style={[s.heroSub, subAnim]}>
              Jollof, waakye, banku & more — order ahead from your phone,{'\n'}
              skip the queue, and pick up fresh from the counter.
            </Animated.Text>
            <Animated.View style={[s.heroBtns, btnsAnim]}>
              <Hover style={s.dlBtn} onPress={goDownload} scaleTo={1.06} lift={-2}>
                <Ionicons name="logo-android" size={18} color={Colors.white} />
                <Text style={s.dlBtnTxt}>Download the App</Text>
              </Hover>
              <TouchableOpacity style={s.ghostBtn} onPress={() => jumpTo('featured')} activeOpacity={0.8}>
                <Text style={s.ghostBtnTxt}>Explore the menu ↓</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* ══ Quick-link strip ══ */}
      <Animated.View
        onLayout={registerSection('quick')}
        style={[s.quickStrip, isWide && s.constrain, !isWide && { flexWrap: 'wrap' }, rev('quick', 'up', 40)]}
      >
        {[
          { icon: 'restaurant-outline' as const, label: 'Menu Highlights', act: () => jumpTo('featured') },
          { icon: 'footsteps-outline' as const,  label: 'How It Works',    act: () => jumpTo('how') },
          { icon: 'logo-android' as const,       label: 'Get the App',     act: goDownload },
          { icon: 'speedometer-outline' as const,label: 'Admin Portal',    act: goAdmin },
        ].map((q) => (
          <View key={q.label} style={{ flex: isWide ? 1 : undefined, minWidth: 150 }}>
            <Hover style={s.quickCard} onPress={q.act} scaleTo={1.03} lift={-5}>
              <Ionicons name={q.icon} size={18} color={Colors.primary} />
              <Text style={s.quickTxt}>{q.label}</Text>
            </Hover>
          </View>
        ))}
      </Animated.View>

      {/* ══ Featured — text left, photo right ══ */}
      <View
        onLayout={registerSection('featured')}
        style={[s.section, isWide && s.constrain]}
      >
        <View style={[isWide ? s.row : s.col, { gap: isWide ? 56 : 28 }]}>
          <Animated.View style={[s.sectionText, isWide && { flex: 1 }, rev('featured', 'left')]}>
            <Text style={s.eyebrow}>THE MENU</Text>
            <Text style={s.h2}>Featured & tasty, straight{'\n'}from the campus kitchen</Text>
            <Text style={s.body}>
              Over 20 dishes prepared fresh daily by Expert Catering Services — smoky jollof,
              hand-pounded fufu with light soup, grilled tilapia with banku, kelewele and more.
              Every plate priced for a student budget, starting from ₵2.
            </Text>
            <View style={s.bulletRow}>
              {['Fresh daily', 'From ₵2', '4.8★ rated'].map((b) => (
                <View key={b} style={s.bullet}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                  <Text style={s.bulletTxt}>{b}</Text>
                </View>
              ))}
            </View>
            <Hover style={s.primaryBtn} onPress={goDownload} scaleTo={1.05} lift={-2}>
              <Text style={s.primaryBtnTxt}>Order on the App</Text>
            </Hover>
          </Animated.View>

          <Animated.View style={[s.photoWrap, isWide && { flex: 1 }, rev('featured', 'right')]}>
            <Image source={{ uri: IMG.kenkey }} style={s.photoTall} contentFit="cover" transition={400} />
            <View style={s.photoTag}>
              <Text style={s.photoTagPrice}>₵22</Text>
              <Text style={s.photoTagName}>Kenkey & Fried Fish</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* ══ How it works — gallery left, steps right ══ */}
      <View onLayout={registerSection('how')} style={s.altBand}>
        <View style={[s.section, isWide && s.constrain]}>
          <View style={[isWide ? s.rowReverse : s.col, { gap: isWide ? 56 : 28 }]}>
            <Animated.View style={[s.sectionText, isWide && { flex: 1 }, rev('how', 'right')]}>
              <Text style={s.eyebrow}>HOW IT WORKS</Text>
              <Text style={s.h2}>Three steps to a{'\n'}hot plate</Text>
              {[
                { n: '01', t: 'Order on the app', d: 'Browse the menu, pick your meal and pickup time, pay with MOMO or cash.' },
                { n: '02', t: 'Kitchen gets to work', d: 'The cafeteria sees your order instantly and starts preparing.' },
                { n: '03', t: 'Pick up & enjoy', d: "You're notified the moment it's ready — walk up, skip the queue, collect." },
              ].map((step) => (
                <View key={step.n} style={s.step}>
                  <Text style={s.stepNum}>{step.n}</Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.stepTitle}>{step.t}</Text>
                    <Text style={s.stepBody}>{step.d}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>

            <Animated.View style={[s.gallery, isWide && { flex: 1 }, rev('how', 'left')]}>
              <View style={s.galleryCol}>
                <Image source={{ uri: IMG.gobe }}    style={s.galleryImgTall}  contentFit="cover" transition={400} />
                <Image source={{ uri: IMG.tilapia }} style={s.galleryImgShort} contentFit="cover" transition={400} />
              </View>
              <View style={s.galleryCol}>
                <Image source={{ uri: IMG.hero }}    style={s.galleryImgShort} contentFit="cover" transition={400} />
                <Image source={{ uri: IMG.kenkey }}  style={s.galleryImgTall}  contentFit="cover" transition={400} />
              </View>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* ══ Download — app preview in a phone, real download button ══ */}
      <View onLayout={registerSection('download')} style={s.dlBand}>
        <View style={s.dlDeco1} />
        <View style={s.dlDeco2} />
        <View style={[s.section, isWide && s.constrain]}>
          <View style={[isWide ? s.row : s.col, { gap: isWide ? 64 : 40, alignItems: 'center' }]}>
            <Animated.View style={[s.sectionText, isWide && { flex: 1 }, rev('download', 'left')]}>
              <Text style={[s.eyebrow, { color: Colors.accent }]}>GET THE APP</Text>
              <Text style={[s.h2, { color: Colors.white }]}>The whole cafeteria,{'\n'}in your pocket</Text>
              <Text style={[s.body, { color: 'rgba(255,255,255,0.85)' }]}>
                Browse the full menu, order ahead, pay with MOMO or cash, and get notified
                the moment your food is ready. Built for HTU students and staff.
              </Text>
              <View style={s.bulletRow}>
                {['Free download', 'Android 8+', 'Light on data'].map((b) => (
                  <View key={b} style={s.bullet}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                    <Text style={[s.bulletTxt, { color: Colors.white }]}>{b}</Text>
                  </View>
                ))}
              </View>
              <Hover style={s.dlRealBtn} onPress={handleDownloadFile} scaleTo={1.06} lift={-2}>
                <Ionicons name="logo-android" size={20} color={Colors.white} />
                <View>
                  <Text style={s.dlRealSub}>Free · direct download</Text>
                  <Text style={s.dlRealTxt}>Download Android APK</Text>
                </View>
              </Hover>
            </Animated.View>

            <Animated.View style={[rev('download', 'right'), isWide && { flex: 1 }, { alignItems: 'center' }]}>
              <View style={s.stage}>
                {/* Tablet stands in back, near-upright, floating on its own rhythm */}
                <Animated.View style={[s.tabletPos, { transform: [{ translateY: floatY2 }, { rotate: '3deg' }] }]}>
                  <TabletPreview />
                </Animated.View>
                {/* Phone in front-left, leaning, overlapping, sitting lower */}
                <Animated.View style={[s.phonePos, { transform: [{ translateY: floatY }, { rotate: '-7deg' }] }]}>
                  <PhonePreview />
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* ══ Footer ══ */}
      <View style={s.footer}>
        <View style={[s.footerInner, isWide && s.constrain, isWide ? s.row : s.col]}>
          <View style={[s.footerCol, isWide && { flex: 1.4 }]}>
            <View style={s.brand}>
              <ECSLogo size="sm" variant="light" />
              <View>
                <Text style={s.brandName}>HTU Cafeteria</Text>
                <Text style={s.brandSub}>EXPERT CATERING SERVICES</Text>
              </View>
            </View>
            <Text style={s.footerBody}>
              Fresh Ghanaian meals for the HTU community —{'\n'}order ahead, skip the queue.
            </Text>
            <View style={s.socialRow}>
              {(['logo-facebook', 'logo-instagram', 'logo-twitter', 'logo-whatsapp'] as const).map((ic) => (
                <View key={ic} style={s.socialDot}>
                  <Ionicons name={ic} size={15} color={Colors.white} />
                </View>
              ))}
            </View>
          </View>

          <View style={[s.footerCol, isWide && { flex: 1 }]}>
            <Text style={s.footerHead}>Students</Text>
            <TouchableOpacity onPress={goDownload} activeOpacity={0.7}>
              <Text style={s.footerLink}>Download the Android app</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => jumpTo('featured')} activeOpacity={0.7}>
              <Text style={s.footerLink}>Menu highlights</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => jumpTo('how')} activeOpacity={0.7}>
              <Text style={s.footerLink}>How it works</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.footerCol, isWide && { flex: 1 }]}>
            <Text style={s.footerHead}>Cafeteria Admins</Text>
            <Text style={s.footerBody}>
              Monitor live orders, update statuses and manage the menu from any browser.
            </Text>
            <Hover style={s.footerAdminBtn} onPress={goAdmin} scaleTo={1.04} lift={-2}>
              <Ionicons name="speedometer-outline" size={16} color={Colors.primary} />
              <Text style={s.footerAdminTxt}>Open Admin Dashboard</Text>
            </Hover>
          </View>
        </View>

        <View style={s.footerRule} />
        <Text style={s.copyright}>
          © {new Date().getFullYear()} Expert Catering Services · Ho Technical University
        </Text>
      </View>

      {/* ── Coming-soon modal ── */}
      <ComingSoonModal visible={comingSoon} onClose={() => setComingSoon(false)} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  scroll: { minHeight: '100%' },
  constrain: { maxWidth: 1140, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowReverse: { flexDirection: 'row-reverse', alignItems: 'center' },
  col: { flexDirection: 'column' },

  // ── Hero — full-bleed, edge to edge ───────────────────────
  heroCard: {
    overflow: 'hidden',
    minHeight: 560,
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark ?? Colors.primary,
  },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroShade: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(28,2,12,0.45)',
  },
  heroShadeLeft: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: '68%',
    backgroundColor: 'rgba(50,3,22,0.45)',
  },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingTop: 22, gap: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandName: { fontSize: 17, fontWeight: '900', color: Colors.white },
  brandSub: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.6 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  navLink: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.92)' },
  navAdminBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22,
  },
  navAdminTxt: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  heroContent: { paddingHorizontal: 48, paddingBottom: 52, paddingTop: 40, gap: 16, maxWidth: 640 },
  heroContentSm: { paddingHorizontal: 24, paddingBottom: 36 },
  heroKicker: { fontSize: 11, fontWeight: '800', color: Colors.accent, letterSpacing: 3 },
  heroTitle: {
    fontSize: 54, lineHeight: 60, color: Colors.white,
    fontFamily: SERIF, fontWeight: '700', letterSpacing: -0.5,
  },
  heroTitleSm: { fontSize: 34, lineHeight: 40 },
  heroSub: { fontSize: 15, lineHeight: 24, color: 'rgba(255,255,255,0.88)' },
  heroBtns: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 8 },
  dlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 26,
    shadowColor: 'rgba(0,0,0,0.35)',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 18,
  },
  dlBtnTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
  ghostBtn: { paddingVertical: 13 },
  ghostBtnTxt: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },

  // ── Quick-link strip ──────────────────────────────────────
  quickStrip: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, marginTop: 24,
  },
  quickCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 10,
  },
  quickTxt: { fontSize: 13, fontWeight: '700', color: Colors.text },

  // ── Sections ──────────────────────────────────────────────
  section: { paddingHorizontal: 24, paddingVertical: 56 },
  sectionText: { gap: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: Colors.secondary ?? Colors.primary, letterSpacing: 3 },
  h2: {
    fontSize: 32, lineHeight: 40, color: Colors.text,
    fontFamily: SERIF, fontWeight: '700',
  },
  body: { fontSize: 14.5, lineHeight: 24, color: Colors.textSecondary, maxWidth: 520 },
  bulletRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 2 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bulletTxt: { fontSize: 13, fontWeight: '700', color: Colors.text },
  primaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 26, marginTop: 8,
  },
  primaryBtnTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },

  photoWrap: { position: 'relative' },
  photoTall: { width: '100%', height: 420, borderRadius: 22 },
  photoTag: {
    position: 'absolute', left: 18, bottom: 18,
    backgroundColor: Colors.white,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 14,
  },
  photoTagPrice: { fontSize: 18, fontWeight: '900', color: Colors.accent },
  photoTagName: { fontSize: 13, fontWeight: '700', color: Colors.text },

  // ── How-it-works band + gallery ───────────────────────────
  altBand: { backgroundColor: Colors.backgroundAlt ?? '#FAF6F8', marginTop: 8 },
  step: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', marginTop: 6 },
  stepNum: {
    fontSize: 22, fontWeight: '900', color: Colors.accent,
    fontFamily: SERIF, width: 40,
  },
  stepTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  stepBody: { fontSize: 13.5, lineHeight: 21, color: Colors.textSecondary },

  gallery: { flexDirection: 'row', gap: 14 },
  galleryCol: { flex: 1, gap: 14 },
  galleryImgTall: { width: '100%', height: 240, borderRadius: 18 },
  galleryImgShort: { width: '100%', height: 160, borderRadius: 18 },

  // ── Download band (phone preview) ─────────────────────────
  dlBand: {
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    marginTop: 8,
  },
  dlDeco1: {
    position: 'absolute', width: 460, height: 460, borderRadius: 230,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -180, right: -140,
  },
  dlDeco2: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -90, left: -70,
  },
  dlRealBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 26, paddingVertical: 14, borderRadius: 18,
    alignSelf: 'flex-start', marginTop: 10,
    shadowColor: 'rgba(0,0,0,0.35)',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20,
  },
  dlRealSub: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  dlRealTxt: { fontSize: 16, fontWeight: '900', color: Colors.white },

  // Device duo — fixed stage; tablet stands in back-right, phone in front-left (lower)
  stage: { width: 500, height: 560, position: 'relative', maxWidth: '100%' },
  tabletPos: { position: 'absolute', right: 0, top: 0, zIndex: 1 },
  phonePos: { position: 'absolute', left: 8, bottom: 0, zIndex: 2 },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingTop: 52, paddingBottom: 26,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
  },
  footerInner: { gap: 36, alignItems: 'flex-start' },
  footerCol: { gap: 14 },
  footerHead: { fontSize: 14, fontWeight: '800', color: Colors.accent, letterSpacing: 0.5 },
  footerBody: { fontSize: 13, lineHeight: 21, color: 'rgba(255,255,255,0.78)' },
  footerLink: { fontSize: 13.5, fontWeight: '600', color: 'rgba(255,255,255,0.92)' },
  footerAdminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 24,
  },
  footerAdminTxt: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  socialDot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  footerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 36, marginBottom: 16 },
  copyright: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
});
