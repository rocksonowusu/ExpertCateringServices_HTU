import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ECSLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

const sizes = {
  sm: { outer: 56, inner: 42, ecs: 16, htu: 9, ring: 2 },
  md: { outer: 80, inner: 60, ecs: 22, htu: 11, ring: 3 },
  lg: { outer: 110, inner: 82, ecs: 30, htu: 14, ring: 3 },
};

export function ECSLogo({ size = 'md', variant = 'light' }: ECSLogoProps) {
  const s = sizes[size];
  const isLight = variant === 'light';

  const outerBg = isLight ? 'rgba(255,255,255,0.18)' : Colors.primary;
  const outerBorder = isLight ? 'rgba(255,255,255,0.55)' : Colors.primaryLight;
  const innerBg = isLight ? 'rgba(255,255,255,0.12)' : Colors.backgroundAlt;
  const ecsColor = isLight ? Colors.white : Colors.primary;
  const htuColor = isLight ? 'rgba(255,255,255,0.75)' : Colors.secondary;
  const swooshColor = isLight ? 'rgba(255,255,255,0.35)' : Colors.primaryLight;

  return (
    <View style={[styles.outer, {
      width: s.outer, height: s.outer, borderRadius: s.outer / 2,
      backgroundColor: outerBg, borderColor: outerBorder, borderWidth: s.ring,
    }]}>
      {/* Decorative swoosh arc */}
      <View style={[styles.swoosh, {
        width: s.outer * 0.7, height: s.outer * 0.7,
        borderRadius: s.outer * 0.35,
        borderColor: swooshColor,
        top: -s.outer * 0.18, right: -s.outer * 0.18,
      }]} />

      <View style={[styles.inner, {
        width: s.inner, height: s.inner, borderRadius: s.inner / 2,
        backgroundColor: innerBg,
      }]}>
        <Text style={[styles.ecsText, { fontSize: s.ecs, color: ecsColor }]}>ecs</Text>
        <Text style={[styles.htuText, { fontSize: s.htu, color: htuColor }]}>HTU</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  swoosh: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  ecsText: {
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  htuText: {
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
