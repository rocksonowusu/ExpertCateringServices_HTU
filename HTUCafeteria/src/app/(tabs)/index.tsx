import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FoodCard } from '@/components/FoodCard';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useMenuStore } from '@/store/menuStore';
import { menuItems } from '@/constants/data';
import type { MenuItem } from '@/constants/data';

const { width } = Dimensions.get('window');
const SLIDE_W = width - 40;

// Promo banner slides are built at runtime from the menu's "Today's Special"
// (isFeatured) items — see buildPromoSlides() inside HomeScreen.
const PROMO_BGS = [Colors.primary, Colors.primaryDark, Colors.secondary];

// ── Categories with a real food image each ────────────────────────────────────
const CATS = [
  { id: 'all',       label: 'All',       img: menuItems[0]?.image ?? '' },
  { id: 'rice',      label: 'Rice',      img: menuItems.find(m => m.category === 'Rice Dishes')?.image     ?? '' },
  { id: 'soups',     label: 'Soups',     img: menuItems.find(m => m.category === 'Soups & Stews')?.image   ?? '' },
  { id: 'fastfood',  label: 'Fast Food', img: menuItems.find(m => m.category === 'Fast Food')?.image       ?? '' },
  { id: 'snacks',    label: 'Snacks',    img: menuItems.find(m => m.category === 'Snacks')?.image          ?? '' },
  { id: 'drinks',    label: 'Drinks',    img: menuItems.find(m => m.category === 'Drinks')?.image          ?? '' },
  { id: 'breakfast', label: 'Breakfast', img: menuItems.find(m => m.category === 'Breakfast')?.image       ?? '' },
];

const CAT_MAP: Record<string, string> = {
  rice: 'Rice Dishes', soups: 'Soups & Stews', fastfood: 'Fast Food',
  snacks: 'Snacks', drinks: 'Drinks', breakfast: 'Breakfast',
};

