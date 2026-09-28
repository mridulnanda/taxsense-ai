import { apiClient } from '@api/client';
import { TaxCalculation, TaxScenario, IncomeSource, Deduction } from '@types/index';

export const TaxService = {
  /**
   * Get tax calculations for a year
   */
  async getCalculations(year: number) {
    const response = await apiClient.get<TaxCalculation[]>(
      `/tax/calculations?year=${year}`
    );
    return response;
  },

  /**
   * Get single tax calculation
   */
  async getCalculation(id: string) {
    const response = await apiClient.get<TaxCalculation>(`/tax/calculations/${id}`);
    return response;
  },

  /**
   * Create new tax calculation
   */
  async createCalculation(data: Partial<TaxCalculation>) {
    const response = await apiClient.post<TaxCalculation>(
      '/tax/calculations',
      data
    );
    return response;
  },

  /**
   * Update tax calculation
   */
  async updateCalculation(id: string, data: Partial<TaxCalculation>) {
    const response = await apiClient.put<TaxCalculation>(
      `/tax/calculations/${id}`,
      data
    );
    return response;
  },

  /**
   * Delete tax calculation
   */
  async deleteCalculation(id: string) {
    const response = await apiClient.delete<{ success: boolean }>(
      `/tax/calculations/${id}`
    );
    return response;
  },

  /**
   * Add income source to calculation
   */
  async addIncomeSource(calculationId: string, source: IncomeSource) {
    const response = await apiClient.post<TaxCalculation>(
      `/tax/calculations/${calculationId}/income-sources`,
      source
    );
    return response;
  },

  /**
   * Remove income source from calculation
   */
  async removeIncomeSource(calculationId: string, sourceId: string) {
    const response = await apiClient.delete<TaxCalculation>(
      `/tax/calculations/${calculationId}/income-sources/${sourceId}`
    );
    return response;
  },

  /**
   * Add deduction to calculation
   */
  async addDeduction(calculationId: string, deduction: Deduction) {
    const response = await apiClient.post<TaxCalculation>(
      `/tax/calculations/${calculationId}/deductions`,
      deduction
    );
    return response;
  },

  /**
   * Remove deduction from calculation
   */
  async removeDeduction(calculationId: string, deductionId: string) {
    const response = await apiClient.delete<TaxCalculation>(
      `/tax/calculations/${calculationId}/deductions/${deductionId}`
    );
    return response;
  },

  /**
   * Calculate tax
   */
  async calculateTax(calculationId: string) {
    const response = await apiClient.post<TaxCalculation>(
      `/tax/calculations/${calculationId}/calculate`
    );
    return response;
  },

  /**
   * Get tax scenarios
   */
  async getScenarios(year: number) {
    const response = await apiClient.get<TaxScenario[]>(
      `/tax/scenarios?year=${year}`
    );
    return response;
  },

  /**
   * Create tax scenario
   */
  async createScenario(data: Partial<TaxScenario>) {
    const response = await apiClient.post<TaxScenario>(
      '/tax/scenarios',
      data
    );
    return response;
  },

  /**
   * Update tax scenario
   */
  async updateScenario(id: string, data: Partial<TaxScenario>) {
    const response = await apiClient.put<TaxScenario>(
      `/tax/scenarios/${id}`,
      data
    );
    return response;
  },

  /**
   * Delete tax scenario
   */
  async deleteScenario(id: string) {
    const response = await apiClient.delete<{ success: boolean }>(
      `/tax/scenarios/${id}`
    );
    return response;
  },

  /**
   * Get tax planning recommendations
   */
  async getTaxPlanningRecommendations(calculationId: string) {
    const response = await apiClient.get<any>(
      `/tax/calculations/${calculationId}/recommendations`
    );
    return response;
  },

  /**
   * Get deduction suggestions
   */
  async getDeductionSuggestions(year: number) {
    const response = await apiClient.get<any>(
      `/tax/suggestions?year=${year}`
    );
    return response;
  },

  /**
   * Calculate quarterly tax
   */
  async calculateQuarterlyTax(year: number, quarter: number) {
    const response = await apiClient.get<any>(
      `/tax/quarterly?year=${year}&quarter=${quarter}`
    );
    return response;
  },

  /**
   * Compare tax regimes
   */
  async compareRegimes(calculationId: string) {
    const response = await apiClient.post<any>(
      `/tax/calculations/${calculationId}/compare-regimes`
    );
    return response;
  },

  /**
   * Get tax deadline
   */
  async getTaxDeadlines(country: string) {
    const response = await apiClient.get<any>(
      `/tax/deadlines?country=${country}`
    );
    return response;
  },

  /**
   * Export calculation as PDF
   */
  async exportCalculationPDF(calculationId: string) {
    const response = await apiClient.get<Blob>(
      `/tax/calculations/${calculationId}/export/pdf`,
      { responseType: 'blob' as any }
    );
    return response;
  },
};
