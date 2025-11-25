import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import mukokoTheme from '../theme';

export default function Logo({ size = 'md', style }) {
  const sizes = {
    sm: { fontSize: 18, padding: 4 },
    md: { fontSize: 22, padding: 8 },
    lg: { fontSize: 28, padding: 12 },
  };

  const { fontSize, padding } = sizes[size];

  return (
    <View style={[styles.container, { padding }, style]}>
      <Text style={[styles.text, { fontSize }]}>
        <Text style={styles.mukoko}>Mukoko</Text>
        <Text style={styles.space}> </Text>
        <Text style={styles.news}>News</Text>
      </Text>
      <Text style={[styles.flag, { fontSize: fontSize }]}>🇿🇼</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontWeight: '700',
    fontFamily: 'Georgia, serif',
  },
  mukoko: {
    color: mukokoTheme.colors.primary,
  },
  space: {
    color: 'transparent',
  },
  news: {
    color: mukokoTheme.colors.onSurface,
  },
  flag: {
    lineHeight: 24,
  },
});
