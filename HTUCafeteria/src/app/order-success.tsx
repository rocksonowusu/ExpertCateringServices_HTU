import {
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

const ORDER_ID = `HTU${String(Math.floor(10000 + Math.random() * 90000)).slice(0, 5)}`;

const STATUS_STEPS = [
  { icon: 'checkmark-circle', label: 'Order Placed', done: true },
  { icon: 'restaurant', label: 'Preparing', done: false },
  { icon: 'bag-check', label: 'Ready for Pickup', done: false },
];

export default function OrderSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Success animation area */}
        <View style={styles.successBlock}>
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark" size={44} color={Colors.white} />
              </View>
            </View>
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>
            Your order has been confirmed and is being prepared.
          </Text>
        </View>

        {/* Order ID card */}
        <View style={styles.orderIdCard}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderIdValue}>#{ORDER_ID}</Text>
          <TouchableOpacity style={styles.copyBtn} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={14} color={Colors.primary} />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Progress tracker */}
        <View style={styles.tracker}>
          <Text style={styles.trackerTitle}>Order Status</Text>
          <View style={styles.steps}>
            {STATUS_STEPS.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                  <Ionicons
                    name={step.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={step.done ? Colors.white : Colors.textMuted}
                  />
                </View>
                {i < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                )}
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoRow}>
          <Ionicons name="notifications-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            We'll notify you when your order is ready for pickup at the counter.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            title="Track Order"
            onPress={() => router.replace('/(tabs)/orders')}
            fullWidth
            size="lg"
          />
          <Button
            title="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 20 },

  successBlock: { alignItems: 'center', gap: 14 },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.success + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: Colors.text },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  orderIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '100%',
  },
  orderIdLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  orderIdValue: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.primary },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  tracker: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  trackerTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  steps: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  step: { alignItems: 'center', flex: 1, gap: 8, position: 'relative' },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepLine: {
    position: 'absolute',
    top: 17,
    left: '60%',
    right: '-60%',
    height: 2,
    backgroundColor: Colors.border,
  },
  stepLineDone: { backgroundColor: Colors.success },
  stepLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', fontWeight: '500' },
  stepLabelDone: { color: Colors.success, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  buttons: { width: '100%', gap: 10 },
});
