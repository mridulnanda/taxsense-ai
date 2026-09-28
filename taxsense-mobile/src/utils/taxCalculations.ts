import BigNumber from 'bignumber.js';

export interface TaxSlabConfig {
  regime: 'OLD' | 'NEW';
  slabs: Array<{
    limit: number;
    rate: number;
    baseAmount: number;
  }>;
}

const NEW_REGIME_SLABS = [
  { limit: 300000, rate: 0, baseAmount: 0 },
  { limit: 700000, rate: 0.05, baseAmount: 0 },
  { limit: 1000000, rate: 0.1, baseAmount: 20000 },
  { limit: 1250000, rate: 0.15, baseAmount: 50000 },
  { limit: 1500000, rate: 0.2, baseAmount: 87500 },
  { limit: Infinity, rate: 0.3, baseAmount: 112500 },
];

const OLD_REGIME_SLABS = [
  { limit: 250000, rate: 0, baseAmount: 0 },
  { limit: 500000, rate: 0.05, baseAmount: 0 },
  { limit: 1000000, rate: 0.2, baseAmount: 12500 },
  { limit: 1500000, rate: 0.3, baseAmount: 112500 },
  { limit: Infinity, rate: 0.3, baseAmount: 150000 },
];

export function calculateIncomeTax(
  taxableIncome: number,
  regime: 'OLD' | 'NEW'
): {
  tax: number;
  surcharge: number;
  cess: number;
  totalTax: number;
} {
  const slabs = regime === 'NEW' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  let tax = 0;

  for (const slab of slabs) {
    if (taxableIncome > slab.limit) {
      continue;
    }

    if (taxableIncome > slab.limit - 250000) {
      tax = slab.baseAmount + (taxableIncome - (slab.limit - 250000)) * slab.rate;
    } else {
      tax = slab.baseAmount;
    }
    break;
  }

  // Calculate surcharge
  const surcharge = calculateSurcharge(tax);

  // Calculate cess
  const cess = (tax + surcharge) * 0.04;

  return {
    tax,
    surcharge,
    cess,
    totalTax: tax + surcharge + cess,
  };
}

function calculateSurcharge(tax: number): number {
  if (tax <= 5000000) {
    return 0;
  } else if (tax <= 20000000) {
    return tax * 0.15;
  } else if (tax <= 50000000) {
    return tax * 0.25;
  } else if (tax <= 100000000) {
    return tax * 0.35;
  } else {
    return tax * 0.37;
  }
}

export function calculateHRA(
  basicSalary: number,
  rentPaid: number,
  city: 'METRO' | 'NON_METRO'
): number {
  const hraPercentage = city === 'METRO' ? 0.5 : 0.4;
  const maxHRA = basicSalary * hraPercentage;
  const rentExemption = rentPaid - basicSalary * 0.1;

  return Math.min(maxHRA, Math.max(0, rentExemption));
}

export function calculateSection80C(
  ppf: number,
  insurance: number,
  uls: number,
  elss: number = 0,
  nsc: number = 0
): number {
  const maxLimit = 150000;
  const total = ppf + insurance + uls + elss + nsc;

  return Math.min(total, maxLimit);
}

export function calculateSection80D(
  selfHealthInsurance: number,
  dependentHealthInsurance: number,
  parentHealthInsurance: number,
  seniorParentHealthInsurance: number = 0
): number {
  const selfLimit = 50000;
  const dependentLimit = 25000;
  const parentLimit = 100000; // Can be 100k if age > 60
  const seniorParentLimit = 100000;

  let totalDeduction = 0;
  totalDeduction += Math.min(selfHealthInsurance, selfLimit);
  totalDeduction += Math.min(dependentHealthInsurance, dependentLimit);

  // For parents, check if they are senior citizens (> 60 years)
  totalDeduction += Math.min(parentHealthInsurance, parentLimit);

  if (seniorParentHealthInsurance > 0) {
    totalDeduction += Math.min(seniorParentHealthInsurance, seniorParentLimit);
  }

  return totalDeduction;
}

export function calculateSection24B(
  homeLoanInterest: number,
  propertyValue: number,
  isSelOccupied: boolean = true
): number {
  const maxLimit = 200000; // Self-occupied property
  const maxLimitLetOut = Infinity; // Let-out property

  if (isSelOccupied) {
    return Math.min(homeLoanInterest, maxLimit);
  } else {
    return homeLoanInterest;
  }
}

export function calculateDepreciationOnProperty(
  propertyValue: number,
  age: number = 1
): number {
  // Standard depreciation rate: 5% per year up to 50 years
  const depreciationRate = 0.05;
  const maxDepreciationAge = 50;

  if (age >= maxDepreciationAge) {
    return 0; // Property fully depreciated
  }

  return propertyValue * depreciationRate;
}

export function formatCurrency(amount: number, decimals: number = 2): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(amount);
}

export function calculateEffectiveTaxRate(
  totalTax: number,
  totalIncome: number
): number {
  if (totalIncome === 0) return 0;
  return (totalTax / totalIncome) * 100;
}

export function calculateTaxSavings(
  oldRegimeTax: number,
  newRegimeTax: number
): number {
  return Math.max(0, oldRegimeTax - newRegimeTax);
}

export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

export function validateAadhar(aadhar: string): boolean {
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadhar);
}

export function calculateRoundOff(amount: number): number {
  // Income tax is rounded off to nearest rupee
  return Math.round(amount);
}
