/**
 * TaxSense AI GraphQL Module
 * Central export point for all GraphQL components
 */

// Schema
export { typeDefs, graphqlSchema } from './schema';

// Resolvers
export { queryResolvers, mutationResolvers } from './resolvers';

// Types
export type {
  // Input Types
  SalaryIncomeInput,
  HousePropertyInput,
  CapitalGainsInput,
  BusinessIncomeInput,
  OtherSourcesInput,
  DeductionInputsInput,
  TaxProfileInput,
  ScenarioInput,

  // Output Types
  HeadwiseIncomeOutput,
  SalaryExemptionsOutput,
  DeductionDetailOutput,
  SlabLineOutput,
  SpecialRateTaxItemOutput,
  SpecialRateTaxOutput,
  RegimeComputationOutput,
  TaxComputationResultOutput,
  TaxRecommendationOutput,
  OptimizationReportOutput,
  ScenarioResultOutput,
  ScenarioComparisonResultOutput,
  IncomeHeadBreakdownItemOutput,
  TaxCompositionItemOutput,
  TaxAnalyticsOutput,
  RegimeComparisonOutput,
  ComputeTaxResultOutput,
  ProfileUpdateResultOutput,
  ExportResultOutput,
  ComparisonSaveResultOutput,
  HealthStatusOutput,
  ComputationProgressUpdateOutput,

  // Context and Resolvers
  GraphQLContext,
  QueryResolvers,
  MutationResolvers,
} from './types';
