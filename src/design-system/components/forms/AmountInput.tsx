import React, { useState } from 'react';
import { Input, InputProps } from '../base/Input';
import { spacing, colors } from '../../tokens';

export interface AmountInputProps extends Omit<InputProps, 'type'> {
  currency?: 'INR' | 'USD';
  showCurrencySymbol?: boolean;
  onAmountChange?: (amount: number) => void;
}

/**
 * AmountInput Component
 * Specialized input for currency amounts with formatting for Indian Rupees (₹)
 */
export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      currency = 'INR',
      showCurrencySymbol = true,
      onAmountChange,
      onChange,
      value: controlledValue,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>('');

    const formatCurrency = (num: number): string => {
      if (isNaN(num)) return '';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    const parseAmount = (str: string): number => {
      const numbers = str.replace(/[^\d.]/g, '');
      return parseFloat(numbers) || 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseAmount(inputValue);

      if (!isNaN(numericValue)) {
        setDisplayValue(inputValue);
        if (onAmountChange) {
          onAmountChange(numericValue);
        }
        if (onChange) {
          onChange(e);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const amount = parseAmount(displayValue);
      if (amount > 0) {
        setDisplayValue(formatCurrency(amount));
      }
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const amount = parseAmount(displayValue);
      setDisplayValue(amount > 0 ? amount.toString() : '');
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const currencySymbol = currency === 'INR' ? '₹' : '$';

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sm,
      width: '100%',
    };

    const wrapperStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
    };

    const symbolStyle: React.CSSProperties = {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: colors.primary[500],
      minWidth: '1.5rem',
    };

    return (
      <div style={containerStyle}>
        <div style={wrapperStyle}>
          {showCurrencySymbol && <span style={symbolStyle}>{currencySymbol}</span>}
          <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            {...props}
          />
        </div>
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';

export default AmountInput;
