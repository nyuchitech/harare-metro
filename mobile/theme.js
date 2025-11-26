/**
 * Mukoko News Custom Material Design Theme
 * Based on Zimbabwe flag colors and Nyuchi Brand System v5.0
 *
 * Design Philosophy:
 * - Primary: Mukoko News Green (#729b63) - Growth, prosperity
 * - Accent: Zimbabwe Yellow (#ffcc00) - Energy, optimism
 * - Error: Zimbabwe Red (#e03c31) - Passion, urgency
 * - Success: Zimbabwe Green (#00843d) - Achievement, progress
 * - Roundness: 16px - Vibrant, modern feel
 * - Fonts: Noto Sans (body), Noto Serif (headings)
 */

export const mukokoTheme = {
  // Roundness - vibrant mobile feel
  roundness: 16,

  // Zimbabwe flag color palette
  colors: {
    // Primary brand colors - Zimbabwe Green (Official flag color)
    primary: '#00A651',
    primaryContainer: '#e5f5ed',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#002913',

    // Accent color - Zimbabwe Yellow (Official flag color)
    accent: '#FDD116',
    accentContainer: '#fff9e5',
    onAccent: '#000000',
    onAccentContainer: '#4d3d00',

    // Secondary palette
    secondary: '#5f5873',        // Nyuchi Lingo purple
    secondaryContainer: '#e9e7ed',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1f1a29',

    // Surface colors
    surface: '#FFFFFF',
    surfaceVariant: '#f5f7f5',
    onSurface: '#1a1a1a',
    onSurfaceVariant: '#4a4a4a',

    // Borders and dividers
    outline: '#d4e0cf',
    outlineVariant: '#e8f0e4',

    // Semantic colors
    error: '#EF3340',            // Zimbabwe Red (Official flag color)
    errorContainer: '#fdecea',
    onError: '#FFFFFF',
    onErrorContainer: '#470c08',

    success: '#00A651',          // Zimbabwe Green (Official flag color)
    successContainer: '#e5f5ed',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#002913',

    warning: '#ff9800',
    warningContainer: '#fff3e0',
    onWarning: '#000000',
    onWarningContainer: '#4d2e00',

    // Background
    background: '#f9faf9',
    onBackground: '#1a1a1a',

    // Zimbabwe flag colors (direct access - Official colors)
    zwGreen: '#00A651',
    zwYellow: '#FDD116',
    zwRed: '#EF3340',
    zwBlack: '#000000',
    zwWhite: '#FFFFFF',
  },

  // Typography - Noto Sans/Serif
  fonts: {
    regular: {
      fontFamily: 'NotoSans-Regular',
      fontWeight: '400'
    },
    medium: {
      fontFamily: 'NotoSans-Medium',
      fontWeight: '500'
    },
    bold: {
      fontFamily: 'NotoSans-Bold',
      fontWeight: '600'
    },
    serif: {
      fontFamily: 'NotoSerif-Regular',
      fontWeight: '400'
    },
    serifBold: {
      fontFamily: 'NotoSerif-Bold',
      fontWeight: '700'
    },
  },

  // Elevation/Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.10,
      shadowRadius: 15,
      elevation: 8,
    },
  },

  // Spacing system (8px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Animation timings
  animation: {
    fast: 150,
    medium: 250,
    slow: 350,
  },
};

/**
 * React Native Paper theme configuration
 * Converts our custom theme to Paper's format
 */
