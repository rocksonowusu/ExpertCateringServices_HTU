import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FoodCard } from '@/components/FoodCard';
import { useCartStore } from '@/store/cartStore';
import { categories, menuItems } from '@/constants/data';

const CATS = [
  { id: 'all',       label: 'All',          emoji: '🍽️' },
  { id: 'rice',      label: 'Rice Dishes',  emoji: '🍚' },
  { id: 'soups',     label: 'Soups & Stews',emoji: '🍲' },
  { id: 'fastfood',  label: 'Fast Food',    emoji: '🍔' },
  { id: 'snacks',    label: 'Snacks',       emoji: '🥪' },
  { id: 'drinks',    label: 'Drinks',       emoji: '🥤' },
  { id: 'breakfast', label: 'Breakfast',    emoji: '🍳' },
];

export default function MenuScreen() {
  const router = useRouter();
  const { addItem, totalItems } = useCartStore();
  const [search, setSearch]   = useState('');
  const [catId, setCatId]     = useState('all');

  const filtered = menuItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      catId === 'all' ||
      item.category === categories.find((c) => c.id === catId)?.name;
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Rich header ──────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.hDeco1} />
        <View style={styles.hDeco2} />

        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Menu 🍽️</Text>
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

      {/* ── Category chips ────────────────────────────────── */}
      <FlatList
        data={CATS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.catList}
        style={styles.catRow}
        renderItem={({ item: cat }) => {
          const active = catId === cat.id;
          return (
            <TouchableOpacity
              style={[styles.catChip, active && styles.catChipActive]}
              onPress={() => setCatId(cat.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, active && styles.catLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Results count ─────────────────────────────────── */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          {catId !== 'all' && ` · ${CATS.find(c => c.id === catId)?.label}`}
        </Text>
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Text style={styles.clearSearch}>Clear search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Items list ────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySub}>Try a different search or category</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FoodCard
            item={item}
            onPress={() => router.push(`/food/${item.id}`)}
            onAddToCart={() => addItem(item)}
            horizontal
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

  // Category row
  catRow: { maxHeight: 56, marginTop: 14 },
  catList: { paddingHorizontal: 20, gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catEmoji:      { fontSize: 15 },
  catLabel:      { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  catLabelActive: { color: Colors.white },

  // Results
  resultsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  resultsText:  { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  clearSearch:  { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  // List
  list:      { paddingHorizontal: 16, paddingBottom: 24 },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySub:  { fontSize: 14, color: Colors.textSecondary },
});
