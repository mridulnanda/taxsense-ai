import {
  calculateIncomeTax,
  calculateHRA,
  calculateSection80C,
  calculateSection80D,
  calculateSection24B,
  formatCurrency,
  calculateEffectiveTaxRate,
  calculateTaxSavings,
  validatePAN,
  validateAadhar,
  calculateRoundOff,
} from '@/utils/taxCalculations';

describe('Tax Calculations', () => {
  describe('calculateIncomeTax', () => {
    it('should calculate tax for new regime with income below 300k', () => {
      const result = calculateIncomeTax(200000, 'NEW');
      expect(result.tax).toBe(0);
    });

    it('should calculate tax for new regime with income above 300k', () => {
      const result = calculateIncomeTax(500000, 'NEW');
      expect(result.tax).toBeGreaterThan(0);
      expect(result.totalTax).toBeGreaterThan(result.tax);
    });

    it('should calculate tax for old regime', () => {
      const result = calculateIncomeTax(500000, 'OLD');
      expect(result.tax).toBeGreaterThan(0);
    });

    it('should include surcharge and cess in total tax', () => {
      const result = calculateIncomeTax(1000000, 'NEW');
      expect(result.totalTax).toBe(
        result.tax + result.surcharge + result.cess
      );
    });
  });

  describe('calculateHRA', () => {
    it('should calculate HRA for metro city', () => {
      const basicSalary = 100000;
      const rentPaid = 80000;
      const hra = calculateHRA(basicSalary, rentPaid, 'METRO');

      expect(hra).toBeGreaterThan(0);
      expect(hra).toBeLessThanOrEqual(basicSalary * 0.5);
    });

    it('should calculate HRA for non-metro city', () => {
      const basicSalary = 100000;
      const rentPaid = 60000;
      const hra = calculateHRA(basicSalary, rentPaid, 'NON_METRO');

      expect(hra).toBeGreaterThan(0);
      expect(hra).toBeLessThanOrEqual(basicSalary * 0.4);
    });

    it('should return 0 if rent is less than 10% of basic salary', () => {
      const basicSalary = 100000;
      const rentPaid = 5000;
      const hra = calculateHRA(basicSalary, rentPaid, 'METRO');

      expect(hra).toBe(0);
    });
  });

  describe('calculateSection80C', () => {
    it('should calculate within limit', () => {
      const result = calculateSection80C(50000, 30000, 20000);
      expect(result).toBe(100000);
    });

    it('should cap at 150000 limit', () => {
      const result = calculateSection80C(100000, 60000, 30000);
      expect(result).toBe(150000);
    });

    it('should include ELSS and NSC', () => {
      const result = calculateSection80C(50000, 30000, 20000, 20000, 10000);
      expect(result).toBe(150000);
    });
  });

  describe('calculateSection80D', () => {
    it('should calculate health insurance deduction', () => {
      const result = calculateSection80D(25000, 15000, 50000);
      expect(result).toBeLessThanOrEqual(50000 + 25000 + 100000);
    });

    it('should cap self health insurance at 50k', () => {
      const result = calculateSection80D(100000, 0, 0);
      expect(result).toBe(50000);
    });
  });

  describe('calculateSection24B', () => {
    it('should cap home loan interest at 200k for self-occupied', () => {
      const result = calculateSection24B(250000, 5000000, true);
      expect(result).toBe(200000);
    });

    it('should not cap for let-out property', () => {
      const result = calculateSection24B(250000, 5000000, false);
      expect(result).toBe(250000);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in INR', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('₹');
    });
  });

  describe('calculateEffectiveTaxRate', () => {
    it('should calculate effective tax rate', () => {
      const rate = calculateEffectiveTaxRate(30000, 1000000);
      expect(rate).toBe(3);
    });

    it('should return 0 for zero income', () => {
      const rate = calculateEffectiveTaxRate(30000, 0);
      expect(rate).toBe(0);
    });
  });

  describe('calculateTaxSavings', () => {
    it('should calculate savings when old regime tax is higher', () => {
      const savings = calculateTaxSavings(100000, 70000);
      expect(savings).toBe(30000);
    });

    it('should return 0 when new regime tax is higher or equal', () => {
      const savings = calculateTaxSavings(70000, 100000);
      expect(savings).toBe(0);
    });
  });

  describe('validatePAN', () => {
    it('should validate correct PAN', () => {
      expect(validatePAN('AAAAA1234A')).toBe(true);
    });

    it('should reject invalid PAN', () => {
      expect(validatePAN('INVALID')).toBe(false);
    });
  });

  describe('validateAadhar', () => {
    it('should validate correct Aadhar', () => {
      expect(validateAadhar('123456789012')).toBe(true);
    });

    it('should reject invalid Aadhar', () => {
      expect(validateAadhar('12345')).toBe(false);
    });
  });

  describe('calculateRoundOff', () => {
    it('should round off to nearest rupee', () => {
      expect(calculateRoundOff(1234.67)).toBe(1235);
      expect(calculateRoundOff(1234.34)).toBe(1234);
    });
  });
});
