// Web-only admin dashboard — desktop layout inside the sidebar shell.
import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
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
import { useAuthStore } from '@/store/authStore';
import { useOrdersStore } from '@/store/ordersStore';
import { useMenuStore } from '@/store/menuStore';
import { type Order } from '@/constants/data';

type Status = Order['status'];

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: Colors.statusPending,   bg: '#FFF3E0' },
  preparing: { label: 'Preparing', color: Colors.statusPreparing, bg: '#E3F2FD' },
  ready:     { label: 'Ready',     color: Colors.statusReady,     bg: '#E8F5E9' },
  delivered: { label: 'Delivered', color: Colors.statusDelivered, bg: '#F0F0F0' },
  cancelled: { label: 'Cancelled', color: Colors.statusCancelled, bg: '#FFEBEE' },
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

function StatCard({ icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboardWeb() {
  const { user } = useAuthStore();
  const { orders, loadAll, subscribe } = useOrdersStore();
  const menuItems = useMenuStore((s) => s.items);
  const { width } = useWindowDimensions();
  const twoCol = width >= 1080;
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAll();
    const unsub = subscribe();
    return unsub;
  }, [loadAll, subscribe]);

  const counts = useMemo(
    () =>
      orders.reduce(
        (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
        {} as Record<string, number>
      ),
    [orders]
  );
  const revenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0),
    [orders]
  );

  const q = search.trim().toLowerCase();
  const recent = orders.filter(
    (o) => !q || o.id.toLowerCase().includes(q) || (o.customerName ?? '').toLowerCase().includes(q)
  );
  const liveQueue = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status));

  const firstName = user?.name?.split(' ')[0] ?? 'Admin';

  return (
    <ScrollView style={s.page} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.welcome}>Welcome, {firstName}! 👋</Text>
          <Text style={s.welcomeSub}>Here's what's happening at the cafeteria today.</Text>
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

      {/* ── Stat cards ── */}
      <View style={s.statsRow}>
        <StatCard icon="receipt-outline"          label="Total Orders" value={String(orders.length)}       tint={Colors.primary} />
        <StatCard icon="cash-outline"             label="Revenue"      value={`₵${revenue}`}                tint={Colors.success} />
        <StatCard icon="time-outline"             label="Pending"      value={String(counts.pending ?? 0)}  tint={Colors.statusPending} />
        <StatCard icon="restaurant-outline"       label="Preparing"    value={String(counts.preparing ?? 0)} tint={Colors.statusPreparing} />
        <StatCard icon="checkmark-circle-outline" label="Ready"        value={String(counts.ready ?? 0)}    tint={Colors.statusReady} />
        <StatCard icon="fast-food-outline"        label="Menu Items"   value={String(menuItems.length)}     tint={Colors.accentDark} />
      </View>

      {/* ── Two-column body ── */}
      <View style={[twoCol ? s.body : s.bodyStack]}>
        {/* Main: recent orders */}
        <View style={[s.panel, twoCol && { flex: 1.7 }]}>
          <View style={s.panelHead}>
            <Text style={s.panelTitle}>Recent Orders</Text>
            <Text style={s.panelCount}>{recent.length} total</Text>
          </View>

          {recent.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={34} color={Colors.textMuted} />
              <Text style={s.emptyTxt}>No orders yet</Text>
            </View>
          ) : (
            recent.slice(0, 8).map((o) => {
              const meta = STATUS_META[o.status];
              return (
                <View key={o.id} style={s.orderRow}>
                  <View style={s.orderAvatar}>
                    <Text style={s.orderAvatarTxt}>{o.customerName?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.orderName} numberOfLines={1}>{o.customerName ?? 'Guest'}</Text>
                    <Text style={s.orderMeta}>#{o.id} · {o.items.length} item{o.items.length !== 1 ? 's' : ''} · {timeAgo(o.createdAt)}</Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
                    <Text style={[s.statusPillTxt, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text style={s.orderTotal}>₵{o.total.toFixed(2)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Right: live queue */}
        <View style={[s.panel, s.queuePanel, twoCol && { flex: 1 }]}>
          <View style={s.panelHead}>
            <Text style={s.panelTitle}>Live Queue</Text>
            <View style={s.queueCount}><Text style={s.queueCountTxt}>{liveQueue.length}</Text></View>
          </View>

          {liveQueue.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="cafe-outline" size={30} color={Colors.textMuted} />
              <Text style={s.emptyTxt}>All caught up!</Text>
            </View>
          ) : (
            liveQueue.slice(0, 6).map((o) => {
              const meta = STATUS_META[o.status];
              return (
                <View key={o.id} style={s.queueCard}>
                  <Image
                    source={{ uri: menuItems.find((m) => m.name === o.items[0]?.name)?.image ?? menuItems[0].image }}
                    style={s.queueImg}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.queueItemName} numberOfLines={1}>{o.items[0]?.name ?? 'Order'}</Text>
                    <Text style={s.queueSub}>#{o.id} · ₵{o.total.toFixed(2)}</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: meta.color }]} />
                  <Text style={[s.queueStatus, { color: meta.color }]}>{meta.label}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.backgroundAlt },
  scroll: { padding: 28, gap: 22 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  welcome: { fontSize: 24, fontWeight: '900', color: Colors.text },
  welcomeSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.white,
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border,
    minWidth: 260,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.successLight,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveTxt: { fontSize: 12, fontWeight: '800', color: Colors.success },

  // Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  statCard: {
    flex: 1, minWidth: 168,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  // Body
  body: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  bodyStack: { flexDirection: 'column', gap: 20 },
  panel: {
    backgroundColor: Colors.white,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.border,
    gap: 6,
  },
  queuePanel: { backgroundColor: '#FFFDF9' },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  panelTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  panelCount: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  queueCount: {
    backgroundColor: Colors.accent, borderRadius: 11,
    minWidth: 22, height: 22, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  queueCountTxt: { fontSize: 12, fontWeight: '800', color: Colors.white },

  // Order row (main)
  orderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  orderAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  orderAvatarTxt: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  orderName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  orderMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusPill: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillTxt: { fontSize: 11.5, fontWeight: '700' },
  orderTotal: { fontSize: 14, fontWeight: '800', color: Colors.primary, width: 68, textAlign: 'right' },

  // Queue card (right)
  queueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  queueImg: { width: 40, height: 40, borderRadius: 11 },
  queueItemName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  queueSub: { fontSize: 11.5, color: Colors.textMuted, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  queueStatus: { fontSize: 11.5, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
});
