import { useCallback, useEffect, useState } from 'react';
import { useTaxStore } from '@store/taxStore';
import { TaxService } from '@services/taxService';
import { TaxCalculation, IncomeSource, Deduction } from '@types/index';

export const useTax = () => {
  const tax = useTaxStore();
  const [loadingCalculations, setLoadingCalculations] = useState(false);

  const fetchCalculations = useCallback(
    async (year: number) => {
      setLoadingCalculations(true);
      try {
        const data = await TaxService.getCalculations(year);
        tax.setCalculations(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch calculations';
        tax.setError(message);
      } finally {
        setLoadingCalculations(false);
      }
    },
    [tax]
  );

  const createCalculation = useCallback(
    async (data: Partial<TaxCalculation>) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        const calculation = await TaxService.createCalculation(data);
        await tax.saveCalculation(calculation);
        tax.setCurrentCalculation(calculation);
        tax.setLoading(false);
        return calculation;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create calculation';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const updateCalculation = useCallback(
    async (id: string, data: Partial<TaxCalculation>) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        const calculation = await TaxService.updateCalculation(id, data);
        await tax.saveCalculation(calculation);
        tax.setCurrentCalculation(calculation);
        tax.setLoading(false);
        return calculation;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update calculation';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const deleteCalculation = useCallback(
    async (id: string) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        await TaxService.deleteCalculation(id);
        const updatedCalcs = tax.calculations.filter((c) => c.id !== id);
        tax.setCalculations(updatedCalcs);
        tax.setCurrentCalculation(null);
        tax.setLoading(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete calculation';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const addIncomeSource = useCallback(
    async (calculationId: string, source: IncomeSource) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        const calculation = await TaxService.addIncomeSource(calculationId, source);
        tax.setCurrentCalculation(calculation);
        tax.calculateTax(calculation);
        tax.setLoading(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add income source';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const removeIncomeSource = useCallback(
    async (calculationId: string, sourceId: string) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        const calculation = await TaxService.removeIncomeSource(calculationId, sourceId);
        tax.setCurrentCalculation(calculation);
        tax.calculateTax(calculation);
        tax.setLoading(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove income source';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const addDeduction = useCallback(
    async (calculationId: string, deduction: Deduction) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        const calculation = await TaxService.addDeduction(calculationId, deduction);
        tax.setCurrentCalculation(calculation);
        tax.calculateTax(calculation);
        tax.setLoading(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add deduction';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const removeDeduction = useCallback(
    async (calculationId: string, deductionId: string) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        const calculation = await TaxService.removeDeduction(calculationId, deductionId);
        tax.setCurrentCalculation(calculation);
        tax.calculateTax(calculation);
        tax.setLoading(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove deduction';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const calculateTax = useCallback(
    async (calculationId: string) => {
      try {
        tax.setLoading(true);
        tax.setError(null);
        const calculation = await TaxService.calculateTax(calculationId);
        tax.setCurrentCalculation(calculation);
        tax.calculateTax(calculation);
        tax.setLoading(false);
        return calculation;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to calculate tax';
        tax.setError(message);
        tax.setLoading(false);
        throw error;
      }
    },
    [tax]
  );

  const getTaxPlanningRecommendations = useCallback(
    async (calculationId: string) => {
      try {
        return await TaxService.getTaxPlanningRecommendations(calculationId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get recommendations';
        tax.setError(message);
        return null;
      }
    },
    [tax]
  );

  return {
    ...tax,
    loadingCalculations,
    fetchCalculations,
    createCalculation,
    updateCalculation,
    deleteCalculation,
    addIncomeSource,
    removeIncomeSource,
    addDeduction,
    removeDeduction,
    calculateTax,
    getTaxPlanningRecommendations,
  };
};
