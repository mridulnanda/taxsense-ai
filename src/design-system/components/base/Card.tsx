import React from 'react';
import { spacing, colors, elevation, radii, motion as motionTokens } from '../../tokens';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  isHoverable?: boolean;
  isPressable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const getVariantStyles = (variant: CardVariant) => {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: colors.semantic.bgPrimary,
        boxShadow: elevation.card.default,
        border: 'none',
      };
    case 'outlined':
      return {
        backgroundColor: colors.semantic.bgPrimary,
        boxShadow: 'none',
        border: `1px solid ${colors.semantic.borderLight}`,
      };
    case 'filled':
      return {
        backgroundColor: colors.semantic.bgSecondary,
        boxShadow: 'none',
        border: 'none',
      };
    default:
      return {};
  }
};

const getPaddingStyle = (padding: string) => {
  const paddingMap = {
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
  };
  return paddingMap[padding as keyof typeof paddingMap] || spacing.lg;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      isHoverable = false,
      isPressable = false,
      padding = 'md',
      className = '',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const variantStyles = getVariantStyles(variant);
    const paddingValue = getPaddingStyle(padding);

    const cardStyle: React.CSSProperties = {
      ...variantStyles,
      padding: paddingValue,
      borderRadius: radii.lg,
      transition: motionTokens.transition.base,
      cursor: isPressable ? 'pointer' : 'auto',

      ...(isHoverable && {
        '&:hover': {
          boxShadow: variant === 'elevated' ? elevation.card.hover : undefined,
          backgroundColor: variant === 'outlined' ? colors.semantic.bgSecondary : undefined,
        },
      }),
    };

    return (
      <div
        ref={ref}
        style={cardStyle}
        onClick={onClick}
        className={className}
        role={isPressable ? 'button' : undefined}
        tabIndex={isPressable ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
