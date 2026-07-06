// Native fallback — Customers is a web-dashboard feature. (Web uses customers.web.tsx.)
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function CustomersNative() {
  return (
    <SafeAreaView style={s.safe}>
      <Ionicons name="people-outline" size={44} color={Colors.textMuted} />
      <Text style={s.title}>Customers</Text>
      <Text style={s.sub}>Open the web dashboard to see your customers.</Text>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, backgroundColor: Colors.background },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
