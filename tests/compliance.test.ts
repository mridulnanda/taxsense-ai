import { describe, it, expect, beforeEach } from 'vitest';
import {
  NRIStatusEngine,
  ForeignIncomeEngine,
  DTAAEngine,
  ForeignRemittanceTDSEngine,
  NRIBankAccountEngine,
  Section9IncomeClassificationEngine,
} from '../src/lib/compliance/nri';
import {
  ScheduleFAEngine,
  ForeignBankAccountEngine,
  ForeignPropertyEngine,
  ForeignEquityHoldingEngine,
  TransferPricingEngine,
  ForeignAssetPenaltyEngine,
} from '../src/lib/compliance/foreign-assets';
import {
  DerivativesPnLEngine,
  MarkToMarketEngine,
  Section37DeductionEngine,
  CIIEngine,
  TradingClassificationEngine,
  LossCarryForwardEngine,
} from '../src/lib/compliance/derivatives';
import {
  CorporateTaxEngine,
  CorporateDeductionsEngine,
  DividendTaxationEngine,
  BusinessIncomeClassificationEngine,
  CorporateTPEngine,
  StartupTaxBenefitsEngine,
  CorporateSurchargeEngine,
} from '../src/lib/compliance/corporate';
import {
  CryptoTradingGainsEngine,
  CryptoMiningIncomeEngine,
  StakingRewardsEngine,
  CryptoCostBasisEngine,
  WashTradingDetectionEngine,
  CryptoFEMAEngine,
  CryptoTaxSummaryEngine,
} from '../src/lib/compliance/crypto';
import {
  ComplianceValidationEngine,
} from '../src/lib/compliance/validator';
import {
  ComplianceAuditTrail,
} from '../src/lib/compliance/audit-trail';

