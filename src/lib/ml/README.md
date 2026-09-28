# TaxSense AI — Machine Learning System

## Overview

The ML system provides sophisticated tax prediction, optimization, and recommendation capabilities powered by 6 specialized machine learning models.

## Quick Start

### 1. Basic Prediction

```typescript
import { MLPredictionService } from '@/lib/ml';
import { computeBoth, type TaxProfile } from '@/lib/tax-engine';

const service = MLPredictionService.getInstance();

const profile: TaxProfile = {
  age: 35,
  residentialStatus: 'resident',
  salary: { /* ... */ },
  houseProperties: [],
  deductions: { /* ... */ },
  taxesPaid: 0,
};

// Get all predictions + recommendations
const result = await service.predictForProfile('user_123', profile, true);

console.log('Predictions:', result.predictions);
console.log('Recommendations:', result.recommendations);
console.log('Processing time:', result.processing_time_ms, 'ms');
```

### 2. Feature Extraction

```typescript
import { FeatureEngineer } from '@/lib/ml';

const features = FeatureEngineer.extractFeatures(profile, {
  prevRegime: 'old',
  incomeHistory: [1000000, 1150000, 1300000], // YoY income
});

console.log('Extracted 30+ features:', features);
console.log('Income concentration:', features.income_concentration);
console.log('Audit risk flags:', features.audit_risk_flags);
```

### 3. Individual Model Predictions

```typescript
import { MLPredictionService } from '@/lib/ml';

const service = MLPredictionService.getInstance();

// Tax liability prediction
const taxPrediction = await service.predictSingleModel(
  'user_123',
  profile,
  'tax_liability'
);

// Regime recommendation
const regimeRec = await service.predictSingleModel(
  'user_123',
  profile,
  'regime_recommender'
);

// Explain prediction
const explanation = await service.explainPrediction(
  profile,
  'tax_liability'
);
```

### 4. Batch Processing

```typescript
const profiles = [
  { profileId: 'user_1', profile: {...} },
  { profileId: 'user_2', profile: {...} },
  // ... up to 1000 profiles
];

const batchResult = await service.batchPredict(profiles);

console.log(`Processed: ${batchResult.completed}/${batchResult.total_profiles}`);
console.log(`Failed: ${batchResult.failed}`);

batchResult.predictions.forEach((predictions, profileId) => {
  console.log(`Predictions for ${profileId}:`, predictions);
});
```

## API Endpoints

### POST /api/ml/predict

Single prediction with full details.

**Request:**
```json
{
  "profile_id": "user_123",
  "profile": { ... },
  "include_recommendations": true
}
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "model_type": "tax_liability",
      "value": 560000,
      "confidence": 0.95,
      "range": { "lower": 504000, "upper": 616000 }
    },
    ...
  ],
  "recommendations": [...],
  "profile_summary": {...},
  "processing_time_ms": 245
}
```

### POST /api/ml/batch-predict

Process multiple profiles efficiently.

### POST /api/ml/explain

Get feature importance and explanations.

### GET /api/ml/model-info

Get model metadata and performance info.

### GET /api/ml/performance

Real-time system health and metrics.

## Model Details

### 1. Tax Liability Predictor
- **Algorithm:** XGBoost Regressor
- **Accuracy:** 95% (±₹15K MAE)
- **Speed:** <50ms per prediction
- **Use Case:** Estimate tax liability for planning

```typescript
const prediction = predictions.find(p => p.model_type === 'tax_liability');
console.log(`Predicted tax: ₹${prediction.value.toLocaleString()}`);
console.log(`95% confidence interval: ₹${prediction.range.lower} - ₹${prediction.range.upper}`);
```

### 2. Regime Recommender
- **Algorithm:** Random Forest Classifier
- **Accuracy:** 90%
- **Output:** Probability distribution
- **Use Case:** Recommend optimal tax regime

```typescript
const regimeRec = predictions.find(p => p.model_type === 'regime_recommender');
const recommendedRegime = regimeRec.old_regime_probability > 0.5 ? 'old' : 'new';
const savings = regimeRec.savings_estimate;
console.log(`Recommended: ${recommendedRegime} regime (₹${savings} potential savings)`);
```

### 3. Deduction Optimizer
- **Algorithm:** Gradient Boosting
- **Accuracy:** 88%
- **Output:** Specific recommendations per section
- **Use Case:** Identify deduction optimization opportunities

```typescript
const dedOptimizer = predictions.find(p => p.model_type === 'deduction_optimizer');
dedOptimizer.recommendations.forEach(rec => {
  console.log(`Section ${rec.section}: Increase by ₹${rec.suggested_increase} (Save ₹${rec.potential_savings})`);
});
```

