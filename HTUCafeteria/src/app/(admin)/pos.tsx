// Native fallback — POS is a web-dashboard feature. (Web uses pos.web.tsx.)
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function PosNative() {
  return (
    <SafeAreaView style={s.safe}>
      <Ionicons name="cart-outline" size={44} color={Colors.textMuted} />
      <Text style={s.title}>Point of Sale</Text>
      <Text style={s.sub}>Open the web dashboard to ring up counter sales.</Text>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, backgroundColor: Colors.background },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
