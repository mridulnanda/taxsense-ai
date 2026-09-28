/**
 * TaxSense AI - Typography Design Tokens
 * Defines font families, sizes, weights, and line heights
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
    serif: 'Georgia, "Times New Roman", serif',
  },

  // Font weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Heading typography (H1 - H6)
  heading: {
    h1: {
      fontSize: '3.5rem', // 56px
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    h2: {
      fontSize: '2.25rem', // 36px
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: '-0.01em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    h3: {
      fontSize: '1.875rem', // 30px
      lineHeight: 1.3,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    h4: {
      fontSize: '1.5rem', // 24px
      lineHeight: 1.4,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    h5: {
      fontSize: '1.25rem', // 20px
      lineHeight: 1.4,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    h6: {
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  },

  // Body typography
  body: {
    largeBold: {
      fontSize: '1.125rem', // 18px
      lineHeight: 1.6,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    large: {
      fontSize: '1.125rem', // 18px
      lineHeight: 1.6,
      fontWeight: 400,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    baseBold: {
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    base: {
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      fontWeight: 400,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    smallBold: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.5,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    small: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.5,
      fontWeight: 400,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  },

  // Caption/Metadata typography
  caption: {
    captionBold: {
      fontSize: '0.75rem', // 12px
      lineHeight: 1.4,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      lineHeight: 1.4,
      fontWeight: 400,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    label: {
      fontSize: '0.75rem', // 12px
      lineHeight: 1.4,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  },

  // Code typography
  code: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400,
    fontFamily: '"Fira Code", "Courier New", monospace',
  },

  // Display typography (larger, impactful text)
  display: {
    lg: {
      fontSize: '4.5rem', // 72px
      lineHeight: 1.1,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    md: {
      fontSize: '3.75rem', // 60px
      lineHeight: 1.1,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    sm: {
      fontSize: '3rem', // 48px
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
  },
};

/**
 * CSS-in-JS utilities for typography
 */
export const createTypographyStyles = (variant: keyof typeof typography.body) => ({
  ...typography.body[variant as keyof typeof typography.body],
});

export type TypographyVariant = keyof typeof typography.heading |
                              keyof typeof typography.body |
                              keyof typeof typography.caption;
