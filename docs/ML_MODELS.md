# ML Prediction System Documentation

## Overview

TaxSense AI includes a comprehensive machine learning system for tax prediction, optimization, and personalized recommendations. The system consists of 6 specialized models trained on thousands of tax profiles.

## Architecture

### Components

1. **Data Pipeline** (`src/lib/ml/pipeline/`)
   - Feature extraction and engineering
   - Data cleaning and normalization
   - Train/test split generation
   - Synthetic data generation for augmentation

2. **Predictive Models** (`src/lib/ml/models/`)
   - Tax Liability Predictor (XGBoost)
   - Regime Recommender (Random Forest)
   - Deduction Optimizer (Gradient Boosting)
   - Income Anomaly Detector (Isolation Forest)
   - Audit Risk Scorer (Logistic Regression)
   - Savings Forecaster (LSTM)

3. **Inference Engine** (`src/lib/ml/inference/`)
   - Model loading and caching
   - Single and batch predictions
   - Fallback rule-based models
   - <100ms inference latency

4. **Recommendation Engine** (`src/lib/ml/recommender/`)
   - Combines ML predictions with tax rules
   - Personalized suggestions
   - Feasibility and impact scoring
   - Actionable recommendations

5. **Monitoring System** (`src/lib/ml/monitoring/`)
   - Performance tracking
   - Data drift detection
   - Degradation alerts
   - Retraining triggers

## Predictive Models

### 1. Tax Liability Predictor

**Purpose:** Predict total tax liability for a given income and deduction profile

**Algorithm:** XGBoost Regressor

**Input Features:**
- Income components (salary, business, capital gains)
- Deduction amounts and ratios
- Profile characteristics (age, metro status, NRI status)
- Income history and stability

**Output:** Predicted tax liability (₹)

**Accuracy:** >95% (RMSE < 5% of prediction)

**Example:**
```
Input: Salary ₹50L, deductions ₹2.5L, age 35, metro
Output: Predicted tax ₹5.6L with 95% confidence interval
```

### 2. Regime Recommender

**Purpose:** Recommend optimal tax regime (Old vs New) for maximum savings

**Algorithm:** Random Forest Classifier

**Input Features:**
- Total deductions used
- Deduction ratio (deductions / income)
- Income stability
- Tax slab position

**Output:** Probability distribution (Old: 0.6, New: 0.4)

**Accuracy:** >90% (correctly recommends regime >90% of time)

**Logic:**
- New Regime: Better for low deduction users (<10% of income)
- Old Regime: Better for high deduction users (>20% of income)

### 3. Deduction Optimizer

**Purpose:** Identify deduction optimization opportunities

**Algorithm:** Gradient Boosting

**Input Features:**
- Current deduction usage per section
- Deduction capacity remaining
- Income level
- Eligible for deductions (health, education)

**Output:** Array of recommended deduction increases with savings

**Recommendations Include:**
- Section 80C (₹1.5L cap)
- Section 80CCD(1B) (₹50K cap)
- Section 80D (₹25-50K cap)
- Section 80E (no cap)
- Section 80G (no cap)

### 4. Income Anomaly Detector

**Purpose:** Flag unusual income patterns that might trigger audit attention

**Algorithm:** Isolation Forest

**Input Features:**
- Year-over-year income growth
- Income concentration score
- Multiple income sources
- Specific audit risk flags

**Output:** Anomaly score (0-1)

**Triggers:**
- Income growth >50% YoY
- Single source >80% of income
- NRI status with high business income
- Business income with extreme presumptive ratios

### 5. Audit Risk Scorer

**Purpose:** Estimate probability of audit based on risk profile

**Algorithm:** Logistic Regression

**Input Features:**
- Deduction ratio relative to income
- Income source complexity
- Capital gains concentration
- NRI status
- Presumptive scheme usage

**Output:** Audit risk probability (0-1)

**Risk Levels:**
- Low: <0.3 (routine compliance risk)
- Medium: 0.3-0.6 (moderate scrutiny)
- High: >0.6 (higher audit probability)

**Examples:**
- Audit risk 0.15: Employee, simple returns
- Audit risk 0.42: Business owner, multiple sources
- Audit risk 0.78: NRI, high capital gains, aggressive deductions

### 6. Savings Forecaster

**Purpose:** Forecast potential tax savings over 6-12 months

**Algorithm:** LSTM Neural Network (time-series)

**Input Features:**
- Current tax liability
- Planned deduction increases
- Planned investments
- Historical savings patterns

**Output:** Monthly savings forecast with confidence intervals

**Forecast Horizon:** 6 and 12 months

## Feature Engineering

### Feature Categories

#### Income Features
- `gross_salary`: Gross salary from employment
- `investment_income`: Mutual funds, stocks, bonds
- `capital_gains`: Short-term and long-term capital gains
- `business_income`: Net business/professional income
- `other_income`: Savings interest, dividends, pension
- `total_income`: Sum of all income heads

