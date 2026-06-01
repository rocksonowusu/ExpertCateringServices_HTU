import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { Order } from '@/constants/data';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: Colors.statusPending, bg: Colors.warningLight, icon: 'time-outline' as const },
  preparing: { label: 'Preparing', color: Colors.statusPreparing, bg: '#E3F2FD', icon: 'restaurant-outline' as const },
  ready: { label: 'Ready for Pickup', color: Colors.statusReady, bg: Colors.successLight, icon: 'checkmark-circle-outline' as const },
  delivered: { label: 'Delivered', color: Colors.statusDelivered, bg: Colors.surface, icon: 'bag-check-outline' as const },
  cancelled: { label: 'Cancelled', color: Colors.statusCancelled, bg: Colors.errorLight, icon: 'close-circle-outline' as const },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 60000;
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const status = statusConfig[order.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      style={styles.card}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.time}>{formatTime(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={13} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.items}>
        {order.items.slice(0, 2).map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}×</Text>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemPrice}>₵{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItems}>+{order.items.length - 2} more item(s)</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.paymentInfo}>
          <Ionicons
            name={order.paymentMethod === 'momo' ? 'phone-portrait-outline' : 'cash-outline'}
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.paymentText}>
            {order.paymentMethod === 'momo' ? 'Mobile Money' : 'Pay on Delivery'}
          </Text>
        </View>
        <Text style={styles.total}>₵{order.total.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { fontSize: 14, fontWeight: '700', color: Colors.text },
  time: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 10 },
  items: { gap: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemQty: { fontSize: 13, fontWeight: '700', color: Colors.primary, width: 24 },
  itemName: { flex: 1, fontSize: 13, color: Colors.text },
  itemPrice: { fontSize: 13, fontWeight: '600', color: Colors.text },
  moreItems: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paymentText: { fontSize: 12, color: Colors.textSecondary },
  total: { fontSize: 16, fontWeight: '800', color: Colors.primary },
});
