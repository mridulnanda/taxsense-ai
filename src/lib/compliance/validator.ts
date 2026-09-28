import { z } from 'zod';

// Compliance Rule
export interface ComplianceRule {
  ruleId: string;
  ruleName: string;
  section: string; // Section of Income Tax Act
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  validate: (data: any) => {
    passed: boolean;
    violations: string[];
    recommendation: string;
  };
  requiredDocumentation: string[];
  penaltyIfViolated: {
    amount: number | string;
    section: string;
  };
}

// Compliance Validation Result
export interface ComplianceValidationResult {
  validationId: string;
  panNumber: string;
  assessmentYear: number;
  validationDate: Date;
  totalRulesChecked: number;
  rulesViolated: number;
  criticalViolations: number;
  overallComplianceScore: number; // 0-100
  violations: Array<{
    ruleId: string;
    ruleName: string;
    severity: string;
    message: string;
    section: string;
    recommendation: string;
    penaltyRisk: number | string;
  }>;
  documentationCheckList: Map<string, boolean>;
  auditRiskScore: number; // 0-100
  complianceStatus: 'FULL_COMPLIANT' | 'MOSTLY_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
  dueDate: Date;
}

// Compliance Validation Engine
export class ComplianceValidationEngine {
  private rules: Map<string, ComplianceRule> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize all compliance rules
   */
  private initializeRules(): void {
    // NRI Taxation Rules
    this.registerRule({
      ruleId: 'NRI_001',
      ruleName: 'NRI Residential Status Verification',
      section: '6',
      description: 'Verify correct residential status determination based on 182-day rule',
      severity: 'CRITICAL',
      validate: (data) => {
        const { daysInIndia, residencyStatus } = data;
        const passed =
          (daysInIndia >= 182 && residencyStatus === 'RESIDENT') ||
          (daysInIndia < 182 && residencyStatus === 'NRI');
        return {
          passed,
          violations: passed ? [] : ['Residential status does not match presence test'],
          recommendation: 'Verify days physically present in India and update status accordingly',
        };
      },
      requiredDocumentation: ['Passport/Travel records', 'Visa stamps', 'Airline tickets'],
      penaltyIfViolated: { amount: '50% of undeclared income', section: '271AAB' },
    });

    // Foreign Income Declaration
    this.registerRule({
      ruleId: 'FA_001',
      ruleName: 'Schedule FA Disclosure',
      section: 'Schedule FA',
      description: 'Foreign assets must be disclosed in Schedule FA if exceeding threshold',
      severity: 'CRITICAL',
      validate: (data) => {
        const { totalForeignAssets, threshold = 2500000, isDisclosed } = data;
        const passed = totalForeignAssets <= threshold || isDisclosed;
        return {
          passed,
          violations: passed ? [] : ['Foreign assets not properly disclosed'],
          recommendation: 'Complete Schedule FA for all foreign assets exceeding 25 lakh',
        };
      },
      requiredDocumentation: ['Schedule FA', 'Asset valuation documents', 'Bank statements'],
      penaltyIfViolated: { amount: '50% of undisclosed value', section: '271AAB' },
    });

    // Derivatives MTM Documentation
    this.registerRule({
      ruleId: 'DRV_001',
      ruleName: 'Mark-to-Market Documentation',
      section: '43(5)',
      description: 'MTM calculated and documented for open derivative positions on March 31',
      severity: 'HIGH',
      validate: (data) => {
        const { mtmCalculated, mtmDateCorrect, positionsMarked } = data;
        const passed = mtmCalculated && mtmDateCorrect && positionsMarked;
        return {
          passed,
          violations: passed ? [] : ['MTM calculation incomplete or dated incorrectly'],
          recommendation: 'Calculate MTM on all open positions as of March 31 year-end',
        };
      },
      requiredDocumentation: ['MTM Schedule', 'Exchange statement on YE date', 'Trading log'],
      penaltyIfViolated: { amount: '30% of income or tax, whichever is higher', section: '271(1)(c)' },
    });

    // Transfer Pricing Documentation
    this.registerRule({
      ruleId: 'TP_001',
      ruleName: 'Transfer Pricing Documentation',
      section: '92D',
      description: 'TP documentation must be maintained for related party transactions',
      severity: 'CRITICAL',
      validate: (data) => {
        const { tpDocumentation, transactionAmount = 0, documented = false } = data;
        const threshold = 50000000; // 5 crore
        const passed = transactionAmount < threshold || documented;
        return {
          passed,
          violations: passed ? [] : ['TP documentation missing for related party transaction'],
          recommendation: 'File Form 3CEPE along with ITR and maintain contemporaneous TP study',
        };
      },
      requiredDocumentation: ['TP Study', 'Form 3CEPE', 'Benchmarking analysis'],
      penaltyIfViolated: { amount: '2% of adjustment or Rs. 1 crore, whichever is lower', section: '271AAE' },
    });

    // Crypto Taxation Rules
    this.registerRule({
      ruleId: 'CRYPTO_001',
      ruleName: 'Crypto Trading Income Reporting',
      section: '28(1)',
      description: 'All crypto trading gains must be reported as business/capital gains',
      severity: 'HIGH',
      validate: (data) => {
        const { totalCryptoGains, isReported, documentation } = data;
        const passed = totalCryptoGains === 0 || (isReported && documentation);
        return {
          passed,
          violations: passed ? [] : ['Crypto gains not reported or documented'],
          recommendation: 'Report all crypto trades with proper cost basis documentation',
        };
      },
      requiredDocumentation: ['Exchange statements', 'Trade confirmations', 'Cost basis tracking'],
      penaltyIfViolated: { amount: '50% of undeclared crypto income', section: '271AAB' },
    });

    // Mining Income Classification
    this.registerRule({
      ruleId: 'MINING_001',
      ruleName: 'Crypto Mining Income Classification',
      section: '56(2)',
      description: 'Mining income must be recognized at FMV on receipt date',
      severity: 'MEDIUM',
      validate: (data) => {
        const { miningIncome, recordedAtFMV } = data;
        const passed = miningIncome === 0 || recordedAtFMV;
        return {
          passed,
          violations: passed ? [] : ['Mining income not recorded at FMV on receipt date'],
          recommendation: 'Record mining income at fair market value on the date of receipt',
        };
      },
      requiredDocumentation: ['Mining pool statement', 'FMV on receipt date evidence'],
      penaltyIfViolated: { amount: '50% of undervalued income', section: '271(1)(c)' },
    });

    // TDS Compliance
    this.registerRule({
      ruleId: 'TDS_001',
      ruleName: 'TDS Deduction and Deposit',
      section: '200-209',
      description: 'TDS must be deducted and deposited on time',
      severity: 'CRITICAL',
      validate: (data) => {
        const { tdsDeductible, tdsDeducted, tdsDeposited, depositDate } = data;
        const onTime = depositDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day rule
        const passed = !tdsDeductible || (tdsDeducted && tdsDeposited && onTime);
        return {
          passed,
          violations: passed ? [] : ['TDS deduction or deposit not compliant'],
          recommendation: 'Deduct TDS within 7 days and deposit before due date',
        };
      },
      requiredDocumentation: ['TDS certificate', 'Bank receipt', 'ITNS16 form'],
      penaltyIfViolated: { amount: 'Interest + 50% penalty on TDS due', section: '220-221' },
    });

    // Return Filing Deadline
    this.registerRule({
      ruleId: 'RETURN_001',
      ruleName: 'Return of Income Filing',
      section: '139(1)',
      description: 'ITR must be filed on or before July 31 for the assessment year',
      severity: 'CRITICAL',
      validate: (data) => {
        const { filingDeadline, fileDate } = data;
        const passed = fileDate <= filingDeadline;
        return {
          passed,
          violations: passed ? [] : ['Return filed after statutory deadline'],
          recommendation: `File return on or before July 31 of the assessment year`,
        };
      },
      requiredDocumentation: ['Signed ITR-V', 'Aadhaar', 'All schedules'],
      penaltyIfViolated: { amount: 'Penalty up to Rs. 10,000', section: '271A' },
    });

    // Section 80G Deduction
    this.registerRule({
      ruleId: 'DEDUCTION_001',
      ruleName: 'Section 80G Charitable Donations',
      section: '80G',
      description: 'Only donations to approved institutions get deduction',
      severity: 'MEDIUM',
      validate: (data) => {
        const { recipientApproved, receiptAvailable } = data;
        const passed = recipientApproved && receiptAvailable;
        return {
          passed,
          violations: passed ? [] : ['Donation to unapproved entity or no receipt'],
          recommendation: 'Ensure recipient is on approved list and receipt is retained',
        };
      },
      requiredDocumentation: ['Approval certificate', 'Donation receipt', 'PAN of recipient'],
      penaltyIfViolated: { amount: 'Disallowance of deduction', section: '271(1)(c)' },
    });

    // Interest Rate Compliance
    this.registerRule({
      ruleId: 'INTEREST_001',
      ruleName: 'Interest Calculation Accuracy',
      section: '234',
      description: 'Interest on late payment calculated correctly at 12% p.a.',
      severity: 'MEDIUM',
      validate: (data) => {
        const { paymentDate, taxDue, interestCalculated, expectedInterest } = data;
        const passed = Math.abs(interestCalculated - expectedInterest) < 100; // 100 INR tolerance
        return {
          passed,
          violations: passed ? [] : ['Interest calculation inaccurate'],
          recommendation: 'Verify interest calculation at 12% p.a. from due date to payment',
        };
      },
      requiredDocumentation: ['Tax schedule', 'Payment receipt', 'Interest calculation worksheet'],
      penaltyIfViolated: { amount: 'Penalty for late interest payment', section: '271A' },
    });
  }

