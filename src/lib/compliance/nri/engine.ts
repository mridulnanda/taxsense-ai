import {
  NRIStatus,
  NRIStatusSchema,
  ForeignIncomeSource,
  DTAAClaim,
  ForeignRemittance,
  NRIBankAccount,
  NRIReturnOfIncome,
  Section9IncomeClassification
} from './types';

// NRI Status Determination Engine
export class NRIStatusEngine {
  /**
   * Determine residency status based on presence test and other factors
   * References: Section 6, Income Tax Act 1961
   */
  determineResidencyStatus(data: {
    daysInIndia: number;
    substantialEquivalentPresence: boolean;
    indianIncomeSource: boolean;
    previousYearResident: boolean;
  }): 'RESIDENT' | 'NRI' | 'DEEMED_RESIDENT' {
    // Rule 1: Resident if present in India for 182+ days in FY
    if (data.daysInIndia >= 182) {
      return 'RESIDENT';
    }

    // Rule 2: Resident if present for 60+ days in FY AND 365+ days in 4 preceding years
    if (data.daysInIndia >= 60 && data.substantialEquivalentPresence) {
      return 'RESIDENT';
    }

    // Rule 3: Deemed Resident if Indian citizen with Indian income
    if (data.previousYearResident && data.indianIncomeSource) {
      return 'DEEMED_RESIDENT';
    }

    return 'NRI';
  }

  /**
   * Determine NRE (Non-Resident External) vs NRI status
   * NRE = NRI with only foreign income
   * NRI = Non-resident
   */
  classifyNRIType(data: {
    residencyStatus: 'NRI' | 'RESIDENT' | 'DEEMED_RESIDENT';
    hasIndianIncome: boolean;
    hasOnlyForeignIncome: boolean;
  }): 'NRI' | 'NRE' | 'RESIDENT' {
    if (data.residencyStatus === 'RESIDENT') return 'RESIDENT';

    if (data.residencyStatus === 'NRI') {
      if (data.hasOnlyForeignIncome) {
        return 'NRE';
      }
      return 'NRI';
    }

    return 'NRI';
  }
}

// Foreign Income Calculation Engine
export class ForeignIncomeEngine {
  /**
   * Calculate taxable foreign income in INR
   * Applies DTAA where applicable
   */
  calculateTaxableForeignIncome(
    foreignIncomes: ForeignIncomeSource[],
    dtaaClaims: Map<string, DTAAClaim>
  ): {
    grossForeignIncome: number;
    dtaaReducedIncome: number;
    taxableForeignIncome: number;
    breakdown: Array<{
      source: string;
      gross: number;
      dtaaAdjustment: number;
      taxable: number;
    }>;
  } {
    const breakdown = foreignIncomes.map(income => {
      const inrAmount = income.grossAmount * income.exchangeRate;
      let dtaaAdjustment = 0;

      if (income.dtaaApplicable && dtaaClaims.has(income.sourceCountry)) {
        const claim = dtaaClaims.get(income.sourceCountry)!;
        // DTAA typically provides relief by:
        // 1. Exempting income if foreign tax is adequate
        // 2. Providing tax credit for foreign taxes paid
        // Calculate based on treaty specific rules
        dtaaAdjustment = Math.max(0, income.taxPaidAbroad * income.exchangeRate);
      }

      return {
        source: income.sourceCountry,
        gross: inrAmount,
        dtaaAdjustment,
        taxable: Math.max(0, inrAmount - dtaaAdjustment),
      };
    });

    const grossForeignIncome = breakdown.reduce((sum, b) => sum + b.gross, 0);
    const dtaaReducedIncome = breakdown.reduce((sum, b) => sum + b.dtaaAdjustment, 0);
    const taxableForeignIncome = breakdown.reduce((sum, b) => sum + b.taxable, 0);

    return {
      grossForeignIncome,
      dtaaReducedIncome,
      taxableForeignIncome,
      breakdown,
    };
  }
}

