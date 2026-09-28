import { useTaxStore } from '@/stores/taxStore';
import { Scenario, IncomeEntry, DeductionEntry } from '@/types';

describe('TaxStore', () => {
  beforeEach(() => {
    useTaxStore.setState({
      currentScenario: null,
      scenarios: [],
      incomeEntries: [],
      deductionEntries: [],
      taxComputation: null,
      isLoading: false,
      error: null,
      hasUnsavedChanges: false,
    });
  });

  describe('Scenario management', () => {
    it('should add a scenario', () => {
      const mockScenario: Scenario = {
        id: '1',
        userId: 'user-1',
        name: 'Test Scenario',
        description: 'Test',
        financialYear: '2024-25',
        incomeEntries: [],
        deductionEntries: [],
        taxComputation: {} as any,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useTaxStore.getState().addScenario(mockScenario);

      const state = useTaxStore.getState();
      expect(state.scenarios).toContainEqual(mockScenario);
      expect(state.hasUnsavedChanges).toBe(true);
    });

    it('should update a scenario', () => {
      const mockScenario: Scenario = {
        id: '1',
        userId: 'user-1',
        name: 'Original',
        description: 'Test',
        financialYear: '2024-25',
        incomeEntries: [],
        deductionEntries: [],
        taxComputation: {} as any,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useTaxStore.setState({ scenarios: [mockScenario] });
      useTaxStore.getState().updateScenario('1', { name: 'Updated' });

      const updated = useTaxStore.getState().scenarios[0];
      expect(updated.name).toBe('Updated');
    });

    it('should delete a scenario', () => {
      const mockScenario: Scenario = {
        id: '1',
        userId: 'user-1',
        name: 'To Delete',
        description: 'Test',
        financialYear: '2024-25',
        incomeEntries: [],
        deductionEntries: [],
        taxComputation: {} as any,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useTaxStore.setState({ scenarios: [mockScenario] });
      useTaxStore.getState().deleteScenario('1');

      expect(useTaxStore.getState().scenarios).toHaveLength(0);
    });
  });

  describe('Income management', () => {
    it('should add income entry', () => {
      const mockEntry: IncomeEntry = {
        id: '1',
        userId: 'user-1',
        type: 'SALARY',
        description: 'Monthly salary',
        amount: 100000,
        financialYear: '2024-25',
        source: 'Employer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useTaxStore.getState().addIncomeEntry(mockEntry);

      expect(useTaxStore.getState().incomeEntries).toContainEqual(mockEntry);
    });

    it('should calculate total income', () => {
      const entries: IncomeEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          type: 'SALARY',
          description: 'Salary',
          amount: 100000,
          financialYear: '2024-25',
          source: 'Employer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user-1',
          type: 'BONUS',
          description: 'Bonus',
          amount: 50000,
          financialYear: '2024-25',
          source: 'Employer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      useTaxStore.setState({ incomeEntries: entries });

      expect(useTaxStore.getState().calculateTotalIncome()).toBe(150000);
    });
  });

  describe('Deduction management', () => {
    it('should add deduction entry', () => {
      const mockEntry: DeductionEntry = {
        id: '1',
        userId: 'user-1',
        section: 'SECTION_80C',
        description: 'Life insurance',
        amount: 50000,
        financialYear: '2024-25',
        category: 'Insurance',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useTaxStore.getState().addDeductionEntry(mockEntry);

      expect(useTaxStore.getState().deductionEntries).toContainEqual(mockEntry);
    });

    it('should calculate total deductions', () => {
      const entries: DeductionEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          section: 'SECTION_80C',
          description: 'Insurance',
          amount: 50000,
          financialYear: '2024-25',
          category: 'Insurance',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user-1',
          section: 'SECTION_80D',
          description: 'Health Insurance',
          amount: 30000,
          financialYear: '2024-25',
          category: 'Insurance',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      useTaxStore.setState({ deductionEntries: entries });

      expect(useTaxStore.getState().calculateTotalDeductions()).toBe(80000);
    });
  });
});
