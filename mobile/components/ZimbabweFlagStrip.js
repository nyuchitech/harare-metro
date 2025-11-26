import React from 'react';
import { View, StyleSheet } from 'react-native';
import mukokoTheme from '../theme';

/**
 * Zimbabwe Flag Strip Component
 *
 * Displays a simplified Zimbabwe flag as a vertical strip on the left side
 * with 5 unique horizontal stripes (no repeating colors):
 * - Green (top) - Growth, prosperity, agriculture
 * - Yellow - Mineral wealth, sunshine
 * - Red - Heritage, struggle, passion
 * - Black - African heritage, strength
 * - White (bottom) - Peace, unity, progress
 *
 * Plus red star indicator on white stripe
 */
export default function ZimbabweFlagStrip({ style }) {
  return (
    <View style={[styles.container, style]}>
      {/* 5 unique horizontal stripes - no repeating colors */}
      <View style={[styles.stripe, styles.green]} />
      <View style={[styles.stripe, styles.yellow]} />
      <View style={[styles.stripe, styles.red]} />
      <View style={[styles.stripe, styles.black]} />
      <View style={[styles.stripe, styles.white]} />

      {/* Red star indicator on white stripe */}
      <View style={styles.starIndicator}>
        <View style={styles.redStar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 12,
    height: '100%',
    zIndex: 1000,
    flexDirection: 'column',
  },
  stripe: {
    flex: 1,
    width: '100%',
  },
  green: {
    backgroundColor: mukokoTheme.colors.zwGreen,
  },
  yellow: {
    backgroundColor: mukokoTheme.colors.zwYellow,
  },
  red: {
    backgroundColor: mukokoTheme.colors.zwRed,
  },
  black: {
    backgroundColor: mukokoTheme.colors.zwBlack,
  },
  white: {
    backgroundColor: mukokoTheme.colors.zwWhite,
  },
  starIndicator: {
    position: 'absolute',
    left: 0,
    bottom: '10%',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redStar: {
    width: 6,
    height: 6,
    backgroundColor: mukokoTheme.colors.zwRed,
    transform: [{ rotate: '45deg' }],
  },
});
