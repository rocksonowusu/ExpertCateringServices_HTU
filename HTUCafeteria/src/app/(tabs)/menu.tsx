import { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cartStore';
import { useMenuStore } from '@/store/menuStore';
import type { MenuItem } from '@/constants/data';

const { width } = Dimensions.get('window');
const CARD_W = (width - 16 * 2 - 12) / 2;

function GridCard({ item, onPress, onAdd }: { item: MenuItem; onPress: () => void; onAdd: () => void }) {
  return (
    <TouchableOpacity style={gc.card} onPress={onPress} activeOpacity={0.88}>
      <View style={gc.imgWrap}>
        <Image source={{ uri: item.image }} style={gc.img} contentFit="cover" transition={250} />
        {item.isPopular && (
          <View style={gc.badge}>
            <Text style={gc.badgeTxt}>Popular</Text>
          </View>
        )}
        <TouchableOpacity style={gc.heartBtn} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={gc.body}>
        <Text style={gc.name} numberOfLines={2}>{item.name}</Text>
        <View style={gc.ratingRow}>
          <Ionicons name="star" size={11} color={Colors.accent} />
          <Text style={gc.ratingTxt}>{item.rating.toFixed(1)}</Text>
          <Text style={gc.dot}>·</Text>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={gc.timeTxt}>{item.prepTime}</Text>
        </View>
        <View style={gc.priceRow}>
          <Text style={gc.price}>₵{item.price}</Text>
          <TouchableOpacity style={gc.addBtn} onPress={onAdd} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const gc = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  imgWrap: { width: '100%', height: 130, position: 'relative' },
  img:     { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.accent,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: Colors.white },
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 10, gap: 4 },
  name: { fontSize: 13, fontWeight: '700', color: Colors.text, lineHeight: 17 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 11, fontWeight: '700', color: Colors.text },
  dot:       { fontSize: 11, color: Colors.textMuted },
  timeTxt:   { fontSize: 11, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price:    { fontSize: 15, fontWeight: '800', color: Colors.primary },
  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});

export default function MenuScreen() {
  const router = useRouter();
  const { addItem, totalItems } = useCartStore();
  const allItems = useMenuStore((s) => s.items);
  const loadMenu = useMenuStore((s) => s.loadMenu);
  const [search, setSearch]   = useState('');

  // Refresh the menu each time the tab is focused (picks up admin availability changes).
  useFocusEffect(useCallback(() => { loadMenu(); }, [loadMenu]));

  const filtered = allItems.filter((item) =>
    item.isAvailable &&
    (item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Rich header ──────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.hDeco1} />
        <View style={styles.hDeco2} />

        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Menu</Text>
            <Text style={styles.headerSub}>What are you craving today?</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/cart')}
            style={styles.cartBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-outline" size={22} color={Colors.white} />
            {totalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar inside header */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search meals, drinks..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Results count ─────────────────────────────────── */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </Text>
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Text style={styles.clearSearch}>Clear search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Items grid ────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySub}>Try a different search or category</Text>
          </View>
        }
        renderItem={({ item }) => (
          <GridCard
            item={item}
            onPress={() => router.push(`/food/${item.id}`)}
            onAdd={() => addItem(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
    overflow: 'hidden',
    gap: 14,
  },
  hDeco1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -40,
  },
  hDeco2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 60,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  cartBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.accent, borderRadius: 7,
    minWidth: 14, height: 14, paddingHorizontal: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: Colors.white, fontSize: 8, fontWeight: '800' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },

  // Results
  resultsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  resultsText:  { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  clearSearch:  { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  // Grid list
  row:  { paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  list: { paddingBottom: 24, paddingTop: 4 },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySub:  { fontSize: 14, color: Colors.textSecondary },
});
