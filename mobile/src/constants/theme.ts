export const theme = {
  colors: {
    // Background colors
    background: '#141414', // Main dark background
    backgroundSecondary: '#1a1a1a', // Slightly lighter
    surface: '#303030', // Cards, inputs background
    surfaceHover: '#404040', // Hover state for surface
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#ababab',
    textMuted: '#666666',
    placeholder: '#999999',
    
    // Brand colors
    primary: '#000000', // Black for primary actions
    primaryHover: '#1a1a1a',
    accent: '#6366f1', // Optional accent color (indigo)
    
    // Semantic colors
    error: '#ff4444',
    errorBackground: 'rgba(255, 68, 68, 0.1)',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    
    // Border colors
    border: '#333333',
    borderLight: '#444444',
    
    // Transparent overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayHeavy: 'rgba(0, 0, 0, 0.8)',
  },
  
  typography: {
    fontFamily: {
      regular: 'SpaceGrotesk-Regular',
      medium: 'SpaceGrotesk-Medium',
      bold: 'SpaceGrotesk-Bold',
      mono: 'SpaceMono-Regular',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 40,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    letterSpacing: {
      tight: -0.015,
      normal: 0,
      wide: 0.015,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 56,
  },
  
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 5.46,
      elevation: 12,
    },
  },
  
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  layout: {
    maxWidth: 480,
    headerHeight: 56,
    tabBarHeight: 60,
  },
};