// DTAA Application Engine
export class DTAAEngine {
  /**
   * Apply DTAA rules for tax credit
   * References: India's bilateral tax treaties
   */
  calculateDTAATaxCredit(claim: DTAAClaim): {
    foreignTaxPaid: number;
    indianTaxBefore: number;
    creditAllowed: number;
    creditLimitedTo: number;
    totalIndianTax: number;
    explanation: string;
  } {
    const indianTaxBefore = claim.grossIncome * (claim.indiaTaxRate / 100);

    // Tax credit limited to lower of:
    // 1. Foreign tax actually paid
    // 2. Indian tax on foreign income
    let creditLimitedTo = Math.min(
      claim.foreignTaxPaid,
      indianTaxBefore
    );

    // If foreign tax is higher than Indian tax, no excess credit is allowed
    // (India doesn't allow carry forward of excess foreign tax credit in general cases)
    const creditAllowed = Math.min(claim.foreignTaxPaid, creditLimitedTo);

    const totalIndianTax = Math.max(0, indianTaxBefore - creditAllowed);

    const explanation = `
      Gross Foreign Income: ${claim.grossIncome}
      Indian Tax Rate: ${claim.indiaTaxRate}%
      Indian Tax Before Credit: ${indianTaxBefore}
      Foreign Tax Paid: ${claim.foreignTaxPaid}
      Credit Allowed: ${creditAllowed} (limited to Indian tax)
      Total Indian Tax After Credit: ${totalIndianTax}
    `.trim();

    return {
      foreignTaxPaid: claim.foreignTaxPaid,
      indianTaxBefore,
      creditAllowed,
      creditLimitedTo,
      totalIndianTax,
      explanation,
    };
  }

  /**
   * Verify DTAA eligibility based on treaty provisions
   */
  verifyDTAAEligibility(claim: DTAAClaim): {
    isEligible: boolean;
    reasons: string[];
    requiredDocuments: string[];
  } {
    const reasons: string[] = [];
    const requiredDocuments: string[] = [];

    // Check if tax was actually paid abroad
    if (claim.foreignTaxPaid === 0) {
      reasons.push('No foreign tax paid - DTAA credit not available');
    } else if (!claim.documentedAbroadTax) {
      reasons.push('Foreign tax payment not documented - claim not valid');
    } else {
      reasons.push('Foreign tax properly paid and documented');
      requiredDocuments.push('Tax certificate from foreign country');
      requiredDocuments.push('Currency conversion documentation');
    }

    // Verify treaty existence and applicability
    if (claim.treatyProvisionsApplied.length === 0) {
      reasons.push('No treaty provisions referenced');
    } else {
      reasons.push(`Treaty provisions applied: ${claim.treatyProvisionsApplied.join(', ')}`);
    }

    const isEligible = claim.foreignTaxPaid > 0 && claim.documentedAbroadTax;

    return {
      isEligible,
      reasons,
      requiredDocuments: isEligible ? requiredDocuments : [],
    };
  }
}

// TDS on Foreign Remittances Engine
export class ForeignRemittanceTDSEngine {
  /**
   * Calculate TDS on foreign remittances
   * References: Sections 194LA, 194LB, 194LC
   */
  calculateRemittanceTDS(remittance: ForeignRemittance): {
    tdsApplicable: boolean;
    tdsRate: number;
    tdsAmount: number;
    netPayable: number;
    section: string;
    explanation: string;
  } {
    let applicableTDS = 0;
    let applicableSection = '';
    const tdsRates: Record<string, number> = {
      '194LA': 20.6, // Salary income
      '194LB': 5, // Consultation fees
      '194LC': 20.6, // Sports persons
      '194LD': 20.6, // Others
    };

    if (remittance.tdsApplicable) {
      applicableTDS = remittance.remittanceAmount * (remittance.tdsRate / 100);
      applicableSection = remittance.tdsSection;
    }

    const netPayable = remittance.remittanceAmount - applicableTDS;

    const explanation = `
      Remittance Type: ${remittance.remittanceType}
      Gross Amount: ${remittance.remittanceAmount}
      TDS Section: ${applicableSection}
      TDS Rate: ${remittance.tdsRate}%
      TDS Amount: ${applicableTDS}
      Net Amount Received: ${netPayable}
      Certificate Status: ${remittance.certificateReceived ? 'Received' : 'Awaited'}
    `.trim();

    return {
      tdsApplicable: remittance.tdsApplicable,
      tdsRate: remittance.tdsRate,
      tdsAmount: applicableTDS,
      netPayable,
      section: applicableSection,
      explanation,
    };
  }
}

