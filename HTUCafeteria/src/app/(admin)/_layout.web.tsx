// Web-only admin shell: a floating, expandable sidebar rail wrapping the admin
// screens. (Native/mobile keeps the bottom-tab layout in _layout.tsx.)
import { useEffect, useRef, useState } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { ECSLogo } from '@/components/ECSLogo';
import { useAuthStore } from '@/store/authStore';
import { useOrdersStore } from '@/store/ordersStore';
import type { Order } from '@/constants/data';

type IconName = keyof typeof Ionicons.glyphMap;
type NavEntry = { key: string; label: string; icon: IconName; path: string };

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const STATUS_TINT: Record<Order['status'], string> = {
  pending: Colors.statusPending,
  preparing: Colors.statusPreparing,
  ready: Colors.statusReady,
  delivered: Colors.statusDelivered,
  cancelled: Colors.statusCancelled,
};

// ── Right-hand notifications panel ─────────────────────────────
function NotificationsPanel({
  visible, orders, seenBefore, onClose, onOpenOrders,
}: {
  visible: boolean;
  orders: Order[];
  seenBefore: number;
  onClose: () => void;
  onOpenOrders: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const panelW = Math.min(400, width);
  const tx = useRef(new Animated.Value(panelW)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      tx.setValue(panelW);
      backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(tx, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 5 }),
      ]).start();
    }
  }, [visible, panelW, tx, backdrop]);

  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 170, useNativeDriver: true }),
      Animated.timing(tx, { toValue: panelW, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const newCount = orders.filter((o) => new Date(o.createdAt).getTime() > seenBefore).length;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[np.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <Animated.View style={[np.panel, { width: panelW, height, transform: [{ translateX: tx }] }]}>
          {/* Header */}
          <View style={np.header}>
            <View style={np.headIcon}><Ionicons name="notifications" size={18} color={Colors.white} /></View>
            <View style={{ flex: 1 }}>
              <Text style={np.title}>Notifications</Text>
              <Text style={np.sub}>{newCount > 0 ? `${newCount} new` : 'All caught up'}</Text>
            </View>
            <TouchableOpacity style={np.closeBtn} onPress={close} activeOpacity={0.75}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Feed */}
          <ScrollView contentContainerStyle={np.list} showsVerticalScrollIndicator={false}>
            {orders.length === 0 ? (
              <View style={np.empty}>
                <Ionicons name="notifications-off-outline" size={38} color={Colors.textMuted} />
                <Text style={np.emptyTxt}>No notifications yet</Text>
              </View>
            ) : (
              orders.slice(0, 40).map((o) => {
                const isNew = new Date(o.createdAt).getTime() > seenBefore;
                const tint = STATUS_TINT[o.status];
                const heading = o.channel === 'pos' ? `Counter sale · #${o.id}` : `New order · #${o.id}`;
                return (
                  <TouchableOpacity
                    key={o.id}
                    style={[np.row, isNew && np.rowNew]}
                    activeOpacity={0.8}
                    onPress={onOpenOrders}
                  >
                    <View style={[np.rowIcon, { backgroundColor: tint + '18' }]}>
                      <Ionicons name={o.channel === 'pos' ? 'cart' : 'receipt'} size={17} color={tint} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={np.rowTitle} numberOfLines={1}>{heading}</Text>
                      <Text style={np.rowBody} numberOfLines={1}>
                        {o.customerName ?? 'Guest'} · {o.items.length} item{o.items.length !== 1 ? 's' : ''} · ₵{o.total.toFixed(2)}
                      </Text>
                      <View style={np.rowMeta}>
                        <View style={[np.statusDot, { backgroundColor: tint }]} />
                        <Text style={np.rowStatus}>{o.status}</Text>
                        <Text style={np.rowDot}>·</Text>
                        <Text style={np.rowTime}>{timeAgo(o.createdAt)}</Text>
                        {o.paymentStatus === 'paid' && <Text style={np.paidTag}>PAID</Text>}
                      </View>
                    </View>
                    {isNew && <View style={np.newDot} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity style={np.footer} onPress={onOpenOrders} activeOpacity={0.85}>
            <Text style={np.footerTxt}>View all orders</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const np = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(28,2,12,0.5)' },
  panel: {
    backgroundColor: Colors.white,
    shadowColor: 'rgba(0,0,0,0.35)', shadowOffset: { width: -8, height: 0 }, shadowOpacity: 1, shadowRadius: 30,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text },
  sub: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 1 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 12, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  rowNew: { backgroundColor: '#FFF9EF', borderColor: Colors.accent + '40' },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13.5, fontWeight: '800', color: Colors.text },
  rowBody: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  rowStatus: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'capitalize' },
  rowDot: { fontSize: 11, color: Colors.textMuted },
  rowTime: { fontSize: 11, color: Colors.textMuted },
  paidTag: { fontSize: 9, fontWeight: '800', color: Colors.success, backgroundColor: Colors.successLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2 },
  newDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.accent },
  empty: { alignItems: 'center', paddingVertical: 70, gap: 12 },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerTxt: { fontSize: 14, fontWeight: '800', color: Colors.primary },
});

const NAV: NavEntry[] = [
  { key: 'dashboard',     label: 'Dashboard',    icon: 'grid',        path: '/(admin)/dashboard' },
  { key: 'pos',           label: 'POS', icon: 'cart',       path: '/(admin)/pos' },
  { key: 'manage-orders', label: 'Orders',       icon: 'receipt',     path: '/(admin)/manage-orders' },
  { key: 'transactions',  label: 'Transactions', icon: 'card',        path: '/(admin)/transactions' },
  { key: 'manage-menu',   label: 'Menu',         icon: 'restaurant',  path: '/(admin)/manage-menu' },
  { key: 'customers',     label: 'Customers',    icon: 'people',      path: '/(admin)/customers' },
];

const COLLAPSED = 88;
const EXPANDED = 244;

// A single nav entry. When the rail is collapsed, hovering the icon flies a
// labelled pill out to the right; when expanded it's a normal full-width row.
function NavItem({
  item, active, expanded, onPress,
}: { item: NavEntry; active: boolean; expanded: boolean; onPress: () => void }) {
  const [hover, setHover] = useState(false);
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(a, {
      toValue: hover ? 1 : 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [a, hover]);

  const iconName = (active ? item.icon : `${item.icon}-outline`) as any;
  const hoverProps = {
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
  } as any;

  // Expanded rail → static full-width row.
  if (expanded) {
    return (
      <TouchableOpacity
        style={[s.navItem, s.navItemExpanded, (active || hover) && s.navItemActive]}
        onPress={onPress}
        activeOpacity={0.85}
        {...hoverProps}
      >
        <Ionicons name={iconName} size={21} color={active ? Colors.white : 'rgba(255,255,255,0.75)'} />
        <Text style={[s.navLabel, active && s.navLabelActive]}>{item.label}</Text>
      </TouchableOpacity>
    );
  }

  // Collapsed rail → icon button + hover flyout.
  return (
    <View style={[s.navSlot, { zIndex: hover ? 40 : 1 }]} {...hoverProps}>
      <TouchableOpacity
        style={[s.navBase, active && s.navItemActive]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Ionicons name={iconName} size={22} color={active ? Colors.white : 'rgba(255,255,255,0.7)'} />
      </TouchableOpacity>

      {/* Flyout — grows from the icon, overflowing to the right */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.flyout,
          active && s.flyoutActive,
          {
            opacity: a,
            transform: [
              { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
              { scaleX: a.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
            ],
          },
        ]}
      >
        <Ionicons name={iconName} size={22} color={Colors.white} />
        <Text style={s.flyoutLabel}>{item.label}</Text>
      </Animated.View>
    </View>
  );
}

export default function AdminWebLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const [expanded, setExpanded] = useState(false);
  const w = useRef(new Animated.Value(COLLAPSED)).current;
  const enter = useRef(new Animated.Value(0)).current;

  // Rail slides in on first mount.
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [enter]);

  const toggle = () => {
    const to = expanded ? COLLAPSED : EXPANDED;
    Animated.timing(w, {
      toValue: to, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const isActive = (key: string) => pathname.includes(key);
  const initial = user?.name?.[0]?.toUpperCase() ?? 'A';

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.confirm('Sign out of the admin panel?')) logout();
  };

  // ── Notifications: live orders feed ──
  const { orders, loadAll: loadOrders, subscribe: subscribeOrders } = useOrdersStore();
  useEffect(() => {
    loadOrders();
    const unsub = subscribeOrders();
    return unsub;
  }, [loadOrders, subscribeOrders]);

  const [lastSeen, setLastSeen] = useState<number>(() =>
    typeof localStorage !== 'undefined' ? Number(localStorage.getItem('admin_notif_seen') ?? 0) : 0
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const seenAtOpen = useRef(0);
  const unread = orders.filter((o) => new Date(o.createdAt).getTime() > lastSeen).length;

  const openNotifications = () => {
    seenAtOpen.current = lastSeen;   // remember what was new before we clear the badge
    setNotifOpen(true);
    const now = Date.now();
    setLastSeen(now);
    if (typeof localStorage !== 'undefined') localStorage.setItem('admin_notif_seen', String(now));
  };

  return (
    <View style={s.shell}>
      {/* ── Floating rail ── */}
      <Animated.View
        style={[
          s.rail,
          {
            width: w,
            opacity: enter,
            transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
          },
        ]}
      >
        {/* Top: toggle + brand */}
        <View style={[s.top, expanded ? s.topExpanded : s.topCollapsed]}>
          <TouchableOpacity style={s.toggleBtn} onPress={toggle} activeOpacity={0.8}>
            <Ionicons name={expanded ? 'chevron-back' : 'menu'} size={20} color={Colors.white} />
          </TouchableOpacity>
          {expanded && (
            <View style={s.brandText}>
              <Text style={s.brandName}>HTU Cafeteria</Text>
              <Text style={s.brandSub}>ADMIN</Text>
            </View>
          )}
        </View>

        <View style={s.logoWrap}>
          <ECSLogo size="sm" variant="light" />
        </View>

        {/* Notifications bell */}
        <TouchableOpacity
          style={[s.bell, expanded ? s.bellExpanded : s.bellCollapsed]}
          onPress={openNotifications}
          activeOpacity={0.85}
        >
          <View style={s.bellIconWrap}>
            <Ionicons name="notifications-outline" size={21} color="rgba(255,255,255,0.85)" />
            {unread > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeTxt}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
          {expanded && <Text style={s.bellLabel}>Notifications</Text>}
        </TouchableOpacity>

        {/* Nav */}
        <View style={s.nav}>
          {NAV.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={isActive(item.key)}
              expanded={expanded}
              onPress={() => router.push(item.path as any)}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          {expanded ? (
            <View style={s.userRow}>
              <View style={s.avatar}><Text style={s.avatarTxt}>{initial}</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.userName} numberOfLines={1}>{user?.name ?? 'Admin'}</Text>
                <Text style={s.userRole}>Cafeteria Admin</Text>
              </View>
            </View>
          ) : (
            <View style={[s.avatar, { alignSelf: 'center' }]}><Text style={s.avatarTxt}>{initial}</Text></View>
          )}
          <TouchableOpacity
            style={[s.logoutBtn, expanded ? s.logoutExpanded : s.logoutCollapsed]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={19} color="rgba(255,255,255,0.9)" />
            {expanded && <Text style={s.logoutTxt}>Sign Out</Text>}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Main content ── */}
      <View style={s.main}>
        <Slot />
      </View>

      {/* ── Notifications panel (slides in from the right) ── */}
      <NotificationsPanel
        visible={notifOpen}
        orders={orders}
        seenBefore={seenAtOpen.current}
        onClose={() => setNotifOpen(false)}
        onOpenOrders={() => { setNotifOpen(false); router.push('/(admin)/manage-orders' as any); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: Colors.backgroundAlt, minHeight: '100%' as any },

  rail: {
    margin: 16,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    justifyContent: 'space-between',
    overflow: 'visible',            // let hover flyouts extend past the rail edge
    zIndex: 30,                     // …and paint above the main content
    shadowColor: 'rgba(85,5,39,0.35)',
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 28,
  },

  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topCollapsed: { justifyContent: 'center' },
  topExpanded: { paddingHorizontal: 18 },
  toggleBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { fontSize: 14, fontWeight: '900', color: Colors.white },
  brandSub: { fontSize: 9, fontWeight: '700', color: Colors.accent, letterSpacing: 1.5 },

  logoWrap: { alignItems: 'center', marginTop: 18, marginBottom: 4 },

  // Notifications bell
  bell: { borderRadius: 16, alignItems: 'center' },
  bellCollapsed: { width: 52, height: 52, justifyContent: 'center', alignSelf: 'center', marginTop: 6 },
  bellExpanded: { flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 13, width: '100%', marginTop: 6 },
  bellIconWrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute', top: -7, right: -9,
    backgroundColor: Colors.accent, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  bellBadgeTxt: { fontSize: 9, fontWeight: '800', color: Colors.white },
  bellLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  nav: { flex: 1, justifyContent: 'center', gap: 10, paddingHorizontal: 18 },
  navItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 16 },
  navItemExpanded: { paddingHorizontal: 16, paddingVertical: 14, gap: 14, width: '100%' },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  navLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.72)' },
  navLabelActive: { color: Colors.white, fontWeight: '700' },

  // Collapsed nav item + hover flyout
  navSlot: { width: 52, height: 52, alignSelf: 'center', position: 'relative' },
  navBase: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  flyout: {
    position: 'absolute', left: 0, top: 0, height: 52,
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingLeft: 15, paddingRight: 22, borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    shadowColor: 'rgba(0,0,0,0.35)',
    shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 16,
    ...({ transformOrigin: 'left center' } as any),
  },
  flyoutActive: { backgroundColor: Colors.primaryLight },
  flyoutLabel: { fontSize: 14, fontWeight: '700', color: Colors.white },

  footer: { gap: 12, paddingHorizontal: 18 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 8,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 13, fontWeight: '700', color: Colors.white },
  userRole: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutCollapsed: { width: 52, height: 48, justifyContent: 'center', alignSelf: 'center' },
  logoutExpanded: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, justifyContent: 'center' },
  logoutTxt: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },

  main: { flex: 1, minWidth: 0, zIndex: 1 },
});