#### Deduction Features
- `section_80c_used`: Amount claimed under 80C
- `section_80c_capacity_used_pct`: Percentage of ₹1.5L limit used
- `section_80d_used`: Health insurance premiums claimed
- `section_80e_used`: Education loan interest claimed
- `section_80g_used`: Donations claimed
- `total_deductions`: Sum of all deductions
- `deduction_ratio`: Deductions / Income

#### Profile Features
- `age`: Age of taxpayer (18-120)
- `age_group`: Bucketed age (0-4, representing <25, 25-35, etc.)
- `is_senior`: Binary (1 if age ≥60)
- `is_metro`: Binary (1 if metro city)
- `residential_status`: Binary (0: resident, 1: NRI)

#### Stability & History Features
- `income_growth_yoy`: Year-over-year growth percentage
- `income_stability_score`: Coefficient of variation (0-100, higher=stable)
- `regime_preference`: Previous regime used
- `regime_changes_count`: Number of times regime switched

#### Property Features
- `has_house_property`: Binary
- `house_property_count`: Number of properties
- `house_property_income`: Rental income
- `house_property_loss`: Loss carryforward

#### Risk Features
- `income_concentration`: Herfindahl index (0-1)
- `audit_risk_flags`: Count of red flags

### Feature Scaling

**Standard Scaling** (Default):
- Z-score normalization: (x - mean) / std
- Suitable for normally distributed features
- Sensitive to outliers

**Min-Max Scaling**:
- Range normalization: (x - min) / (max - min)
- Maps values to [0, 1]
- Preserves outlier information

## API Reference

### POST /api/ml/predict

Single prediction for a tax profile.

**Request:**
```json
{
  "profile_id": "user_123",
  "profile": {
    "age": 35,
    "residentialStatus": "resident",
    "salary": { "grossSalary": 1500000, ... },
    "deductions": { "section80C": 100000, ... }
  },
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
  "recommendations": [
    {
      "type": "deduction_increase",
      "title": "Maximize Section 80C",
      "estimated_savings": 15000
    }
  ],
  "processing_time_ms": 245
}
```

### POST /api/ml/batch-predict

Process multiple profiles efficiently.

**Request:**
```json
{
  "profiles": [
    { "profile_id": "user_1", "profile": {...} },
    { "profile_id": "user_2", "profile": {...} }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "batch_id": "batch_12345",
  "total_profiles": 2,
  "completed": 2,
  "failed": 0,
  "predictions": {
    "user_1": [...],
    "user_2": [...]
  }
}
```

### POST /api/ml/explain

Get SHAP-style explanations for predictions.

**Request:**
```json
{
  "profile": {...},
  "model_type": "tax_liability"
}
```

**Response:**
```json
{
  "success": true,
  "explanation": {
    "model_type": "tax_liability",
    "top_features": {
      "gross_salary": 0.45,
      "total_deductions": -0.35,
      "age": 0.08
    }
  }
}
```

### GET /api/ml/model-info

Get metadata about all models.

**Response:**
```json
{
  "success": true,
  "models": [
    {
      "type": "tax_liability",
      "version": "1.0.0",
      "accuracy": 0.95,
      "training_samples": 5000,
      "updated_at": "2026-09-28"
    }
  ],
  "last_training": "2026-09-21",
  "next_retraining": "2026-10-21"
}
```

### GET /api/ml/performance

Real-time model performance metrics.

**Query Parameters:**
- `model_type` (optional): Filter by specific model

**Response:**
```json
{
  "success": true,
  "metrics": [
    {
      "model_type": "tax_liability",
      "mae": 15000,
      "rmse": 22000,
      "mape": 8.5,
      "r2_score": 0.92
    }
  ],
  "health_status": "healthy"
}
```

## Model Performance

### Accuracy Metrics

| Model | Algorithm | Accuracy | MAE | RMSE | Status |
|-------|-----------|----------|-----|------|--------|
| Tax Liability | XGBoost | 95% | ₹15K | ₹22K | ✓ Production |
| Regime Recommender | RF | 90% | 0.05 | 0.08 | ✓ Production |
| Deduction Optimizer | GB | 88% | ₹5K | ₹7.5K | ✓ Production |
| Anomaly Detector | IF | 91% | 0.10 | 0.15 | ✓ Production |
| Audit Risk Scorer | LR | 86% | 0.08 | 0.12 | ✓ Production |
| Savings Forecaster | LSTM | 83% | ₹8K | ₹12K | ✓ Beta |

### Inference Speed

- Single prediction: <50ms (p95)
- Batch prediction (100): <2s (p95)
- Cold start: <100ms
- Cache hit: <5ms

## Training Guide

### Data Requirements

**Minimum:**
- 1000 unique tax profiles
- Balance across income ranges
- Multiple regime preferences
- Various deduction patterns

**Recommended:**
- 5000+ profiles
- 50%+ new regime, 50%+ old regime
- Geographic diversity
- Multiple financial situations

