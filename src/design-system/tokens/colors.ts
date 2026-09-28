/**
 * TaxSense AI - Color Design Tokens
 * Semantic naming for consistent color usage across all platforms
 * Supports light and dark themes
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c3d66',
  },

  // Secondary Colors (Accent)
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Secondary accent
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success primary
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning primary
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error/Danger Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error primary
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Info Colors
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Info primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutral/Gray Colors (used for text, borders, backgrounds)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic Colors
  semantic: {
    // Text colors
    textPrimary: '#171717', // Dark text on light, light text on dark
    textSecondary: '#737373', // Secondary text
    textTertiary: '#a3a3a3', // Tertiary text
    textInverse: '#fafafa', // Light text on dark backgrounds

    // Background colors
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f5f5',
    bgTertiary: '#efefef',
    bgOverlay: 'rgba(0, 0, 0, 0.5)',

    // Border colors
    borderLight: '#e5e5e5',
    borderMedium: '#d4d4d4',
    borderDark: '#a3a3a3',

    // State colors
    disabled: '#d4d4d4',
    disabledText: '#a3a3a3',
    focus: '#0ea5e9',
    hover: 'rgba(0, 0, 0, 0.05)',
    active: 'rgba(0, 0, 0, 0.1)',
  },

  // Tax-specific semantic colors
  tax: {
    oldRegime: '#8b5cf6', // Purple - Old regime
    newRegime: '#22c55e', // Green - New regime
    savings: '#0ea5e9', // Blue - Tax savings
    liability: '#ef4444', // Red - Tax liability
    neutral: '#737373', // Gray - Neutral/no change
  },

  // Legacy support (for backward compatibility)
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Theme definitions
export const lightTheme = {
  colors: {
    ...colors,
    semantic: {
      textPrimary: colors.neutral[900],
      textSecondary: colors.neutral[600],
      textTertiary: colors.neutral[500],
      textInverse: colors.neutral[50],
      bgPrimary: colors.white,
      bgSecondary: colors.neutral[50],
      bgTertiary: colors.neutral[100],
      bgOverlay: 'rgba(0, 0, 0, 0.5)',
      borderLight: colors.neutral[200],
      borderMedium: colors.neutral[300],
      borderDark: colors.neutral[400],
      disabled: colors.neutral[200],
      disabledText: colors.neutral[400],
      focus: colors.primary[500],
      hover: 'rgba(0, 0, 0, 0.05)',
      active: 'rgba(0, 0, 0, 0.1)',
    },
  },
};

export const darkTheme = {
  colors: {
    ...colors,
    semantic: {
      textPrimary: colors.neutral[50],
      textSecondary: colors.neutral[300],
      textTertiary: colors.neutral[400],
      textInverse: colors.neutral[900],
      bgPrimary: colors.neutral[900],
      bgSecondary: colors.neutral[800],
      bgTertiary: colors.neutral[700],
      bgOverlay: 'rgba(0, 0, 0, 0.7)',
      borderLight: colors.neutral[700],
      borderMedium: colors.neutral[600],
      borderDark: colors.neutral[500],
      disabled: colors.neutral[700],
      disabledText: colors.neutral[500],
      focus: colors.primary[400],
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.15)',
    },
  },
};

export type ColorName = keyof typeof colors;
export type ColorShade = keyof (typeof colors)[ColorName];
