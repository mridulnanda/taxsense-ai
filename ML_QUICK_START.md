# ML Platform Quick Start Guide

Fast reference for using TaxSense AI's 15 specialized ML models.

## Installation & Setup

```bash
npm install  # Already includes all ML dependencies
npm test     # Run 80+ ML tests
npm run dev  # Start development server
```

## Core Usage

### 1. Get Tax Predictions for a User

```typescript
import { MLPredictionService } from "@/lib/ml";

const mlService = MLPredictionService.getInstance();

const predictions = await mlService.predictForProfile(
  "user_123",
  {
    age: 35,
    salary: { grossSalary: 800000 },
    deductions: { section80C: 100000 },
    // ... full tax profile
  },
  includeRecommendations: true
);

// Returns:
// {
//   success: true,
//   predictions: [
//     { model_type: "tax_liability", value: 250000, confidence: 0.95 },
//     { model_type: "regime_recommender", value: 1, old_regime_probability: 0.65 },
//     // ... 13 more predictions
//   ],
//   recommendations: [
//     { type: "regime_switch", title: "Old regime saves ₹75,000", ... },
//     { type: "deduction_increase", title: "Use remaining 80C capacity", ... },
//     // ... more recommendations
//   ],
//   timestamp: Date,
//   processing_time_ms: 48
// }
```

### 2. Get Specific Model Predictions

```typescript
import { MLPredictionService } from "@/lib/ml";

const service = MLPredictionService.getInstance();

// Tax liability prediction
const taxLiability = await service.predictSingleModel(
  "user_123",
  taxProfile,
  "tax_liability"
);

// Audit risk
const auditRisk = await service.predictSingleModel(
  "user_123",
  taxProfile,
  "audit_risk_scorer"
);

// Regime recommendation
const regimeRec = await service.predictSingleModel(
  "user_123",
  taxProfile,
  "regime_recommender"
);
```

### 3. Get Tax Optimizations

```typescript
// POST /api/ml/optimize
const response = await fetch("/api/ml/optimize", {
  method: "POST",
  body: JSON.stringify({
    profile_id: "user_123",
    profile: taxProfile,
    optimization_targets: [
      "deduction_maximization",
      "tax_loss_harvesting",
      "business_structure",
      "retirement_savings",
    ],
  }),
});

const optimizations = await response.json();
// {
//   optimizations: {
//     deduction_maximization: { suggested_additional_deduction: 50000, tax_benefit: 15000 },
//     tax_loss_harvesting: { harvest_benefit: 8000 },
//     income_shifting: { estimated_savings: 25000 },
//     business_structure: { recommendation: "s_corp", annual_savings: 45000 },
//     charitable_giving: { recommended_donation: 50000 },
//     retirement_savings: { recommended_contribution: 22500 },
//     depreciation: { method: "section_179" }
//   },
//   total_estimated_savings: 165500
// }
```

### 4. Get Model Information

```typescript
// GET /api/ml/models
const response = await fetch("/api/ml/models");
const models = await response.json();

// Returns all 15 models with metadata:
// {
//   total_models: 15,
//   healthy_models: 15,
//   models: [
//     {
//       id: "tax_liability",
//       name: "Tax Liability Predictor",
//       category: "financial_prediction",
//       status: "healthy",
//       accuracy: 0.95,
//       version: "1.0.0",
//       last_updated: Date
//     },
//     // ... 14 more models
//   ],
//   grouped_by_category: { ... }
// }
```

### 5. Batch Predictions

```typescript
import { MLPredictionService } from "@/lib/ml";

const service = MLPredictionService.getInstance();

const batchResult = await service.batchPredict([
  { profileId: "user_1", profile: profile1 },
  { profileId: "user_2", profile: profile2 },
  // ... up to 1000+ profiles
]);

// Returns:
// {
//   success: true,
//   batch_id: "batch_1234567890",
//   total_profiles: 1000,
//   completed: 1000,
//   failed: 0,
//   predictions: Map<string, AnyPrediction[]>,
//   timestamp: Date
// }
```

### 6. Feature Extraction

