// Web-only admin Transactions page — payment ledger derived from orders.
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { type Order } from '@/constants/data';
import { useOrdersStore } from '@/store/ordersStore';

type PayStatus = Order['paymentStatus'];

const PAY_META: Record<PayStatus, { label: string; color: string; bg: string }> = {
  paid:     { label: 'Paid',     color: Colors.success, bg: '#E8F5E9' },
  unpaid:   { label: 'Unpaid',   color: Colors.statusPending, bg: '#FFF3E0' },
  refunded: { label: 'Refunded', color: Colors.textSecondary, bg: '#F0F0F0' },
};

const FILTERS: Array<{ key: 'all' | PayStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'refunded', label: 'Refunded' },
];

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function isToday(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function Tile({ icon, label, value, sub, tint }: { icon: any; label: string; value: string; sub?: string; tint: string }) {
  return (
    <View style={s.tile}>
      <View style={[s.tileIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.tileValue}>{value}</Text>
        <Text style={s.tileLabel}>{label}</Text>
        {sub ? <Text style={s.tileSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export default function TransactionsWeb() {
  const { orders, loadAll, subscribe, setPaymentStatus } = useOrdersStore();
  const [filter, setFilter] = useState<'all' | PayStatus>('all');
  const [method, setMethod] = useState<'all' | 'momo' | 'cash'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAll();
    const unsub = subscribe();
    return unsub;
  }, [loadAll, subscribe]);

  const paid = orders.filter((o) => o.paymentStatus === 'paid');
  const totals = useMemo(() => {
    const sum = (list: Order[]) => list.reduce((a, o) => a + o.total, 0);
    return {
      collected: sum(paid),
      today: sum(paid.filter((o) => isToday(o.paidAt) || isToday(o.createdAt))),
      momo: sum(paid.filter((o) => o.paymentMethod === 'momo')),
      cash: sum(paid.filter((o) => o.paymentMethod === 'on_delivery')),
      unpaidAmt: sum(orders.filter((o) => o.paymentStatus === 'unpaid')),
      unpaidCount: orders.filter((o) => o.paymentStatus === 'unpaid').length,
    };
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === 'all' || o.paymentStatus === filter) &&
        (method === 'all' || (method === 'momo' ? o.paymentMethod === 'momo' : o.paymentMethod === 'on_delivery')) &&
        (!q || o.id.toLowerCase().includes(q) || (o.customerName ?? '').toLowerCase().includes(q))
    );
  }, [orders, filter, method, search]);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Transactions</Text>
          <Text style={s.subtitle}>Payment ledger · {orders.length} orders</Text>
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
      </View>

      {/* Summary tiles */}
      <View style={s.tiles}>
        <Tile icon="cash-outline"             label="Collected today" value={`₵${totals.today.toFixed(2)}`} tint={Colors.success} />
        <Tile icon="wallet-outline"           label="Total collected" value={`₵${totals.collected.toFixed(2)}`} tint={Colors.primary} />
        <Tile icon="phone-portrait-outline"   label="MoMo"            value={`₵${totals.momo.toFixed(2)}`} tint={Colors.statusPreparing} />
        <Tile icon="cash-outline"             label="Cash"            value={`₵${totals.cash.toFixed(2)}`} tint={Colors.accentDark} />
        <Tile icon="alert-circle-outline"     label="Outstanding"     value={`₵${totals.unpaidAmt.toFixed(2)}`} sub={`${totals.unpaidCount} unpaid`} tint={Colors.statusPending} />
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        <View style={s.tabs}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[s.tab, active && s.tabActive]} activeOpacity={0.8}>
                <Text style={[s.tabTxt, active && s.tabTxtActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={s.tabs}>
          {(['all', 'momo', 'cash'] as const).map((mt) => {
            const active = method === mt;
            return (
              <TouchableOpacity key={mt} onPress={() => setMethod(mt)} style={[s.methodTab, active && s.methodTabActive]} activeOpacity={0.8}>
                <Text style={[s.tabTxt, active && s.methodTabTxtActive]}>{mt === 'all' ? 'All methods' : mt === 'momo' ? 'MoMo' : 'Cash'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Ledger table */}
      <View style={s.table}>
        <View style={s.thead}>
          <Text style={[s.th, { flex: 1.2 }]}>Order</Text>
          <Text style={[s.th, { flex: 1.4 }]}>Customer</Text>
          <Text style={[s.th, { width: 92 }]}>Method</Text>
          <Text style={[s.th, { width: 74 }]}>Channel</Text>
          <Text style={[s.th, { width: 150 }]}>Time</Text>
          <Text style={[s.th, { width: 92, textAlign: 'right' }]}>Amount</Text>
          <Text style={[s.th, { width: 96 }]}>Status</Text>
          <Text style={[s.th, { width: 168 }]}>Actions</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={36} color={Colors.textMuted} />
            <Text style={s.emptyTxt}>No transactions match</Text>
          </View>
        ) : (
          filtered.map((o) => {
            const meta = PAY_META[o.paymentStatus];
            return (
              <View key={o.id} style={s.tr}>
                <Text style={[s.tdStrong, { flex: 1.2 }]}>#{o.id}</Text>
                <Text style={[s.td, { flex: 1.4 }]} numberOfLines={1}>{o.customerName ?? 'Guest'}</Text>
                <View style={{ width: 92 }}>
                  <View style={s.methodChip}>
                    <Ionicons name={o.paymentMethod === 'momo' ? 'phone-portrait-outline' : 'cash-outline'} size={12} color={Colors.textSecondary} />
                    <Text style={s.methodTxt}>{o.paymentMethod === 'momo' ? 'MoMo' : 'Cash'}</Text>
                  </View>
                </View>
                <Text style={[s.td, { width: 74 }]}>{o.channel === 'pos' ? 'Counter' : 'App'}</Text>
                <Text style={[s.tdMuted, { width: 150 }]}>{fmtTime(o.paidAt ?? o.createdAt)}</Text>
                <Text style={[s.tdStrong, { width: 92, textAlign: 'right', color: Colors.primary }]}>₵{o.total.toFixed(2)}</Text>
                <View style={{ width: 96 }}>
                  <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
                    <Text style={[s.statusTxt, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
                <View style={{ width: 168, flexDirection: 'row', gap: 6 }}>
                  {o.paymentStatus !== 'paid' && (
                    <TouchableOpacity style={s.payBtn} onPress={() => setPaymentStatus(o.id, 'paid')} activeOpacity={0.85}>
                      <Ionicons name="checkmark" size={13} color={Colors.white} />
                      <Text style={s.payBtnTxt}>Mark Paid</Text>
                    </TouchableOpacity>
                  )}
                  {o.paymentStatus === 'paid' && (
                    <TouchableOpacity style={s.refundBtn} onPress={() => setPaymentStatus(o.id, 'refunded')} activeOpacity={0.85}>
                      <Text style={s.refundTxt}>Refund</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
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

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: {
    flex: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: Colors.border,
  },
  tileIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 20, fontWeight: '900', color: Colors.text },
  tileLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  tileSub: { fontSize: 11, color: Colors.statusPending, fontWeight: '700', marginTop: 1 },

  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: {
    backgroundColor: Colors.white, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTxtActive: { color: Colors.white },
  methodTab: {
    backgroundColor: Colors.white, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.border,
  },
  methodTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  methodTabTxtActive: { color: Colors.white },

  table: {
    backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  thead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.backgroundAlt, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  th: { fontSize: 11.5, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  tr: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  td: { fontSize: 13, color: Colors.text },
  tdStrong: { fontSize: 13.5, fontWeight: '800', color: Colors.text },
  tdMuted: { fontSize: 12, color: Colors.textMuted },
  methodChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  methodTxt: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  statusPill: { alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt: { fontSize: 11.5, fontWeight: '800' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.success, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7,
  },
  payBtnTxt: { fontSize: 12, fontWeight: '800', color: Colors.white },
  refundBtn: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  refundTxt: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
});
