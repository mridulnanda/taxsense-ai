/**
 * Compliance AI Module
 * Validates tax recommendations against rules
 * Checks for audit risk and compliance issues
 */

import pino from "pino";
import { providerManager, type LLMMessage } from "./provider";
import type { TaxRecommendation } from "./tax-advisor";
import type { TaxProfile } from "../tax-engine";

const logger = pino();

export interface ComplianceCheck {
  isCompliant: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  issues: ComplianceIssue[];
  auditRiskScore: number; // 0-1
  documentationRequired: DocumentationRequirement[];
  recommendations: string[];
  redFlags: string[];
  advisorReview: boolean; // Needs human review
}

export interface ComplianceIssue {
  code: string;
  severity: "warning" | "error" | "critical";
  description: string;
  regulation: string;
  remediation: string;
  riskScore: number;
}

export interface DocumentationRequirement {
  document: string;
  purpose: string;
  retention: string;
  format: string;
}

export interface AuditRiskAssessment {
  overallRisk: number; // 0-1
  riskFactors: Array<{
    factor: string;
    risk: number;
    description: string;
  }>;
  triggerPoints: string[];
  mitigationStrategies: string[];
  documentationPriority: string[];
}

const CRITICAL_RULES = [
  "TDS_compliance",
  "GST_filing",
  "Form_16_accuracy",
  "ITR_filing_deadline",
  "FDI_compliance",
  "Foreign_assets_disclosure",
  "Schedule_FA_accuracy",
];

const RISK_FACTORS = [
  "Large_cash_transactions",
  "Frequent_amendments",
  "Divergence_from_comparable",
  "Transfer_pricing_issues",
  "Related_party_transactions",
  "Unexplained_large_gains",
  "Usage_of_exemptions",
  "International_transactions",
];

export class ComplianceAI {
  private provider = providerManager;

  async validateRecommendation(
    recommendation: TaxRecommendation,
    profile: TaxProfile
  ): Promise<ComplianceCheck> {
    const systemPrompt = `You are an expert tax compliance officer.
    Validate tax recommendations against Indian tax laws and regulations.

    Consider:
    1. Income Tax Act 1961
    2. Tax Procedure Code
    3. Recent Supreme Court and High Court judgments
    4. CBDT circulars and clarifications
    5. Transfer Pricing regulations
    6. Foreign Assets disclosure requirements

    Be conservative - if a rule is ambiguous, flag it.
    Identify specific audit risk triggers.`;

    const userPrompt = `Validate this tax recommendation for compliance:

Recommendation: ${recommendation.title}
Category: ${recommendation.category}
Description: ${recommendation.description}
Implementation: ${recommendation.implementation}
Risk Level: ${recommendation.riskLevel}

Tax Profile:
- Income Type: ${this.getIncomeTypes(profile)}
- Total Income: ₹${this.calculateTotalIncome(profile).toLocaleString("en-IN")}
- Previous Audits: ${profile.previousAudits ?? "None mentioned"}
- Foreign Assets: ${this.hasForeignAssets(profile) ? "Yes" : "No"}

Provide compliance assessment including:
1. Is it compliant? (yes/no)
2. Specific compliance issues (if any)
3. Audit risk score (0-1)
4. Required documentation
5. Red flags
6. Recommendations
7. Needs advisor review? (yes/no)

Format as JSON.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const result = await this.provider.completeJsonWithFallback<any>(
        messages,
        {},
        { temperature: 0.2, maxTokens: 2048 }
      );

      logger.info(
        { provider: result.provider, compliant: result.data.isCompliant },
        "Compliance check completed"
      );

      return this.parseComplianceResult(result.data);
    } catch (error) {
      logger.error({ error }, "Compliance check failed");
      throw error;
    }
  }

  async assessAuditRisk(
    profile: TaxProfile,
    recommendations: TaxRecommendation[]
  ): Promise<AuditRiskAssessment> {
    const systemPrompt = `You are an expert in tax audit risk assessment.
    Evaluate the audit risk based on:
    1. Income composition and sources
    2. Deduction patterns
    3. Comparison with benchmarks
    4. Red flags in the tax position
    5. Historical audit history

    Provide specific risk factors and mitigation strategies.`;

    const userPrompt = `Assess audit risk for this tax profile:

Tax Profile:
- Income: ₹${this.calculateTotalIncome(profile).toLocaleString("en-IN")}
- Income Sources: ${this.getIncomeTypes(profile)}
- Deductions: ₹${this.calculateTotalDeductions(profile).toLocaleString("en-IN")}
- Capital Gains: ${profile.capitalGains ? "Yes" : "No"}
- House Properties: ${profile.houseProperties.length}

Recommendations Applied: ${recommendations.map((r) => r.title).join(", ")}

Provide:
1. Overall audit risk score (0-1)
2. Risk factors with individual scores
3. Specific audit trigger points
4. Mitigation strategies
5. Priority documentation to maintain

Format as JSON.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const result = await this.provider.completeJsonWithFallback<any>(
      messages,
      {},
      { temperature: 0.2, maxTokens: 1024 }
    );

    return {
      overallRisk: Math.min(1, Math.max(0, result.data.overallRisk ?? 0.3)),
      riskFactors: result.data.riskFactors ?? [],
      triggerPoints: result.data.triggerPoints ?? [],
      mitigationStrategies: result.data.mitigationStrategies ?? [],
      documentationPriority: result.data.documentationPriority ?? [],
    };
  }

