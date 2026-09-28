/**
 * TaxSense Global — 6-Country Tax Engine Suite
 *
 * Production-grade tax computation engines with statutory accuracy
 * for 2026 tax year across all major jurisdictions
 */

// US Tax Engine
export * as usEngine from "./us";

// UK Tax Engine
export * as ukEngine from "./uk";

// Canadian Tax Engine
export * as caEngine from "./ca";

// Singapore Tax Engine
export * as sgEngine from "./sg";

// Australia Tax Engine
export * as auEngine from "./au";

// Re-export India engine (existing)
export * as inEngine from "../tax-engine";
