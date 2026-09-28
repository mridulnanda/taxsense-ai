/**
 * Type Definitions for AI Module
 */

import type { TaxRecommendation, TaxAnalysis } from "./tax-advisor";
import type {
  ExtractedTaxInfo,
  DocumentAnalysis,
  QuestionClassification,
} from "./nlp";
import type { ComplianceCheck, AuditRiskAssessment } from "./compliance";

export interface AIConfig {
  openai?: {
    apiKey: string;
    model: string;
    timeout: number;
  };
  groq?: {
    apiKey: string;
    model: string;
    timeout: number;
  };
  anthropic?: {
    apiKey: string;
    model: string;
    timeout: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    format: "json" | "text";
  };
}

export interface ChatRequestPayload {
  message: string;
  conversationId?: string;
  profileId?: string;
  profile?: any;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  mode?: "chat" | "recommend" | "compliance" | "document-analysis";
  uploadedDocuments?: Array<{
    name: string;
    content: string;
    type?: string;
  }>;
  context?: {
    previousRecommendations?: TaxRecommendation[];
    previousAnalysis?: TaxAnalysis;
  };
}

export interface ChatResponsePayload {
  reply: string;
  provider: string;
  model: string;
  conversationId: string;
  mode: string;
  analysis?: DocumentAnalysis[];
  recommendations?: TaxRecommendation[];
  complianceCheck?: ComplianceCheck;
  auditRisk?: AuditRiskAssessment;
  actions?: string[];
  metadata?: {
    processingTime: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

export interface RecommendationContext {
  profile: any;
  previousRecommendations?: TaxRecommendation[];
  userPreferences?: {
    riskTolerance: "low" | "medium" | "high";
    prioritizeCompliance: boolean;
    prioritizeSavings: boolean;
  };
  marketContext?: {
    inflationRate: number;
    marginTaxRate: number;
    year: number;
  };
}

export interface DocumentMetadata {
  name: string;
  type: string;
  uploadedAt: Date;
  size: number;
  language: string;
  extracted: ExtractedTaxInfo[];
}

export interface ConversationContext {
  id: string;
  userId: string;
  profileId: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    provider: string;
  }>;
  documents: DocumentMetadata[];
  analysis?: TaxAnalysis;
  createdAt: Date;
  updatedAt: Date;
}
