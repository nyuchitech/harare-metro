/**
 * Mukoko News Custom Material Design Theme
 * Based on official Mukoko brand guidelines from assets.nyuchi.com
 * Nyuchi Brand System v5.0 - News Platform Configuration
 *
 * Brand Colors (Official from assets.nyuchi.com/api/v5/platform/news):
 * - Primary: Mukoko News Green (#729b63) - Growth, prosperity, nature
 * - Hover: #8fb47f - Interactive states
 * - Active: #5d804f - Pressed states
 * - Surface: #f1f5ef - Card backgrounds, containers
 * - Subtle: #f8faf7 - Subtle backgrounds
 *
 * Typography (Nyuchi Brand System):
 * - Display/Headings: Noto Serif - Elegant, authoritative
 * - Body: Noto Sans - Clean, modern, readable
 *
 * Additional Colors:
 * - Accent: Zimbabwe Yellow (#FDD116) - Energy, highlights
 * - Error: Zimbabwe Red (#EF3340) - Urgency, breaking news
 * - Roundness: 16px - Vibrant, modern mobile feel
 */

export const mukokoTheme = {
  // Roundness - clean modern feel (increased to 24px like reference app)
  roundness: 24,

  // Mukoko News official brand colors (from assets.nyuchi.com)
  colors: {
    // Primary brand colors - Mukoko News Green (#729b63)
    primary: '#729b63',          // Official Mukoko News green
    primaryHover: '#8fb47f',     // Hover state from brand guidelines
    primaryActive: '#5d804f',    // Active state from brand guidelines
    primaryContainer: '#f1f5ef', // Surface color from brand guidelines
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1f2d1a',

    // Accent color - Zimbabwe Yellow (kept for energy/highlights)
    accent: '#FDD116',
    accentContainer: '#fff9e5',
    onAccent: '#000000',
    onAccentContainer: '#4d3d00',

    // Secondary palette
    secondary: '#5f5873',        // Nyuchi Lingo purple
    secondaryContainer: '#e9e7ed',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1f1a29',

    // Surface colors (cleaner, lighter backgrounds like reference app)
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',   // Light gray background like reference app
    surfaceSubtle: '#FAFAFA',    // Even lighter for subtle backgrounds
    onSurface: '#1a1a1a',
    onSurfaceVariant: '#666666',

    // Borders and dividers (more subtle)
    outline: '#E0E0E0',
    outlineVariant: '#F0F0F0',

    // Semantic colors
    error: '#EF3340',            // Zimbabwe Red (Official flag color)
    errorContainer: '#fdecea',
    onError: '#FFFFFF',
    onErrorContainer: '#470c08',

    success: '#729b63',          // Mukoko News green for success states
    successContainer: '#f1f5ef',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#1f2d1a',

    warning: '#ff9800',
    warningContainer: '#fff3e0',
    onWarning: '#000000',
    onWarningContainer: '#4d2e00',

    // Background (lighter, cleaner like reference app)
    background: '#F5F5F5',       // Light gray background
    onBackground: '#1a1a1a',

    // Mukoko News brand colors (from assets.nyuchi.com)
    mukokoGreen: '#729b63',      // Primary brand green
    mukokoGreenHover: '#8fb47f', // Hover state
    mukokoGreenActive: '#5d804f',// Active state

    // Zimbabwe flag colors (kept for Zimbabwe flag strip component)
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

  // Elevation/Shadows (more subtle, like reference app)
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
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  },

  // Spacing system (8px base - increased for more generous white space)
  spacing: {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 36,
    xxl: 56,
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
