import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import mukokoTheme from '../theme';

export default function AppFooter() {
  const [isTabletOrDesktop, setIsTabletOrDesktop] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      // Only show footer on tablet/desktop (768px+)
      setIsTabletOrDesktop(width >= 768);
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

  // Hide footer on mobile - bottom tab navigation is used instead
  if (!isTabletOrDesktop) {
    return null;
  }

  const handleNavigate = (screenName) => {
    try {
      navigation.navigate(screenName);
    } catch (e) {
      console.log(`Navigation to ${screenName} not available`);
    }
  };

  const handleExternalLink = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <View style={styles.footer}>
      <View style={styles.container}>
        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mukoko News</Text>
          <Text style={styles.description}>
            Zimbabwe's modern news platform. Stay informed with the latest news from trusted local sources.
          </Text>
          <Text style={styles.copyright}>
            © 2025 Mukoko News. All rights reserved.
          </Text>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <TouchableOpacity onPress={() => handleNavigate('Home')}>
            <Text style={styles.link}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNavigate('Discover')}>
            <Text style={styles.link}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNavigate('Bytes')}>
            <Text style={styles.link}>NewsBytes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNavigate('Search')}>
            <Text style={styles.link}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity onPress={() => handleExternalLink('https://mukoko.com/about')}>
            <Text style={styles.link}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExternalLink('https://mukoko.com/contact')}>
            <Text style={styles.link}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExternalLink('https://mukoko.com/privacy')}>
            <Text style={styles.link}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExternalLink('https://mukoko.com/terms')}>
            <Text style={styles.link}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* Social */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect</Text>
          <TouchableOpacity onPress={() => handleExternalLink('https://twitter.com/mukokonews')}>
            <Text style={styles.link}>Twitter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExternalLink('https://facebook.com/mukokonews')}>
            <Text style={styles.link}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExternalLink('https://instagram.com/mukokonews')}>
            <Text style={styles.link}>Instagram</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: mukokoTheme.colors.surfaceVariant,
    paddingVertical: mukokoTheme.spacing.xl,
    paddingHorizontal: mukokoTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: mukokoTheme.colors.outline,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    gap: mukokoTheme.spacing.xl,
  },
  section: {
    flex: 1,
    minWidth: 200,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    color: mukokoTheme.colors.onSurface,
    marginBottom: mukokoTheme.spacing.md,
  },
  description: {
    fontSize: 14,
    fontFamily: mukokoTheme.fonts.regular.fontFamily,
    color: mukokoTheme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: mukokoTheme.spacing.md,
  },
  copyright: {
    fontSize: 12,
    fontFamily: mukokoTheme.fonts.regular.fontFamily,
    color: mukokoTheme.colors.onSurfaceVariant,
    marginTop: mukokoTheme.spacing.sm,
  },
  link: {
    fontSize: 14,
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
    color: mukokoTheme.colors.primary,
    marginBottom: mukokoTheme.spacing.sm,
  },
});