  /**
   * Register a compliance rule
   */
  registerRule(rule: ComplianceRule): void {
    this.rules.set(rule.ruleId, rule);
  }

  /**
   * Validate compliance for a tax return
   */
  validateCompliance(data: {
    panNumber: string;
    assessmentYear: number;
    taxReturnData: any;
    foreignIncomes?: any;
    derivativePositions?: any;
    cryptoTransactions?: any;
    relatedPartyTransactions?: any;
  }): ComplianceValidationResult {
    const violations: Array<{
      ruleId: string;
      ruleName: string;
      severity: string;
      message: string;
      section: string;
      recommendation: string;
      penaltyRisk: number | string;
    }> = [];

    let criticalViolations = 0;

    // Run all registered rules
    this.rules.forEach((rule) => {
      const ruleData = this.prepareRuleData(rule.ruleId, data);
      const result = rule.validate(ruleData);

      if (!result.passed) {
        violations.push({
          ruleId: rule.ruleId,
          ruleName: rule.ruleName,
          severity: rule.severity,
          message: result.violations.join(', '),
          section: rule.section,
          recommendation: result.recommendation,
          penaltyRisk: rule.penaltyIfViolated.amount,
        });

        if (rule.severity === 'CRITICAL') {
          criticalViolations++;
        }
      }
    });

    const complianceScore = Math.max(
      0,
      100 - (violations.length * 10 + criticalViolations * 20)
    );

    const complianceStatus =
      complianceScore === 100
        ? 'FULL_COMPLIANT'
        : complianceScore >= 80
        ? 'MOSTLY_COMPLIANT'
        : complianceScore >= 60
        ? 'PARTIALLY_COMPLIANT'
        : 'NON_COMPLIANT';

    return {
      validationId: `comp_val_${Date.now()}`,
      panNumber: data.panNumber,
      assessmentYear: data.assessmentYear,
      validationDate: new Date(),
      totalRulesChecked: this.rules.size,
      rulesViolated: violations.length,
      criticalViolations,
      overallComplianceScore: complianceScore,
      violations,
      documentationCheckList: this.generateDocumentationChecklist(),
      auditRiskScore: 100 - complianceScore,
      complianceStatus,
      dueDate: new Date(data.assessmentYear + 1, 6, 31), // July 31
    };
  }