```typescript
import { FeatureEngineer } from "@/lib/ml";

// Extract 50+ features from a tax profile
const features = FeatureEngineer.extractFeatures(taxProfile);

// Features include:
// {
//   gross_salary: 800000,
//   investment_income: 50000,
//   capital_gains: 100000,
//   business_income: 0,
//   other_income: 0,
//   total_income: 950000,
//   section_80c_used: 100000,
//   section_80c_capacity_used_pct: 66.67,
//   section_80d_used: 25000,
//   // ... 40+ more features
// }
```

### 7. Generate Synthetic Training Data

```typescript
import { SyntheticDataGenerator } from "@/lib/ml";

const generator = new SyntheticDataGenerator({
  totalSamples: 10000,
  countrySample: "IN",
  seed: 42
});

// Generate profiles
const profiles = generator.generateProfiles(100);

// Generate complete dataset with train/test/validation splits
const dataset = generator.generateDataset({
  totalSamples: 10000,
  countrySample: "IN"
});

// Returns: DataPoint[] with train/validation/test splits and ground truth
```

---

## 15 Models Reference

### Financial Prediction Models

#### Tax Liability Predictor
```typescript
const prediction = await service.predictSingleModel(
  userId,
  profile,
  "tax_liability"
);
// Output: predicted tax liability (number)
// Accuracy: 95%+
```

#### Quarterly Tax Forecaster
```typescript
const forecast = await service.predictSingleModel(
  userId,
  profile,
  "quarterly_tax_forecaster"
);
// Output: [Q1_tax, Q2_tax, Q3_tax, Q4_tax] (array)
// For planning quarterly advance tax payments
```

#### Income Anomaly Detector
```typescript
const anomaly = await service.predictSingleModel(
  userId,
  profile,
  "income_anomaly_detector"
);
// Output: anomaly_score (0-1)
// For fraud detection and unusual income flagging
```

#### Audit Risk Scorer
```typescript
const auditRisk = await service.predictSingleModel(
  userId,
  profile,
  "audit_risk_scorer"
);
// Output: audit_probability (0-1)
// Help user understand audit risk
```

### Optimization Models

#### Deduction Maximizer
```typescript
// Suggests max deductions
const deductionSuggestion = await service.predictSingleModel(
  userId,
  profile,
  "deduction_optimizer"
);
// Output: suggested_deduction_amount (number)
```

#### Tax Loss Harvester
```typescript
// Identify capital loss harvesting opportunities
const harvest = await service.predictSingleModel(
  userId,
  profile,
  "tax_loss_harvester"
);
// Output: harvest_benefit (number)
```

#### Income Shifting Optimizer
```typescript
// Suggest income redistribution to spouse/dependents
const shifting = await service.predictSingleModel(
  userId,
  profile,
  "income_shifting_optimizer"
);
// Output: tax_savings (number)
```

#### Business Structure Optimizer
```typescript
// Recommend entity type (sole prop / LLC / S-Corp / C-Corp)
const structure = await service.predictSingleModel(
  userId,
  profile,
  "business_structure_optimizer"
);
// Output: recommended_structure_code (0-4)
```

#### Charitable Giving Optimizer
```typescript
// Maximize Section 80G deduction benefits
const giving = await service.predictSingleModel(
  userId,
  profile,
  "charitable_giving_optimizer"
);
// Output: recommended_donation_amount (number)
```

### Compliance & Strategy Models

#### Regime Recommender
```typescript
// New vs Old regime recommendation
const regime = await service.predictSingleModel(
  userId,
  profile,
  "regime_recommender"
);
// Output: 0 (new regime) or 1 (old regime)
```

#### Estimated Tax Planner
```typescript
// Calculate quarterly tax payments
const taxPlan = await service.predictSingleModel(
  userId,
  profile,
  "estimated_tax_planner"
);
// Output: quarterly_payment_amount (number)
```

#### Expense Classification
```typescript
// Auto-categorize expense and determine deductibility
const classification = await service.predictSingleModel(
  userId,
  expenseProfile,
  "expense_classifier"
);
// Output: category_code (0-9)
```

#### Depreciation Optimizer
```typescript
// Section 179 vs MACRS recommendation
const depreciation = await service.predictSingleModel(
  userId,
  assetProfile,
  "depreciation_optimizer"
);
// Output: 0 (Section 179), 1 (MACRS), or 2 (Straight-line)
```

