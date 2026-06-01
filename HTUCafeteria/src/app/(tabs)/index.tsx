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
import { menuItems } from '@/constants/data';
import type { MenuItem } from '@/constants/data';

const { width } = Dimensions.get('window');
const SLIDE_W   = width - 40;

// ── Promo slides ──────────────────────────────────────────────────────────────
const promos = [
  {
    id: '1', tag: "TODAY'S SPECIAL",
    title: "Ghana's Beloved\nGobe & Plantain", price: '₵18',
    image: 'https://i.pinimg.com/1200x/1d/5c/97/1d5c97784ff0d314cfd2500415aab7de.jpg',
    bg: '#1A1A1A',
  },
  {
    id: '2', tag: 'MOST ORDERED',
    title: 'Smoky Jollof Rice\n+ Chicken', price: '₵35',
    image: 'https://i.pinimg.com/1200x/22/a6/d3/22a6d392b01182374f572e13f5e45f81.jpg',
    bg: '#1C0A05',
  },
  {
    id: '3', tag: 'TRADITIONAL PICK',
    title: 'Classic Kenkey\n& Fried Fish', price: '₵22',
    image: 'https://i.pinimg.com/736x/10/b3/e6/10b3e6ebb5be2c1066cc94c80270787f.jpg',
    bg: '#0F0A1A',
  },
];

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

// ── Big food card (reference style) ──────────────────────────────────────────
function BigCard({
  item, onPress, onAdd,
}: { item: MenuItem; onPress: () => void; onAdd: () => void }) {
  return (
    <TouchableOpacity style={bc.card} onPress={onPress} activeOpacity={0.92}>
      <Image source={{ uri: item.image }} style={bc.img} contentFit="cover" transition={300} />

      {/* Rating badge */}
      <View style={bc.ratingBadge}>
        <Ionicons name="star" size={11} color="#FFB800" />
        <Text style={bc.ratingTxt}>{item.rating.toFixed(1)}</Text>
      </View>

      {/* Heart */}
      <View style={bc.heart}>
        <Ionicons name="heart-outline" size={16} color={Colors.white} />
      </View>

      {/* Bottom info */}
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

      {/* Add button */}
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

  const popular  = menuItems.filter((m) => m.isPopular);
  const featured = menuItems.filter((m) => m.isFeatured);

  const hotItems = catId === 'all'
    ? [...featured, ...popular].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i).slice(0, 8)
    : menuItems.filter(m => m.category === (CAT_MAP[catId] ?? '')).slice(0, 8);

  // Auto-scroll promo
  useEffect(() => {
    const t = setInterval(() => {
      setPromoIdx((prev) => {
        const next = (prev + 1) % promos.length;
        promoRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.hDeco1} />
          <View style={s.hDeco2} />

          <View style={s.topRow}>
            {/* Left: avatar initial */}
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{firstName[0]?.toUpperCase() ?? 'U'}</Text>
            </View>

            {/* Center: location */}
            <View style={s.locBlock}>
              <Text style={s.locLabel}>Location</Text>
              <View style={s.locRow}>
                <Ionicons name="location-sharp" size={13} color={Colors.accent} />
                <Text style={s.locName}>Expert Catering, HTU</Text>
              </View>
            </View>

            {/* Right: icons */}
            <View style={s.icons}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(tabs)/notifications')} activeOpacity={0.8}>
                <Ionicons name="notifications-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/cart')} activeOpacity={0.8}>
                <Ionicons name="bag-outline" size={20} color={Colors.white} />
                {totalItems() > 0 && (
                  <View style={s.cartBadge}><Text style={s.cartBadgeTxt}>{totalItems()}</Text></View>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* ── Promo Carousel ───────────────────────────────────────────── */}
        <View style={s.carouselWrap}>
          <FlatList
            ref={promoRef}
            data={promos}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p.id}
            onMomentumScrollEnd={(e) =>
              setPromoIdx(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W))
            }
            renderItem={({ item: p }) => (
              <View style={[s.promoCard, { backgroundColor: p.bg, width: SLIDE_W }]}>
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
                  <Text style={s.promoTitle}>{p.title}</Text>
                  <View style={s.promoBottom}>
                    <Text style={s.promoPrice}>{p.price}</Text>
                    <TouchableOpacity style={s.promoBtn} onPress={() => router.push('/(tabs)/menu')} activeOpacity={0.85}>
                      <Text style={s.promoBtnTxt}>Order Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
          <View style={s.dots}>
            {promos.map((_, i) => (
              <View key={i} style={[s.dot, i === promoIdx && s.dotActive]} />
            ))}
          </View>
        </View>

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
                  {/* Circle food image */}
                  <View style={[s.catImgWrap, active && s.catImgWrapActive]}>
                    <Image source={{ uri: cat.img }} style={s.catImg} contentFit="cover" transition={200} />
                  </View>
                  {/* Label — always visible, color changes */}
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
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20,
    overflow: 'hidden',
  },
  hDeco1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -90, right: -50,
  },
  hDeco2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 8, left: 40,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },
  locBlock:  { flex: 1 },
  locLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  locRow:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  locName:   { fontSize: 13, fontWeight: '700', color: Colors.white },
  icons:     { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.accent, borderRadius: 8,
    minWidth: 15, height: 15, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeTxt: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 14, elevation: 6,
  },

  // Promo carousel
  carouselWrap: { marginTop: -20, paddingHorizontal: 20, marginBottom: 6 },
  promoCard: {
    borderRadius: 20, flexDirection: 'row',
    height: 155, overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 16, elevation: 12,
  },
  promoText:   { flex: 1, padding: 18, justifyContent: 'space-between', zIndex: 1 },
  promoTag:    {
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
  promoImgWrap: { width: 140, position: 'relative' },
  promoImg:     { width: '100%', height: '100%' },
  promoImgFade: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 40,
    backgroundColor: 'transparent',
  },
  dots:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 20, backgroundColor: Colors.primary },

  // Sections
  section:    { marginTop: 26 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, paddingHorizontal: 20, marginBottom: 14 },
  seeAll:       { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // Categories with food images
  catsRow: { paddingHorizontal: 20, gap: 10 },

  // Inactive chip: image circle + gray label side by side, no bg
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 28,
  },
  // Active chip: same layout wrapped in a red pill with shadow
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

  // Image circle inside chip
  catImgWrap: {
    width: 42, height: 42, borderRadius: 21,
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

  // Hot list
  hotList:  { paddingHorizontal: 20, gap: 14 },

  // Most Loved vertical
  vertList: { paddingHorizontal: 20, gap: 10 },
});
