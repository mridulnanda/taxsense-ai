import React from 'react';
import { spacing, colors, elevation, radii, motion as motionTokens } from '../../tokens';

export type InputType = 'text' | 'number' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'date';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isRequired?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      isRequired,
      helperText,
      icon,
      iconPosition = 'left',
      size = 'md',
      type = 'text',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: { padding: `${spacing.sm} ${spacing.md}`, fontSize: '0.875rem' },
      md: { padding: `${spacing.md} ${spacing.md}`, fontSize: '1rem' },
      lg: { padding: `${spacing.md} ${spacing.lg}`, fontSize: '1.125rem' },
    };

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sm,
      width: '100%',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: colors.semantic.textPrimary,
      marginBottom: spacing.xs,
    };

    const wrapperStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    };

    const inputStyle: React.CSSProperties = {
      width: '100%',
      ...sizeClasses[size],
      backgroundColor: colors.semantic.bgPrimary,
      border: `1px solid ${error ? colors.error[500] : colors.semantic.borderLight}`,
      borderRadius: radii.md,
      color: colors.semantic.textPrimary,
      transition: motionTokens.transition.colors,
      boxShadow: error ? `0 0 0 3px ${colors.error[100]}` : 'none',
      paddingLeft: icon && iconPosition === 'left' ? `${spacing.xl}` : undefined,
      paddingRight: icon && iconPosition === 'right' ? `${spacing.xl}` : undefined,

      '&:focus': {
        outline: 'none',
        borderColor: error ? colors.error[500] : colors.primary[500],
        boxShadow: `0 0 0 3px ${error ? colors.error[100] : colors.primary[100]}`,
      },

      '&:disabled': {
        backgroundColor: colors.semantic.disabled,
        color: colors.semantic.disabledText,
        cursor: 'not-allowed',
      },

      '&::placeholder': {
        color: colors.semantic.textTertiary,
      },
    };

    const iconStyle: React.CSSProperties = {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.semantic.textSecondary,
      pointerEvents: 'none',
      left: iconPosition === 'left' ? spacing.md : undefined,
      right: iconPosition === 'right' ? spacing.md : undefined,
    };

    const errorStyle: React.CSSProperties = {
      fontSize: '0.75rem',
      color: colors.error[600],
      fontWeight: 500,
    };

    const helperStyle: React.CSSProperties = {
      fontSize: '0.75rem',
      color: colors.semantic.textSecondary,
    };

    return (
      <div style={containerStyle}>
        {label && (
          <label style={labelStyle}>
            {label}
            {isRequired && <span style={{ color: colors.error[500], marginLeft: spacing.xs }}>*</span>}
          </label>
        )}

        <div style={wrapperStyle}>
          {icon && <div style={iconStyle}>{icon}</div>}
          <input
            ref={ref}
            type={type}
            {...props}
            style={inputStyle}
            className={className}
          />
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {helperText && !error && <div style={helperStyle}>{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
