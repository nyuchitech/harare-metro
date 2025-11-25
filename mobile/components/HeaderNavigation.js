import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Appbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mukokoTheme from '../theme';
import Logo from './Logo';

/**
 * Mukoko News Header Navigation Component
 *
 * Top navigation bar with logo, search, and profile actions
 * Adapted from Harare Metro web version for React Native
 *
 * Props:
 * - navigation: React Navigation object
 * - currentRoute: Current route name
 * - isAuthenticated: Boolean for auth state
 * - onSearchPress: Callback for search action
 * - showBack: Show back button (optional)
 * - title: Custom title text (optional, overrides logo)
 */
export default function HeaderNavigation({
  navigation,
  currentRoute = 'Home',
  isAuthenticated = false,
  onSearchPress,
  showBack = false,
  title,
}) {
  const handleHomePress = () => {
    navigation.navigate('Home');
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      // Navigate to search screen when implemented
      console.log('Search pressed');
    }
  };

  const handleProfilePress = () => {
    if (isAuthenticated) {
      navigation.navigate('Profile');
    } else {
      // Navigate to auth screen
      navigation.navigate('Profile');
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={mukokoTheme.colors.primary}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Appbar.Header style={styles.header} elevated>
          {/* Back Button (conditional) */}
          {showBack ? (
            <Appbar.BackAction
              onPress={handleBackPress}
              color={mukokoTheme.colors.onPrimary}
            />
          ) : null}

          {/* Logo or Title */}
          {title ? (
            <Appbar.Content
              title={title}
              titleStyle={styles.titleText}
              color={mukokoTheme.colors.onPrimary}
            />
          ) : (
            <View style={styles.logoContainer}>
              <TouchableOpacity
                onPress={handleHomePress}
                activeOpacity={0.7}
                accessible
                accessibilityLabel="Go to home"
              >
                <Logo variant="compact" size="md" />
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {/* Search Button */}
            <IconButton
              icon="magnify"
              iconColor={mukokoTheme.colors.onPrimary}
              size={24}
              onPress={handleSearchPress}
              accessible
              accessibilityLabel="Search news"
            />

            {/* Profile/Auth Button */}
            <IconButton
              icon={isAuthenticated ? 'account-circle' : 'login'}
              iconColor={mukokoTheme.colors.onPrimary}
              size={24}
              onPress={handleProfilePress}
              accessible
              accessibilityLabel={
                isAuthenticated ? 'View profile' : 'Sign in'
              }
            />
          </View>
        </Appbar.Header>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: mukokoTheme.colors.primary,
  },
  header: {
    backgroundColor: mukokoTheme.colors.primary,
    elevation: 4,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: mukokoTheme.spacing.md,
  },
  titleText: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    color: mukokoTheme.colors.onPrimary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mukokoTheme.spacing.xs,
  },
});
