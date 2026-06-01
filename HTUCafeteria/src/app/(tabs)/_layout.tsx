import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const TABS = [
  { name: 'index',   icon: 'home'       as const, label: 'Home'    },
  { name: 'menu',    icon: 'restaurant' as const, label: 'Menu'    },
  { name: 'orders',  icon: 'receipt'    as const, label: 'Orders'  },
  { name: 'profile', icon: 'person'     as const, label: 'Profile' },
];

const PILL_W = 92; // fixed pill width — fits icon + short label

function FloatingTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets  = useSafeAreaInsets();
  const [barW, setBarW] = useState(0);
  const pillX   = useRef(new Animated.Value(0)).current;

  const activeRoute = (state.routes[state.index]?.name ?? 'index') as string;
  const activeIdx   = Math.max(TABS.findIndex((t) => t.name === activeRoute), 0);

  const tabW = barW / TABS.length;

  useEffect(() => {
    if (!barW) return;
    const target = activeIdx * tabW + (tabW - PILL_W) / 2;
    Animated.spring(pillX, {
      toValue: target,
      useNativeDriver: true,
      tension: 55,
      friction: 9,
    }).start();
  }, [activeIdx, barW]);

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
      <View style={styles.bar} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
        {/* Sliding content-sized pill */}
        {barW > 0 && (
          <Animated.View
            style={[styles.pill, { transform: [{ translateX: pillX }] }]}
          />
        )}

        {TABS.map((tab, i) => {
          const focused = i === activeIdx;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => { if (!focused) navigation.navigate(tab.name); }}
            >
              <Ionicons
                name={focused ? tab.icon : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                size={focused ? 20 : 22}
                color={focused ? Colors.white : Colors.tabInactive}
              />
              {focused && <Text style={styles.label}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <FloatingTabBar state={props.state} navigation={props.navigation} />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 20,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 4,
    shadowColor: 'rgba(0,0,0,0.13)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 20,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: PILL_W,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.1,
  },
});
