import { create } from 'zustand';
import { Scenario, TaxComputation, IncomeEntry, DeductionEntry } from '@/types';

interface TaxState {
  currentScenario: Scenario | null;
  scenarios: Scenario[];
  incomeEntries: IncomeEntry[];
  deductionEntries: DeductionEntry[];
  taxComputation: TaxComputation | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Actions
  setCurrentScenario: (scenario: Scenario | null) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  addIncomeEntry: (entry: IncomeEntry) => void;
  updateIncomeEntry: (id: string, updates: Partial<IncomeEntry>) => void;
  removeIncomeEntry: (id: string) => void;
  addDeductionEntry: (entry: DeductionEntry) => void;
  updateDeductionEntry: (id: string, updates: Partial<DeductionEntry>) => void;
  removeDeductionEntry: (id: string) => void;
  setTaxComputation: (computation: TaxComputation | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  clearCurrentScenario: () => void;
  getScenarioById: (id: string) => Scenario | undefined;
  calculateTotalIncome: () => number;
  calculateTotalDeductions: () => number;
}

export const useTaxStore = create<TaxState>((set, get) => ({
  currentScenario: null,
  scenarios: [],
  incomeEntries: [],
  deductionEntries: [],
  taxComputation: null,
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,

  setCurrentScenario: (scenario) =>
    set({ currentScenario: scenario, hasUnsavedChanges: false }),

  setScenarios: (scenarios) => set({ scenarios }),

  addScenario: (scenario) =>
    set((state) => ({
      scenarios: [...state.scenarios, scenario],
      hasUnsavedChanges: true,
    })),

  updateScenario: (id, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      currentScenario:
        state.currentScenario?.id === id
          ? { ...state.currentScenario, ...updates }
          : state.currentScenario,
      hasUnsavedChanges: true,
    })),

  deleteScenario: (id) =>
    set((state) => ({
      scenarios: state.scenarios.filter((s) => s.id !== id),
      currentScenario:
        state.currentScenario?.id === id ? null : state.currentScenario,
      hasUnsavedChanges: true,
    })),

  addIncomeEntry: (entry) =>
    set((state) => ({
      incomeEntries: [...state.incomeEntries, entry],
      hasUnsavedChanges: true,
    })),

  updateIncomeEntry: (id, updates) =>
    set((state) => ({
      incomeEntries: state.incomeEntries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
      hasUnsavedChanges: true,
    })),

  removeIncomeEntry: (id) =>
    set((state) => ({
      incomeEntries: state.incomeEntries.filter((e) => e.id !== id),
      hasUnsavedChanges: true,
    })),

  addDeductionEntry: (entry) =>
    set((state) => ({
      deductionEntries: [...state.deductionEntries, entry],
      hasUnsavedChanges: true,
    })),

  updateDeductionEntry: (id, updates) =>
    set((state) => ({
      deductionEntries: state.deductionEntries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
      hasUnsavedChanges: true,
    })),

  removeDeductionEntry: (id) =>
    set((state) => ({
      deductionEntries: state.deductionEntries.filter((e) => e.id !== id),
      hasUnsavedChanges: true,
    })),

  setTaxComputation: (computation) => set({ taxComputation: computation }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

  clearCurrentScenario: () =>
    set({
      currentScenario: null,
      incomeEntries: [],
      deductionEntries: [],
      taxComputation: null,
      hasUnsavedChanges: false,
    }),

  getScenarioById: (id) => {
    const { scenarios } = get();
    return scenarios.find((s) => s.id === id);
  },

  calculateTotalIncome: () => {
    const { incomeEntries } = get();
    return incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  },

  calculateTotalDeductions: () => {
    const { deductionEntries } = get();
    return deductionEntries.reduce((sum, entry) => sum + entry.amount, 0);
  },
}));
