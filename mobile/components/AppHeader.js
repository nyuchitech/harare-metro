import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import mukokoTheme from '../theme';
import Logo from './Logo';

export default function AppHeader() {
  try {
    const navigation = useNavigation();
    const route = useRoute();

    // Don't show header on NewsBytes screen (full-screen experience)
    if (route.name === 'BytesFeed' || route.name === 'Bytes') {
      return null;
    }

    const handleSearchPress = () => {
      try {
        navigation.navigate('Search');
      } catch (e) {
        console.log('Navigation to Search not available');
      }
    };

    const handleProfilePress = () => {
      try {
        navigation.navigate('Profile');
      } catch (e) {
        console.log('Navigation to Profile not available');
      }
    };

    return (
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Logo size="sm" />
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="magnify"
            onPress={handleSearchPress}
            iconColor={mukokoTheme.colors.onSurface}
            size={24}
          />
          <IconButton
            icon="bell-outline"
            iconColor={mukokoTheme.colors.onSurface}
            size={24}
          />
          <IconButton
            icon="account-circle-outline"
            onPress={handleProfilePress}
            iconColor={mukokoTheme.colors.onSurface}
            size={24}
          />
        </View>
      </View>
    );
  } catch (error) {
    // If navigation context is not available, return a simple header
    return (
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Logo size="sm" />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: mukokoTheme.spacing.sm,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
