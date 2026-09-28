import React from 'react';
import { Card } from '../base/Card';
import { spacing, colors, typography, elevation } from '../../tokens';

export interface TaxComparisonData {
  oldRegime: {
    taxableIncome: number;
    taxLiability: number;
    surcharge: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
  };
  newRegime: {
    taxableIncome: number;
    taxLiability: number;
    surcharge: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
  };
}

export interface TaxComparisonProps {
  data: TaxComparisonData;
  isNewRegimeBetter?: boolean;
  savings?: number;
}

/**
 * TaxComparison Component
 * Displays side-by-side comparison of tax liability under old vs new regime
 */
export const TaxComparison: React.FC<TaxComparisonProps> = ({
  data,
  isNewRegimeBetter = false,
  savings = 0,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const comparisonRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.md,
    marginBottom: spacing.md,
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };

  const labelStyle: React.CSSProperties = {
    ...typography.caption.caption,
    color: colors.semantic.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 500,
  };

  const valueStyle: React.CSSProperties = {
    ...typography.heading.h4,
    color: colors.semantic.textPrimary,
    fontWeight: 600,
  };

  const regimeHeaderStyle = (regime: 'old' | 'new'): React.CSSProperties => ({
    ...valueStyle,
    color: regime === 'old' ? colors.tax.oldRegime : colors.tax.newRegime,
    textAlign: 'center',
    paddingBottom: spacing.md,
    borderBottom: `2px solid ${regime === 'old' ? colors.tax.oldRegime : colors.tax.newRegime}`,
  });

  const headerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.md,
    marginBottom: spacing.lg,
  };

  const savingsBoxStyle: React.CSSProperties = {
    backgroundColor: colors.success[50],
    border: `2px solid ${colors.success[200]}`,
    borderRadius: '0.5rem',
    padding: spacing.lg,
    textAlign: 'center',
    marginTop: spacing.lg,
  };

  const savingsLabelStyle: React.CSSProperties = {
    ...typography.caption.caption,
    color: colors.success[700],
    textTransform: 'uppercase',
    fontWeight: 500,
    marginBottom: spacing.sm,
  };

  const savingsValueStyle: React.CSSProperties = {
    ...typography.heading.h2,
    color: colors.success[600],
    fontWeight: 700,
  };

  return (
    <Card variant="elevated" padding="lg">
      <div style={headerStyle}>
        <div style={columnStyle}>
          <span style={labelStyle}>Metric</span>
        </div>
        <div style={regimeHeaderStyle('old')}>Old Regime</div>
        <div style={regimeHeaderStyle('new')}>New Regime</div>
      </div>

      <div style={comparisonRowStyle}>
        <div style={columnStyle}>
          <span style={labelStyle}>Taxable Income</span>
        </div>
        <div style={columnStyle}>
          <span style={valueStyle}>{formatCurrency(data.oldRegime.taxableIncome)}</span>
        </div>
        <div style={columnStyle}>
          <span style={valueStyle}>{formatCurrency(data.newRegime.taxableIncome)}</span>
        </div>
      </div>

      <div style={comparisonRowStyle}>
        <div style={columnStyle}>
          <span style={labelStyle}>Tax Liability</span>
        </div>
        <div style={columnStyle}>
          <span style={valueStyle}>{formatCurrency(data.oldRegime.taxLiability)}</span>
        </div>
        <div style={columnStyle}>
          <span style={valueStyle}>{formatCurrency(data.newRegime.taxLiability)}</span>
        </div>
      </div>

      <div style={comparisonRowStyle}>
        <div style={columnStyle}>
          <span style={labelStyle}>Total Tax</span>
        </div>
        <div style={columnStyle}>
          <span style={{ ...valueStyle, color: colors.tax.liability }}>
            {formatCurrency(data.oldRegime.totalTax)}
          </span>
        </div>
        <div style={columnStyle}>
          <span style={{ ...valueStyle, color: colors.tax.liability }}>
            {formatCurrency(data.newRegime.totalTax)}
          </span>
        </div>
      </div>

      <div style={comparisonRowStyle}>
        <div style={columnStyle}>
          <span style={labelStyle}>Effective Tax Rate</span>
        </div>
        <div style={columnStyle}>
          <span style={valueStyle}>{formatPercentage(data.oldRegime.effectiveRate)}</span>
        </div>
        <div style={columnStyle}>
          <span style={valueStyle}>{formatPercentage(data.newRegime.effectiveRate)}</span>
        </div>
      </div>

      {savings > 0 && (
        <div style={savingsBoxStyle}>
          <div style={savingsLabelStyle}>Potential Tax Savings</div>
          <div style={savingsValueStyle}>{formatCurrency(savings)}</div>
          <div style={{ ...labelStyle, color: colors.success[700], marginTop: spacing.sm }}>
            {isNewRegimeBetter ? 'New Regime is Recommended' : 'Old Regime is Recommended'}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TaxComparison;
