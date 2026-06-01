import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { ECSLogo } from '@/components/ECSLogo';
import { Input } from '@/components/ui/Input';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: 'https://i.pinimg.com/1200x/1d/5c/97/1d5c97784ff0d314cfd2500415aab7de.jpg',
    food: 'Red Red (Gobe)',
    title: "Ghana's Beloved Gobe",
    subtitle: 'Hot beans with sweet fried plantain — the campus classic that hits different every time.',
    bg: Colors.primary,
    light: false,
    isEmailStep: false,
    doubleCircle: false,
  },
  {
    id: '2',
    image: 'https://i.pinimg.com/1200x/22/a6/d3/22a6d392b01182374f572e13f5e45f81.jpg',
    food: 'Jollof Rice',
    title: "Ghana's Famous Jollof",
    subtitle: 'Rich, smoky and perfectly seasoned. Order ahead — no queue, no wait, just flavour.',
    bg: Colors.white,
    light: true,
    isEmailStep: false,
    doubleCircle: true,
  },
  {
    id: '3',
    image: 'https://i.pinimg.com/736x/10/b3/e6/10b3e6ebb5be2c1066cc94c80270787f.jpg',
    food: 'Kenkey & Fish',
    title: 'Taste Pure Tradition',
    subtitle: 'Fermented kenkey with fried fish and pepper — real Ghanaian flavour served fresh daily.',
    bg: Colors.primaryDark,
    light: false,
    isEmailStep: false,
    doubleCircle: false,
  },
  {
    id: '4',
    image: null,
    food: null,
    title: 'One Last Step',
    subtitle: 'Enter your email to start ordering. All your orders and activity will be tied to it.',
    bg: Colors.white,
    light: true,
    isEmailStep: true,
    doubleCircle: false,
  },
] as const;

// Single food circle — slides in from the right, then hovers
function AnimatedFoodImage({ uri, light, isActive }: { uri: string; light: boolean; isActive: boolean }) {
  const translateX = useRef(new Animated.Value(160)).current;
  const scale      = useRef(new Animated.Value(0.86)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const floatY     = useRef(new Animated.Value(0)).current;
  const floatRef   = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      floatRef.current?.stop();
      translateX.setValue(160);
      scale.setValue(0.86);
      opacity.setValue(0);
      floatY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale,      { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      floatRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, { toValue: -9, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatY, { toValue:  0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      floatRef.current.start();
    });
    return () => { floatRef.current?.stop(); };
  }, [isActive]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale }, { translateY: floatY }] }}>
      <View style={[styles.imageRing, light && styles.imageRingLight]}>
        <View style={styles.imageWrap}>
          <Image source={{ uri }} style={styles.foodImage} contentFit="cover" transition={300} />
        </View>
      </View>
    </Animated.View>
  );
}

