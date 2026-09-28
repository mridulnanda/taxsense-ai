import React from 'react';
import { spacing, colors, motion as motionTokens, radii } from '../../tokens';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeMap = {
      sm: { size: 16, borderRadius: radii.xs },
      md: { size: 20, borderRadius: radii.sm },
      lg: { size: 24, borderRadius: radii.md },
    };

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sm,
    };

    const wrapperStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
    };

    const checkboxStyle: React.CSSProperties = {
      width: sizeMap[size].size,
      height: sizeMap[size].size,
      cursor: 'pointer',
      accentColor: colors.primary[500],
      borderRadius: sizeMap[size].borderRadius,
      transition: motionTokens.transition.colors,

      '&:focus': {
        outline: `2px solid ${colors.primary[500]}`,
        outlineOffset: '2px',
      },

      '&:disabled': {
        cursor: 'not-allowed',
        opacity: 0.5,
      },
    };

    const labelStyle: React.CSSProperties = {
      fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
      fontWeight: 500,
      color: colors.semantic.textPrimary,
      cursor: 'pointer',
      userSelect: 'none',
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
        <div style={wrapperStyle}>
          <input
            ref={ref}
            type="checkbox"
            {...props}
            style={checkboxStyle}
            className={className}
          />
          {label && (
            <label style={labelStyle} htmlFor={props.id}>
              {label}
            </label>
          )}
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {helperText && !error && <div style={helperStyle}>{helperText}</div>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