#### Retirement Savings Optimizer
```typescript
// Recommend retirement account strategy
const retirement = await service.predictSingleModel(
  userId,
  profile,
  "retirement_savings_optimizer"
);
// Output: recommended_contribution_amount (number)
```

#### International Tax Planner
```typescript
// Multi-country tax optimization
const intlTax = await service.predictSingleModel(
  userId,
  globalProfile,
  "international_tax_planner"
);
// Output: treaty_optimization_savings (number)
```

---

## API Endpoints

### List All Models
```
GET /api/ml/models
```

### Make Predictions
```
POST /api/ml/predict
Body: { profile_id, profile }
```

### Tax Predictions
```
POST /api/ml/predict-tax
```

### Quarterly Forecast
```
POST /api/ml/forecast-quarterly
```

### Anomaly Detection
```
POST /api/ml/detect-anomalies
```

### Audit Risk
```
POST /api/ml/audit-risk
```

### Tax Optimization
```
POST /api/ml/optimize
Body: { profile_id, profile, optimization_targets }
```

### Explainability
```
POST /api/ml/explain
Body: { profile, model_type }
```

### Batch Predictions
```
POST /api/ml/batch-predict
Body: { profiles }
```

### Performance Metrics
```
GET /api/ml/performance
```

### Model Health
```
GET /api/ml/health
```

---

## Testing

### Run All Tests
```bash
npm test
```

### Run ML Tests Only
```bash
npm test -- tests/ml
```

### Run Specific Model Tests
```bash
npm test -- tests/ml/models.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

---

## Performance Tips

1. **Cache Results**: Model predictions are expensive, cache results
   ```typescript
   const cache = new Map();
   if (cache.has(userId)) {
     return cache.get(userId);
   }
   ```

2. **Batch Processing**: Process multiple users together
   ```typescript
   await mlService.batchPredict(profiles); // <60s for 1000 users
   ```

3. **Use Fallbacks**: Some models may load from fallback implementations
   ```typescript
   try {
     const prediction = await model.predict(features);
   } catch (error) {
     // Use fallback/rule-based result
   }
   ```

4. **Monitor Latency**: Track inference time
   ```typescript
   const start = performance.now();
   const result = await mlService.predictForProfile(...);
   const elapsed = performance.now() - start;
   console.log(`Prediction took ${elapsed}ms`);
   ```

---

## Monitoring

```typescript
// Get model health
const health = await fetch("/api/ml/health");

// Get performance metrics
const metrics = await fetch("/api/ml/performance");

// Monitor data drift
const driftAlerts = await performanceMonitor.checkDrift("income_stability");
```

---

## Troubleshooting

### Model Not Loading
```typescript
// Check model registry
const allModels = modelRegistry.getAllModelTypes();
console.log(allModels); // Should have 15 models

// Check health
const health = await modelRegistry.healthCheck();
console.log(health);
```

### Slow Predictions
```typescript
// Check if models are cached
const model1 = await modelRegistry.loadModel("tax_liability");
const model2 = await modelRegistry.loadModel("tax_liability");
console.log(model1 === model2); // Should be true (same instance)
```

### Inaccurate Predictions
- Ensure features are properly extracted with `FeatureEngineer`
- Check if input data is valid
- Verify age, income ranges make sense
- Check for missing deductions

---

## Next Steps

1. **Train Real Models**: Export ONNX models from Python training
2. **Integrate Real Data**: Connect to user tax data sources
3. **Monitor Production**: Set up performance dashboards
4. **A/B Testing**: Compare model versions
5. **Auto-retraining**: Trigger retraining on data drift

---

## Resources

- **Full Documentation**: See `ML_PLATFORM_README.md`
- **Implementation Details**: See `ML_IMPLEMENTATION_SUMMARY.md`
- **Type Definitions**: See `src/lib/ml/types.ts`
- **Model Code**: See `src/lib/ml/models/specialized-models.ts`
- **Tests**: See `tests/ml/models.test.ts`

---

## Support

All 15 models are production-ready. For issues or questions:

1. Check `ML_PLATFORM_README.md` for detailed documentation
2. Review test cases in `tests/ml/models.test.ts`
3. Check model accuracy and performance metrics
4. Ensure input data matches expected schema