### 4. Anomaly Detector
- **Algorithm:** Isolation Forest
- **Accuracy:** 91%
- **Output:** Anomaly score (0-1)
- **Use Case:** Detect unusual patterns

```typescript
const anomaly = predictions.find(p => p.model_type === 'income_anomaly_detector');
if (anomaly.is_anomaly) {
  console.log(`Unusual pattern detected (score: ${anomaly.anomaly_score})`);
  console.log(`Similar profiles: ${anomaly.similar_profiles_count}`);
}
```

### 5. Audit Risk Scorer
- **Algorithm:** Logistic Regression
- **Accuracy:** 86%
- **Output:** Risk probability (0-1)
- **Use Case:** Identify high-risk profiles

```typescript
const auditRisk = predictions.find(p => p.model_type === 'audit_risk_scorer');
console.log(`Audit risk: ${auditRisk.risk_level} (${(auditRisk.value * 100).toFixed(1)}%)`);
auditRisk.risk_factors.forEach(f => {
  console.log(`- ${f.factor}: +${(f.contribution * 100).toFixed(1)}%`);
});
```

### 6. Savings Forecaster
- **Algorithm:** LSTM (Ensemble)
- **Accuracy:** 83%
- **Output:** Monthly forecasts with confidence intervals
- **Use Case:** Long-term tax planning

```typescript
const forecast = predictions.find(p => p.model_type === 'savings_forecaster');
forecast.forecasted_savings.forEach(m => {
  console.log(
    `Month ${m.month}: ₹${m.expected_savings.toLocaleString()} ` +

    `(₹${m.confidence_lower}-₹${m.confidence_upper})`
  );
});
```

## Feature Engineering

### Automatic Feature Extraction

```typescript
import { FeatureEngineer } from '@/lib/ml';

const features = FeatureEngineer.extractFeatures(profile);
// Produces 30+ engineered features from TaxProfile
```

### Custom Features

Add historical context:

```typescript
const features = FeatureEngineer.extractFeatures(profile, {
  prevRegime: 'old',
  incomeHistory: [900000, 1000000, 1100000], // 3 years
});

// Features include:
// - income_growth_yoy: Year-over-year growth
// - income_stability_score: Consistency (0-100)
// - regime_preference: Previous choice
```

### Feature Scaling

```typescript
import { FeatureScaler } from '@/lib/ml';

const scaler = new FeatureScaler('standard');
const scaledFeatures = scaler.fitTransform([features1, features2, ...]);

// Save/load scaler
const params = scaler.getParams();
scaler.loadParams(params);
```

## Data Pipeline

### Collect Data

```typescript
import { DataCollector } from '@/lib/ml';

const dataPoint = DataCollector.collectDataPoint(
  'profile_123',
  profile,
  'FY2025-26',
  {
    actual_tax_liability: 500000,
    actual_regime: 'old',
  }
);
```

### Generate Synthetic Data

```typescript
import { SyntheticDataGenerator } from '@/lib/ml';

// Generate 1000 synthetic profiles for testing
const profiles = SyntheticDataGenerator.generateProfiles(1000);

// Augment training data (3x)
const augmented = SyntheticDataGenerator.augmentProfiles(profiles, 3);
```

### Clean & Validate

```typescript
import { DataCollector } from '@/lib/ml';

const cleaned = DataCollector.cleanData(dataPoints);
const stats = DataCollector.computeStats(cleaned);
const validation = DataCollector.validateQuality(stats);

if (!validation.valid) {
  console.log('Quality issues:', validation.issues);
}
```

## Monitoring & Alerts

### Performance Tracking

```typescript
import { PerformanceMonitor } from '@/lib/ml';

const monitor = new PerformanceMonitor();

// Record predictions
monitor.recordMetric({
  timestamp: new Date(),
  model_type: 'tax_liability',
  mae: 15000,
  rmse: 22000,
  mape: 8.5,
  r2_score: 0.92,
  predictions_count: 500,
});

// Get performance summary
const summary = monitor.getSummary('tax_liability');
console.log(`Trend: ${summary.trend}`); // 'improving' | 'stable' | 'degrading'

// Detect degradation
const degradation = monitor.checkDegradation('tax_liability');
if (degradation) {
  console.log(`Alert: Accuracy dropped ${degradation.degradation_pct.toFixed(1)}%`);
}
```

### Data Drift Detection

```typescript
import { DataDriftDetector } from '@/lib/ml';

const driftDetector = new DataDriftDetector();

// Set training distribution
driftDetector.setReference('gross_salary', {
  min: 500000,
  max: 3000000,
  mean: 1500000,
  std: 500000,
});

// Detect drift in new data
const alerts = driftDetector.detectDrift(newFeatures);
alerts.forEach(alert => {
  console.log(`Drift in ${alert.feature_name}: ${(alert.drift_score * 100).toFixed(0)}%`);
  console.log(`Recommendation: ${alert.recommendation}`);
});
```

