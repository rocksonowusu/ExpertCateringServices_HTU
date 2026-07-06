import { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cartStore';
import { useMenuStore } from '@/store/menuStore';

const { height } = Dimensions.get('window');
const HERO_H    = height * 0.42;
const CARD_PULL = 28;

export default function FoodDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { addItem } = useCartStore();

  const item = useMenuStore((s) => s.items).find((m) => m.id === id);
  const [qty,   setQty]   = useState(1);
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);

  if (!item) {
    return (
      <View style={s.notFound}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={s.notFoundTxt}>Item not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkTxt}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleAddToCart() {
    addItem(item!, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleOrderNow() {
    addItem(item!, qty);
    router.push('/checkout');
  }

  return (
    <View style={s.root}>

      {/* ── Hero image ─────────────────────────────────────── */}
      <View style={[s.hero, { height: HERO_H }]}>
        <Image source={{ uri: item.image }} style={s.heroImg} contentFit="cover" transition={300} />
        {/* Bottom fade into white card */}
        <View style={s.heroFade} />

        {/* Top controls — sit above the fold */}
        <View style={[s.topBar, { marginTop: insets.top + 6 }]}>
          <TouchableOpacity style={s.ctrl} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={s.heroTitle} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity style={s.ctrl} onPress={() => setLiked(v => !v)} activeOpacity={0.85}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? Colors.accent : Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Availability banner */}
        {!item.isAvailable && (
          <View style={s.unavailOverlay}>
            <Text style={s.unavailTxt}>Currently Unavailable</Text>
          </View>
        )}
      </View>

      {/* ── White card ─────────────────────────────────────── */}
      <View style={[s.card, { marginTop: -CARD_PULL }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Pill handle */}
          <View style={s.handle} />

          {/* Price + name */}
          <View style={s.nameRow}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.price}>₵{item.price}</Text>
          </View>

          {/* Category label */}
          <Text style={s.category}>{item.category}</Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statPill}>
              <Ionicons name="star" size={13} color={Colors.accent} />
              <Text style={s.statTxt}>{item.rating.toFixed(1)}</Text>
              <Text style={s.statSub}>({item.reviewCount})</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statPill}>
              <Ionicons name="time-outline" size={13} color={Colors.primary} />
              <Text style={s.statTxt}>{item.prepTime}</Text>
            </View>
            {item.calories != null && (
              <>
                <View style={s.statDivider} />
                <View style={s.statPill}>
                  <Ionicons name="flame-outline" size={13} color={Colors.primary} />
                  <Text style={s.statTxt}>{item.calories} kcal</Text>
                </View>
              </>
            )}
          </View>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={s.tags}>
              {item.tags.map((t) => (
                <View key={t} style={s.tag}>
                  <Text style={s.tagTxt}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Description</Text>
            <Text style={s.desc}>{item.description}</Text>
          </View>

          {/* Info note */}
          <View style={s.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={s.infoNoteTxt}>
              Freshly prepared daily. Notify staff of any dietary requirements.
            </Text>
          </View>
        </ScrollView>

        {/* ── Bottom bar ─────────────────────────────────── */}
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.actionRow}>
            <View style={s.qtyWrap}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))} activeOpacity={0.8}>
                <Ionicons name="remove" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={s.qtyTxt}>{qty}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => q + 1)} activeOpacity={0.8}>
                <Ionicons name="add" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.cartBtn, added && s.cartBtnAdded, !item.isAvailable && s.addBtnOff]}
              onPress={handleAddToCart}
              disabled={!item.isAvailable}
              activeOpacity={0.85}
            >
              <Ionicons
                name={added ? 'checkmark-circle' : 'bag-add-outline'}
                size={18}
                color={added ? Colors.white : Colors.primary}
              />
              <Text style={[s.cartBtnTxt, added && s.cartBtnTxtAdded]}>
                {added ? 'Added to Cart ✓' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.orderBtn, !item.isAvailable && s.addBtnOff]}
            onPress={handleOrderNow}
            disabled={!item.isAvailable}
            activeOpacity={0.88}
          >
            <Ionicons name="flash-outline" size={18} color={Colors.white} />
            <Text style={s.orderBtnTxt}>Order Now  ₵{(item.price * qty).toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryDark },

  // Hero
  hero:     { width: '100%' },
  heroImg:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroFade: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
    backgroundColor: Colors.white,
    opacity: 0,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, gap: 12,
  },
  ctrl: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 15, fontWeight: '700', color: Colors.white,
  },
  unavailOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  unavailTxt: { fontSize: 18, fontWeight: '700', color: Colors.white },

  // White card
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scroll: { paddingHorizontal: 24, paddingBottom: 12 },

  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 20,
  },

  // Name + price
  nameRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 12, marginBottom: 4,
  },
  name:  { flex: 1, fontSize: 21, fontWeight: '800', color: Colors.text, lineHeight: 26 },
  price: { fontSize: 24, fontWeight: '900', color: Colors.primary },

  category: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14, padding: 12, gap: 10, marginBottom: 16,
  },
  statPill:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTxt:     { fontSize: 13, fontWeight: '700', color: Colors.text },
  statSub:     { fontSize: 11, color: Colors.textMuted },
  statDivider: { width: 1, height: 16, backgroundColor: Colors.border },

  // Tags
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag:  { backgroundColor: Colors.backgroundAlt, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  // Description
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  desc:         { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Info note
  infoNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.backgroundAlt, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  infoNoteTxt: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // Bottom bar
  bottomBar: {
    gap: 10,
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 40, height: 48,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.backgroundAlt,
  },
  qtyTxt: {
    width: 38, textAlign: 'center',
    fontSize: 16, fontWeight: '800', color: Colors.text,
  },
  cartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  cartBtnAdded: { backgroundColor: Colors.success, borderColor: Colors.success },
  cartBtnTxt: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  cartBtnTxtAdded: { color: Colors.white },
  orderBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14,
    backgroundColor: Colors.primary,
    shadowColor: 'rgba(85,5,39,0.3)',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 6,
  },
  addBtnOff: { backgroundColor: Colors.textMuted, borderColor: Colors.textMuted, shadowOpacity: 0, elevation: 0 },
  orderBtnTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },

  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.background },
  notFoundTxt: { fontSize: 18, fontWeight: '700', color: Colors.text },
  backLink:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10 },
  backLinkTxt: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
});
