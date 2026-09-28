import React from 'react';
import { spacing, colors, radii } from '../../tokens';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  isDot?: boolean;
}

const getVariantStyles = (variant: BadgeVariant) => {
  const variants = {
    primary: {
      backgroundColor: colors.primary[100],
      color: colors.primary[700],
      borderColor: colors.primary[200],
    },
    secondary: {
      backgroundColor: colors.secondary[100],
      color: colors.secondary[700],
      borderColor: colors.secondary[200],
    },
    success: {
      backgroundColor: colors.success[100],
      color: colors.success[700],
      borderColor: colors.success[200],
    },
    warning: {
      backgroundColor: colors.warning[100],
      color: colors.warning[700],
      borderColor: colors.warning[200],
    },
    error: {
      backgroundColor: colors.error[100],
      color: colors.error[700],
      borderColor: colors.error[200],
    },
    info: {
      backgroundColor: colors.info[100],
      color: colors.info[700],
      borderColor: colors.info[200],
    },
    neutral: {
      backgroundColor: colors.neutral[100],
      color: colors.neutral[700],
      borderColor: colors.neutral[200],
    },
  };

  return variants[variant] || variants.primary;
};

const getSizeStyles = (size: BadgeSize) => {
  const sizes = {
    sm: {
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: '0.75rem',
      fontWeight: 600,
      minHeight: '20px',
    },
    md: {
      padding: `${spacing.xs} ${spacing.md}`,
      fontSize: '0.875rem',
      fontWeight: 600,
      minHeight: '24px',
    },
    lg: {
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: '1rem',
      fontWeight: 600,
      minHeight: '32px',
    },
  };

  return sizes[size] || sizes.md;
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      onDismiss,
      isDot = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = getVariantStyles(variant);
    const sizeStyles = getSizeStyles(size);

    const containerStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      ...variantStyles,
      ...sizeStyles,
      borderRadius: isDot ? '50%' : radii.full,
      border: `1px solid ${variantStyles.borderColor}`,
      whiteSpace: 'nowrap',
    };

    const iconStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const dismissStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      marginLeft: spacing.xs,
      opacity: 0.7,
      transition: 'opacity 200ms ease-out',

      '&:hover': {
        opacity: 1,
      },
    };

    return (
      <div ref={ref} style={containerStyle} className={className} {...props}>
        {icon && <div style={iconStyle}>{icon}</div>}
        {!isDot && children}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={dismissStyle}
            aria-label="Dismiss badge"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
