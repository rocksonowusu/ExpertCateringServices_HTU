import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { type Order } from '@/constants/data';
import { useOrdersStore } from '@/store/ordersStore';

type Status = Order['status'];

const STATUS_FLOW: Status[] = ['pending', 'preparing', 'ready', 'delivered'];

const statusConfig: Record<Status, { label: string; color: string; bg: string; next?: Status; nextLabel?: string }> = {
  pending: { label: 'Pending', color: Colors.statusPending, bg: Colors.warningLight, next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: Colors.statusPreparing, bg: '#E3F2FD', next: 'ready', nextLabel: 'Mark Ready' },
  ready: { label: 'Ready', color: Colors.statusReady, bg: Colors.successLight, next: 'delivered', nextLabel: 'Mark Delivered' },
  delivered: { label: 'Delivered', color: Colors.statusDelivered, bg: Colors.surface },
  cancelled: { label: 'Cancelled', color: Colors.statusCancelled, bg: Colors.errorLight },
};

const FILTER_TABS: Array<{ key: 'all' | Status; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function ManageOrdersScreen() {
  const { orders, loadAll, updateStatus, subscribe } = useOrdersStore();
  const [filter, setFilter] = useState<'all' | Status>('all');
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  // Load once, then keep the list live via Supabase realtime.
  useEffect(() => {
    loadAll();
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [loadAll, subscribe]);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const advanceStatus = (orderCode: string) => {
    const order = orders.find((o) => o.id === orderCode);
    const next = order ? statusConfig[order.status].next : undefined;
    if (next) updateStatus(orderCode, next);
  };

  const cancelOrder = (orderCode: string) => {
    updateStatus(orderCode, 'cancelled');
  };

  const counts = orders.reduce(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Orders</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.key}
          contentContainerStyle={styles.tabs}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              onPress={() => setFilter(tab.key)}
              style={[styles.tab, filter === tab.key && styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.key !== 'all' && counts[tab.key] ? (
                <View style={[styles.tabCount, filter === tab.key && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, filter === tab.key && styles.tabCountTextActive]}>
                    {counts[tab.key]}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isWide && styles.listWide]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No orders</Text>
          </View>
        }
        renderItem={({ item: order }) => {
          const cfg = statusConfig[order.status];
          return (
            <View style={styles.orderCard}>
              {/* Top row */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              {/* Customer */}
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitial}>{order.customerName?.[0] ?? '?'}</Text>
                </View>
                <View>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.pickupTime}>
                    <Ionicons name="time-outline" size={11} /> Pickup: {order.pickupTime}
                  </Text>
                </View>
                <View style={styles.paymentTag}>
                  <Ionicons
                    name={order.paymentMethod === 'momo' ? 'phone-portrait-outline' : 'cash-outline'}
                    size={12}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.paymentText}>
                    {order.paymentMethod === 'momo' ? 'MOMO' : 'Cash'}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View style={styles.itemsList}>
                {order.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemQty}>{item.quantity}×</Text>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₵{(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>Total: ₵{order.total.toFixed(2)}</Text>
                <View style={styles.actionBtns}>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <TouchableOpacity
                      onPress={() => cancelOrder(order.id)}
                      style={styles.cancelBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  {cfg.next && (
                    <TouchableOpacity
                      onPress={() => advanceStatus(order.id)}
                      style={[styles.advanceBtn, { backgroundColor: cfg.color }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.advanceBtnText}>{cfg.nextLabel}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  tabsWrapper: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  tabCount: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabCountText: { fontSize: 9, fontWeight: '800', color: Colors.textSecondary },
  tabCountTextActive: { color: Colors.white },

  list: { padding: 12, paddingBottom: 24 },
  // Wide screens (tablet / desktop web): center the order feed at a readable width
  listWide: { maxWidth: 860, width: '100%', alignSelf: 'center' },

  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 15, fontWeight: '800', color: Colors.text },
  orderTime: { fontSize: 11, color: Colors.textMuted },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitial: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  customerName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  pickupTime: { fontSize: 11, color: Colors.textMuted },
  paymentTag: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },

  itemsList: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 8, gap: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemQty: { fontSize: 12, fontWeight: '700', color: Colors.primary, width: 22 },
  itemName: { flex: 1, fontSize: 12, color: Colors.text },
  itemPrice: { fontSize: 12, fontWeight: '600', color: Colors.text },

  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10 },
  orderTotal: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  actionBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: Colors.error },
  advanceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  advanceBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
});
