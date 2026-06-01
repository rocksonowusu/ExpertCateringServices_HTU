import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'muted';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'primary', size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], size === 'sm' && styles.small]}>
      <Text style={[styles.text, styles[`${variant}Text`], size === 'sm' && styles.smallText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 7, paddingVertical: 2 },

  primary: { backgroundColor: Colors.primaryLight + '20' },
  accent: { backgroundColor: Colors.accent + '25' },
  success: { backgroundColor: Colors.successLight },
  warning: { backgroundColor: Colors.warningLight },
  error: { backgroundColor: Colors.errorLight },
  muted: { backgroundColor: Colors.surface },

  text: { fontWeight: '600', fontSize: 12 },
  smallText: { fontSize: 10 },

  primaryText: { color: Colors.primary },
  accentText: { color: Colors.accentDark },
  successText: { color: Colors.success },
  warningText: { color: Colors.warning },
  errorText: { color: Colors.error },
  mutedText: { color: Colors.textSecondary },
});
