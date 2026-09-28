/**
 * GraphQL API Tests for TaxSense AI
 * Comprehensive test suite covering queries, mutations, and error scenarios
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queryResolvers, mutationResolvers } from '../src/lib/graphql/resolvers';
import type { TaxProfileInput, GraphQLContext } from '../src/lib/graphql/types';

// ============================================================================
// FIXTURES
// ============================================================================

const mockContext: GraphQLContext = {
  userId: 'test-user-1',
  isAuthenticated: true,
  requestId: 'test-req-123',
};

const minimalProfile: TaxProfileInput = {
  age: 35,
  residentialStatus: 'resident',
  houseProperties: [],
  deductions: {
    section80C: 0,
    section80CCD1B: 0,
    section80D_selfFamily: 0,
    section80D_parents: 0,
    parentsAreSenior: false,
    section80E: 0,
    section80G: 0,
  },
  taxesPaid: 0,
};

const salaryProfile: TaxProfileInput = {
  ...minimalProfile,
  name: 'John Doe',
  salary: {
    grossSalary: 1500000,
    basicPlusDA: 1000000,
    hraReceived: 300000,
    rentPaid: 300000,
    isMetroCity: true,
    employerNpsContribution: 50000,
    professionalTax: 2500,
  },
  deductions: {
    section80C: 150000,
    section80CCD1B: 50000,
    section80D_selfFamily: 25000,
    section80D_parents: 0,
    parentsAreSenior: false,
    section80E: 0,
    section80G: 10000,
  },
};

const capitalGainsProfile: TaxProfileInput = {
  ...salaryProfile,
  capitalGains: {
    stcg111A: 50000,
    stcgOther: 0,
    ltcg112A: 100000,
    ltcgOther: 0,
  },
};

const businessProfile: TaxProfileInput = {
  ...minimalProfile,
  business: {
    netIncome: 500000,
    presumptive: false,
  },
};

const otherSourcesProfile: TaxProfileInput = {
  ...minimalProfile,
  otherSources: {
    savingsInterest: 10000,
    fdInterest: 20000,
    dividends: 15000,
    familyPension: 0,
    other: 5000,
  },
};

// ============================================================================
// QUERY TESTS
// ============================================================================

describe('GraphQL Query: getTaxComputation', () => {
  it('should compute tax for salary income', async () => {
    const result = await queryResolvers.getTaxComputation(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    expect(result).toBeDefined();
    expect(result.old).toBeDefined();
    expect(result.new).toBeDefined();
    expect(result.recommended).toMatch(/^(old|new)$/);
    expect(result.savings).toBeGreaterThanOrEqual(0);
    expect(result.computedAt).toBeDefined();
    expect(new Date(result.computedAt)).toBeInstanceOf(Date);
  });

  it('should compute tax for capital gains', async () => {
    const result = await queryResolvers.getTaxComputation(
      undefined,
      { profile: capitalGainsProfile },
      mockContext
    );

    expect(result.old.specialRateTax).toBeDefined();
    expect(result.new.specialRateTax).toBeDefined();
    expect(result.old.specialRateTax.stcg111A.taxable).toEqual(50000);
    expect(result.old.specialRateTax.ltcg112A.taxable).toBeGreaterThanOrEqual(0);
  });

  it('should handle business income', async () => {
    const result = await queryResolvers.getTaxComputation(
      undefined,
      { profile: businessProfile },
      mockContext
    );

    expect(result.old.heads.business).toEqual(500000);
    expect(result.new.heads.business).toEqual(500000);
  });

  it('should handle other sources income', async () => {
    const result = await queryResolvers.getTaxComputation(
      undefined,
      { profile: otherSourcesProfile },
      mockContext
    );

    expect(result.old.heads.otherSources).toBeGreaterThan(0);
  });

  it('should handle multiple house properties', async () => {
    const profileWithHP: TaxProfileInput = {
      ...minimalProfile,
      houseProperties: [
        {
          use: 'self-occupied',
          annualRent: 0,
          municipalTaxes: 0,
          homeLoanInterest: 150000,
        },
        {
          use: 'let-out',
          annualRent: 240000,
          municipalTaxes: 12000,
          homeLoanInterest: 100000,
        },
      ],
    };

    const result = await queryResolvers.getTaxComputation(
      undefined,
      { profile: profileWithHP },
      mockContext
    );

    expect(result.old.heads.houseProperty).toBeDefined();
    expect(result.new.heads.houseProperty).toBeDefined();
  });

  it('should throw error for invalid age', async () => {
    const invalidProfile: TaxProfileInput = {
      ...minimalProfile,
      age: 10, // Invalid: below 18
    };

    await expect(
      queryResolvers.getTaxComputation(
        undefined,
        { profile: invalidProfile },
        mockContext
      )
    ).rejects.toThrow();
  });

  it('should throw error for negative amounts', async () => {
    const invalidProfile: TaxProfileInput = {
      ...salaryProfile,
      deductions: {
        ...salaryProfile.deductions,
        section80C: -50000, // Invalid
      },
    };

    await expect(
      queryResolvers.getTaxComputation(
        undefined,
        { profile: invalidProfile },
        mockContext
      )
    ).rejects.toThrow();
  });
});

describe('GraphQL Query: getRegimeComparison', () => {
  it('should compare old and new regime', async () => {
    const result = await queryResolvers.getRegimeComparison(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    expect(result.old).toBeDefined();
    expect(result.new).toBeDefined();
    expect(result.recommended).toMatch(/^(old|new)$/);
    expect(result.savings).toBeGreaterThanOrEqual(0);
  });

  it('should recommend regime with lower tax', async () => {
    const result = await queryResolvers.getRegimeComparison(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    const oldLiability = result.old.totalTaxLiability;
    const newLiability = result.new.totalTaxLiability;

    if (newLiability <= oldLiability) {
      expect(result.recommended).toBe('new');
    } else {
      expect(result.recommended).toBe('old');
    }
  });

  it('should calculate savings correctly', async () => {
    const result = await queryResolvers.getRegimeComparison(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    const expectedSavings = Math.abs(
      result.old.totalTaxLiability - result.new.totalTaxLiability
    );
    expect(result.savings).toBe(expectedSavings);
  });
});

describe('GraphQL Query: getRecommendations', () => {
  it('should generate recommendations for salary profile', async () => {
    const result = await queryResolvers.getRecommendations(
      undefined,
      { profile: salaryProfile, riskProfile: 'moderate' },
      mockContext
    );

    expect(result).toBeDefined();
    expect(result.recommendations).toBeInstanceOf(Array);
    expect(result.totalPotentialSavings).toBeGreaterThanOrEqual(0);
    expect(result.currentLiability).toBeGreaterThanOrEqual(0);
    expect(result.optimizedLiability).toBeGreaterThanOrEqual(0);
    expect(result.riskProfile).toMatch(/^(conservative|moderate|aggressive)$/);
  });

  it('should respect risk profile preference', async () => {
    const conservativeResult = await queryResolvers.getRecommendations(
      undefined,
      { profile: salaryProfile, riskProfile: 'conservative' },
      mockContext
    );

    expect(conservativeResult.riskProfile).toBe('conservative');
  });
});

describe('GraphQL Query: getScenarios', () => {
  it('should compare multiple scenarios', async () => {
    const scenario1: TaxProfileInput = {
      ...salaryProfile,
      deductions: {
        ...salaryProfile.deductions,
        section80C: 150000, // Increase 80C
      },
    };

    const scenario2: TaxProfileInput = {
      ...salaryProfile,
      capitalGains: {
        stcg111A: 100000,
        stcgOther: 0,
        ltcg112A: 150000,
        ltcgOther: 0,
      },
    };

    const result = await queryResolvers.getScenarios(
      undefined,
      {
        baseline: salaryProfile,
        scenarios: [
          { name: 'Increased 80C', description: 'Invest more in 80C', profileChanges: scenario1 },
          { name: 'With Capital Gains', description: 'Add capital gains', profileChanges: scenario2 },
        ],
      },
      mockContext
    );

    expect(result.baseline).toBeDefined();
    expect(result.scenarios).toHaveLength(2);
    expect(result.bestScenario).toBeDefined();
    expect(result.maxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should identify best scenario', async () => {
    const scenario1: TaxProfileInput = {
      ...salaryProfile,
      deductions: {
        ...salaryProfile.deductions,
        section80C: 50000, // Lower deduction
      },
    };

    const scenario2: TaxProfileInput = {
      ...salaryProfile,
      deductions: {
        ...salaryProfile.deductions,
        section80C: 150000, // Higher deduction
      },
    };

    const result = await queryResolvers.getScenarios(
      undefined,
      {
        baseline: salaryProfile,
        scenarios: [
          { name: 'Low Deductions', description: '', profileChanges: scenario1 },
          { name: 'High Deductions', description: '', profileChanges: scenario2 },
        ],
      },
      mockContext
    );

    expect(result.bestScenario.name).toMatch(/^(Low|High|Baseline)/);
  });
});

describe('GraphQL Query: getAnalytics', () => {
  it('should generate analytics from computation', async () => {
    const computation = await queryResolvers.getTaxComputation(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    const result = await queryResolvers.getAnalytics(
      undefined,
      { computation },
      mockContext
    );

    expect(result).toBeDefined();
    expect(result.effectiveTaxRate).toBeGreaterThanOrEqual(0);
    expect(result.marginalRate).toBeGreaterThanOrEqual(0);
    expect(result.taxPerRupee).toBeGreaterThanOrEqual(0);
    expect(result.incomeHeadBreakdown).toBeInstanceOf(Array);
    expect(result.taxComposition).toBeInstanceOf(Array);
    expect(result.metrics).toBeDefined();
  });

  it('should have income breakdown percentage sum close to 100', async () => {
    const computation = await queryResolvers.getTaxComputation(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    const result = await queryResolvers.getAnalytics(
      undefined,
      { computation },
      mockContext
    );

    const totalPercentage = result.incomeHeadBreakdown.reduce(
      (sum, item) => sum + item.percentage,
      0
    );

    // Allow up to 5% variation due to zero-income head filtering
    expect(totalPercentage).toBeGreaterThanOrEqual(95);
    expect(totalPercentage).toBeLessThanOrEqual(105);
  });
});

describe('GraphQL Query: health', () => {
  it('should return health status', async () => {
    const result = await queryResolvers.health(undefined, undefined, mockContext);

    expect(result.status).toBe('healthy');
    expect(result.timestamp).toBeDefined();
    expect(result.version).toBe('1.0.0');
  });
});

// ============================================================================
// MUTATION TESTS
// ============================================================================

describe('GraphQL Mutation: computeTax', () => {
  it('should successfully compute tax', async () => {
    const result = await mutationResolvers.computeTax(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.computation).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should return error for invalid input', async () => {
    const invalidProfile: TaxProfileInput = {
      ...minimalProfile,
      age: -5, // Invalid
    };

    const result = await mutationResolvers.computeTax(
      undefined,
      { profile: invalidProfile },
      mockContext
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('GraphQL Mutation: createScenario', () => {
  it('should create scenario successfully', async () => {
    const scenario: TaxProfileInput = {
      ...salaryProfile,
      deductions: {
        ...salaryProfile.deductions,
        section80C: 100000,
      },
    };

    const result = await mutationResolvers.createScenario(
      undefined,
      {
        baseline: salaryProfile,
        scenario: {
          name: 'Test Scenario',
          description: 'Test scenario for 80C increase',
          profileChanges: scenario,
        },
      },
      mockContext
    );

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Scenario');
    expect(result.description).toBe('Test scenario for 80C increase');
    expect(result.computation).toBeDefined();
  });
});

describe('GraphQL Mutation: updateProfile', () => {
  it('should update profile successfully', async () => {
    const result = await mutationResolvers.updateProfile(
      undefined,
      {
        userId: 'test-user-1',
        profile: salaryProfile,
      },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.profile).toEqual(salaryProfile);
  });

  it('should fail for invalid profile', async () => {
    const invalidProfile: TaxProfileInput = {
      ...minimalProfile,
      age: 999, // Invalid
    };

    const result = await mutationResolvers.updateProfile(
      undefined,
      {
        userId: 'test-user-1',
        profile: invalidProfile,
      },
      mockContext
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('GraphQL Mutation: exportReport', () => {
  it('should export report as PDF', async () => {
    const computation = await queryResolvers.getTaxComputation(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    const result = await mutationResolvers.exportReport(
      undefined,
      {
        computation,
        format: 'PDF',
      },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.filename).toBeDefined();
    expect(result.format).toBe('PDF');
  });

  it('should export report as JSON', async () => {
    const computation = await queryResolvers.getTaxComputation(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    const result = await mutationResolvers.exportReport(
      undefined,
      {
        computation,
        format: 'JSON',
      },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.filename).toBeDefined();
    expect(result.format).toBe('JSON');
  });

  it('should export report as CSV', async () => {
    const computation = await queryResolvers.getTaxComputation(
      undefined,
      { profile: salaryProfile },
      mockContext
    );

    const result = await mutationResolvers.exportReport(
      undefined,
      {
        computation,
        format: 'CSV',
      },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.filename).toBeDefined();
    expect(result.format).toBe('CSV');
  });
});

describe('GraphQL Mutation: saveComparison', () => {
  it('should save scenario comparison', async () => {
    const scenarios: TaxProfileInput[] = [
      {
        ...salaryProfile,
        deductions: { ...salaryProfile.deductions, section80C: 100000 },
      },
      {
        ...salaryProfile,
        deductions: { ...salaryProfile.deductions, section80C: 150000 },
      },
    ];

    const result = await mutationResolvers.saveComparison(
      undefined,
      {
        baseline: salaryProfile,
        scenarios: scenarios.map((s, i) => ({
          name: `Scenario ${i + 1}`,
          description: `Scenario ${i + 1}`,
          profileChanges: s,
        })),
        name: 'My Comparison',
      },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.comparisonId).toBeDefined();
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  it('should handle invalid tax profile structure', async () => {
    const invalidProfile = {
      age: 35,
      // Missing required fields
    } as unknown as TaxProfileInput;

    await expect(
      queryResolvers.getTaxComputation(
        undefined,
        { profile: invalidProfile },
        mockContext
      )
    ).rejects.toThrow();
  });

  it('should validate age is within acceptable range', async () => {
    const tooOldProfile: TaxProfileInput = {
      ...minimalProfile,
      age: 200,
    };

    await expect(
      queryResolvers.getTaxComputation(
        undefined,
        { profile: tooOldProfile },
        mockContext
      )
    ).rejects.toThrow();
  });

  it('should validate no negative amounts', async () => {
    const negativeProfile: TaxProfileInput = {
      ...minimalProfile,
      taxesPaid: -50000,
    };

    await expect(
      queryResolvers.getTaxComputation(
        undefined,
        { profile: negativeProfile },
        mockContext
      )
    ).rejects.toThrow();
  });

  it('should handle complex scenario with multiple income heads', async () => {
    const complexProfile: TaxProfileInput = {
      name: 'Complex Profile',
      age: 45,
      residentialStatus: 'resident',
      salary: {
        grossSalary: 2000000,
        basicPlusDA: 1200000,
        hraReceived: 400000,
        rentPaid: 400000,
        isMetroCity: true,
        employerNpsContribution: 100000,
        professionalTax: 2500,
      },
      houseProperties: [
        {
          use: 'self-occupied',
          annualRent: 0,
          municipalTaxes: 0,
          homeLoanInterest: 200000,
        },
        {
          use: 'let-out',
          annualRent: 600000,
          municipalTaxes: 24000,
          homeLoanInterest: 150000,
        },
      ],
      capitalGains: {
        stcg111A: 200000,
        stcgOther: 50000,
        ltcg112A: 300000,
        ltcgOther: 100000,
      },
      business: {
        netIncome: 300000,
        presumptive: false,
      },
      otherSources: {
        savingsInterest: 25000,
        fdInterest: 50000,
        dividends: 30000,
        familyPension: 50000,
        other: 20000,
      },
      deductions: {
        section80C: 150000,
        section80CCD1B: 50000,
        section80D_selfFamily: 50000,
        section80D_parents: 25000,
        parentsAreSenior: true,
        section80E: 100000,
        section80G: 50000,
      },
      taxesPaid: 500000,
    };

    const result = await queryResolvers.getTaxComputation(
      undefined,
      { profile: complexProfile },
      mockContext
    );

    expect(result).toBeDefined();
    expect(result.old.totalIncome).toBeGreaterThan(0);
    expect(result.new.totalIncome).toBeGreaterThan(0);
  });
});