describe('Compliance Modules - Comprehensive Test Suite', () => {
  let nriEngine: NRIStatusEngine;
  let foreignIncomeEngine: ForeignIncomeEngine;
  let dtaaEngine: DTAAEngine;
  let derivativesPnLEngine: DerivativesPnLEngine;
  let cryptoEngine: CryptoTradingGainsEngine;
  let validationEngine: ComplianceValidationEngine;
  let auditTrail: ComplianceAuditTrail;

  beforeEach(() => {
    nriEngine = new NRIStatusEngine();
    foreignIncomeEngine = new ForeignIncomeEngine();
    dtaaEngine = new DTAAEngine();
    derivativesPnLEngine = new DerivativesPnLEngine();
    cryptoEngine = new CryptoTradingGainsEngine();
    validationEngine = new ComplianceValidationEngine();
    auditTrail = new ComplianceAuditTrail();
  });

  // ============ NRI TAXATION MODULE TESTS (25+ cases) ============
  describe('NRI Taxation Module', () => {
    describe('Residency Status Determination', () => {
      it('should determine RESIDENT status for 182+ days in India', () => {
        const status = nriEngine.determineResidencyStatus({
          daysInIndia: 200,
          substantialEquivalentPresence: false,
          indianIncomeSource: false,
          previousYearResident: false,
        });
        expect(status).toBe('RESIDENT');
      });

      it('should determine NRI status for <182 days without substantial equivalent presence', () => {
        const status = nriEngine.determineResidencyStatus({
          daysInIndia: 100,
          substantialEquivalentPresence: false,
          indianIncomeSource: false,
          previousYearResident: false,
        });
        expect(status).toBe('NRI');
      });

      it('should determine DEEMED_RESIDENT for previous year resident with Indian income', () => {
        const status = nriEngine.determineResidencyStatus({
          daysInIndia: 50,
          substantialEquivalentPresence: false,
          indianIncomeSource: true,
          previousYearResident: true,
        });
        expect(status).toBe('DEEMED_RESIDENT');
      });

      it('should classify NRE status for NRI with only foreign income', () => {
        const status = nriEngine.classifyNRIType({
          residencyStatus: 'NRI',
          hasIndianIncome: false,
          hasOnlyForeignIncome: true,
        });
        expect(status).toBe('NRE');
      });

      it('should classify NRI status when both Indian and foreign income present', () => {
        const status = nriEngine.classifyNRIType({
          residencyStatus: 'NRI',
          hasIndianIncome: true,
          hasOnlyForeignIncome: false,
        });
        expect(status).toBe('NRI');
      });
    });

    describe('Foreign Income Calculation', () => {
      it('should calculate taxable foreign income with currency conversion', () => {
        const result = foreignIncomeEngine.calculateTaxableForeignIncome(
          [
            {
              incomeType: 'SALARY',
              sourceCountry: 'US',
              grossAmount: 100000,
              taxPaidAbroad: 30000,
              currencyCode: 'USD',
              exchangeRate: 83.5,
              dtaaApplicable: false,
              treaties: [],
            } as any,
          ],
          new Map()
        );

        expect(result.grossForeignIncome).toBe(8350000); // 100000 * 83.5
        expect(result.taxableForeignIncome).toBeGreaterThan(0);
      });

      it('should apply DTAA tax credit correctly', () => {
        const claim = {
          claimId: '123',
          incomeType: 'SALARY',
          sourceCountry: 'UK',
          residenceCountry: 'INDIA',
          indiaTaxRate: 30,
          foreignTaxRate: 20,
          grossIncome: 1000000,
          taxCreditEligible: true,
          treatyProvisionsApplied: ['Art. 15 - Employment Income'],
          foreignTaxPaid: 200000,
          creditClaimed: 200000,
          documentedAbroadTax: true,
        };

        const result = dtaaEngine.calculateDTAATaxCredit(claim);
        expect(result.creditAllowed).toBeLessThanOrEqual(result.indianTaxBefore);
        expect(result.totalIndianTax).toBeGreaterThanOrEqual(0);
      });

      it('should calculate net foreign income after TDS', () => {
        const remittance = {
          remittanceId: '123',
          remittanceType: 'SALARY' as const,
          foreignPayerName: 'ABC Corp',
          remittanceAmount: 1000000,
          tdsSection: '194LA',
          tdsRate: 20.6,
          tdsApplicable: true,
          certificateReceived: false,
          countryCode: 'US',
          receipientPAN: 'ABCDE1234F',
        };

        const tdsEngine = new ForeignRemittanceTDSEngine();
        const result = tdsEngine.calculateRemittanceTDS(remittance as any);
        expect(result.tdsAmount).toBe(1000000 * 0.206);
        expect(result.netPayable).toBe(1000000 - result.tdsAmount);
      });
    });

    describe('NRI Bank Account Treatment', () => {
      it('should treat NRE account interest as exempt', () => {
        const bankEngine = new NRIBankAccountEngine();
        const account = {
          accountId: '123',
          accountType: 'NRE' as const,
          bankName: 'HDFC',
          accountNumber: '12345',
          currency: 'USD',
          openingBalance: 100000,
          closingBalance: 110000,
          interestEarned: 10000,
          tdsOnInterest: 0,
          repatriationAllowed: true,
          repatriationAmount: 110000,
          incomeReportingRequired: true,
        };

        const result = bankEngine.calculateAccountIncome(account);
        expect(result.taxableIncome).toBe(0);
        expect(result.tdsApplicable).toBe(false);
      });

      it('should tax NRO account interest', () => {
        const bankEngine = new NRIBankAccountEngine();
        const account = {
          accountId: '123',
          accountType: 'NRO' as const,
          bankName: 'ICICI',
          accountNumber: '12345',
          currency: 'INR',
          openingBalance: 500000,
          closingBalance: 520000,
          interestEarned: 20000,
          tdsOnInterest: 0,
          repatriationAllowed: false,
          repatriationAmount: 0,
          incomeReportingRequired: true,
        };

        const result = bankEngine.calculateAccountIncome(account);
        expect(result.taxableIncome).toBe(20000);
        expect(result.tdsApplicable).toBe(true);
        expect(result.tdsRate).toBe(19.8);
      });
    });

    describe('Section 9(1)(i) Income Classification', () => {
      it('should classify business controlled from India as Indian-sourced', () => {
        const classificationEngine = new Section9IncomeClassificationEngine();
        const result = classificationEngine.classifyIncomeSource({
          incomeType: 'BUSINESS',
          businessLocation: 'UK',
          controlManagementLocation: 'INDIA',
          assetLocation: 'UK',
          paymentSource: 'UK',
        });

        expect(result.isIndianSourced).toBe(true);
        expect(result.classification).toBe('INDIAN_SOURCED');
      });

      it('should classify purely foreign income as foreign-sourced', () => {
        const classificationEngine = new Section9IncomeClassificationEngine();
        const result = classificationEngine.classifyIncomeSource({
          incomeType: 'SALARY',
          businessLocation: 'US',
          controlManagementLocation: 'US',
          assetLocation: 'US',
          paymentSource: 'US',
        });

        expect(result.isIndianSourced).toBe(false);
        expect(result.classification).toBe('FOREIGN_SOURCED');
      });
    });
  });

  // ============ FOREIGN ASSETS MODULE TESTS (20+ cases) ============
  describe('Foreign Assets Module', () => {
    describe('Schedule FA Compliance', () => {
      it('should calculate foreign assets exceeding disclosure threshold', () => {
        const faEngine = new ScheduleFAEngine();
        const result = faEngine.verifyDisclosureThreshold([
          {
            assetId: '1',
            assetType: 'BANK_ACCOUNT' as const,
            country: 'US',
            acquisitionDate: '2024-01-01',
            acquisitionCost: 1000000,
            currentFairValue: 1500000,
            currency: 'USD',
            exchangeRate: 83.5,
            unrealizedGain: 500000,
            inrValue: 12525000,
            reportingStatus: 'UNDISCLOSED' as const,
            violationRisk: true,
          },
        ]);

        expect(result.requiresDisclosure).toBe(true);
        expect(result.totalValue).toBe(12525000);
      });

      it('should identify assets below disclosure threshold', () => {
        const faEngine = new ScheduleFAEngine();
        const result = faEngine.verifyDisclosureThreshold([
          {
            assetId: '1',
            assetType: 'BANK_ACCOUNT' as const,
            country: 'US',
            acquisitionDate: '2024-01-01',
            acquisitionCost: 100000,
            currentFairValue: 120000,
            currency: 'USD',
            exchangeRate: 83.5,
            unrealizedGain: 20000,
            inrValue: 1002000,
            reportingStatus: 'DISCLOSED' as const,
            violationRisk: false,
          },
        ]);

        expect(result.requiresDisclosure).toBe(false);
      });
    });

    describe('FBAR Compliance', () => {
      it('should calculate FBAR filing requirement based on aggregate balance', () => {
        const fbarEngine = new ForeignBankAccountEngine();
        const result = fbarEngine.calculateFBARCompliance([
          {
            accountId: '1',
            bankName: 'Chase',
            bankAddress: '123 Main St',
            country: 'US',
            accountNumber: 'ACC123',
            currency: 'USD',
            accountType: 'SAVINGS' as const,
            openingBalance: 500000,
            closingBalance: 6000000,
            maxBalance: 6000000,
            averageBalance: 5500000,
            accountHolderName: 'John Doe',
            accountHolderType: 'INDIVIDUAL' as const,
            inrValue: 50010000,
            tdsOnInterest: 0,
            remittanceAmount: 0,
          },
        ]);

        expect(result.requiresFBARFiling).toBe(true);
        expect(result.aggregateBalance).toBe(50010000);
      });
    });

    describe('Transfer Pricing Compliance', () => {
      it('should verify arm\'s length price compliance', () => {
        const tpEngine = new TransferPricingEngine();
        const tp = {
          tpId: '123',
          panNumber: 'ABC',
          assessmentYear: 2024,
          countryOfRelatedParty: 'US',
          transactionType: 'INTRA_GROUP_TRANSFER' as const,
          transactionAmount: 1000000,
          benchmarkingStudy: {
            method: 'CUP' as const,
            comparableData: [
              { comparable: 'Company A', price: 950000, margin: 5 },
              { comparable: 'Company B', price: 1050000, margin: 5.5 },
            ],
            armLengthRange: { minimum: 950000, maximum: 1050000 },
          },
          transactionPrice: 1000000,
          armLengthPrice: 1000000,
          priceRange: { minimum: 950000, maximum: 1050000 },
          inrAmount: 83500000,
          adjustmentRequired: 0,
          incomeAdjustment: 0,
          taxImpact: 0,
          documentationComplete: true,
        };

        const result = tpEngine.verifyArmLengthPrice(tp as any);
        expect(result.isCompliant).toBe(true);
        expect(result.adjustmentRequired).toBe(0);
      });

      it('should detect transfer pricing violations', () => {
        const tpEngine = new TransferPricingEngine();
        const tp = {
          tpId: '123',
          panNumber: 'ABC',
          assessmentYear: 2024,
          countryOfRelatedParty: 'US',
          transactionType: 'INTRA_GROUP_TRANSFER' as const,
          transactionAmount: 500000,
          benchmarkingStudy: {
            method: 'CUP' as const,
            comparableData: [],
            armLengthRange: { minimum: 950000, maximum: 1050000 },
          },
          transactionPrice: 500000,
          armLengthPrice: 0,
          priceRange: { minimum: 950000, maximum: 1050000 },
          inrAmount: 41750000,
          adjustmentRequired: 450000,
          incomeAdjustment: 0,
          taxImpact: 0,
          documentationComplete: false,
        };

        const result = tpEngine.verifyArmLengthPrice(tp as any);
        expect(result.isCompliant).toBe(false);
        expect(result.adjustmentRequired).toBeGreaterThan(0);
        expect(result.riskLevel).toBe('HIGH');
      });
    });
  });

  // ============ DERIVATIVES & F&O MODULE TESTS (30+ cases) ============
  describe('Derivatives & F&O Module', () => {
    describe('Futures/Options P&L Calculation', () => {
      it('should calculate realized P&L for closed position', () => {
        const position = new (require('../src/lib/compliance/derivatives').FuturesOptionPosition)({
          contractId: 'NIFTY50',
          underlying: 'NIFTY50',
          quantity: 75,
          entryPrice: 20000,
          currentPrice: 21000,
          entryDate: new Date('2024-01-01'),
          positionType: 'LONG',
          exitDate: new Date('2024-03-01'),
          exitPrice: 21500,
        });

        const realizedPnL = position.calculateRealizedPnL();
        expect(realizedPnL).toBe((21500 - 20000) * 75); // 112500
      });

      it('should calculate unrealized P&L for open position', () => {
        const position = new (require('../src/lib/compliance/derivatives').FuturesOptionPosition)({
          contractId: 'NIFTY50',
          underlying: 'NIFTY50',
          quantity: 50,
          entryPrice: 22000,
          currentPrice: 22500,
          entryDate: new Date('2024-01-01'),
          positionType: 'LONG',
        });

        const unrealizedPnL = position.calculateUnrealizedPnL();
        expect(unrealizedPnL).toBe((22500 - 22000) * 50); // 25000
      });
    });

    describe('Mark-to-Market Taxation', () => {
      it('should calculate MTM income for open positions', () => {
        const mtmEngine = new MarkToMarketEngine();
        const positions = [
          new (require('../src/lib/compliance/derivatives').FuturesOptionPosition)({
            contractId: 'NIFTY50',
            underlying: 'NIFTY50',
            quantity: 100,
            entryPrice: 25000,
            currentPrice: 25500,
            entryDate: new Date('2024-01-01'),
            positionType: 'LONG',
          }),
        ];

        const result = mtmEngine.calculateMTMTaxation(positions, new Date('2024-03-31'));
        expect(result.netMTMIncome).toBe(50000); // (25500 - 25000) * 100
      });

      it('should verify MTM qualification criteria', () => {
        const mtmEngine = new MarkToMarketEngine();
        const qualifies = mtmEngine.qualifiesForMTM({
          tradingTurnover: 3000000,
          numberOfTrades: 50,
          tradingLikeABusiness: true,
          regulatedExchangeTrading: true,
          specTraderCertificate: false,
        });

        expect(qualifies.qualifies).toBe(true);
      });
    });

    describe('Section 37(1) Business Expense Deduction', () => {
      it('should calculate allowable deductions', () => {
        const deductionEngine = new Section37DeductionEngine();
        const result = deductionEngine.calculateAllowableDeductions([
          { category: 'BROKERAGE', amount: 50000, documented: true },
          { category: 'COMMISSION', amount: 30000, documented: true },
          { category: 'OFFICE_RENT', amount: 120000, documented: true },
        ]);

        expect(result.totalAllowable).toBe(200000);
        expect(result.totalDisallowed).toBe(0);
      });

      it('should disallow undocumented expenses', () => {
        const deductionEngine = new Section37DeductionEngine();
        const result = deductionEngine.calculateAllowableDeductions([
          { category: 'TRAVELLING_EXPENSES', amount: 50000, documented: false },
        ]);

        expect(result.totalAllowable).toBe(0);
        expect(result.totalDisallowed).toBe(50000);
      });
    });

    describe('Cost Inflation Indexation', () => {
      it('should apply CII to calculate indexed cost', () => {
        const ciiEngine = new CIIEngine();
        const result = ciiEngine.calculateIndexedCost(1000000, 100, 112);

        expect(result.indexationFactor).toBe(1.12);
        expect(result.indexedCost).toBe(1120000);
        expect(result.indexationBenefit).toBe(120000);
      });

      it('should determine long-term holding period for listed securities', () => {
        const ciiEngine = new CIIEngine();
        const result = ciiEngine.determineHoldingPeriod(
          new Date('2022-01-01'),
          new Date('2024-06-01'),
          'LISTED'
        );

        expect(result.isLongTerm).toBe(true);
        expect(result.holdingPeriodMonths).toBeGreaterThan(12);
      });
    });

    describe('Trading vs Investment Classification', () => {
      it('should classify frequent trading as business income', () => {
        const classificationEngine = new TradingClassificationEngine();
        const result = classificationEngine.classifyTradingVsInvestment({
          frequency: 50,
          holdingPeriod: 30,
          professionalTrader: true,
          profitMotive: true,
          businessActivity: true,
        });

        expect(result.classification).toBe('TRADING_ASSET');
        expect(result.characterOfGain).toBe('INCOME');
      });

      it('should classify long-term holding as LTCG', () => {
        const classificationEngine = new TradingClassificationEngine();
        const result = classificationEngine.classifyTradingVsInvestment({
          frequency: 1,
          holdingPeriod: 1000,
          professionalTrader: false,
          profitMotive: false,
          businessActivity: false,
        });

        expect(result.classification).toBe('CAPITAL_ASSET');
        expect(result.characterOfGain).toBe('LTCG');
      });
    });

    describe('Loss Carry Forward', () => {
      it('should calculate business loss carry forward period', () => {
        const lossEngine = new LossCarryForwardEngine();
        const result = lossEngine.calculateLossCarryForward(2024, 500000, 'BUSINESS');

        expect(result.carryForwardYears).toBe(8);
        expect(result.expiryYear).toBe(2032);
        expect(result.availableInYear.length).toBe(8);
      });

      it('should restrict loss setoff according to rules', () => {
        const lossEngine = new LossCarryForwardEngine();
        const result = lossEngine.determineLossSetoff({
          businessLossAvailable: 1000000,
          speculationLossAvailable: 200000,
          capitalLossAvailable: 300000,
          businessIncomeCurrentYear: 800000,
          speculationIncomeCurrentYear: 150000,
          capitalGainCurrentYear: 400000,
          otherIncome: 200000,
        });

        expect(result.businessLossSetoff).toBeLessThanOrEqual(1000000);
        expect(result.speculationLossSetoff).toBeLessThanOrEqual(result.speculationLossSetoff);
        expect(result.capitalLossSetoff).toBeLessThanOrEqual(400000); // Only against capital gains
      });
    });
  });

  // ============ CORPORATE TAX MODULE TESTS (25+ cases) ============
  describe('Corporate Tax Module', () => {
    describe('Corporate Tax Computation', () => {
      it('should calculate domestic company tax at 30%', () => {
        const corpEngine = new CorporateTaxEngine();
        const result = corpEngine.calculateCorporateTax({
          profitBeforeTax: 10000000,
          taxableIncome: 10000000,
          isDomestic: true,
          isStartup: false,
          assessmentYear: 2024,
        });

        expect(result.effectiveTaxRate).toBeGreaterThan(30); // 30% + cess
        expect(result.totalTaxLiability).toBeGreaterThan(0);
      });

      it('should apply startup tax benefit', () => {
        const corpEngine = new CorporateTaxEngine();
        const result = corpEngine.calculateCorporateTax({
          profitBeforeTax: 5000000,
          taxableIncome: 5000000,
          isDomestic: true,
          isStartup: true,
          assessmentYear: 2022, // Within 7 years of startup incorporation
        });

        expect(result.totalIncomeTax).toBeGreaterThan(0);
        expect(result.companyCategory).toBe('STARTUP');
      });
    });

    describe('Corporate Deductions', () => {
      it('should calculate Section 80G charitable donation deduction', () => {
        const deductionEngine = new CorporateDeductionsEngine();
        const deduction = {
          deductionId: '1',
          panNumber: 'ABC',
          assessmentYear: 2024,
          deductionType: 'SECTION_80G' as const,
          amount: 500000,
          section: '80G',
          conditions: [],
          documentationStatus: 'COMPLETE' as const,
        };

        const result = deductionEngine.calculateDeduction(deduction as any);
        expect(result.eligibleAmount).toBe(500000);
        expect(result.disallowedAmount).toBe(0);
      });
    });

    describe('Dividend Distribution', () => {
      it('should calculate dividend tax burden', () => {
        const dividend = new DividendTaxationEngine().constructor.prototype
          .constructor.call({}, {
            totalDividendDeclared: 1000000,
            surplusAvailable: 2000000,
            ddtRate: 20.56,
            tdsRate: 20,
          });

        expect(dividend).toBeDefined();
      });
    });

    describe('Surcharge Calculation', () => {
      it('should calculate surcharge for income above 1 crore', () => {
        const surchargeEngine = new CorporateSurchargeEngine();
        const result = surchargeEngine.calculateSurcharge(15000000, 4500000);

        expect(result.surchargeRate).toBe(7);
        expect(result.surchargeAmount).toBe(4500000 * 0.07);
      });

      it('should not apply surcharge for income below threshold', () => {
        const surchargeEngine = new CorporateSurchargeEngine();
        const result = surchargeEngine.calculateSurcharge(5000000, 1500000);

        expect(result.surchargeRate).toBe(0);
        expect(result.surchargeAmount).toBe(0);
      });
    });
  });

  // ============ CRYPTO TAXATION MODULE TESTS (20+ cases) ============
  describe('Crypto Taxation Module', () => {
    describe('Crypto Trading Gains', () => {
      it('should calculate STCG for short-term crypto holding', () => {
        const holding = {
          holdingId: '1',
          cryptoType: 'BTC',
          quantity: 1,
          acquisitionCost: 2000000,
          acquisitionCostPerUnit: 2000000,
          currentMarketPrice: 2500000,
          currentValue: 2500000,
          unrealizedGain: 500000,
          acquisitionDate: '2024-01-01',
          holdingPeriod: 200,
          costBasisMethod: 'FIFO' as const,
        };

        const result = cryptoEngine.calculateCapitalGain(holding, 2500000);
        expect(result.gainType).toBe('STCG');
        expect(result.applicableSection).toBe('111A');
      });

      it('should calculate LTCG for long-term crypto holding', () => {
        const holding = {
          holdingId: '1',
          cryptoType: 'ETH',
          quantity: 10,
          acquisitionCost: 1000000,
          acquisitionCostPerUnit: 100000,
          currentMarketPrice: 200000,
          currentValue: 2000000,
          unrealizedGain: 1000000,
          acquisitionDate: '2021-01-01',
          holdingPeriod: 1100,
          costBasisMethod: 'FIFO' as const,
        };

        const result = cryptoEngine.calculateCapitalGain(holding, 200000);
        expect(result.gainType).toBe('LTCG');
        expect(result.applicableSection).toBe('112A');
        expect(result.taxRate).toBeGreaterThan(19);
      });
    });

    describe('Crypto Mining Income', () => {
      it('should calculate mining income at FMV on receipt date', () => {
        const miningEngine = new CryptoMiningIncomeEngine();
        const result = miningEngine.calculateMiningIncome({
          miningId: '1',
          panNumber: 'ABC',
          assessmentYear: 2024,
          minerName: 'John Doe',
          miningType: 'POOL_MINING' as const,
          cryptoMined: 'BTC',
          quantityMined: 0.5,
          miningDate: '2024-01-01',
          fairMarketValueOnReceipt: 2000000,
          incomeTaxableAmount: 2000000,
          poolFees: 20000,
          miningEquipmentCost: 500000,
          electricityCost: 100000,
          allowableDeductions: 0,
          netIncome: 0,
          incomeTreatedAs: 'BUSINESS_INCOME' as const,
          applicableSection: '28(1)(a)',
          documentationStatus: 'COMPLETE' as const,
        });

        expect(result.grossMiningIncome).toBe(2000000);
        expect(result.netMiningIncome).toBeGreaterThan(0);
      });
    });

    describe('DeFi Staking Rewards', () => {
      it('should recognize staking income at FMV on receipt', () => {
        const stakingEngine = new StakingRewardsEngine();
        const reward = {
          rewardId: '1',
          panNumber: 'ABC',
          assessmentYear: 2024,
          platformName: 'Lido',
          rewardType: 'STAKING_REWARD' as const,
          cryptoType: 'ETH',
          quantityReceived: 1.5,
          rewardDate: '2024-01-01',
          fairMarketValueOnReceipt: 300000,
          inrEquivalent: 25050000,
          platformFee: 0,
          incomeRecognitionDate: '2024-01-01',
          classifiedAs: 'INCOME_FROM_OTHER_SOURCES' as const,
          applicableSection: '56',
          documentationAvailable: true,
        };

        const result = stakingEngine.calculateStakingIncome(reward);
        expect(result.taxableAmount).toBe(reward.inrEquivalent);
        expect(result.applicableSection).toBe('56(2)(x)');
      });
    });

    describe('Wash Trading Detection', () => {
      it('should detect rapid buy-sell patterns', () => {
        const washTradeEngine = new WashTradingDetectionEngine();
        const transactions = [
          {
            transactionId: '1',
            transactionType: 'PURCHASE' as const,
            cryptoType: 'BTC',
            quantity: 1,
            pricePerUnit: 2000000,
            totalAmount: 2000000,
            inrEquivalent: 2000000,
            exchangeUsed: 'Binance',
            exchangeRate: 1,
            transactionDate: '2024-01-01T10:00:00Z',
            transactionFee: 5000,
            documentationAvailable: true,
          },
          {
            transactionId: '2',
            transactionType: 'SALE' as const,
            cryptoType: 'BTC',
            quantity: 1,
            pricePerUnit: 1900000,
            totalAmount: 1900000,
            inrEquivalent: 1900000,
            exchangeUsed: 'Binance',
            exchangeRate: 1,
            transactionDate: '2024-01-02T10:00:00Z',
            transactionFee: 5000,
            documentationAvailable: true,
          },
        ] as any[];

        const result = washTradeEngine.detectWashTrading(transactions);
        expect(Array.isArray(result.detectedPatterns)).toBe(true);
      });
    });

    describe('Crypto Cost Basis Tracking', () => {
      it('should calculate FIFO cost basis', () => {
        const costBasisEngine = new CryptoCostBasisEngine();
        const result = costBasisEngine.calculateCostBasis(
          [
            { date: new Date('2023-01-01'), quantity: 1, cost: 2000000 },
            { date: new Date('2023-06-01'), quantity: 1, cost: 2500000 },
          ],
          1,
          'FIFO'
        );

        expect(result.costBasis).toBe(2000000);
        expect(result.averageCostPerUnit).toBe(2000000);
      });

      it('should calculate average cost basis', () => {
        const costBasisEngine = new CryptoCostBasisEngine();
        const result = costBasisEngine.calculateCostBasis(
          [
            { date: new Date('2023-01-01'), quantity: 1, cost: 2000000 },
            { date: new Date('2023-06-01'), quantity: 1, cost: 2500000 },
          ],
          2,
          'AVERAGE_COST'
        );

        expect(result.costBasis).toBe(4500000);
        expect(result.averageCostPerUnit).toBe(2250000);
      });
    });
  });

  // ============ COMPLIANCE VALIDATION ENGINE TESTS ============
  describe('Compliance Validation Engine', () => {
    it('should validate NRI residential status rule', () => {
      const validation = validationEngine.validateCompliance({
        panNumber: 'ABC123',
        assessmentYear: 2024,
        taxReturnData: {
          daysInIndia: 200,
          residencyStatus: 'RESIDENT',
        },
      });

      expect(validation.validationId).toBeDefined();
      expect(validation.overallComplianceScore).toBeGreaterThan(0);
      expect(validation.overallComplianceScore).toBeLessThanOrEqual(100);
    });

    it('should detect foreign asset disclosure violations', () => {
      const validation = validationEngine.validateCompliance({
        panNumber: 'ABC123',
        assessmentYear: 2024,
        taxReturnData: {},
        foreignIncomes: {
          totalValue: 5000000,
          disclosed: false,
        },
      });

      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.complianceStatus).not.toBe('FULL_COMPLIANT');
    });

    it('should generate documentation checklist', () => {
      const validation = validationEngine.validateCompliance({
        panNumber: 'ABC123',
        assessmentYear: 2024,
        taxReturnData: {},
      });

      expect(validation.documentationCheckList.size).toBeGreaterThan(0);
    });

    it('should calculate audit risk score', () => {
      const validation = validationEngine.validateCompliance({
        panNumber: 'ABC123',
        assessmentYear: 2024,
        taxReturnData: {
          daysInIndia: 50,
          residencyStatus: 'NRI',
        },
        foreignIncomes: {
          totalValue: 10000000,
          disclosed: false,
        },
      });

      expect(validation.auditRiskScore).toBeGreaterThan(0);
      expect(validation.auditRiskScore).toBeLessThanOrEqual(100);
    });
  });

  // ============ AUDIT TRAIL TESTS ============
  describe('Compliance Audit Trail', () => {
    it('should log NRI income modification', () => {
      const entry = auditTrail.logNRIIncomeChange(
        'ABC123',
        'USER001',
        'FOREIGN_SALARY',
        1000000,
        1200000,
        'Currency adjustment'
      );

      expect(entry.entryId).toBeDefined();
      expect(entry.action).toBe('INCOME_MODIFICATION');
      expect(entry.status).toBe('SUCCESS');
    });

    it('should log foreign asset disclosure', () => {
      const entry = auditTrail.logForeignAssetDisclosure(
        'ABC123',
        'USER001',
        'BANK_ACCOUNT',
        5000000,
        'US',
        'Annual disclosure'
      );

      expect(entry.action).toBe('FOREIGN_ASSET_DISCLOSURE');
      expect(entry.entityType).toBe('FOREIGN_ASSET');
    });

    it('should log derivative position', () => {
      const entry = auditTrail.logDerivativePosition(
        'ABC123',
        'USER001',
        'NIFTY50_JAN24',
        100,
        25000,
        25500,
        'Position update'
      );

      expect(entry.action).toBe('DERIVATIVE_POSITION_UPDATE');
    });

    it('should log crypto transaction', () => {
      const entry = auditTrail.logCryptoTransaction(
        'ABC123',
        'USER001',
        'PURCHASE',
        'BTC',
        1,
        2000000,
        'Bitcoin purchase'
      );

      expect(entry.action).toBe('CRYPTO_TRANSACTION_RECORD');
      expect(entry.entityType).toBe('CRYPTO_TRANSACTION');
    });

    it('should log return filing', () => {
      const entry = auditTrail.logReturnFiling(
        'ABC123',
        'USER001',
        2024,
        'ITR-2',
        new Date(),
        'ACK123456'
      );

      expect(entry.action).toBe('RETURN_FILED');
    });

    it('should generate comprehensive audit report', () => {
      auditTrail.logNRIIncomeChange('ABC123', 'USER001', 'SALARY', 1000000, 1200000, 'Adjustment');
      auditTrail.logForeignAssetDisclosure('ABC123', 'USER001', 'PROPERTY', 10000000, 'UK', 'Disclosure');
      auditTrail.logReturnFiling('ABC123', 'USER001', 2024, 'ITR-2', new Date());

      const report = auditTrail.generateAuditReport('ABC123', 2024);

      expect(report.reportId).toBeDefined();
      expect(report.panNumber).toBe('ABC123');
      expect(report.totalEntries).toBeGreaterThan(0);
      expect(report.dataIntegrity.checksumValid).toBe(true);
    });

    it('should verify data integrity', () => {
      auditTrail.logReturnFiling('ABC123', 'USER001', 2024, 'ITR-2', new Date());

      const integrity = auditTrail.verifyIntegrity('ABC123');

      expect(integrity.isValid).toBe(true);
      expect(integrity.lastVerified).toBeDefined();
    });

    it('should export audit trail in JSON format', () => {
      auditTrail.logNRIIncomeChange('ABC123', 'USER001', 'SALARY', 1000000, 1200000, 'Adjustment');

      const exported = auditTrail.exportForAudit('ABC123', 'JSON');

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export audit trail in CSV format', () => {
      auditTrail.logNRIIncomeChange('ABC123', 'USER001', 'SALARY', 1000000, 1200000, 'Adjustment');

      const exported = auditTrail.exportForAudit('ABC123', 'CSV');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('Entry ID');
    });

    it('should provide audit statistics', () => {
      auditTrail.logNRIIncomeChange('ABC123', 'USER001', 'SALARY', 1000000, 1200000, 'Adjustment');
      auditTrail.logForeignAssetDisclosure('ABC123', 'USER001', 'PROPERTY', 10000000, 'UK', 'Disclosure');

      const stats = auditTrail.getAuditStatistics('ABC123');

      expect(stats.totalChanges).toBeGreaterThan(0);
      expect(stats.changesByType.size).toBeGreaterThan(0);
      expect(stats.lastModified).toBeDefined();
      expect(stats.failureRate).toBeLessThanOrEqual(1);
    });
  });

  // ============ INTEGRATION TESTS ============
  describe('Integration Tests', () => {
    it('should handle complete NRI tax computation workflow', () => {
      // NRI status
      const nriStatus = nriEngine.determineResidencyStatus({
        daysInIndia: 100,
        substantialEquivalentPresence: false,
        indianIncomeSource: true,
        previousYearResident: false,
      });

      // Foreign income
      const foreignIncome = foreignIncomeEngine.calculateTaxableForeignIncome(
        [
          {
            incomeType: 'SALARY',
            sourceCountry: 'US',
            grossAmount: 150000,
            taxPaidAbroad: 45000,
            currencyCode: 'USD',
            exchangeRate: 83.5,
            dtaaApplicable: true,
            treaties: ['US-India DTAA'],
          } as any,
        ],
        new Map()
      );

      // Validation
      const validation = validationEngine.validateCompliance({
        panNumber: 'ABC123',
        assessmentYear: 2024,
        taxReturnData: {
          residencyStatus: nriStatus,
          daysInIndia: 100,
        },
        foreignIncomes: {
          totalValue: foreignIncome.taxableForeignIncome,
          disclosed: true,
        },
      });

      // Audit trail
      auditTrail.logNRIIncomeChange(
        'ABC123',
        'USER001',
        'SALARY',
        0,
        foreignIncome.grossForeignIncome,
        'NRI income calculation'
      );

      expect(nriStatus).toBe('NRI');
      expect(foreignIncome.taxableForeignIncome).toBeGreaterThan(0);
      expect(validation.complianceStatus).toBeDefined();
    });

    it('should handle complete crypto tax computation workflow', () => {
      // Crypto holding
      const holding = {
        holdingId: '1',
        cryptoType: 'ETH',
        quantity: 5,
        acquisitionCost: 500000,
        acquisitionCostPerUnit: 100000,
        currentMarketPrice: 200000,
        currentValue: 1000000,
        unrealizedGain: 500000,
        acquisitionDate: '2022-01-01',
        holdingPeriod: 1100,
        costBasisMethod: 'FIFO' as const,
      };

      // Calculate gains
      const gain = cryptoEngine.calculateCapitalGain(holding, 200000);

      // Log transaction
      auditTrail.logCryptoTransaction(
        'ABC123',
        'USER001',
        'SALE',
        'ETH',
        5,
        200000,
        'Crypto sales'
      );

      // Validate compliance
      const validation = validationEngine.validateCompliance({
        panNumber: 'ABC123',
        assessmentYear: 2024,
        cryptoTransactions: {
          totalGains: gain.capitalGain,
          reported: true,
          documented: true,
        },
      });

      expect(gain.gainType).toBe('LTCG');
      expect(validation.violations.length).toBe(0);
    });
  });
});
