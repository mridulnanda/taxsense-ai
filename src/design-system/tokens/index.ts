/**
 * TaxSense AI - Design System Tokens Index
 * Central export for all design tokens
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './elevation';
export * from './breakpoints';
export * from './motion';
export * from './radii';

// Combined token export
export const designTokens = {
  colors: require('./colors'),
  typography: require('./typography'),
  spacing: require('./spacing'),
  elevation: require('./elevation'),
  breakpoints: require('./breakpoints'),
  motion: require('./motion'),
  radii: require('./radii'),
};

export default designTokens;
