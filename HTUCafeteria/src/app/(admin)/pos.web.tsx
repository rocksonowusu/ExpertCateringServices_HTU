// Web-only admin POS (point of sale) — ring up walk-in counter sales.
// Creates a real order (channel: 'pos', paid, delivered) so counter sales
// join app sales in the same orders + transactions system.
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { type MenuItem } from '@/constants/data';
import { useOrdersStore } from '@/store/ordersStore';
import { useMenuStore } from '@/store/menuStore';

const CATEGORIES = ['All', 'Rice Dishes', 'Soups & Stews', 'Fast Food', 'Snacks', 'Drinks', 'Breakfast'];
const SERVICE_FEE = 0;

type Line = { item: MenuItem; qty: number };

export default function PosWeb() {
  const { placeOrder } = useOrdersStore();
  const menuItems = useMenuStore((s) => s.items);
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState('');
  const [method, setMethod] = useState<'cash' | 'momo'>('cash');
  const [placing, setPlacing] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);

  const menuCols = wide ? (width >= 1500 ? 5 : 4) : 3;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter(
      (i) => i.isAvailable && (cat === 'All' || i.category === cat) && (!q || i.name.toLowerCase().includes(q))
    );
  }, [cat, search, menuItems]);

  const add = (item: MenuItem) =>
    setLines((prev) => {
      const ex = prev.find((l) => l.item.id === item.id);
      if (ex) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { item, qty: 1 }];
    });
  const bump = (id: string, d: number) =>
    setLines((prev) =>
      prev
        .map((l) => (l.item.id === id ? { ...l, qty: l.qty + d } : l))
        .filter((l) => l.qty > 0)
    );
  const clear = () => setLines([]);

  const subtotal = lines.reduce((a, l) => a + l.item.price * l.qty, 0);
  const total = subtotal + SERVICE_FEE;

  const charge = async () => {
    if (lines.length === 0 || placing) return;
    setPlacing(true);
    try {
      const order = await placeOrder({
        items: lines.map((l) => ({ name: l.item.name, quantity: l.qty, price: l.item.price })),
        total,
        paymentMethod: method === 'momo' ? 'momo' : 'on_delivery',
        paymentStatus: 'paid',
        status: 'delivered',
        channel: 'pos',
        pickupTime: 'Counter',
        customerName: customer.trim() || 'Walk-in',
      });
      setDoneCode(order.id);
      setLines([]);
      setCustomer('');
      setTimeout(() => setDoneCode(null), 3500);
    } catch {
      if (typeof window !== 'undefined') window.alert('Could not record the sale. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={[s.page, wide ? s.row : s.col]}>
      {/* ── Left: menu ── */}
      <View style={s.menuPane}>
        <View style={s.menuHead}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Point of Sale</Text>
            <Text style={s.subtitle}>Ring up a walk-in customer</Text>
          </View>
          <View style={s.search}>
            <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search dishes…"
              placeholderTextColor={Colors.textMuted}
              style={[s.searchInput, { outlineWidth: 0 } as any]}
            />
          </View>
        </View>

        <View style={s.tabs}>
          {CATEGORIES.map((c) => {
            const active = cat === c;
            return (
              <TouchableOpacity key={c} onPress={() => setCat(c)} style={s.tabWrap} activeOpacity={0.8}>
                <Text style={[s.tab, active && s.tabActive]}>{c}</Text>
                {active && <View style={s.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.menuGrid} showsVerticalScrollIndicator={false}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[s.foodCard, { flexBasis: `${100 / menuCols}%` as any, maxWidth: `${100 / menuCols}%` as any }]}
              onPress={() => add(item)}
              activeOpacity={0.85}
            >
              <View style={s.foodInner}>
                <Image source={{ uri: item.image }} style={s.foodImg} contentFit="cover" transition={150} />
                <View style={s.foodBody}>
                  <Text style={s.foodName} numberOfLines={1}>{item.name}</Text>
                  <View style={s.foodFoot}>
                    <Text style={s.foodPrice}>₵{item.price}</Text>
                    <View style={s.addChip}><Ionicons name="add" size={15} color={Colors.white} /></View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Right: cart ── */}
      <View style={[s.cartPane, wide ? { width: 380 } : undefined]}>
        <View style={s.cartHead}>
          <Ionicons name="cart-outline" size={20} color={Colors.primary} />
          <Text style={s.cartTitle}>Current Sale</Text>
          {lines.length > 0 && (
            <TouchableOpacity onPress={clear} activeOpacity={0.7} style={s.clearBtn}>
              <Text style={s.clearTxt}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
          {lines.length === 0 ? (
            <View style={s.cartEmpty}>
              <Ionicons name="fast-food-outline" size={34} color={Colors.textMuted} />
              <Text style={s.cartEmptyTxt}>Tap dishes to add them</Text>
            </View>
          ) : (
            lines.map((l) => (
              <View key={l.item.id} style={s.line}>
                <Image source={{ uri: l.item.image }} style={s.lineImg} contentFit="cover" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.lineName} numberOfLines={1}>{l.item.name}</Text>
                  <Text style={s.linePrice}>₵{l.item.price} each</Text>
                </View>
                <View style={s.qtyBox}>
                  <TouchableOpacity onPress={() => bump(l.item.id, -1)} style={s.qtyBtn} activeOpacity={0.8}>
                    <Ionicons name="remove" size={15} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={s.qtyTxt}>{l.qty}</Text>
                  <TouchableOpacity onPress={() => bump(l.item.id, 1)} style={s.qtyBtn} activeOpacity={0.8}>
                    <Ionicons name="add" size={15} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={s.lineTotal}>₵{(l.item.price * l.qty).toFixed(2)}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer: customer, payment, charge */}
        <View style={s.cartFoot}>
          <TextInput
            value={customer}
            onChangeText={setCustomer}
            placeholder="Customer name (optional)"
            placeholderTextColor={Colors.textMuted}
            style={[s.custInput, { outlineWidth: 0 } as any]}
          />

          <View style={s.payRow}>
            {(['cash', 'momo'] as const).map((m) => {
              const active = method === m;
              return (
                <TouchableOpacity key={m} onPress={() => setMethod(m)} style={[s.payOpt, active && s.payOptActive]} activeOpacity={0.85}>
                  <Ionicons name={m === 'cash' ? 'cash-outline' : 'phone-portrait-outline'} size={16} color={active ? Colors.white : Colors.textSecondary} />
                  <Text style={[s.payTxt, active && s.payTxtActive]}>{m === 'cash' ? 'Cash' : 'MoMo'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>₵{total.toFixed(2)}</Text>
          </View>

          {doneCode ? (
            <View style={s.doneBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={s.doneTxt}>Sale recorded · #{doneCode}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.chargeBtn, (lines.length === 0 || placing) && s.chargeOff]}
              onPress={charge}
              disabled={lines.length === 0 || placing}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={s.chargeTxt}>{placing ? 'Recording…' : `Charge ₵${total.toFixed(2)}`}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.backgroundAlt },
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },

  // Menu pane
  menuPane: { flex: 1, minWidth: 0, padding: 24, gap: 16 },
  menuHead: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  title: { fontSize: 23, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.white, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border, minWidth: 220,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabWrap: { paddingVertical: 7 },
  tab: { fontSize: 13.5, fontWeight: '600', color: Colors.textMuted },
  tabActive: { color: Colors.primary, fontWeight: '800' },
  tabUnderline: { height: 3, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 5 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, paddingBottom: 12 },

  foodCard: { padding: 5 },
  foodInner: {
    backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    ...({ cursor: 'pointer' } as any),
  },
  foodImg: { width: '100%', height: 74 },
  foodBody: { padding: 8, gap: 6 },
  foodName: { fontSize: 12, fontWeight: '700', color: Colors.text },
  foodFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  foodPrice: { fontSize: 13.5, fontWeight: '900', color: Colors.primary },
  addChip: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  // Cart pane
  cartPane: {
    backgroundColor: Colors.white,
    borderLeftWidth: 1, borderLeftColor: Colors.border,
    padding: 20, gap: 14,
  },
  cartHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartTitle: { flex: 1, fontSize: 17, fontWeight: '900', color: Colors.text },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.backgroundAlt },
  clearTxt: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },

  cartEmpty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  cartEmptyTxt: { fontSize: 13.5, color: Colors.textMuted, fontWeight: '600' },

  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineImg: { width: 40, height: 40, borderRadius: 10 },
  lineName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  linePrice: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.backgroundAlt, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 3 },
  qtyBtn: { width: 24, height: 24, borderRadius: 8, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  qtyTxt: { fontSize: 13, fontWeight: '800', color: Colors.text, minWidth: 16, textAlign: 'center' },
  lineTotal: { fontSize: 13.5, fontWeight: '800', color: Colors.primary, width: 60, textAlign: 'right' },

  cartFoot: { gap: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  custInput: {
    backgroundColor: Colors.backgroundAlt, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 13.5, color: Colors.text,
  },
  payRow: { flexDirection: 'row', gap: 10 },
  payOpt: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 11, borderRadius: 12, backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  payOptActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  payTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  payTxtActive: { color: Colors.white },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 24, fontWeight: '900', color: Colors.primary },

  chargeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
  },
  chargeOff: { opacity: 0.5 },
  chargeTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
  doneBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.successLight, borderRadius: 14, paddingVertical: 15,
  },
  doneTxt: { fontSize: 14, fontWeight: '800', color: Colors.success },
});