  /**
   * Prepare data for rule validation
   */
  private prepareRuleData(ruleId: string, data: any): any {
    switch (ruleId) {
      case 'NRI_001':
        return {
          daysInIndia: data.taxReturnData?.daysInIndia || 0,
          residencyStatus: data.taxReturnData?.residencyStatus || 'NRI',
        };
      case 'FA_001':
        return {
          totalForeignAssets: data.foreignIncomes?.totalValue || 0,
          isDisclosed: data.foreignIncomes?.disclosed || false,
        };
      case 'DRV_001':
        return {
          mtmCalculated: data.derivativePositions?.mtmCalculated || false,
          mtmDateCorrect: data.derivativePositions?.mtmDateCorrect || false,
          positionsMarked: data.derivativePositions?.positionsMarked || false,
        };
      case 'CRYPTO_001':
        return {
          totalCryptoGains: data.cryptoTransactions?.totalGains || 0,
          isReported: data.cryptoTransactions?.reported || false,
          documentation: data.cryptoTransactions?.documented || false,
        };
      case 'TP_001':
        return {
          transactionAmount: data.relatedPartyTransactions?.amount || 0,
          documented: data.relatedPartyTransactions?.tpDocumented || false,
        };
      default:
        return {};
    }
  }

  /**
   * Generate documentation checklist
   */
  private generateDocumentationChecklist(): Map<string, boolean> {
    const checklist = new Map<string, boolean>();

    checklist.set('PAN Card', false);
    checklist.set('Aadhaar', false);
    checklist.set('Bank Statements', false);
    checklist.set('Investment Statements', false);
    checklist.set('Salary Certificates', false);
    checklist.set('Foreign Asset Declaration', false);
    checklist.set('Travel Records', false);
    checklist.set('TDS Certificates', false);
    checklist.set('Trading Statements', false);
    checklist.set('Mining Documentation', false);

    return checklist;
  }

  /**
   * Generate audit risk score based on violations
   */
  calculateAuditRisk(violations: any[]): number {
    let riskScore = 20; // Base 20% risk

    violations.forEach((v) => {
      switch (v.severity) {
        case 'CRITICAL':
          riskScore += 20;
          break;
        case 'HIGH':
          riskScore += 10;
          break;
        case 'MEDIUM':
          riskScore += 5;
          break;
        default:
          riskScore += 2;
      }
    });

    return Math.min(100, riskScore);
  }

  /**
   * Get specific guidance for violation
   */
  getRemediationGuidance(ruleId: string): {
    steps: string[];
    timeline: string;
    documents: string[];
  } {
    const rule = this.rules.get(ruleId);
    if (!rule) return { steps: [], timeline: '', documents: [] };

    return {
      steps: [
        `Understand Section ${rule.section}`,
        rule.description,
        'Collect supporting documentation',
        'Calculate correct amount',
        'File/Update return if needed',
      ],
      timeline: '30 days recommended',
      documents: rule.requiredDocumentation,
    };
  }
}
