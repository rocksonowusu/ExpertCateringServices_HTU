import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { MenuItem } from '@/constants/data';

interface FoodCardProps {
  item: MenuItem;
  onPress: () => void;
  onAddToCart?: () => void;
  horizontal?: boolean;
}

export function FoodCard({ item, onPress, onAddToCart, horizontal = false }: FoodCardProps) {
  if (horizontal) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.horizontalCard}>
        <Image
          source={{ uri: item.image }}
          style={styles.horizontalImage}
          contentFit="cover"
          transition={250}
        />
        <View style={styles.horizontalContent}>
          {!item.isAvailable && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Unavailable</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={Colors.accent} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewText}>({item.reviewCount})</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.prepTime}>{item.prepTime}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₵{item.price.toFixed(2)}</Text>
            {onAddToCart && item.isAvailable && (
              <TouchableOpacity onPress={onAddToCart} style={styles.addBtn} activeOpacity={0.8}>
                <Ionicons name="add" size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />
        {!item.isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableOverlayText}>Unavailable</Text>
          </View>
        )}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.tags[0]}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={Colors.accent} />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.prepTime}>{item.prepTime}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₵{item.price.toFixed(2)}</Text>
          {onAddToCart && item.isAvailable && (
            <TouchableOpacity onPress={onAddToCart} style={styles.addBtn} activeOpacity={0.8}>
              <Ionicons name="add" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    width: 175,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 130 },
  unavailableOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableOverlayText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  tagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  content: { padding: 12 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  description: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  ratingText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  reviewText: { fontSize: 11, color: Colors.textMuted },
  dot: { color: Colors.textMuted, fontSize: 11 },
  prepTime: { fontSize: 11, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Horizontal card styles
  horizontalCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  horizontalImage: { width: 100, height: 90 },
  horizontalContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
  },
  unavailableBadge: {
    backgroundColor: Colors.errorLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  unavailableText: { fontSize: 10, color: Colors.error, fontWeight: '600' },
});
