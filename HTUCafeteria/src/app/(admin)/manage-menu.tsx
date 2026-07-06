import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { menuItems as initialItems, type MenuItem } from '@/constants/data';

export default function ManageMenuScreen() {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Menu</Text>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{items.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {items.filter((i) => i.isAvailable).length}
          </Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            {items.filter((i) => !i.isAvailable).length}
          </Text>
          <Text style={styles.summaryLabel}>Unavailable</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isWide && styles.listWide]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.isAvailable && styles.cardUnavailable]}>
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>₵{item.price}</Text>
              </View>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <View style={styles.bottomRow}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={11} color={Colors.accent} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                <View style={styles.availRow}>
                  <Text style={[styles.availLabel, item.isAvailable ? styles.availOn : styles.availOff]}>
                    {item.isAvailable ? 'Available' : 'Off Menu'}
                  </Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => toggleAvailability(item.id)}
                    trackColor={{ false: Colors.border, true: Colors.success + '60' }}
                    thumbColor={item.isAvailable ? Colors.success : Colors.textMuted}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
              <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 20, fontWeight: '900', color: Colors.text },
  summaryLabel: { fontSize: 11, color: Colors.textMuted },
  summaryDivider: { width: 1, backgroundColor: Colors.divider },

  list: { padding: 12, paddingBottom: 24 },
  // Wide screens (tablet / desktop web): center the menu list at a readable width
  listWide: { maxWidth: 860, width: '100%', alignSelf: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUnavailable: { opacity: 0.65 },
  image: { width: 80, height: 80 },
  info: { flex: 1, padding: 10, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
  itemPrice: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  itemCategory: { fontSize: 11, color: Colors.textMuted },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availLabel: { fontSize: 11, fontWeight: '600' },
  availOn: { color: Colors.success },
  availOff: { color: Colors.error },
  editBtn: {
    padding: 10,
    marginRight: 4,
  },
});
