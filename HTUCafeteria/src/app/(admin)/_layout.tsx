import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

function AdminTabIcon({
  name,
  focused,
  label,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}) {
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={22}
        color={focused ? Colors.primary : Colors.tabInactive}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <AdminTabIcon name="grid" focused={focused} label="Dashboard" />
          ),
        }}
      />
      <Tabs.Screen
        name="manage-menu"
        options={{
          tabBarIcon: ({ focused }) => (
            <AdminTabIcon name="restaurant" focused={focused} label="Menu" />
          ),
        }}
      />
      <Tabs.Screen
        name="manage-orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <AdminTabIcon name="receipt" focused={focused} label="Orders" />
          ),
        }}
      />
      {/* Web-only admin routes — hidden from the mobile tab bar */}
      <Tabs.Screen name="pos" options={{ href: null }} />
      <Tabs.Screen name="transactions" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    elevation: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  tabIcon: { alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 10, color: Colors.tabInactive, fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});
