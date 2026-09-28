/**
 * TaxSense AI - Design System Index
 * Central export point for all design system resources
 */

// Design Tokens
export * from './tokens';

// Components
export * from './components';

// Utils & Provider
export { ThemeProvider, useTheme } from './utils/ThemeProvider';
export type { Theme } from './utils/ThemeProvider';

// Hooks
export * from './hooks';

// Type definitions
export type { Breakpoint, ResponsiveValue } from './tokens/breakpoints';
export type { ColorName, ColorShade } from './tokens/colors';
export type { TypographyVariant } from './tokens/typography';
export type { ShadowLevel, ZIndexLevel } from './tokens/elevation';
export type { MotionDuration, MotionEasing, AnimationName } from './tokens/motion';
export type { RadiusSize, ComponentRadiusKey } from './tokens/radii';
export type { SpacingValue, ComponentSpacingKey } from './tokens/spacing';

export default {};
