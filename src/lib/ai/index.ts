/**
 * AI Module Exports
 * Unified interface for all AI-powered tax planning features
 */

export { providerManager, type LLMProvider, type LLMMessage, type LLMResponse } from "./provider";
export { taxAdvisor, type TaxRecommendation, type TaxAnalysis } from "./tax-advisor";
export { taxNLP, type ExtractedTaxInfo, type DocumentAnalysis, type QuestionClassification } from "./nlp";
export { complianceAI, type ComplianceCheck, type AuditRiskAssessment } from "./compliance";
