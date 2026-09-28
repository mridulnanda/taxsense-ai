/**
 * TaxSense AI - Breakpoint Design Tokens
 * Mobile-first responsive design breakpoints
 */

export const breakpoints = {
  // Mobile breakpoints
  xs: '320px',    // Extra small phones
  sm: '640px',    // Small phones
  md: '768px',    // Tablets
  lg: '1024px',   // Small laptops
  xl: '1280px',   // Desktops
  '2xl': '1536px', // Large desktops
  '3xl': '1920px', // Ultra-wide displays
  '4xl': '2560px', // 4K displays
};

export const breakpointPixels = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
};

// Media query helpers
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.sm})`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `@media (min-width: ${breakpoints.lg})`,

  // Min-width queries (mobile-first approach)
  minXs: `@media (min-width: ${breakpoints.xs})`,
  minSm: `@media (min-width: ${breakpoints.sm})`,
  minMd: `@media (min-width: ${breakpoints.md})`,
  minLg: `@media (min-width: ${breakpoints.lg})`,
  minXl: `@media (min-width: ${breakpoints.xl})`,
  min2xl: `@media (min-width: ${breakpoints['2xl']})`,
  min3xl: `@media (min-width: ${breakpoints['3xl']})`,
  min4xl: `@media (min-width: ${breakpoints['4xl']})`,

  // Max-width queries
  maxXs: `@media (max-width: ${breakpoints.xs})`,
  maxSm: `@media (max-width: ${breakpoints.sm})`,
  maxMd: `@media (max-width: ${breakpoints.md})`,
  maxLg: `@media (max-width: ${breakpoints.lg})`,
  maxXl: `@media (max-width: ${breakpoints.xl})`,
  max2xl: `@media (max-width: ${breakpoints['2xl']})`,
  max3xl: `@media (max-width: ${breakpoints['3xl']})`,
};

// Container sizes for different breakpoints
export const containerSizes = {
  xs: '100%',
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  '2xl': '1320px',
  '3xl': '1500px',
  fluid: '100%',
};

// Device orientation media queries
export const orientationQueries = {
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',
};

// Touch device detection
export const touchQueries = {
  hover: '@media (hover: hover) and (pointer: fine)',
  touch: '@media (hover: none) and (pointer: coarse)',
  noHover: '@media (hover: none)',
};

// High DPI device detection (for retina displays)
export const dpiQueries = {
  highDpi: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  superHighDpi: '@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 384dpi)',
};

// Prefers reduced motion
export const motionQueries = {
  prefersReducedMotion: '@media (prefers-reduced-motion: reduce)',
  prefersMotion: '@media (prefers-reduced-motion: no-preference)',
};

// Prefers color scheme
export const colorSchemeQueries = {
  prefersDark: '@media (prefers-color-scheme: dark)',
  prefersLight: '@media (prefers-color-scheme: light)',
};

// Responsive type for breakpoint values
export type Breakpoint = keyof typeof breakpoints;
export type ResponsiveValue<T> = {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  '3xl'?: T;
  '4xl'?: T;
};
