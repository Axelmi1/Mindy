/**
 * MINDY Theme Configuration
 * "Coder Vibe" / Cyber-minimalist aesthetic
 * 
 * Based on GitHub Dark palette with neon accents
 */

export const theme = {
  colors: {
    // ========================================
    // Base colors (GitHub Dark)
    // ========================================
    background: '#0D1117',
    surface: '#161B22',
    surfaceHover: '#21262D',
    surfaceActive: '#30363D',
    border: '#30363D',
    borderFocus: '#58A6FF',
    
    // ========================================
    // Accent colors
    // ========================================
    primary: '#39FF14',        // Neon Green - main CTA
    primaryDim: '#2ECC10',     // Dimmed green
    secondary: '#58A6FF',      // Electric Blue - links, info
    secondaryDim: '#388BFD',   // Dimmed blue
    warning: '#F78166',        // Orange - streak fire
    warningDim: '#D46A50',     // Dimmed warning
    
    // ========================================
    // Text colors
    // ========================================
    text: '#E6EDF3',           // Primary text
    textMuted: '#8B949E',      // Secondary text
    textDim: '#484F58',        // Disabled/placeholder
    textInverse: '#0D1117',    // Text on light backgrounds
    
    // ========================================
    // Semantic colors
    // ========================================
    success: '#39FF14',        // Correct answers
    error: '#F85149',          // Wrong answers
    info: '#58A6FF',           // Info messages
    
    // ========================================
    // Special
    // ========================================
    xp: '#FFD700',             // XP gold
    streak: '#F78166',         // Streak fire
    terminal: '#39FF14',       // Terminal green (Mindy)
  },
  
  fonts: {
    mono: 'JetBrainsMono',     // Terminal text, code, Mindy
    sans: 'Inter',             // UI text, body
  },
  
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
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
    neon: {
      shadowColor: '#39FF14',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    neonStrong: {
      shadowColor: '#39FF14',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
  },
} as const;

// Type exports for TypeScript
export type Theme = typeof theme;
export type ThemeColors = keyof typeof theme.colors;
export type ThemeFonts = keyof typeof theme.fonts;