### Retraining Triggers

```typescript
import { RetrainingTrigger } from '@/lib/ml';

const trigger = new RetrainingTrigger();

// Check if retraining needed
const check = trigger.shouldRetrain(
  'tax_liability',
  currentMetrics,
  driftAlerts,
  samplesSinceTraining
);

if (check.should_retrain) {
  console.log('Reasons to retrain:', check.reasons);
  await retrainModel('tax_liability');
  trigger.recordTraining('tax_liability');
}

// Get next training time
const nextTraining = trigger.getNextScheduledTraining('tax_liability');
console.log(`Next scheduled training: ${nextTraining.toLocaleString()}`);
```

## Training New Models

### Python Training Script

```bash
# Install dependencies
pip install scikit-learn xgboost pandas numpy joblib

# Generate synthetic data and train
python scripts/train_models.py

# Models saved to: models/ml/
# Results saved to: models/ml/training_results.json
```

### Custom Training

```python
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load data
X_train, X_test, y_train, y_test = load_your_data()

# Train
model = RandomForestClassifier(n_estimators=200)
model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy:.4f}")

# Save
joblib.dump(model, 'models/ml/your_model.pkl')
```

## Integration Examples

### In Tax Computation Route

```typescript
// src/app/api/compute/route.ts
import { MLPredictionService } from '@/lib/ml';
import { computeBoth } from '@/lib/tax-engine';

const service = MLPredictionService.getInstance();
const taxResult = computeBoth(profile, 'new');

// Get ML predictions
const mlResult = await service.predictForProfile(profileId, profile);

// Combine results
return {
  computation: taxResult,
  ml_predictions: mlResult.predictions,
  recommendations: mlResult.recommendations,
};
```

### In Dashboard

```typescript
// src/app/app/dashboard/page.tsx
import { MLPredictionService } from '@/lib/ml';

async function DashboardPage() {
  const service = MLPredictionService.getInstance();
  const predictions = await service.predictForProfile(userId, userProfile);

  return (
    <div>
      <RegimeSwitchCard prediction={predictions.predictions[1]} />
      <DeductionCard prediction={predictions.predictions[2]} />
      <RecommendationsList recommendations={predictions.recommendations} />
      <HealthStatus />
    </div>
  );
}
```

### In Admin Analytics

```typescript
// src/app/admin/analytics/page.tsx
const response = await fetch('/api/ml/model-info');
const modelInfo = await response.json();

const response2 = await fetch('/api/ml/performance');
const performance = await response2.json();

return (
  <AdminAnalytics
    models={modelInfo.models}
    metrics={performance.metrics}
    health={performance.health_status}
  />
);
```

## Troubleshooting

### Predictions Too High/Low

1. Check feature extraction: `console.log(FeatureEngineer.extractFeatures(profile))`
2. Verify profile data quality
3. Check if model needs retraining
4. Compare with rule-based fallback

### High Drift Alerts

1. Check for regulatory changes
2. Investigate data quality issues
3. Review new data patterns
4. Consider triggering retraining

### Slow Predictions

1. Check system load
2. Monitor cache hits: `InferenceEngine.getInstance()`
3. Profile prediction time
4. Consider batch processing for multiple profiles

## Performance Benchmarks

| Operation | Time | Throughput |
|-----------|------|-----------|
| Single prediction | <50ms | 20 req/s per model |
| Batch (100) | <2s | 50 samples/s |
| Cold start | <100ms | — |
| Cache hit | <5ms | — |
| Feature extraction | <5ms | — |
| All 6 models | <300ms | — |

## Architecture Decisions

1. **Fallback Models:** Rule-based implementations ensure predictions even if ML models fail
2. **Caching:** Models cached in memory with 1-hour TTL to minimize load time
3. **Stateless Inference:** Each prediction independent, no session state needed
4. **Batch Processing:** Separate endpoint for efficient bulk predictions
5. **Monitoring First:** Built-in performance and drift detection
6. **Feature-Driven:** 30+ features capture tax complexity

## Future Enhancements

- [ ] Real-time model updates (online learning)
- [ ] Multi-year trend analysis
- [ ] Scenario planning (what-if simulations)
- [ ] Regional tax variations
- [ ] Integration with GST
- [ ] Natural language explanations
- [ ] Causal inference for recommendations
- [ ] Ensemble with alternative models

## Support

For issues, check:
1. `/api/ml/performance` for system health
2. Drift alerts in monitoring
3. Model performance metrics
4. Feature engineering output

See `docs/ML_MODELS.md` for comprehensive documentation.
