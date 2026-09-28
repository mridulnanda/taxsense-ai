/**
 * AI-Powered Tax Advisor
 * Generates personalized tax recommendations with confidence scores
 * and explains strategies in plain English
 */

import { z } from "zod";
import pino from "pino";
import { providerManager, type LLMMessage } from "./provider";
import type { TaxProfile } from "../tax-engine";

const logger = pino();

export interface TaxRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  estimatedSavings: number;
  estimatedSavingsRange: {
    min: number;
    max: number;
  };
  confidenceScore: number; // 0-1
  riskLevel: "low" | "medium" | "high";
  requirements: string[];
  implementation: string;
  complianceNotes: string;
  edgeCases: string[];
  applicability: string;
  priority: "high" | "medium" | "low";
}

export interface TaxAnalysis {
  profileSummary: string;
  totalPotentialSavings: number;
  recommendations: TaxRecommendation[];
  riskAssessment: string;
  opportunities: string[];
  warnings: string[];
  nextSteps: string[];
  advisorNotes: string;
}

const RecommendationSchema = z.object({
  id: z.string(),
  category: z.enum([
    "salary-optimization",
    "investment-strategy",
    "deduction-maximization",
    "loss-harvesting",
    "entity-structure",
    "timing-strategy",
    "credit-optimization",
    "expense-management",
  ]),
  title: z.string(),
  description: z.string(),
  estimatedSavings: z.number(),
  estimatedSavingsRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  confidenceScore: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  requirements: z.array(z.string()),
  implementation: z.string(),
  complianceNotes: z.string(),
  edgeCases: z.array(z.string()),
  applicability: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

const AnalysisSchema = z.object({
  profileSummary: z.string(),
  totalPotentialSavings: z.number(),
  recommendations: z.array(RecommendationSchema),
  riskAssessment: z.string(),
  opportunities: z.array(z.string()),
  warnings: z.array(z.string()),
  nextSteps: z.array(z.string()),
  advisorNotes: z.string(),
});

export class TaxAdvisor {
  private provider = providerManager;

  async analyzeProfile(profile: TaxProfile): Promise<TaxAnalysis> {
    const profileJson = JSON.stringify(profile, null, 2);

    const systemPrompt = `You are an expert Indian tax advisor with 15+ years of experience.
    Your role is to analyze tax profiles and provide actionable, personalized recommendations.

    Guidelines:
    - Ensure all recommendations comply with Indian tax law (IT Act 1961)
    - Consider the Financial Year 2025-26 (Assessment Year 2026-27)
    - Provide confidence scores based on legal precedent and current tax rules
    - Flag high-risk strategies that may trigger audits
    - Always include documentation requirements
    - Be conservative with savings estimates
    - Consider edge cases and exceptions

    Return comprehensive analysis with specific, implementable recommendations.`;

    const userPrompt = `Analyze this tax profile and provide personalized recommendations:

${profileJson}

Provide a comprehensive tax analysis including:
1. Profile summary (2-3 sentences)
2. Total potential savings (conservative estimate)
3. 5-8 specific, actionable recommendations
4. Risk assessment
5. Key opportunities
6. Critical warnings or red flags
7. Next steps
8. Advisor notes

Format your response as valid JSON matching the specified schema.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const result = await this.provider.completeJsonWithFallback<TaxAnalysis>(
        messages,
        AnalysisSchema,
        { temperature: 0.3, maxTokens: 4096 }
      );

      logger.info(
        { provider: result.provider, model: result.model },
        "Tax analysis completed"
      );

      return this.validateAnalysis(result.data);
    } catch (error) {
      logger.error({ error }, "Tax analysis failed");
      throw new Error(`Tax analysis failed: ${error}`);
    }
  }

  async explainRecommendation(
    recommendation: TaxRecommendation,
    profile: TaxProfile
  ): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `You are an expert tax advisor explaining a tax recommendation to a non-expert client.
        Use simple, jargon-free language. Focus on benefits, requirements, and risks.
        Be honest about limitations and edge cases.`,
      },
      {
        role: "user",
        content: `Explain this tax recommendation to a non-expert in 2-3 paragraphs:

Recommendation: ${recommendation.title}
Description: ${recommendation.description}
Estimated Savings: ₹${recommendation.estimatedSavings.toLocaleString("en-IN")}
Confidence: ${Math.round(recommendation.confidenceScore * 100)}%
Risk Level: ${recommendation.riskLevel.toUpperCase()}
Implementation: ${recommendation.implementation}

Tax Profile Income Sources:
- Salary: ₹${profile.salary?.grossSalary.toLocaleString("en-IN") ?? "0"}
- Business: ₹${profile.business?.netIncome.toLocaleString("en-IN") ?? "0"}
- House Property: ₹${profile.houseProperties.length > 0 ? "Yes" : "No"}
- Capital Gains: ₹${profile.capitalGains ? "Yes" : "No"}

Explain in simple terms, including what the client needs to do and what documents to keep.`,
      },
    ];

    const response = await this.provider.completeWithFallback(messages, {
      temperature: 0.5,
      maxTokens: 1024,
    });

    return response.content;
  }

  async estimateAccuracy(
    recommendation: TaxRecommendation,
    historicalData?: any
  ): Promise<{
    accuracyScore: number;
    confidenceJustification: string;
    potentialVariations: string[];
  }> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `You are an expert in tax savings estimation and accuracy calibration.
        Evaluate the accuracy of tax recommendations based on:
        - Legal precedent and case law
        - Tax department audit history
        - Market conditions and variability
        - Individual circumstances

        Provide honest assessment of confidence levels.`,
      },
      {
        role: "user",
        content: `Evaluate the accuracy and confidence of this recommendation:

Title: ${recommendation.title}
Estimated Savings: ₹${recommendation.estimatedSavings.toLocaleString("en-IN")} (Range: ₹${recommendation.estimatedSavingsRange.min.toLocaleString("en-IN")} - ₹${recommendation.estimatedSavingsRange.max.toLocaleString("en-IN")})
Current Confidence: ${Math.round(recommendation.confidenceScore * 100)}%
Implementation: ${recommendation.implementation}

Provide:
1. Adjusted accuracy score (0-1)
2. Justification for the confidence level
3. 3-4 factors that could affect actual savings

Format as JSON with keys: accuracyScore, confidenceJustification, potentialVariations (array)`,
      },
    ];

    const response = await this.provider.completeJsonWithFallback<any>(
      messages,
      {},
      { temperature: 0.2, maxTokens: 1024 }
    );

    return {
      accuracyScore: Math.min(1, Math.max(0, response.data.accuracyScore ?? 0)),
      confidenceJustification:
        response.data.confidenceJustification ??
        "Unable to determine confidence level",
      potentialVariations: response.data.potentialVariations ?? [],
    };
  }

  async identifyEdgeCases(
    recommendation: TaxRecommendation,
    profile: TaxProfile
  ): Promise<string[]> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `You are an expert tax advisor identifying edge cases and exceptions.
        Find scenarios where a recommendation might not apply or could cause issues.`,
      },
      {
        role: "user",
        content: `Identify edge cases for this tax recommendation:

Recommendation: ${recommendation.title}
Description: ${recommendation.description}
Risk Level: ${recommendation.riskLevel}
Requirements: ${recommendation.requirements.join(", ")}

Tax Profile:
- Age: ${profile.age}
- Salary: ₹${profile.salary?.grossSalary}
- Business: ${profile.business ? "Yes" : "No"}
- House Properties: ${profile.houseProperties.length}
- Capital Gains: ${profile.capitalGains ? "Yes" : "No"}

List 3-5 specific edge cases where this recommendation might not work or could create problems.
Format as JSON with key: edgeCases (array of strings)`,
      },
    ];

    const response = await this.provider.completeJsonWithFallback<any>(
      messages,
      {},
      { temperature: 0.3, maxTokens: 1024 }
    );

    return response.data.edgeCases ?? [];
  }

  private validateAnalysis(analysis: TaxAnalysis): TaxAnalysis {
    // Validate that savings estimates are reasonable
    if (analysis.totalPotentialSavings < 0) {
      analysis.totalPotentialSavings = 0;
    }

    // Validate recommendations
    analysis.recommendations = analysis.recommendations.map((rec) => ({
      ...rec,
      confidenceScore: Math.min(1, Math.max(0, rec.confidenceScore)),
      estimatedSavings: Math.max(0, rec.estimatedSavings),
      estimatedSavingsRange: {
        min: Math.max(0, rec.estimatedSavingsRange.min),
        max: Math.max(rec.estimatedSavingsRange.min, rec.estimatedSavingsRange.max),
      },
    }));

    // Sort by priority and savings
    analysis.recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedSavings - a.estimatedSavings;
    });

    return analysis;
  }
}

export const taxAdvisor = new TaxAdvisor();
