import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { mockOrders, menuItems } from '@/constants/data';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
  color: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const todayOrders = mockOrders.slice(0, 3);
const todayRevenue = todayOrders
  .filter((o) => o.status !== 'cancelled')
  .reduce((a, o) => a + o.total, 0);

const statusCounts = mockOrders.reduce(
  (acc, o) => ({ ...acc, [o.status]: (acc[o.status as keyof typeof acc] ?? 0) + 1 }),
  {} as Record<string, number>
);

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of the admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.adminBadge}>ADMIN PANEL</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSub}>HTU Cafeteria Management</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Today's stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="receipt-outline"
              label="Total Orders"
              value={String(mockOrders.length)}
              sub="Today"
              color={Colors.primary}
            />
            <StatCard
              icon="cash-outline"
              label="Revenue"
              value={`₵${todayRevenue}`}
              sub="Collected"
              color={Colors.success}
            />
            <StatCard
              icon="time-outline"
              label="Pending"
              value={String(statusCounts['pending'] ?? 0)}
              sub="Awaiting prep"
              color={Colors.statusPending}
            />
            <StatCard
              icon="restaurant-outline"
              label="Preparing"
              value={String(statusCounts['preparing'] ?? 0)}
              sub="In kitchen"
              color={Colors.statusPreparing}
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="Ready"
              value={String(statusCounts['ready'] ?? 0)}
              sub="For pickup"
              color={Colors.statusReady}
            />
            <StatCard
              icon="bag-check-outline"
              label="Delivered"
              value={String(statusCounts['delivered'] ?? 0)}
              sub="Completed"
              color={Colors.statusDelivered}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: 'add-circle-outline' as const, label: 'Add Menu Item', color: Colors.primary },
              { icon: 'notifications-outline' as const, label: 'Send Alert', color: Colors.accent },
              { icon: 'bar-chart-outline' as const, label: 'Reports', color: Colors.statusPreparing },
              { icon: 'settings-outline' as const, label: 'Settings', color: Colors.textSecondary },
            ].map((action) => (
              <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.8}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.ordersList}>
            {mockOrders.slice(0, 4).map((order) => {
              const statusColors: Record<string, string> = {
                pending: Colors.statusPending,
                preparing: Colors.statusPreparing,
                ready: Colors.statusReady,
                delivered: Colors.statusDelivered,
                cancelled: Colors.statusCancelled,
              };
              return (
                <View key={order.id} style={styles.orderRow}>
                  <View>
                    <Text style={styles.orderId}>#{order.id}</Text>
                    <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  </View>
                  <View style={styles.orderMid}>
                    <Text style={styles.orderItems}>{order.items.length} item(s)</Text>
                    <Text style={styles.orderTime}>{order.pickupTime}</Text>
                  </View>
                  <View>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[order.status] + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.orderTotal}>₵{order.total}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Menu stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Overview</Text>
          <View style={styles.menuStats}>
            <View style={styles.menuStatItem}>
              <Text style={styles.menuStatValue}>{menuItems.length}</Text>
              <Text style={styles.menuStatLabel}>Total Items</Text>
            </View>
            <View style={styles.menuStatDivider} />
            <View style={styles.menuStatItem}>
              <Text style={styles.menuStatValue}>{menuItems.filter((m) => m.isAvailable).length}</Text>
              <Text style={styles.menuStatLabel}>Available</Text>
            </View>
            <View style={styles.menuStatDivider} />
            <View style={styles.menuStatItem}>
              <Text style={styles.menuStatValue}>{menuItems.filter((m) => m.isPopular).length}</Text>
              <Text style={styles.menuStatLabel}>Popular</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundAlt },
  scroll: { paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  adminBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statInfo: {},
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '900', color: Colors.text },
  statSub: { fontSize: 10, color: Colors.textMuted },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },

  ordersList: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  orderId: { fontSize: 13, fontWeight: '700', color: Colors.text },
  orderCustomer: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  orderMid: { alignItems: 'center' },
  orderItems: { fontSize: 12, color: Colors.textSecondary },
  orderTime: { fontSize: 11, color: Colors.textMuted },
  statusDot: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-end' },
  statusText: { fontSize: 10, fontWeight: '700' },
  orderTotal: { fontSize: 13, fontWeight: '800', color: Colors.primary, textAlign: 'right', marginTop: 2 },

  menuStats: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 20,
  },
  menuStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  menuStatValue: { fontSize: 24, fontWeight: '900', color: Colors.white },
  menuStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  menuStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
});
