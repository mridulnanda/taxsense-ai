import React from 'react';
import { motion } from 'framer-motion';
import { spacing, motion as motionTokens, colors, elevation, radii } from '../../tokens';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const getVariantStyles = (variant: ButtonVariant) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: motionTokens.transition.fast,
    borderRadius: radii.md,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        backgroundColor: colors.primary[500],
        color: colors.white,
        boxShadow: elevation.button.default,
        '&:hover': {
          backgroundColor: colors.primary[600],
          boxShadow: elevation.button.hover,
        },
        '&:active': {
          boxShadow: elevation.button.active,
        },
      };

    case 'secondary':
      return {
        ...baseStyles,
        backgroundColor: colors.secondary[500],
        color: colors.white,
        boxShadow: elevation.button.default,
        '&:hover': {
          backgroundColor: colors.secondary[600],
          boxShadow: elevation.button.hover,
        },
      };

    case 'outline':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: colors.primary[500],
        border: `1px solid ${colors.primary[500]}`,
        '&:hover': {
          backgroundColor: `${colors.primary[50]}`,
        },
      };

    case 'ghost':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: colors.neutral[700],
        '&:hover': {
          backgroundColor: colors.neutral[100],
        },
      };

    case 'danger':
      return {
        ...baseStyles,
        backgroundColor: colors.error[500],
        color: colors.white,
        boxShadow: elevation.button.default,
        '&:hover': {
          backgroundColor: colors.error[600],
          boxShadow: elevation.button.hover,
        },
      };

    default:
      return baseStyles;
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return {
        fontSize: '0.875rem',
        padding: `${spacing.sm} ${spacing.md}`,
        minHeight: '32px',
      };
    case 'md':
      return {
        fontSize: '1rem',
        padding: `${spacing.md} ${spacing.lg}`,
        minHeight: '40px',
      };
    case 'lg':
      return {
        fontSize: '1.125rem',
        padding: `${spacing.md} ${spacing.xl}`,
        minHeight: '48px',
      };
    default:
      return {};
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabledState = isDisabled || isLoading;
    const variantStyles = getVariantStyles(variant);
    const sizeStyles = getSizeStyles(size);

    const buttonStyles: React.CSSProperties = {
      ...variantStyles,
      ...sizeStyles,
      width: fullWidth ? '100%' : 'auto',
      opacity: isDisabledState ? 0.6 : 1,
      cursor: isDisabledState ? 'not-allowed' : 'pointer',
      ...props.style,
    };

    return (
      <motion.button
        ref={ref}
        {...props}
        disabled={isDisabledState}
        style={buttonStyles}
        className={className}
        whileHover={!isDisabledState ? { y: -2 } : {}}
        whileTap={!isDisabledState ? { y: 0 } : {}}
        transition={{ duration: 0.1 }}
      >
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ display: 'flex' }}
          >
            ⟳
          </motion.div>
        )}
        {!isLoading && icon && iconPosition === 'left' && icon}
        {!isLoading && children}
        {!isLoading && icon && iconPosition === 'right' && icon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
