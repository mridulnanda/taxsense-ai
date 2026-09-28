/**
 * Natural Language Processing for Tax Documents
 * Extracts tax information from text, parses financial documents
 * Supports multi-language (Hindi, English)
 */

import { z } from "zod";
import pino from "pino";
import { providerManager, type LLMMessage } from "./provider";

const logger = pino();

export interface ExtractedTaxInfo {
  category: string;
  value: number;
  currency: string;
  description: string;
  confidence: number;
  source: string;
  language: string;
}

export interface DocumentAnalysis {
  documentType: string;
  content: string;
  extractedInfo: ExtractedTaxInfo[];
  summary: string;
  issues: string[];
  recommendations: string[];
  language: string;
}

export interface QuestionClassification {
  category: string;
  subcategory: string;
  confidence: number;
  relatedTopics: string[];
  suggestedDocuments: string[];
}

const ExtractedInfoSchema = z.object({
  items: z.array(
    z.object({
      category: z.string(),
      value: z.number(),
      currency: z.enum(["INR", "USD", "EUR"]),
      description: z.string(),
      confidence: z.number().min(0).max(1),
      source: z.string(),
    })
  ),
  summary: z.string(),
  issues: z.array(z.string()),
});

const ClassificationSchema = z.object({
  category: z.string(),
  subcategory: z.string(),
  confidence: z.number().min(0).max(1),
  relatedTopics: z.array(z.string()),
  suggestedDocuments: z.array(z.string()),
});

export class TaxNLP {
  private provider = providerManager;

