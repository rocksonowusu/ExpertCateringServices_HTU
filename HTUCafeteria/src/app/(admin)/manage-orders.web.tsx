// Web-only admin Orders page — filter tabs + order cards with status controls.
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { type Order } from '@/constants/data';
import { useOrdersStore } from '@/store/ordersStore';

type Status = Order['status'];

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; next?: Status; nextLabel?: string }> = {
  pending:   { label: 'Pending',   color: Colors.statusPending,   bg: '#FFF3E0', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: Colors.statusPreparing, bg: '#E3F2FD', next: 'ready',     nextLabel: 'Mark Ready' },
  ready:     { label: 'Ready',     color: Colors.statusReady,     bg: '#E8F5E9', next: 'delivered', nextLabel: 'Mark Delivered' },
  delivered: { label: 'Delivered', color: Colors.statusDelivered, bg: '#F0F0F0' },
  cancelled: { label: 'Cancelled', color: Colors.statusCancelled, bg: '#FFEBEE' },
};

const FILTERS: Array<{ key: 'all' | Status; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function ManageOrdersWeb() {
  const { orders, loadAll, updateStatus, subscribe } = useOrdersStore();
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const cols = width >= 1500 ? 3 : width >= 1000 ? 2 : 1;
  const cardBasis = `${100 / cols}%`;

  useEffect(() => {
    loadAll();
    const unsub = subscribe();
    return unsub;
  }, [loadAll, subscribe]);

  const counts = useMemo(
    () => orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {} as Record<string, number>),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === 'all' || o.status === filter) &&
        (!q || o.id.toLowerCase().includes(q) || (o.customerName ?? '').toLowerCase().includes(q))
    );
  }, [orders, filter, search]);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Orders</Text>
          <Text style={s.subtitle}>{orders.length} total · {(counts.pending ?? 0) + (counts.preparing ?? 0) + (counts.ready ?? 0)} active</Text>
        </View>
        <View style={s.search}>
          <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search order # or customer…"
            placeholderTextColor={Colors.textMuted}
            style={[s.searchInput, { outlineWidth: 0 } as any]}
          />
        </View>
        <View style={s.liveBadge}>
          <View style={s.liveDot} />
          <Text style={s.liveTxt}>Live</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.tabs}>
        {FILTERS.map((tabItem) => {
          const active = filter === tabItem.key;
          const count = tabItem.key === 'all' ? orders.length : counts[tabItem.key] ?? 0;
          return (
            <TouchableOpacity
              key={tabItem.key}
              onPress={() => setFilter(tabItem.key)}
              style={[s.tab, active && s.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, active && s.tabTxtActive]}>{tabItem.label}</Text>
              <View style={[s.tabCount, active && s.tabCountActive]}>
                <Text style={[s.tabCountTxt, active && s.tabCountTxtActive]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Order cards */}
      <View style={s.grid}>
        {filtered.map((o) => {
          const cfg = STATUS_CFG[o.status];
          return (
            <View key={o.id} style={[s.cardCell, { flexBasis: cardBasis as any, maxWidth: cardBasis as any }]}>
              <View style={s.card}>
                {/* Header */}
                <View style={s.cardHead}>
                  <View>
                    <Text style={s.orderId}>#{o.id}</Text>
                    <Text style={s.orderTime}>{timeAgo(o.createdAt)}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                    <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                    <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                {/* Customer */}
                <View style={s.customer}>
                  <View style={s.custAvatar}><Text style={s.custAvatarTxt}>{o.customerName?.[0]?.toUpperCase() ?? '?'}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.custName} numberOfLines={1}>{o.customerName ?? 'Guest'}</Text>
                    <Text style={s.custMeta}>Pickup: {o.pickupTime || '—'}</Text>
                  </View>
                  <View style={s.payTag}>
                    <Ionicons
                      name={o.paymentMethod === 'momo' ? 'phone-portrait-outline' : 'cash-outline'}
                      size={12}
                      color={Colors.textSecondary}
                    />
                    <Text style={s.payTxt}>{o.paymentMethod === 'momo' ? 'MOMO' : 'Cash'}</Text>
                  </View>
                </View>

                {/* Items */}
                <View style={s.items}>
                  {o.items.map((it, i) => (
                    <View key={i} style={s.itemRow}>
                      <Text style={s.itemQty}>{it.quantity}×</Text>
                      <Text style={s.itemName} numberOfLines={1}>{it.name}</Text>
                      <Text style={s.itemPrice}>₵{(it.price * it.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* Footer */}
                <View style={s.cardFooter}>
                  <Text style={s.total}>Total: <Text style={s.totalVal}>₵{o.total.toFixed(2)}</Text></Text>
                  <View style={s.actions}>
                    {o.status !== 'delivered' && o.status !== 'cancelled' && (
                      <TouchableOpacity style={s.cancelBtn} onPress={() => updateStatus(o.id, 'cancelled')} activeOpacity={0.8}>
                        <Text style={s.cancelTxt}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    {cfg.next && (
                      <TouchableOpacity
                        style={[s.advanceBtn, { backgroundColor: cfg.color }]}
                        onPress={() => updateStatus(o.id, cfg.next!)}
                        activeOpacity={0.85}
                      >
                        <Text style={s.advanceTxt}>{cfg.nextLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
            <Text style={s.emptyTxt}>No orders here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.backgroundAlt },
  scroll: { padding: 28, gap: 20 },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.white, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border, minWidth: 260,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.successLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveTxt: { fontSize: 12, fontWeight: '800', color: Colors.success },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.white, borderRadius: 22,
    paddingHorizontal: 15, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTxtActive: { color: Colors.white },
  tabCount: {
    backgroundColor: Colors.backgroundAlt, borderRadius: 9,
    minWidth: 20, height: 18, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountTxt: { fontSize: 10.5, fontWeight: '800', color: Colors.textSecondary },
  tabCountTxtActive: { color: Colors.white },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  cardCell: { padding: 8 },
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { fontSize: 16, fontWeight: '900', color: Colors.text },
  orderTime: { fontSize: 11.5, color: Colors.textMuted, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 12, fontWeight: '800' },

  customer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  custAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  custAvatarTxt: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  custName: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  custMeta: { fontSize: 11.5, color: Colors.textMuted, marginTop: 1 },
  payTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.backgroundAlt, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
  },
  payTxt: { fontSize: 10.5, fontWeight: '700', color: Colors.textSecondary },

  items: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10, gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemQty: { fontSize: 12.5, fontWeight: '800', color: Colors.primary, width: 26 },
  itemName: { flex: 1, fontSize: 13, color: Colors.text },
  itemPrice: { fontSize: 12.5, fontWeight: '700', color: Colors.text },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 12, gap: 8, flexWrap: 'wrap',
  },
  total: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  totalVal: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: Colors.error },
  cancelTxt: { fontSize: 12.5, fontWeight: '700', color: Colors.error },
  advanceBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  advanceTxt: { fontSize: 12.5, fontWeight: '800', color: Colors.white },

  empty: { width: '100%', alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
});
