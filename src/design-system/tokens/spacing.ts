/**
 * TaxSense AI - Spacing Design Tokens
 * Based on 4px scale for consistent spacing throughout the application
 */

export const spacing = {
  // Base 4px scale
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '2.5rem',  // 40px
  '3xl': '3rem',    // 48px
  '4xl': '4rem',    // 64px

  // Aliases for better semantics
  tight: '0.25rem',    // 4px
  base: '0.5rem',      // 8px
  comfortable: '1rem', // 16px
  spacious: '1.5rem',  // 24px
};

// Commonly used spacing combinations
export const spacingCombinations = {
  // Padding combinations
  padding: {
    xs: `${spacing.xs}`,
    sm: `${spacing.sm}`,
    md: `${spacing.md}`,
    lg: `${spacing.lg}`,
    xl: `${spacing.xl}`,
    '2xl': `${spacing['2xl']}`,
    none: '0',
  },

  // Margin combinations
  margin: {
    xs: `${spacing.xs}`,
    sm: `${spacing.sm}`,
    md: `${spacing.md}`,
    lg: `${spacing.lg}`,
    xl: `${spacing.xl}`,
    '2xl': `${spacing['2xl']}`,
    none: '0',
    auto: 'auto',
  },

  // Gap for flexbox and grid
  gap: {
    xs: `${spacing.xs}`,
    sm: `${spacing.sm}`,
    md: `${spacing.md}`,
    lg: `${spacing.lg}`,
    xl: `${spacing.xl}`,
    '2xl': `${spacing['2xl']}`,
    none: '0',
  },
};

// Specific component spacing patterns
export const componentSpacing = {
  // Button spacing
  button: {
    paddingX: spacing.md,
    paddingY: spacing.sm,
    paddingXLarge: spacing.lg,
    paddingYLarge: spacing.md,
  },

  // Input spacing
  input: {
    paddingX: spacing.md,
    paddingY: spacing.sm,
    paddingXLarge: spacing.lg,
    paddingYLarge: spacing.md,
  },

  // Card spacing
  card: {
    padding: spacing.lg,
    paddingLarge: spacing.xl,
    paddingSmall: spacing.md,
  },

  // Modal/Dialog spacing
  modal: {
    padding: spacing.xl,
    gapContent: spacing.lg,
  },

  // Form spacing
  form: {
    groupGap: spacing.lg,
    fieldGap: spacing.md,
    labelMarginBottom: spacing.sm,
  },

  // List spacing
  list: {
    itemGap: spacing.sm,
    sectionGap: spacing.lg,
  },
};

export type SpacingValue = keyof typeof spacing;
export type ComponentSpacingKey = keyof typeof componentSpacing;
