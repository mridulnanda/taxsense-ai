/**
 * TaxSense AI - Border Radius Design Tokens
 * Consistent border radius system for rounded corners
 */

export const radii = {
  // Base radius scale
  none: '0',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Fully rounded (pills)

  // Aliases for semantic use
  tight: '0.25rem',    // 4px - small buttons, inputs
  base: '0.375rem',    // 6px - standard components
  comfortable: '0.5rem', // 8px - cards, modals
  spacious: '0.75rem', // 12px - large containers
  generous: '1rem',    // 16px - large cards
  full: '9999px',      // Fully rounded
};

// Component-specific radius patterns
export const componentRadii = {
  // Button radius
  button: {
    xs: '0.125rem',   // Minimal rounding
    sm: '0.25rem',    // Small buttons
    md: '0.375rem',   // Medium buttons
    lg: '0.5rem',     // Large buttons
    full: '9999px',   // Pill buttons
  },

  // Input field radius
  input: {
    sm: '0.25rem',    // Minimal
    md: '0.375rem',   // Standard
    lg: '0.5rem',     // Spacious
  },

  // Card radius
  card: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // Modal/Dialog radius
  modal: {
    default: '0.75rem',
    large: '1rem',
  },

  // Dropdown/Menu radius
  dropdown: {
    default: '0.5rem',
    compact: '0.375rem',
  },

  // Chip/Badge radius
  chip: {
    small: '0.125rem',
    medium: '0.25rem',
    full: '9999px',
  },

  // Alert/Banner radius
  alert: {
    sm: '0.375rem',
    md: '0.5rem',
  },

  // Tooltip radius
  tooltip: {
    default: '0.375rem',
  },

  // Popover radius
  popover: {
    default: '0.5rem',
  },

  // Avatar radius
  avatar: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },

  // Progress bar radius
  progressBar: {
    container: '0.5rem',
    track: '0.5rem',
  },

  // Skeleton loading radius
  skeleton: {
    default: '0.375rem',
  },

  // Image radius
  image: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
};

// Combined with opacity for soft corners
export const radiusWithOverflow = {
  container: '0.75rem',
  card: '0.5rem',
  button: '0.375rem',
  input: '0.375rem',
  badge: '0.125rem',
  avatar: '9999px',
  modal: '0.75rem',
};

export type RadiusSize = keyof typeof radii;
export type ComponentRadiusKey = keyof typeof componentRadii;
