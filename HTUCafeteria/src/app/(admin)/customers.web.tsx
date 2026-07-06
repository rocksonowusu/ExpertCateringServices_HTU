// Web-only admin Customers page — derived from orders (no separate table).
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { type Order } from '@/constants/data';
import { useOrdersStore } from '@/store/ordersStore';

type Customer = {
  name: string;
  orders: number;
  spent: number;
  lastOrder: string;
  topDish: string;
  momo: number;
  cash: number;
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function buildCustomers(orders: Order[]): Customer[] {
  const map = new Map<string, Customer & { dishes: Record<string, number> }>();
  for (const o of orders) {
    const name = o.customerName?.trim() || 'Guest';
    const c = map.get(name) ?? { name, orders: 0, spent: 0, lastOrder: o.createdAt, topDish: '', momo: 0, cash: 0, dishes: {} };
    c.orders += 1;
    if (o.status !== 'cancelled') c.spent += o.total;
    if (new Date(o.createdAt) > new Date(c.lastOrder)) c.lastOrder = o.createdAt;
    if (o.paymentMethod === 'momo') c.momo += 1; else c.cash += 1;
    for (const it of o.items) c.dishes[it.name] = (c.dishes[it.name] ?? 0) + it.quantity;
    map.set(name, c);
  }
  return [...map.values()]
    .map((c) => {
      const top = Object.entries(c.dishes).sort((a, b) => b[1] - a[1])[0];
      return { name: c.name, orders: c.orders, spent: c.spent, lastOrder: c.lastOrder, topDish: top?.[0] ?? '—', momo: c.momo, cash: c.cash };
    })
    .sort((a, b) => b.spent - a.spent);
}

export default function CustomersWeb() {
  const { orders, loadAll, subscribe } = useOrdersStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAll();
    const unsub = subscribe();
    return unsub;
  }, [loadAll, subscribe]);

  const customers = useMemo(() => buildCustomers(orders), [orders]);
  const q = search.trim().toLowerCase();
  const filtered = customers.filter((c) => !q || c.name.toLowerCase().includes(q));

  const totalSpent = customers.reduce((a, c) => a + c.spent, 0);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Customers</Text>
          <Text style={s.subtitle}>{customers.length} customers · ₵{totalSpent.toFixed(2)} lifetime spend</Text>
        </View>
        <View style={s.search}>
          <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search customers…"
            placeholderTextColor={Colors.textMuted}
            style={[s.searchInput, { outlineWidth: 0 } as any]}
          />
        </View>
      </View>

      <View style={s.table}>
        <View style={s.thead}>
          <Text style={[s.th, { flex: 1.6 }]}>Customer</Text>
          <Text style={[s.th, { width: 90, textAlign: 'center' }]}>Orders</Text>
          <Text style={[s.th, { width: 120, textAlign: 'right' }]}>Total spent</Text>
          <Text style={[s.th, { flex: 1.2 }]}>Favourite</Text>
          <Text style={[s.th, { width: 120 }]}>Pays with</Text>
          <Text style={[s.th, { width: 110 }]}>Last order</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={36} color={Colors.textMuted} />
            <Text style={s.emptyTxt}>No customers yet</Text>
          </View>
        ) : (
          filtered.map((c, i) => (
            <View key={c.name} style={s.tr}>
              <View style={[{ flex: 1.6, flexDirection: 'row', alignItems: 'center', gap: 11 }]}>
                <View style={[s.avatar, i === 0 && { backgroundColor: Colors.accent }]}>
                  <Text style={s.avatarTxt}>{c.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ minWidth: 0 }}>
                  <Text style={s.name} numberOfLines={1}>{c.name}</Text>
                  {i === 0 && <Text style={s.topTag}>★ Top customer</Text>}
                </View>
              </View>
              <Text style={[s.tdStrong, { width: 90, textAlign: 'center' }]}>{c.orders}</Text>
              <Text style={[s.tdStrong, { width: 120, textAlign: 'right', color: Colors.primary }]}>₵{c.spent.toFixed(2)}</Text>
              <Text style={[s.td, { flex: 1.2 }]} numberOfLines={1}>{c.topDish}</Text>
              <View style={{ width: 120, flexDirection: 'row', gap: 6 }}>
                {c.momo > 0 && <View style={s.payChip}><Text style={s.payChipTxt}>MoMo {c.momo}</Text></View>}
                {c.cash > 0 && <View style={s.payChip}><Text style={s.payChipTxt}>Cash {c.cash}</Text></View>}
              </View>
              <Text style={[s.tdMuted, { width: 110 }]}>{timeAgo(c.lastOrder)}</Text>
            </View>
          ))
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
    borderWidth: 1, borderColor: Colors.border, minWidth: 240,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text },

  table: { backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  thead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.backgroundAlt, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  th: { fontSize: 11.5, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  topTag: { fontSize: 10.5, fontWeight: '700', color: Colors.accentDark, marginTop: 1 },
  td: { fontSize: 13, color: Colors.text },
  tdStrong: { fontSize: 14, fontWeight: '800', color: Colors.text },
  tdMuted: { fontSize: 12, color: Colors.textMuted },
  payChip: { backgroundColor: Colors.backgroundAlt, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  payChipTxt: { fontSize: 10.5, fontWeight: '700', color: Colors.textSecondary },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
});
