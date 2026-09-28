/**
 * AI Module Utilities
 * Helper functions for common AI operations
 */

import pino from "pino";

const logger = pino();

/**
 * Sanitize user input for safety
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 4000)
    .replace(/[<>]/g, "")
    .replace(/\n\n\n+/g, "\n\n");
}

/**
 * Estimate tokens from text (rough approximation)
 * 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidenceScore(
  factors: Record<string, number>
): number {
  const scores = Object.values(factors);
  if (scores.length === 0) return 0.5;

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(1, Math.max(0, average));
}

/**
 * Convert savings to formatted currency string
 */
export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount}`;
}

/**
 * Parse amount from text (e.g., "₹1,20,000" or "1.2 lakhs")
 */
export function parseAmount(text: string): number | null {
  const text_lower = text.toLowerCase();

  // Handle lakhs/crores
  const croreMatch = text.match(
    /(\d+(?:[,.]\d+)?)\s*(?:crore|cr|करोड़)/i
  );
  if (croreMatch) {
    return parseFloat(croreMatch[1].replace(",", ".")) * 10000000;
  }

  const lakhMatch = text.match(
    /(\d+(?:[,.]\d+)?)\s*(?:lakh|lac|l|लाख)/i
  );
  if (lakhMatch) {
    return parseFloat(lakhMatch[1].replace(",", ".")) * 100000;
  }

  const thousandMatch = text.match(
    /(\d+(?:[,.]\d+)?)\s*(?:thousand|k|हज़ार)/i
  );
  if (thousandMatch) {
    return parseFloat(thousandMatch[1].replace(",", ".")) * 1000;
  }

  // Handle regular numbers
  const numberMatch = text.match(/₹?\s*(\d+(?:[,.]\d+)?)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1].replace(/[,.]/g, ""));
  }

  return null;
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract year from text (e.g., "FY 2024-25" → 2024)
 */
export function extractYear(text: string): number | null {
  const match = text.match(/(?:FY|AY|20)\s*(\d{4})/i);
  if (match) {
    return parseInt(match[1]);
  }
  return new Date().getFullYear();
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Validate tax recommendation structure
 */
export function isValidRecommendation(obj: any): boolean {
  const required = [
    "id",
    "category",
    "title",
    "description",
    "estimatedSavings",
    "confidenceScore",
    "riskLevel",
  ];

  return (
    typeof obj === "object" &&
    required.every((field) => field in obj) &&
    obj.confidenceScore >= 0 &&
    obj.confidenceScore <= 1 &&
    ["low", "medium", "high"].includes(obj.riskLevel)
  );
}

/**
 * Group recommendations by category
 */
export function groupRecommendationsByCategory(
  recommendations: any[]
): Record<string, any[]> {
  return recommendations.reduce(
    (acc, rec) => {
      const category = rec.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(rec);
      return acc;
    },
    {} as Record<string, any[]>
  );
}

/**
 * Sort recommendations by savings potential
 */
export function sortByPotentialSavings(
  recommendations: any[]
): any[] {
  return [...recommendations].sort(
    (a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0)
  );
}

/**
 * Sort recommendations by confidence score
 */
export function sortByConfidence(recommendations: any[]): any[] {
  return [...recommendations].sort(
    (a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0)
  );
}

/**
 * Filter recommendations by minimum confidence
 */
export function filterByConfidence(
  recommendations: any[],
  minConfidence: number = 0.7
): any[] {
  return recommendations.filter((r) => r.confidenceScore >= minConfidence);
}

/**
 * Filter recommendations by risk level
 */
export function filterByRiskLevel(
  recommendations: any[],
  maxRiskLevel: "low" | "medium" | "high" = "medium"
): any[] {
  const riskOrder = { low: 0, medium: 1, high: 2 };
  return recommendations.filter(
    (r) => riskOrder[r.riskLevel as keyof typeof riskOrder] <= riskOrder[maxRiskLevel]
  );
}

/**
 * Format recommendation for display
 */
export function formatRecommendation(rec: any): string {
  return `
${rec.title}
Potential Savings: ${formatCurrency(rec.estimatedSavings)}
Confidence: ${Math.round(rec.confidenceScore * 100)}%
Risk: ${rec.riskLevel.toUpperCase()}
${rec.description}
  `.trim();
}

/**
 * Rate limit handler
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = requests.filter((time) => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  getRemainingRequests(key: string): number {
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const recentRequests = requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

/**
 * Cache with TTL
 */
export class TTLCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private ttlMs: number;

  constructor(ttlSeconds: number = 3600) {
    this.ttlMs = ttlSeconds * 1000;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Error handler with context
 */
export function handleAIError(error: any, context: Record<string, any>): Error {
  logger.error({ error, context }, "AI operation failed");

  if (error.status === 429) {
    return new Error("Rate limit exceeded. Please try again later.");
  }

  if (error.status === 401) {
    return new Error("Authentication failed. Please check API keys.");
  }

  if (error.status === 500) {
    return new Error(
      "AI service temporarily unavailable. Please try again later."
    );
  }

  if (error.message.includes("timeout")) {
    return new Error("Request timed out. Please try again.");
  }

  return error instanceof Error
    ? error
    : new Error("An unexpected error occurred");
}

/**
 * Generate unique conversation ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Extract tax year from profile
 */
export function extractTaxYear(profile: any): number {
  if (profile?.taxYear) return profile.taxYear;
  return new Date().getFullYear();
}

/**
 * Calculate effective tax rate
 */
export function calculateEffectiveTaxRate(
  taxPaid: number,
  grossIncome: number
): number {
  if (grossIncome <= 0) return 0;
  return (taxPaid / grossIncome) * 100;
}

/**
 * Estimate quarterly tax payment
 */
export function estimateQuarterlyTax(annualTax: number): {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
} {
  return {
    q1: Math.round(annualTax * 0.15),
    q2: Math.round(annualTax * 0.35),
    q3: Math.round(annualTax * 0.75),
    q4: annualTax,
  };
}
