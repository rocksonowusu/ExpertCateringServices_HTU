import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrdersStore } from '@/store/ordersStore';

const PICKUP_TIMES = [
  'ASAP (15-20 min)',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
];

type PaymentMethod = 'on_delivery' | 'momo';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, totalPrice, clearCart } = useCartStore();
  const { placeOrder } = useOrdersStore();
  const [pickupTime, setPickupTime] = useState(PICKUP_TIMES[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('on_delivery');
  const [momoPhone, setMomoPhone] = useState(user?.phone ?? '');
  const [momoNetwork, setMomoNetwork] = useState<'mtn' | 'vodafone' | 'airteltigo'>('mtn');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = totalPrice();
  const serviceFee = 1;
  const total = subtotal + serviceFee;

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'momo' && (!momoPhone || !/^0[2-9]\d{8}$/.test(momoPhone))) {
      Alert.alert('Invalid Number', 'Please enter a valid Ghana MOMO phone number.');
      return;
    }
    setLoading(true);
    try {
      const order = await placeOrder({
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total,
        paymentMethod,
        pickupTime,
        notes: notes.trim() || undefined,
        userId: user?.id,
        customerName: user?.name,
      });
      clearCart();
      router.replace({ pathname: '/order-success', params: { code: order.id } });
    } catch (e: any) {
      const detail = e?.message ? `\n\nDetails: ${e.message}` : '';
      Alert.alert('Order Failed', `We could not place your order. Please check your connection and try again.${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemQty}>{item.quantity}×</Text>
              <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.orderItemPrice}>₵{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Subtotal</Text>
            <Text style={styles.feeValue}>₵{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Service Fee</Text>
            <Text style={styles.feeValue}>₵{serviceFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.feeRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₵{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Pickup time */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="time-outline" size={15} color={Colors.primary} /> Pickup Time
          </Text>
          <View style={styles.timeGrid}>
            {PICKUP_TIMES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setPickupTime(t)}
                style={[styles.timeChip, pickupTime === t && styles.timeChipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeChipText, pickupTime === t && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="wallet-outline" size={15} color={Colors.primary} /> Payment Method
          </Text>

          {/* On delivery */}
          <TouchableOpacity
            onPress={() => setPaymentMethod('on_delivery')}
            style={[styles.payOption, paymentMethod === 'on_delivery' && styles.payOptionActive]}
            activeOpacity={0.85}
          >
            <View style={[styles.payRadio, paymentMethod === 'on_delivery' && styles.payRadioActive]}>
              {paymentMethod === 'on_delivery' && <View style={styles.payRadioInner} />}
            </View>
            <View style={styles.payIconBox}>
              <Ionicons name="cash-outline" size={22} color={paymentMethod === 'on_delivery' ? Colors.primary : Colors.textSecondary} />
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payTitle, paymentMethod === 'on_delivery' && styles.payTitleActive]}>
                Pay on Delivery
              </Text>
              <Text style={styles.paySubtitle}>Pay cash when you collect your order</Text>
            </View>
          </TouchableOpacity>

          {/* MOMO */}
          <TouchableOpacity
            onPress={() => setPaymentMethod('momo')}
            style={[styles.payOption, paymentMethod === 'momo' && styles.payOptionActive]}
            activeOpacity={0.85}
          >
            <View style={[styles.payRadio, paymentMethod === 'momo' && styles.payRadioActive]}>
              {paymentMethod === 'momo' && <View style={styles.payRadioInner} />}
            </View>
            <View style={styles.payIconBox}>
              <Ionicons name="phone-portrait-outline" size={22} color={paymentMethod === 'momo' ? Colors.primary : Colors.textSecondary} />
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payTitle, paymentMethod === 'momo' && styles.payTitleActive]}>
                Mobile Money (MOMO)
              </Text>
              <Text style={styles.paySubtitle}>MTN, Vodafone Cash, AirtelTigo</Text>
            </View>
          </TouchableOpacity>

          {/* MOMO fields */}
          {paymentMethod === 'momo' && (
            <View style={styles.momoFields}>
              <Text style={styles.momoLabel}>Select Network</Text>
              <View style={styles.networkRow}>
                {(['mtn', 'vodafone', 'airteltigo'] as const).map((net) => (
                  <TouchableOpacity
                    key={net}
                    onPress={() => setMomoNetwork(net)}
                    style={[styles.networkChip, momoNetwork === net && styles.networkChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.networkText, momoNetwork === net && styles.networkTextActive]}>
                      {net === 'mtn' ? 'MTN' : net === 'vodafone' ? 'Vodafone' : 'AirtelTigo'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label="MOMO Phone Number"
                placeholder="0241234567"
                value={momoPhone}
                onChangeText={setMomoPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                leftIcon={<Ionicons name="phone-portrait-outline" size={16} color={Colors.textMuted} />}
              />
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Input
            label="Special Instructions (Optional)"
            placeholder="E.g. No pepper, extra sauce..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

      </ScrollView>

      {/* Place order */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>₵{total.toFixed(2)}</Text>
        </View>
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={loading}
          style={styles.orderBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundAlt },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: Colors.white, textAlign: 'center' },

  scroll: { padding: 16, gap: 14, paddingBottom: 24 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },

  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderItemQty: { fontSize: 13, fontWeight: '700', color: Colors.primary, width: 24 },
  orderItemName: { flex: 1, fontSize: 13, color: Colors.text },
  orderItemPrice: { fontSize: 13, fontWeight: '700', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.divider },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 13, color: Colors.textSecondary },
  feeValue: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  timeChipTextActive: { color: Colors.white },

  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
  },
  payOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  payRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payRadioActive: { borderColor: Colors.primary },
  payRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  payIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payInfo: { flex: 1 },
  payTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  payTitleActive: { color: Colors.text },
  paySubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  momoFields: { gap: 12, marginTop: 4 },
  momoLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  networkRow: { flexDirection: 'row', gap: 8 },
  networkChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  networkChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  networkText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  networkTextActive: { color: Colors.white },

  footer: {
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
  footerTotal: { gap: 2 },
  footerTotalLabel: { fontSize: 12, color: Colors.textSecondary },
  footerTotalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  orderBtn: { flex: 1 },
});
