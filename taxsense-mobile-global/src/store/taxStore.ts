import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaxCalculation, IncomeSource, Deduction, TaxScenario } from '@types/index';
import { STORAGE_KEYS } from '@constants/index';

interface TaxStore {
  calculations: TaxCalculation[];
  currentCalculation: TaxCalculation | null;
  scenarios: TaxScenario[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentCalculation: (calc: TaxCalculation | null) => void;
  setCalculations: (calcs: TaxCalculation[]) => void;
  setScenarios: (scenarios: TaxScenario[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addIncomeSource: (calculation: TaxCalculation, source: IncomeSource) => void;
  removeIncomeSource: (calculation: TaxCalculation, sourceId: string) => void;
  addDeduction: (calculation: TaxCalculation, deduction: Deduction) => void;
  removeDeduction: (calculation: TaxCalculation, deductionId: string) => void;
  calculateTax: (calculation: TaxCalculation) => void;
  createScenario: (scenario: TaxScenario) => void;
  deleteScenario: (scenarioId: string) => void;
  saveCalculation: (calculation: TaxCalculation) => Promise<void>;
  fetchCalculations: (year: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  calculations: [],
  currentCalculation: null,
  scenarios: [],
  isLoading: false,
  error: null,
};

export const useTaxStore = create<TaxStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentCalculation: (calc) => set({ currentCalculation: calc }),
      setCalculations: (calcs) => set({ calculations: calcs }),
      setScenarios: (scenarios) => set({ scenarios }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      addIncomeSource: (calculation, source) => {
        const updated = {
          ...calculation,
          incomeSources: [...calculation.incomeSources, source],
        };
        const totalIncome = updated.incomeSources.reduce((sum, s) => sum + s.amount, 0);
        updated.totalIncome = totalIncome;
        set({ currentCalculation: updated });
      },

      removeIncomeSource: (calculation, sourceId) => {
        const updated = {
          ...calculation,
          incomeSources: calculation.incomeSources.filter((s) => s.id !== sourceId),
        };
        const totalIncome = updated.incomeSources.reduce((sum, s) => sum + s.amount, 0);
        updated.totalIncome = totalIncome;
        set({ currentCalculation: updated });
      },

      addDeduction: (calculation, deduction) => {
        const updated = {
          ...calculation,
          deductions: [...calculation.deductions, deduction],
        };
        const totalDeductions = updated.deductions.reduce((sum, d) => sum + d.amount, 0);
        updated.totalDeductions = totalDeductions;
        set({ currentCalculation: updated });
      },

      removeDeduction: (calculation, deductionId) => {
        const updated = {
          ...calculation,
          deductions: calculation.deductions.filter((d) => d.id !== deductionId),
        };
        const totalDeductions = updated.deductions.reduce((sum, d) => sum + d.amount, 0);
        updated.totalDeductions = totalDeductions;
        set({ currentCalculation: updated });
      },

      calculateTax: (calculation) => {
        const taxableIncome = Math.max(
          0,
          calculation.totalIncome - calculation.totalDeductions
        );

        // Simplified tax calculation (for India old regime)
        let taxOldRegime = 0;
        if (taxableIncome > 1000000) {
          taxOldRegime = (taxableIncome - 1000000) * 0.3 + 112500;
        } else if (taxableIncome > 500000) {
          taxOldRegime = (taxableIncome - 500000) * 0.2 + 12500;
        } else if (taxableIncome > 250000) {
          taxOldRegime = (taxableIncome - 250000) * 0.05;
        }

        // Simplified tax calculation (for India new regime)
        let taxNewRegime = 0;
        if (taxableIncome > 1500000) {
          taxNewRegime = (taxableIncome - 1500000) * 0.3 + 187500;
        } else if (taxableIncome > 1000000) {
          taxNewRegime = (taxableIncome - 1000000) * 0.2 + 112500;
        } else if (taxableIncome > 500000) {
          taxNewRegime = (taxableIncome - 500000) * 0.15 + 12500;
        } else if (taxableIncome > 250000) {
          taxNewRegime = (taxableIncome - 250000) * 0.05;
        }

        const savings = Math.abs(taxOldRegime - taxNewRegime);
        const recommendedRegime = taxOldRegime < taxNewRegime ? 'old' : 'new';

        const updated = {
          ...calculation,
          taxableIncome,
          taxOldRegime,
          taxNewRegime,
          savings,
          recommendedRegime,
        };

        set({ currentCalculation: updated });
      },

      createScenario: (scenario) => {
        const { scenarios } = get();
        set({ scenarios: [...scenarios, scenario] });
      },

      deleteScenario: (scenarioId) => {
        const { scenarios } = get();
        set({ scenarios: scenarios.filter((s) => s.id !== scenarioId) });
      },

      saveCalculation: async (calculation) => {
        set({ isLoading: true, error: null });
        try {
          const { calculations } = get();
          const existingIndex = calculations.findIndex((c) => c.id === calculation.id);

          if (existingIndex >= 0) {
            const updated = [...calculations];
            updated[existingIndex] = calculation;
            set({ calculations: updated });
          } else {
            set({ calculations: [...calculations, calculation] });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Save failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchCalculations: async (year) => {
        set({ isLoading: true, error: null });
        try {
          // This will be replaced with actual API call
          const response = await fetch(
            `https://api.taxsense.global/tax/calculations?year=${year}`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch calculations');
          }

          const data = await response.json();
          set({ calculations: data });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Fetch failed';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.TAX_CALCULATIONS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
