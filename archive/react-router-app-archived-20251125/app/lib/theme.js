/**
 * Material UI Theme Configuration
 * Integrates Nyuchi Brand System with Mukoko News platform colors
 *
 * Design System: https://assets.nyuchi.com/api/v5/brand-system
 * Platform: Mukoko News (Green palette)
 *
 * Features:
 * - Vibrant Material Design with shadows and rounded corners
 * - Nyuchi brand colors (Green primary for news)
 * - Zimbabwe flag accent colors
 * - Noto Sans/Serif typography
 * - Custom elevation and border radius
 */

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',

    // Mukoko News Primary (Green)
    primary: {
      main: '#729b63',      // Mukoko News green
      light: '#8fb47f',     // Hover state
      dark: '#5d804f',      // Active state
      contrastText: '#ffffff',
    },

    // Zimbabwe Flag Yellow as Secondary
    secondary: {
      main: '#ffcc00',      // Zimbabwe flag yellow
      light: '#ffd633',
      dark: '#ccaa00',
      contrastText: '#000000',
    },

    // Nyuchi Lingo Purple as Tertiary
    tertiary: {
      main: '#5f5873',      // Nyuchi Lingo purple
      light: '#7a7690',
      dark: '#4c465c',
      contrastText: '#ffffff',
    },

    // Zimbabwe Flag Colors
    success: {
      main: '#00843d',      // Zimbabwe flag green
      contrastText: '#ffffff',
    },

    error: {
      main: '#e03c31',      // Zimbabwe flag red
      light: '#cd6b76',     // Nyuchi accent red
      contrastText: '#ffffff',
    },

    info: {
      main: '#6b8ecd',      // Nyuchi accent blue
      contrastText: '#ffffff',
    },

    warning: {
      main: '#ffcc00',      // Zimbabwe flag yellow
      contrastText: '#000000',
    },

    // Background colors
    background: {
      default: '#0a0a0a',   // Deep black
      paper: '#1a1a1a',     // Card background
      elevated: '#242424',  // Elevated surfaces
    },

    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#6b6b6b',
    },

    // Dividers
    divider: 'rgba(255, 255, 255, 0.12)',
  },

  typography: {
    // Noto Sans as primary font family
    fontFamily: "'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    // Noto Serif for display/headlines
    h1: {
      fontFamily: "'Noto Serif', Georgia, serif",
      fontWeight: 900,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: "'Noto Serif', Georgia, serif",
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: "'Noto Sans', sans-serif",
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: "'Noto Sans', sans-serif",
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: "'Noto Sans', sans-serif",
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: "'Noto Sans', sans-serif",
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: 1.5,
    },

    // Body text
    body1: {
      fontFamily: "'Noto Sans', sans-serif",
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: "'Noto Sans', sans-serif",
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },

    // Buttons
    button: {
      fontFamily: "'Noto Sans', sans-serif",
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none', // No uppercase
      letterSpacing: '0.02em',
    },
  },

  shape: {
    borderRadius: 16, // Vibrant rounded corners (default Material is 4)
  },

  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.2)',
    '0px 4px 8px rgba(0, 0, 0, 0.25)',
    '0px 8px 16px rgba(0, 0, 0, 0.3)',
    '0px 12px 24px rgba(0, 0, 0, 0.35)',
    '0px 16px 32px rgba(0, 0, 0, 0.4)',
    '0px 20px 40px rgba(0, 0, 0, 0.45)',
    '0px 24px 48px rgba(0, 0, 0, 0.5)',
    '0px 28px 56px rgba(0, 0, 0, 0.55)',
    '0px 32px 64px rgba(0, 0, 0, 0.6)',
    // Material Design elevation system
    '0px 4px 5px rgba(114, 155, 99, 0.15), 0px 1px 10px rgba(114, 155, 99, 0.1)', // Green glow
    '0px 6px 10px rgba(114, 155, 99, 0.2), 0px 2px 15px rgba(114, 155, 99, 0.15)',
    '0px 8px 15px rgba(114, 155, 99, 0.25), 0px 3px 20px rgba(114, 155, 99, 0.2)',
    '0px 10px 20px rgba(114, 155, 99, 0.3), 0px 4px 25px rgba(114, 155, 99, 0.25)',
    '0px 12px 25px rgba(114, 155, 99, 0.35), 0px 5px 30px rgba(114, 155, 99, 0.3)',
    '0px 14px 30px rgba(114, 155, 99, 0.4), 0px 6px 35px rgba(114, 155, 99, 0.35)',
    '0px 16px 35px rgba(114, 155, 99, 0.45), 0px 7px 40px rgba(114, 155, 99, 0.4)',
    '0px 18px 40px rgba(114, 155, 99, 0.5), 0px 8px 45px rgba(114, 155, 99, 0.45)',
    '0px 20px 45px rgba(114, 155, 99, 0.55), 0px 9px 50px rgba(114, 155, 99, 0.5)',
    '0px 22px 50px rgba(114, 155, 99, 0.6), 0px 10px 55px rgba(114, 155, 99, 0.55)',
    '0px 24px 55px rgba(114, 155, 99, 0.65), 0px 11px 60px rgba(114, 155, 99, 0.6)',
    '0px 26px 60px rgba(114, 155, 99, 0.7), 0px 12px 65px rgba(114, 155, 99, 0.65)',
    '0px 28px 65px rgba(114, 155, 99, 0.75), 0px 13px 70px rgba(114, 155, 99, 0.7)',
    '0px 30px 70px rgba(114, 155, 99, 0.8), 0px 14px 75px rgba(114, 155, 99, 0.75)',
    '0px 32px 75px rgba(114, 155, 99, 0.85), 0px 15px 80px rgba(114, 155, 99, 0.8)',
  ],

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Extra rounded for buttons
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0px 4px 12px rgba(114, 155, 99, 0.3)',
          '&:hover': {
            boxShadow: '0px 8px 20px rgba(114, 155, 99, 0.4)',
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20, // Vibrant rounded corners
          backgroundColor: '#1a1a1a',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Export pre-configured theme
export default theme;
