import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import mukokoTheme from '../theme';

export default function Logo({ size = 'md', style }) {
  const sizes = {
    sm: { fontSize: 20, padding: 4 },
    md: { fontSize: 24, padding: 8 },
    lg: { fontSize: 32, padding: 12 },
  };

  const { fontSize, padding } = sizes[size];

  return (
    <View style={[styles.container, { padding }, style]}>
      <Text style={[styles.text, { fontSize }]}>
        Mukoko News
      </Text>
      <Text style={[styles.flag, { fontSize: fontSize * 0.7 }]}>🇿🇼</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '700',
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    color: mukokoTheme.colors.onSurface,
  },
  flag: {
    lineHeight: 24,
  },
});