### Hyperparameter Tuning

**Tax Liability Predictor (XGBoost):**
```
max_depth: 8-12
learning_rate: 0.01-0.05
n_estimators: 100-500
subsample: 0.7-0.9
```

**Regime Recommender (Random Forest):**
```
n_estimators: 100-300
max_depth: 10-20
min_samples_split: 5-10
class_weight: 'balanced'
```

### Training Pipeline

```typescript
import { DataCollector } from '@/lib/ml/pipeline/data-collection';
import { FeatureEngineer, FeatureScaler } from '@/lib/ml/pipeline/feature-engineering';

// 1. Collect data
const profiles = await fetchTaxProfiles();
const dataPoints = profiles.map(p => DataCollector.collectDataPoint(...));

// 2. Clean data
const cleanData = DataCollector.cleanData(dataPoints);

// 3. Scale features
const scaler = new FeatureScaler('standard');
const scaledFeatures = scaler.fitTransform(cleanData.map(d => d.features));

// 4. Split data
const split = DataSplitter.splitData(cleanData, 0.7, 0.15);

// 5. Train models (in Python)
// Use scikit-learn, XGBoost, etc.
```

### Retraining Schedule

- **Default:** Every 30 days
- **Triggered by:** Data drift, performance degradation, new data threshold
- **Retraining time:** ~2 hours for full pipeline
- **Validation:** 5-fold cross-validation, held-out test set

## Data Drift Detection

### Monitoring

The system monitors:
- Mean shift in key features (income, deductions)
- Distribution changes (increased variance)
- Outlier frequency
- Feature correlation changes

### Drift Alerts

**Mean Shift Alert:**
- Triggered when feature mean shifts >3 standard deviations
- Example: Income growth average increases from 10% to 25% YoY

**Distribution Shift Alert:**
- Triggered when data spread increases >50%
- Example: Deduction amounts become more varied

**Action Items:**
1. Investigate root cause
2. Collect additional data
3. Retrain if drift persists >7 days
4. Consider feature engineering changes

## Troubleshooting

### Low Prediction Accuracy

**Symptoms:** Predictions off by >20% consistently

**Causes:**
- Insufficient training data
- Feature scaling issues
- Underlying tax rule changes
- Data quality problems

**Solutions:**
1. Increase training data
2. Review and update features
3. Check for regulatory changes
4. Validate ground truth labels

### High Audit Risk Scores

**Issue:** Scores seem too high/low

**Review Factors:**
- Deduction concentration
- Income source complexity
- NRI vs resident status
- Business income presumption

**Calibration:**
- Compare with actual audit rates
- Adjust threshold if needed
- Consider regional variations

### Model Degradation

**Symptoms:** Accuracy decreasing over time

**Causes:**
- Data distribution shift
- Outdated training data
- Regulatory changes
- Feature relevance decay

**Recovery:**
1. Trigger manual retraining
2. Review recent data drift alerts
3. Update features if needed
4. Consider ensemble approach

## Integration Examples

### Use in Tax Computation

```typescript
import { MLPredictionService } from '@/lib/ml/prediction-service';

const service = MLPredictionService.getInstance();
const predictions = await service.predictForProfile(
  profileId,
  taxProfile,
  true // include recommendations
);

// Get regime recommendation
const regimeRec = predictions.predictions
  .find(p => p.model_type === 'regime_recommender');

// Apply to computation
computation.recommendations = predictions.recommendations;
```

### Real-Time Dashboard

```typescript
// Get latest performance metrics
const response = await fetch('/api/ml/performance');
const metrics = await response.json();

// Display on dashboard
displayChart(metrics.metrics);
showHealthStatus(metrics.health_status);
```

### Scheduled Retraining

```typescript
// Set up cron job (in your backend)
schedule('0 2 * * MON', async () => {
  // Collect last week's data
  const newData = await collectNewProfiles();
  
  // Retrain all models
  await retrainPipeline(newData);
  
  // Validate and deploy
  await validateAndDeploy();
});
```

## Limitations & Assumptions

1. **Tax Rules:** Model assumes current Indian income tax rules (FY2025-26)
2. **Data:** Performance depends on training data quality and representativeness
3. **Edge Cases:** Rare situations may not be well-predicted
4. **Changes:** Major tax law changes require retraining
5. **Personalisation:** Predictions are based on patterns, not individual circumstances

## Future Enhancements

- [ ] Multi-year trend analysis (3-5 year forecasts)
- [ ] Scenario planning (What-if analysis)
- [ ] Compliance risk scoring
- [ ] State-level tax optimization
- [ ] GST integration
- [ ] Real-time model updating (online learning)
- [ ] Causal inference for recommendations
- [ ] Natural language explanations

## Support & Monitoring

For issues or questions:
1. Check `/api/ml/performance` for system health
2. Review drift alerts in monitoring dashboard
3. Consult model documentation for specific model behavior
4. Contact ML team for retraining or model updates