// ── Big food card ─────────────────────────────────────────────────────────────
function BigCard({
  item, onPress, onAdd,
}: { item: MenuItem; onPress: () => void; onAdd: () => void }) {
  return (
    <TouchableOpacity style={bc.card} onPress={onPress} activeOpacity={0.92}>
      <Image source={{ uri: item.image }} style={bc.img} contentFit="cover" transition={300} />

      <View style={bc.ratingBadge}>
        <Ionicons name="star" size={11} color="#FFB800" />
        <Text style={bc.ratingTxt}>{item.rating.toFixed(1)}</Text>
      </View>

      <View style={bc.heart}>
        <Ionicons name="heart-outline" size={16} color={Colors.white} />
      </View>

      <View style={bc.footer}>
        <View style={bc.nameRow}>
          <Text style={bc.name} numberOfLines={1}>{item.name}</Text>
          <Text style={bc.price}>₵{item.price}</Text>
        </View>
        <View style={bc.metaRow}>
          <Ionicons name="bag-outline" size={11} color={Colors.accent} />
          <Text style={bc.meta}>Free pickup</Text>
          <Text style={bc.dot}>·</Text>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={bc.meta}>{item.prepTime}</Text>
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={bc.tags}>
            {item.tags.slice(0, 3).map((t) => (
              <View key={t} style={bc.tag}>
                <Text style={bc.tagTxt}>{t.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={bc.addBtn} onPress={onAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color={Colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const bc = StyleSheet.create({
  card: {
    width: 210, height: 240, borderRadius: 20,
    overflow: 'hidden', backgroundColor: Colors.card,
    shadowColor: 'rgba(0,0,0,0.16)',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 14, elevation: 8,
  },
  img: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ratingBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 3,
  },
  ratingTxt: { fontSize: 11, fontWeight: '700', color: Colors.text },
  heart: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 12, gap: 5,
  },
  nameRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:     { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
  price:    { fontSize: 15, fontWeight: '800', color: Colors.primary, marginLeft: 6 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta:     { fontSize: 10, color: Colors.textMuted },
  dot:      { fontSize: 10, color: Colors.textMuted },
  tags:     { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  tag:      { backgroundColor: Colors.backgroundAlt, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt:   { fontSize: 9, fontWeight: '700', color: Colors.textSecondary },
  addBtn: {
    position: 'absolute', right: 10, bottom: 80,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { addItem, totalItems } = useCartStore();

  const [promoIdx, setPromoIdx] = useState(0);
  const [catId,    setCatId]    = useState('all');
  const promoRef = useRef<FlatList>(null);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const allItems = useMenuStore((s) => s.items).filter((m) => m.isAvailable);
  const popular  = allItems.filter((m) => m.isPopular);
  const featured = allItems.filter((m) => m.isFeatured);

  // Banner = today's specials from the backend; fall back to popular dishes.
  const promoSource = featured.length ? featured : popular;
  const promoSlides = promoSource.slice(0, 5).map((item, i) => ({
    id: item.id,
    tag: item.isFeatured ? "TODAY'S SPECIAL" : 'MOST ORDERED',
    title: item.name,
    price: `₵${item.price}`,
    image: item.image,
    bg: PROMO_BGS[i % PROMO_BGS.length],
  }));

  const hotItems = catId === 'all'
    ? [...featured, ...popular].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i).slice(0, 8)
    : allItems.filter(m => m.category === (CAT_MAP[catId] ?? '')).slice(0, 8);

  useEffect(() => {
    if (promoSlides.length <= 1) return;
    const t = setInterval(() => {
      setPromoIdx((prev) => {
        const next = (prev + 1) % promoSlides.length;
        promoRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3800);
    return () => clearInterval(t);
  }, [promoSlides.length]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Rich maroon header ───────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.hDeco1} />
          <View style={s.hDeco2} />

          <View style={s.headerTop}>
            <TouchableOpacity style={s.avatar} activeOpacity={0.85} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={s.avatarTxt}>{firstName[0]?.toUpperCase() ?? 'U'}</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.greeting}>{greeting} 👋</Text>
              <Text style={s.nameTxt} numberOfLines={1}>{firstName}</Text>
            </View>

            <View style={s.icons}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(tabs)/notifications')} activeOpacity={0.8}>
                <Ionicons name="notifications-outline" size={20} color={Colors.white} />
                <View style={s.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/cart')} activeOpacity={0.8}>
                <Ionicons name="bag-outline" size={20} color={Colors.white} />
                {totalItems() > 0 && (
                  <View style={s.cartBadge}>
                    <Text style={s.cartBadgeTxt}>{totalItems()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.locRow}>
            <Ionicons name="location-sharp" size={13} color={Colors.accent} />
            <Text style={s.locName}>Expert Catering, HTU</Text>
            <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.6)" />
          </View>

          <TouchableOpacity style={s.searchBar} activeOpacity={0.9} onPress={() => router.push('/(tabs)/menu')}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <Text style={s.searchPlaceholder}>Search meals, drinks…</Text>
            <View style={s.searchIconBtn}>
              <Ionicons name="options-outline" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Promo Carousel (Today's Special, from backend) ───────────── */}
        {promoSlides.length > 0 && (
          <View style={s.carouselWrap}>
            <FlatList
              ref={promoRef}
              data={promoSlides}
              horizontal pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              onMomentumScrollEnd={(e) =>
                setPromoIdx(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W))
              }
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => router.push(`/food/${p.id}`)}
                  style={[s.promoCard, { backgroundColor: p.bg, width: SLIDE_W }]}
                >
                  {/* Decorative blobs */}
                  <View style={s.promoDeco1} />
                  <View style={s.promoDeco2} />

                  {/* Image right side */}
                  <View style={s.promoImgWrap}>
                    <Image source={{ uri: p.image }} style={s.promoImg} contentFit="cover" transition={300} />
                    <View style={s.promoImgFade} />
                  </View>

                  {/* Text left */}
                  <View style={s.promoText}>
                    <View style={s.promoTag}>
                      <Text style={s.promoTagTxt}>{p.tag}</Text>
                    </View>
                    <Text style={s.promoTitle} numberOfLines={2}>{p.title}</Text>
                    <View style={s.promoBottom}>
                      <Text style={s.promoPrice}>{p.price}</Text>
                      <TouchableOpacity
                        style={s.promoBtn}
                        onPress={() => router.push(`/food/${p.id}`)}
                        activeOpacity={0.85}
                      >
                        <Text style={s.promoBtnTxt}>Order Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Dot indicators */}
            {promoSlides.length > 1 && (
              <View style={s.dots}>
                {promoSlides.map((_, i) => (
                  <View key={i} style={[s.dot, i === promoIdx && s.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Select by Category ───────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsRow}>
            {CATS.map((cat) => {
              const active = catId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, active && s.catChipActive]}
                  onPress={() => setCatId(cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={[s.catImgWrap, active && s.catImgWrapActive]}>
                    <Image source={{ uri: cat.img }} style={s.catImg} contentFit="cover" transition={200} />
                  </View>
                  <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Hot Right Now ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>
              {catId === 'all' ? 'Hot Right Now 🔥' : `${CATS.find(c => c.id === catId)?.label ?? ''} Dishes`}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu')} activeOpacity={0.7}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={hotItems}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.hotList}
            renderItem={({ item }) => (
              <BigCard
                item={item}
                onPress={() => router.push(`/food/${item.id}`)}
                onAdd={() => addItem(item)}
              />
            )}
          />
        </View>

        {/* ── Most Loved ────────────────────────────────────────────────── */}
        <View style={[s.section, { paddingBottom: 8 }]}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Most Loved 💛</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu')} activeOpacity={0.7}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={s.vertList}>
            {popular.slice(0, 4).map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/food/${item.id}`)}
                onAddToCart={() => addItem(item)}
                horizontal
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.primary },
  scrollView: { flex: 1, backgroundColor: Colors.backgroundAlt },
  scroll:     { paddingBottom: 24 },

  // ── Rich maroon header ──────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
    gap: 16,
    overflow: 'hidden',
  },
  hDeco1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -40,
  },
  hDeco2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)', top: 44, left: -50,
  },

  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 18, fontWeight: '800', color: Colors.white },
  greeting: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  nameTxt:  { fontSize: 19, fontWeight: '800', color: Colors.white, marginTop: 1 },

  icons: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 10, right: 11,
    width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent,
    borderWidth: 1, borderColor: Colors.primary,
  },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.accent, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  cartBadgeTxt: { color: Colors.white, fontSize: 9, fontWeight: '800' },

  locRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  locName: { fontSize: 12.5, fontWeight: '700', color: Colors.white },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 16,
    paddingLeft: 14, paddingRight: 6, paddingVertical: 6,
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 14, elevation: 6,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: Colors.textMuted, paddingVertical: 8 },
  searchIconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Promo carousel (lifts off the header) ───────────────────────────────────
  carouselWrap: { paddingHorizontal: 20, marginTop: -18, marginBottom: 4, zIndex: 2 },

  promoCard: {
    borderRadius: 22,
    flexDirection: 'row',
    height: 160,
    overflow: 'hidden',
    shadowColor: 'rgba(85,5,39,0.35)',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 20, elevation: 14,
  },

  // Subtle decorative blobs inside the card
  promoDeco1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -30,
  },
  promoDeco2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 50,
  },

  promoText:   { flex: 1, padding: 18, justifyContent: 'space-between', zIndex: 1 },
  promoTag: {
    alignSelf: 'flex-start', backgroundColor: Colors.accent,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  promoTagTxt: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.8 },
  promoTitle:  { fontSize: 17, fontWeight: '800', color: Colors.white, lineHeight: 24 },
  promoBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promoPrice:  { fontSize: 22, fontWeight: '900', color: Colors.accent },
  promoBtn: {
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  promoBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  promoImgWrap: { width: 145, position: 'relative' },
  promoImg:     { width: '100%', height: '100%' },
  promoImgFade: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 36,
    backgroundColor: 'transparent',
  },

  // Dot indicators
  dots:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 22, borderRadius: 3, backgroundColor: Colors.primary },

  // ── Sections ────────────────────────────────────────────────────────────────
  section:    { marginTop: 26 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, paddingHorizontal: 20, marginBottom: 14 },
  seeAll:       { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // ── Category chips ──────────────────────────────────────────────────────────
  catsRow: { paddingHorizontal: 20, gap: 10 },

  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 28,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    paddingLeft: 5,
    paddingRight: 14,
    shadowColor: 'rgba(85,5,39,0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },

  catImgWrap: {
    width: 44, height: 44, borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.border,
  },
  catImgWrapActive: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  catImg: { width: '100%', height: '100%' },

  catLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
  },
  catLabelActive: {
    color: Colors.white, fontWeight: '800',
  },

  // ── Lists ────────────────────────────────────────────────────────────────────
  hotList:  { paddingHorizontal: 20, gap: 14 },
  vertList: { paddingHorizontal: 20, gap: 10 },
});