// NRI Bank Account Treatment Engine
export class NRIBankAccountEngine {
  /**
   * Determine taxability of NRI bank account income
   * References: Section 2(29A) - Income of NRI (from NRE account is exempt)
   */
  calculateAccountIncome(account: NRIBankAccount): {
    interestEarned: number;
    taxableIncome: number;
    tdsApplicable: boolean;
    tdsRate: number;
    explanation: string;
  } {
    let taxableIncome = 0;
    let tdsRate = 0;

    // NRE account: Interest is exempt from tax
    if (account.accountType === 'NRE') {
      taxableIncome = 0;
      tdsRate = 0;
    }
    // NRO account: Interest is taxable
    else if (account.accountType === 'NRO') {
      taxableIncome = account.interestEarned;
      tdsRate = 19.8; // TDS rate for NRI savings account
    }
    // FCNR(B) account: Interest is taxable
    else if (account.accountType === 'FCNR_B') {
      taxableIncome = account.interestEarned;
      tdsRate = 19.8;
    }
    // RFC account: Interest is taxable
    else if (account.accountType === 'RFC') {
      taxableIncome = account.interestEarned;
      tdsRate = 19.8;
    }

    const tdsApplicable = taxableIncome > 0;
    const tdsAmount = taxableIncome * (tdsRate / 100);

    const explanation = `
      Account Type: ${account.accountType}
      Interest Earned: ${account.interestEarned}
      Taxable Income: ${taxableIncome}
      TDS Applicable: ${tdsApplicable}
      TDS Rate: ${tdsRate}%
      TDS Deducted: ${tdsAmount}
      Repatriation Allowed: ${account.repatriationAllowed}
    `.trim();

    return {
      interestEarned: account.interestEarned,
      taxableIncome,
      tdsApplicable,
      tdsRate,
      explanation,
    };
  }
}

// Section 9(1)(i) Income Classification Engine
export class Section9IncomeClassificationEngine {
  /**
   * Classify income as Indian or Foreign sourced
   * References: Section 9(1)(i) - India as place of business
   */
  classifyIncomeSource(data: {
    incomeType: string;
    businessLocation: string;
    controlManagementLocation: string;
    assetLocation: string;
    paymentSource: string;
  }): Section9IncomeClassification {
    const rules = [
      {
        rule: 'Business/Profession controlled from India',
        satisfied: data.controlManagementLocation === 'INDIA',
        explanation: 'Income from business controlled and managed from India is Indian-sourced',
      },
      {
        rule: 'Profession exercised in India',
        satisfied: data.businessLocation === 'INDIA',
        explanation: 'Professional income earned in India is Indian-sourced',
      },
      {
        rule: 'Assets located in India',
        satisfied: data.assetLocation === 'INDIA',
        explanation: 'Income from assets in India is Indian-sourced',
      },
      {
        rule: 'Income received in India',
        satisfied: data.paymentSource === 'INDIA',
        explanation: 'Income received in India is generally Indian-sourced',
      },
    ];

    const isIndianSourced = rules.some(r => r.satisfied);

    return {
      classificationId: `sec9_${Date.now()}`,
      incomeAmount: 0, // To be populated by caller
      incomeType: data.incomeType,
      isIndianSourced,
      reasoningChain: rules,
      classification: isIndianSourced ? 'INDIAN_SOURCED' : 'FOREIGN_SOURCED',
      applicableSection: '9(1)(i)',
    };
  }
}