  /**
   * Extract tax-relevant information from text
   */
  async extractTaxInfo(
    text: string,
    language: string = "english"
  ): Promise<DocumentAnalysis> {
    const systemPrompt = `You are an expert at extracting tax information from documents and text.
    You understand Indian tax terminology in both English and Hindi.

    Extract:
    1. Income sources (salary, business, investments, etc.)
    2. Deductions (donations, insurance, education, etc.)
    3. Assets and liabilities
    4. Transaction details
    5. Tax-relevant dates

    Be precise with numbers and currency.
    Flag any inconsistencies or missing information.
    Provide confidence scores for each extracted value.`;

    const userPrompt = `Extract tax information from this ${language} text:

${text}

Provide:
1. Extracted information items (category, value, description, confidence)
2. Summary of key tax information
3. Any issues or inconsistencies found
4. Recommendations for additional information

Format as JSON with keys: items (array), summary, issues (array)`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const result = await this.provider.completeJsonWithFallback<any>(
        messages,
        ExtractedInfoSchema,
        { temperature: 0.2, maxTokens: 2048 }
      );

      logger.info(
        {
          provider: result.provider,
          itemsExtracted: result.data.items?.length ?? 0,
        },
        "Tax info extraction completed"
      );

      return {
        documentType: this.detectDocumentType(text),
        content: text.slice(0, 1000),
        extractedInfo: (result.data.items ?? []).map((item: any) => ({
          category: item.category ?? "unknown",
          value: item.value ?? 0,
          currency: item.currency ?? "INR",
          description: item.description ?? "",
          confidence: item.confidence ?? 0.5,
          source: "document",
          language,
        })),
        summary: result.data.summary ?? "No summary available",
        issues: result.data.issues ?? [],
        recommendations: [],
        language,
      };
    } catch (error) {
      logger.error({ error }, "Tax info extraction failed");
      throw error;
    }
  }

  /**
   * Classify tax-related questions
   */
  async classifyQuestion(question: string): Promise<QuestionClassification> {
    const systemPrompt = `You are a tax question classifier.
    Categorize questions into tax topics and identify the type of assistance needed.

    Categories:
    - Income (salary, business, investments, etc.)
    - Deductions (medical, education, donations, etc.)
    - Exemptions (specific tax-exempt amounts)
    - Capital Gains (short-term, long-term)
    - House Property (rent, interest deduction)
    - Filing (ITR filing, deadlines, forms)
    - Compliance (documentation, audit-related)
    - Optimization (tax planning, strategies)
    - Loss Management (loss harvesting, carry-forward)`;

    const userPrompt = `Classify this tax question:

"${question}"

Provide:
1. Primary category
2. Subcategory
3. Confidence (0-1)
4. Related topics
5. Suggested documents to upload

Format as JSON with keys: category, subcategory, confidence, relatedTopics (array), suggestedDocuments (array)`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const result = await this.provider.completeJsonWithFallback<any>(
        messages,
        ClassificationSchema,
        { temperature: 0.2, maxTokens: 512 }
      );

      return {
        category: result.data.category ?? "general",
        subcategory: result.data.subcategory ?? "uncategorized",
        confidence: result.data.confidence ?? 0.5,
        relatedTopics: result.data.relatedTopics ?? [],
        suggestedDocuments: result.data.suggestedDocuments ?? [],
      };
    } catch (error) {
      logger.error({ error }, "Question classification failed");
      throw error;
    }
  }

  /**
   * Generate audit-friendly explanations for tax positions
   */
  async generateAuditExplanation(
    position: string,
    rationale: string,
    supportingFacts: string[]
  ): Promise<string> {
    const systemPrompt = `You are an expert at writing clear, compliance-friendly tax explanations.
    Write explanations that would satisfy a tax auditor or commissioner.

    Style:
    - Professional and formal
    - Clear citation of tax law/rules
    - Factual and objective
    - Complete documentation of basis
    - Anticipate questions and address them
    - Acknowledge any gray areas honestly`;

    const userPrompt = `Write an audit-friendly explanation for this tax position:

Position: ${position}
Rationale: ${rationale}
Supporting Facts:
${supportingFacts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Write a 2-3 paragraph explanation that an auditor would accept, including:
1. Clear statement of position
2. Basis in tax law
3. How facts support the position
4. Any limitations or caveats
5. Supporting documentation needed`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.provider.completeWithFallback(messages, {
      temperature: 0.3,
      maxTokens: 1024,
    });

    return response.content;
  }

  /**
   * Multi-language support - translate key terms
   */
  async translateTaxTerms(
    terms: string[],
    targetLanguage: string = "hindi"
  ): Promise<Record<string, string>> {
    const systemPrompt = `You are an expert translator of tax terminology.
    Translate English tax terms to ${targetLanguage} accurately.
    Include both direct translations and explanations where needed.`;

    const userPrompt = `Translate these tax terms to ${targetLanguage}:

${terms.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Format as JSON object with English term as key and ${targetLanguage} translation as value.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.provider.completeJsonWithFallback<
      Record<string, string>
    >(messages, {}, { temperature: 0.2, maxTokens: 512 });

    return response.data ?? {};
  }

  /**
   * Detect language of input text
   */
  detectLanguage(text: string): string {
    // Simple heuristic - can be replaced with ML model
    const hindiPattern = /[ऀ-ॿ]/g;
    const hindiChars = text.match(hindiPattern)?.length ?? 0;
    const totalChars = text.length;

    if (hindiChars / totalChars > 0.3) {
      return "hindi";
    }
    return "english";
  }

  /**
   * Detect document type from content
   */
  private detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();

    if (/w-2|form 1040|1099|itr|income tax return/.test(lowerText)) {
      return "tax-return";
    }
    if (/invoice|bill of sale|receipt/.test(lowerText)) {
      return "invoice";
    }
    if (/bank statement|transaction/.test(lowerText)) {
      return "bank-statement";
    }
    if (/salary|payslip|compensation/.test(lowerText)) {
      return "payslip";
    }
    if (/dividend|interest|stock|capital gain/.test(lowerText)) {
      return "investment-statement";
    }
    if (/loan|mortgage|interest/.test(lowerText)) {
      return "loan-document";
    }
    if (/donation|charity|ngo/.test(lowerText)) {
      return "donation-receipt";
    }

    return "general-document";
  }

  /**
   * Parse financial document (text extraction from OCR)
   */
  async parseFinancialDocument(
    documentText: string,
    documentType?: string
  ): Promise<{
    type: string;
    extractedFields: Record<string, any>;
    confidence: number;
    warnings: string[];
  }> {
    const systemPrompt = `You are an expert at parsing financial documents.
    Extract structured data from the document text.
    Be precise about amounts, dates, and account numbers.
    Flag any missing or unclear information.`;

    const userPrompt = `Parse this financial document (${documentType ?? "unknown type"}):

${documentText}

Extract all relevant fields into a structured format.
Include amounts, dates, account numbers, and other identifiers.
Format as JSON with all extracted fields.
Also provide confidence level (0-1) and any warnings.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.provider.completeJsonWithFallback<any>(
      messages,
      {},
      { temperature: 0.1, maxTokens: 2048 }
    );

    return {
      type: documentType ?? this.detectDocumentType(documentText),
      extractedFields: response.data ?? {},
      confidence: 0.85,
      warnings: response.data.warnings ?? [],
    };
  }
}

export const taxNLP = new TaxNLP();