  async generateComplianceReport(
    profile: TaxProfile,
    recommendations: TaxRecommendation[]
  ): Promise<string> {
    const systemPrompt = `You are a tax compliance expert writing a formal compliance report.
    The report will be reviewed by auditors and tax professionals.
    Be thorough, accurate, and cite relevant rules and regulations.`;

    const profileSummary = `
Tax Profile Summary:
- Income: ₹${this.calculateTotalIncome(profile).toLocaleString("en-IN")}
- Sources: ${this.getIncomeTypes(profile)}
- Deductions: ₹${this.calculateTotalDeductions(profile).toLocaleString("en-IN")}
- Age: ${profile.age}
- House Properties: ${profile.houseProperties.length}
- Business Income: ${profile.business ? "Yes" : "No"}
- Capital Gains: ${profile.capitalGains ? "Yes" : "No"}
    `.trim();

    const recommendationsSummary = recommendations
      .map(
        (r) => `
- ${r.title}
  Risk: ${r.riskLevel}
  Savings: ₹${r.estimatedSavings.toLocaleString("en-IN")}
  Compliance: ${r.riskLevel === "low" ? "Safe" : "Review Required"}
      `
      )
      .join("");

    const userPrompt = `Generate a compliance report based on:

${profileSummary}

Recommendations:
${recommendationsSummary}

Include:
1. Executive Summary
2. Compliance Assessment
3. Risk Analysis
4. Documentation Requirements
5. Recommendations
6. Sign-off (prepared by AI Advisor on YYYY-MM-DD)`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.provider.completeWithFallback(messages, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    return response.content;
  }

  async flagNonCompliantStrategies(
    recommendations: TaxRecommendation[]
  ): Promise<{
    flaggedRecommendations: TaxRecommendation[];
    reasons: Record<string, string[]>;
  }> {
    const systemPrompt = `You are a strict tax compliance auditor.
    Flag any recommendations that might violate tax laws or create audit risk.
    Be conservative in your assessment.`;

    const userPrompt = `Review these recommendations for compliance issues:

${recommendations
  .map(
    (r, i) => `
${i + 1}. ${r.title}
   Category: ${r.category}
   Risk Level: ${r.riskLevel}
   Implementation: ${r.implementation}
   Compliance Notes: ${r.complianceNotes}
  `
  )
  .join("")}

For each recommendation, flag if it has compliance issues.
Format: JSON with array of flagged indices and reasons.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const result = await this.provider.completeJsonWithFallback<any>(
      messages,
      {},
      { temperature: 0.1, maxTokens: 1024 }
    );

    const flaggedIndices = result.data.flaggedIndices ?? [];
    const flaggedRecommendations = recommendations.filter((_, i) =>
      flaggedIndices.includes(i)
    );

    return {
      flaggedRecommendations,
      reasons: result.data.reasons ?? {},
    };
  }

  async validateDocumentation(
    documentationList: string[]
  ): Promise<{
    isComplete: boolean;
    missing: string[];
    improvements: string[];
  }> {
    const systemPrompt = `You are an expert in tax documentation requirements.
    Review documentation lists for completeness and compliance.`;

    const userPrompt = `Review this documentation list for completeness:

${documentationList.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Identify:
1. Is documentation complete? (yes/no)
2. Missing documents
3. Improvements to documentation

Format as JSON.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const result = await this.provider.completeJsonWithFallback<any>(
      messages,
      {},
      { temperature: 0.2, maxTokens: 512 }
    );

    return {
      isComplete: result.data.isComplete ?? false,
      missing: result.data.missing ?? [],
      improvements: result.data.improvements ?? [],
    };
  }

  private parseComplianceResult(data: any): ComplianceCheck {
    return {
      isCompliant: data.isCompliant ?? true,
      riskLevel: this.normalizeRiskLevel(data.riskLevel ?? "low"),
      issues: data.issues ?? [],
      auditRiskScore: Math.min(1, Math.max(0, data.auditRiskScore ?? 0.2)),
      documentationRequired: data.documentationRequired ?? [],
      recommendations: data.recommendations ?? [],
      redFlags: data.redFlags ?? [],
      advisorReview: data.advisorReview ?? false,
    };
  }

  private normalizeRiskLevel(
    level: string
  ): "low" | "medium" | "high" | "critical" {
    const normalized = level.toLowerCase();
    if (["high", "medium", "low", "critical"].includes(normalized)) {
      return normalized as "low" | "medium" | "high" | "critical";
    }
    return "medium";
  }

  private getIncomeTypes(profile: TaxProfile): string {
    const types: string[] = [];
    if (profile.salary?.grossSalary) types.push("Salary");
    if (profile.business?.netIncome) types.push("Business");
    if (profile.capitalGains) types.push("Capital Gains");
    if (profile.houseProperties.length > 0) types.push("House Property");
    if (profile.otherSources) types.push("Other Sources");
    return types.join(", ") || "None";
  }

  private calculateTotalIncome(profile: TaxProfile): number {
    let total = 0;
    if (profile.salary) total += profile.salary.grossSalary;
    if (profile.business) total += profile.business.netIncome;
    if (profile.capitalGains) {
      total +=
        profile.capitalGains.stcgOther +
        profile.capitalGains.ltcgOther +
        profile.capitalGains.stcg111A;
    }
    if (profile.otherSources) {
      total +=
        (profile.otherSources.savingsInterest ?? 0) +
        (profile.otherSources.fdInterest ?? 0) +
        (profile.otherSources.dividends ?? 0) +
        (profile.otherSources.other ?? 0);
    }
    return total;
  }

  private calculateTotalDeductions(profile: TaxProfile): number {
    let total = 0;
    if (profile.deductions) {
      Object.values(profile.deductions).forEach((val) => {
        if (typeof val === "number") total += val;
      });
    }
    return total;
  }

  private hasForeignAssets(profile: TaxProfile): boolean {
    // Check if profile has foreign asset information
    return false; // Placeholder
  }
}

export const complianceAI = new ComplianceAI();
