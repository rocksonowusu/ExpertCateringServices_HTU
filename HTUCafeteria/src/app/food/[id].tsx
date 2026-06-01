import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';
import { menuItems } from '@/constants/data';

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, getItem, updateQuantity } = useCartStore();

  const item = menuItems.find((m) => m.id === id);
  const cartItem = item ? getItem(item.id) : undefined;
  const [qty, setQty] = useState(cartItem?.quantity ?? 1);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Item not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    if (cartItem) {
      updateQuantity(item.id, qty);
    } else {
      addItem(item, qty);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagStack}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {!item.isAvailable && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Currently Unavailable</Text>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Title + rating */}
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.price}>₵{item.price.toFixed(2)}</Text>
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({item.reviewCount} reviews)</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{item.prepTime}</Text>
            </View>
            {item.calories && (
              <View style={styles.infoBadge}>
                <Ionicons name="flame-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.calories} cal</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {/* Allergen / info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoCardText}>
              Freshly prepared daily. Contains common allergens. Notify staff of any dietary requirements.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              onPress={() => setQty(Math.max(1, qty - 1))}
              style={styles.qtyBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qty}>{qty}</Text>
            <TouchableOpacity
              onPress={() => setQty(qty + 1)}
              style={styles.qtyBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Button
            title={`Add to Cart · ₵${(item.price * qty).toFixed(2)}`}
            onPress={handleAddToCart}
            disabled={!item.isAvailable}
            style={styles.addBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },

  imageContainer: { position: 'relative', height: 280 },
  image: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tagStack: {
    position: 'absolute',
    top: 52,
    right: 16,
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  unavailableOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: { color: Colors.white, fontSize: 18, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 10 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleLeft: { flex: 1 },
  category: { fontSize: 12, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, lineHeight: 28 },
  price: { fontSize: 24, fontWeight: '900', color: Colors.primary },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8EC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  ratingCount: { fontSize: 11, color: Colors.textMuted },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  infoCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCardText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 16, fontWeight: '800', color: Colors.text, minWidth: 24, textAlign: 'center' },
  addBtn: { flex: 1 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { fontSize: 17, color: Colors.textSecondary },
});