export const paperTheme = {
  dark: false,
  roundness: mukokoTheme.roundness,

  colors: {
    primary: mukokoTheme.colors.primary,
    primaryContainer: mukokoTheme.colors.primaryContainer,

    secondary: mukokoTheme.colors.secondary,
    secondaryContainer: mukokoTheme.colors.secondaryContainer,

    tertiary: mukokoTheme.colors.accent,
    tertiaryContainer: mukokoTheme.colors.accentContainer,

    surface: mukokoTheme.colors.surface,
    surfaceVariant: mukokoTheme.colors.surfaceVariant,
    surfaceDisabled: 'rgba(26, 26, 26, 0.12)',

    background: mukokoTheme.colors.background,

    error: mukokoTheme.colors.error,
    errorContainer: mukokoTheme.colors.errorContainer,

    onPrimary: mukokoTheme.colors.onPrimary,
    onPrimaryContainer: mukokoTheme.colors.onPrimaryContainer,
    onSecondary: mukokoTheme.colors.onSecondary,
    onSecondaryContainer: mukokoTheme.colors.onSecondaryContainer,
    onTertiary: mukokoTheme.colors.onAccent,
    onTertiaryContainer: mukokoTheme.colors.onAccentContainer,
    onSurface: mukokoTheme.colors.onSurface,
    onSurfaceVariant: mukokoTheme.colors.onSurfaceVariant,
    onSurfaceDisabled: 'rgba(26, 26, 26, 0.38)',
    onError: mukokoTheme.colors.onError,
    onErrorContainer: mukokoTheme.colors.onErrorContainer,
    onBackground: mukokoTheme.colors.onBackground,

    outline: mukokoTheme.colors.outline,
    outlineVariant: mukokoTheme.colors.outlineVariant,

    inverseSurface: '#2e2e2e',
    inverseOnSurface: '#f4f4f4',
    inversePrimary: '#a8d198',

    shadow: '#000000',
    scrim: '#000000',

    backdrop: 'rgba(46, 49, 46, 0.4)',

    elevation: {
      level0: 'transparent',
      level1: '#f5f7f5',
      level2: '#eff3ed',
      level3: '#e9efeb',
      level4: '#e6ede8',
      level5: '#e0e9e2',
    },
  },

  fonts: {
    regular: mukokoTheme.fonts.regular,
    medium: mukokoTheme.fonts.medium,
    bold: mukokoTheme.fonts.bold,

    // Paper-specific font variants
    displayLarge: {
      ...mukokoTheme.fonts.serifBold,
      fontSize: 57,
      lineHeight: 64,
      letterSpacing: 0,
    },
    displayMedium: {
      ...mukokoTheme.fonts.serifBold,
      fontSize: 45,
      lineHeight: 52,
      letterSpacing: 0,
    },
    displaySmall: {
      ...mukokoTheme.fonts.serif,
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: 0,
    },

    headlineLarge: {
      ...mukokoTheme.fonts.serifBold,
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineMedium: {
      ...mukokoTheme.fonts.serif,
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineSmall: {
      ...mukokoTheme.fonts.serif,
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
    },

    titleLarge: {
      ...mukokoTheme.fonts.serifBold,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      ...mukokoTheme.fonts.serif,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      ...mukokoTheme.fonts.serif,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },

    bodyLarge: {
      ...mukokoTheme.fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      ...mukokoTheme.fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      ...mukokoTheme.fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },

    labelLarge: {
      ...mukokoTheme.fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      ...mukokoTheme.fonts.medium,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      ...mukokoTheme.fonts.medium,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },

  animation: {
    scale: 1.0,
  },
};

/**
 * Dark theme variant for React Native Paper
 */
export const paperThemeDark = {
  dark: true,
  roundness: mukokoTheme.roundness,

  colors: {
    primary: mukokoTheme.colors.primary,
    primaryContainer: '#003d20',

    secondary: mukokoTheme.colors.secondary,
    secondaryContainer: '#2a2536',

    tertiary: mukokoTheme.colors.accent,
    tertiaryContainer: '#4d3d00',

    surface: '#1a1a1a',
    surfaceVariant: '#2a2a2a',
    surfaceDisabled: 'rgba(232, 232, 232, 0.12)',

    background: '#0a0a0a',

    error: mukokoTheme.colors.error,
    errorContainer: '#5d1a1c',

    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#a8d198',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#d4cce0',
    onTertiary: '#000000',
    onTertiaryContainer: '#ffed99',
    onSurface: '#e8e8e8',
    onSurfaceVariant: '#9ca3af',
    onSurfaceDisabled: 'rgba(232, 232, 232, 0.38)',
    onError: '#FFFFFF',
    onErrorContainer: '#ffb3b3',
    onBackground: '#e8e8e8',

    outline: '#3a3a3a',
    outlineVariant: '#2a2a2a',

    inverseSurface: '#f4f4f4',
    inverseOnSurface: '#2e2e2e',
    inversePrimary: '#00663d',

    shadow: '#000000',
    scrim: '#000000',

    backdrop: 'rgba(0, 0, 0, 0.5)',

    elevation: {
      level0: 'transparent',
      level1: '#1f1f1f',
      level2: '#242424',
      level3: '#292929',
      level4: '#2b2b2b',
      level5: '#303030',
    },
  },

  fonts: paperTheme.fonts, // Use same font configuration

  animation: {
    scale: 1.0,
  },
};

export default mukokoTheme;