// Two-circle layout for the jollof slide — large circle from right, small from top-left
function DoubleImageLayout({ uri, isActive }: { uri: string; isActive: boolean }) {
  const bigX   = useRef(new Animated.Value(160)).current;
  const bigOp  = useRef(new Animated.Value(0)).current;
  const bigSc  = useRef(new Animated.Value(0.86)).current;
  const bigFY  = useRef(new Animated.Value(0)).current;

  const smX    = useRef(new Animated.Value(-90)).current;
  const smY    = useRef(new Animated.Value(-70)).current;
  const smOp   = useRef(new Animated.Value(0)).current;
  const smSc   = useRef(new Animated.Value(0.6)).current;

  const floatRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      floatRef.current?.stop();
      bigX.setValue(160); bigOp.setValue(0); bigSc.setValue(0.86); bigFY.setValue(0);
      smX.setValue(-90);  smY.setValue(-70); smOp.setValue(0);  smSc.setValue(0.6);
      return;
    }

    // Large circle slides in from the right
    Animated.parallel([
      Animated.timing(bigOp, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(bigX,  { toValue: 0, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bigSc, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      floatRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bigFY, { toValue: -8, duration: 2100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bigFY, { toValue:  0, duration: 2100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      floatRef.current.start();
    });

    // Small circle slides in from top-left with 200 ms delay
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(smOp, { toValue: 1, duration: 380, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(smX,  { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(smY,  { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(smSc, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    return () => { floatRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={styles.doubleContainer}>
      {/* Large circle — bottom-right of container */}
      <Animated.View style={[styles.bigCirclePos, { opacity: bigOp, transform: [{ translateX: bigX }, { scale: bigSc }, { translateY: bigFY }] }]}>
        <View style={styles.imageRingLight}>
          <View style={styles.imageWrap}>
            <Image source={{ uri }} style={styles.foodImage} contentFit="cover" transition={300} />
          </View>
        </View>
      </Animated.View>

      {/* Small circle — top-left, overlapping */}
      <Animated.View style={[styles.smallCirclePos, { opacity: smOp, transform: [{ translateX: smX }, { translateY: smY }, { scale: smSc }] }]}>
        <View style={styles.smallRing}>
          <View style={styles.smallWrap}>
            <Image source={{ uri }} style={styles.foodImage} contentFit="cover" contentPosition="center" transition={300} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function SlideDecorations({ light }: { light: boolean }) {
  return (
    <>
      <View style={[styles.dF1, { backgroundColor: light ? 'rgba(85,5,39,0.10)' : 'rgba(255,255,255,0.07)' }]} />
      <View style={[styles.dF2, { backgroundColor: light ? 'rgba(85,5,39,0.07)' : 'rgba(255,255,255,0.05)' }]} />
      <View style={[styles.dF3, { backgroundColor: light ? 'rgba(85,5,39,0.06)' : 'rgba(255,255,255,0.04)' }]} />
      <View style={[styles.dR1, { borderColor: light ? 'rgba(85,5,39,0.22)' : 'rgba(255,255,255,0.12)' }]} />
      <View style={[styles.dR2, { borderColor: light ? 'rgba(85,5,39,0.18)' : 'rgba(255,255,255,0.09)' }]} />
      <View style={[styles.dR3, { borderColor: light ? 'rgba(85,5,39,0.14)' : 'rgba(255,255,255,0.06)' }]} />
    </>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { loginWithEmail, isLoading } = useAuthStore();

  const isLastSlide = currentIndex === slides.length - 1;
  const isLight = slides[currentIndex]?.light ?? false;

  const handleNext = async () => {
    if (!isLastSlide) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
      return;
    }
    // Email step — validate and submit
    setEmailError('');
    if (!email.trim()) { setEmailError('Please enter your email address'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email address'); return; }
    // markOnboarded=true sets hasSeenOnboarding atomically with user — avoids nav flash
    await loginWithEmail(email.trim().toLowerCase(), true);
  };

  const handleSkip = () => {
    // Skip to email step
    const lastIdx = slides.length - 1;
    flatListRef.current?.scrollToIndex({ index: lastIdx });
    setCurrentIndex(lastIdx);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!isLastSlide}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <SlideDecorations light={item.light} />
            <SafeAreaView style={styles.slideSafe} edges={['top']}>

              {item.isEmailStep ? (
                /* ── Email step: centred layout, adapts to light/dark bg ── */
                <View style={styles.emailSlide}>
                  <View style={styles.emailHero}>
                    <ECSLogo size="lg" variant={item.light ? 'dark' : 'light'} />
                    <Text style={[styles.emailHeroTitle, item.light && { color: Colors.text }]}>
                      Almost Done!
                    </Text>
                    <Text style={[styles.emailHeroSub, item.light && { color: Colors.textSecondary }]}>
                      Your campus meals, one tap away.
                    </Text>
                    {/* Mini food previews */}
                    <View style={styles.miniRow}>
                      {([slides[0].image, slides[1].image, slides[2].image] as string[]).map((uri, i) => (
                        <View key={i} style={[styles.miniCircle, item.light && styles.miniCircleLight]}>
                          <Image source={{ uri }} style={styles.foodImage} contentFit="cover" />
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Input card */}
                  <View style={[styles.emailSheet, item.light && styles.emailSheetLight]}>
                    <Text style={styles.sheetTitle}>Enter your email</Text>
                    <Text style={styles.sheetSub}>
                      We'll tie your orders and history to it — no password needed.
                    </Text>
                    <Input
                      placeholder="yourname@htu.edu.gh"
                      value={email}
                      onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={emailError}
                      leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
                    />
                    <TouchableOpacity
                      style={styles.demoFill}
                      onPress={() => setEmail('student@htu.edu.gh')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="flash-outline" size={14} color={Colors.primary} />
                      <Text style={styles.demoFillText}>Use demo email</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ── Regular food slides ── */
                <View style={styles.slideContent}>
                  <View style={styles.logoRow}>
                    <ECSLogo size="sm" variant={item.light ? 'dark' : 'light'} />
                    <Text style={[styles.logoSub, item.light && styles.logoSubDark]}>
                      Expert Catering Services
                    </Text>
                  </View>

                  {item.image ? (
                    <>
                      {item.doubleCircle
                        ? <DoubleImageLayout uri={item.image} isActive={index === currentIndex} />
                        : <AnimatedFoodImage uri={item.image} light={item.light} isActive={index === currentIndex} />
                      }
                      <View style={[styles.foodBadge, item.light && styles.foodBadgeLight]}>
                        <Ionicons name="restaurant" size={12} color={item.light ? Colors.primary : Colors.white} />
                        <Text style={[styles.foodBadgeText, item.light && styles.foodBadgeTextLight]}>
                          {item.food}
                        </Text>
                      </View>
                    </>
                  ) : null}

                  <View style={styles.textBlock}>
                    <Text style={[styles.title, item.light && styles.titleDark]}>{item.title}</Text>
                    <Text style={[styles.subtitle, item.light && styles.subtitleDark]}>{item.subtitle}</Text>
                  </View>
                </View>
              )}

            </SafeAreaView>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View style={[
        styles.controls,
        { backgroundColor: slides[currentIndex]?.bg ?? Colors.primary },
        isLight && styles.controlsLight,
      ]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                isLight && styles.dotDark,
                i === currentIndex && (isLight ? styles.dotActiveDark : styles.dotActive),
              ]}
            />
          ))}
        </View>

        <View style={styles.btnRow}>
          {!isLastSlide && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={[styles.skipText, isLight && styles.skipTextDark]}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextBtn, isLight && styles.nextBtnDark, isLastSlide && styles.nextBtnLast]}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={[styles.nextText, isLight && styles.nextTextDark, isLastSlide && styles.nextTextLast]}>
                Loading...
              </Text>
            ) : (
              <>
                <Text style={[styles.nextText, isLight && styles.nextTextDark, isLastSlide && styles.nextTextLast]}>
                  {isLastSlide ? 'Get Started' : 'Next'}
                </Text>
                <Ionicons
                  name={isLastSlide ? 'checkmark' : 'arrow-forward'}
                  size={18}
                  color={isLastSlide ? Colors.white : (isLight ? Colors.white : Colors.primary)}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { width, flex: 1, overflow: 'hidden' },
  slideSafe: { flex: 1 },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 18,
  },

  // Decorative shapes
  dF1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, top: -110, right: -90 },
  dF2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: 60, left: -65 },
  dF3: { position: 'absolute', width: 90, height: 90, borderRadius: 45, top: 80, left: 50 },
  dR1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, top: 30, left: -40 },
  dR2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, bottom: 100, right: 20 },
  dR3: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 1, bottom: 50, right: 80 },

  // Logo
  logoRow: { alignItems: 'center', gap: 8 },
  logoSub: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },
  logoSubDark: { color: Colors.primary },

  // Food image
  imageRing: {
    width: 228, height: 228, borderRadius: 114,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 18,
  },
  imageRingLight: {
    width: 228, height: 228, borderRadius: 114,
    borderWidth: 2, borderColor: 'rgba(85,5,39,0.18)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(85,5,39,0.25)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1, shadowRadius: 22, elevation: 18,
  },
  imageWrap: { width: 210, height: 210, borderRadius: 105, overflow: 'hidden' },
  foodImage: { width: '100%', height: '100%' },

  // Double-circle layout (jollof slide)
  doubleContainer: { width: 260, height: 260 },
  bigCirclePos: { position: 'absolute', bottom: 0, right: 0 },
  smallCirclePos: { position: 'absolute', top: 0, left: 0, zIndex: 10 },
  smallRing: {
    width: 112, height: 112, borderRadius: 56,
    borderWidth: 3, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.22)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 12,
    backgroundColor: Colors.white,
  },
  smallWrap: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },

  // Food badge
  foodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  foodBadgeLight: { backgroundColor: 'rgba(85,5,39,0.08)', borderColor: 'rgba(85,5,39,0.2)' },
  foodBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  foodBadgeTextLight: { color: Colors.primary },

  // Text
  textBlock: { alignItems: 'center', gap: 10 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.white, textAlign: 'center', letterSpacing: -0.5 },
  titleDark: { color: Colors.text },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 21 },
  subtitleDark: { color: Colors.textSecondary },

  // Bottom controls
  controls: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 18, gap: 18 },
  controlsLight: { borderTopWidth: 1, borderTopColor: Colors.border },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotDark: { backgroundColor: 'rgba(85,5,39,0.2)' },
  dotActive: { width: 24, backgroundColor: Colors.white },
  dotActiveDark: { width: 24, backgroundColor: Colors.primary },

  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  skipBtn: { padding: 8 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
  skipTextDark: { color: Colors.primary },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 25,
  },
  nextBtnDark: { backgroundColor: Colors.primary },
  nextBtnLast: { backgroundColor: Colors.accent, flex: 1, justifyContent: 'center' },
  nextText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  nextTextDark: { color: Colors.white },
  nextTextLast: { color: Colors.white },

  // Email step — split layout
  emailSlide: { flex: 1 },
  emailHero: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, gap: 14,
  },
  emailHeroTitle: {
    fontSize: 28, fontWeight: '800', color: Colors.white,
    letterSpacing: -0.5, textAlign: 'center',
  },
  emailHeroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 20,
  },
  miniRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 6 },
  miniCircle: {
    width: 70, height: 70, borderRadius: 35, overflow: 'hidden',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.45)',
    elevation: 8,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 8,
  },
  miniCircleLight: { borderColor: 'rgba(85,5,39,0.25)' },
  emailSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 28, paddingBottom: 12, gap: 12,
  },
  emailSheetLight: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: 'rgba(85,5,39,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sheetSub: {
    fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: -4,
  },
  demoFill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  demoFillText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});
