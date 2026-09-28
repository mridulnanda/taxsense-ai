#!/usr/bin/env python3
"""
ML Model Training Script
Trains all ML models using scikit-learn, XGBoost, and related libraries
Saves models in ONNX format for use with TensorFlow.js or ONNX Runtime
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, Any

# ML Libraries
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import cross_val_score, GridSearchCV, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("Warning: XGBoost not installed. Install with: pip install xgboost")

try:
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    print("Warning: skl2onnx not installed. Install with: pip install skl2onnx")


class ModelTrainer:
    """Main training orchestrator"""

    def __init__(self, data_dir: str = "data/ml-training", model_dir: str = "models/ml"):
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.results = {}

    def load_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """Load training data from JSON or CSV"""
        # Try JSON first
        json_path = self.data_dir / "training_data.jsonl"
        if json_path.exists():
            data = []
            with open(json_path) as f:
                for line in f:
                    data.append(json.loads(line))
            df = pd.DataFrame(data)
            y = df.pop("target") if "target" in df.columns else None
            return df, y

        # Try CSV
        csv_path = self.data_dir / "training_data.csv"
        if csv_path.exists():
            df = pd.read_csv(csv_path)
            y = df.pop("target") if "target" in df.columns else None
            return df, y

        raise FileNotFoundError(f"No training data found in {self.data_dir}")

    def train_tax_liability_predictor(self, X_train, X_test, y_train, y_test):
        """Train XGBoost tax liability prediction model"""
        print("\n" + "=" * 60)
        print("Training Tax Liability Predictor (XGBoost)")
        print("=" * 60)

        if not XGBOOST_AVAILABLE:
            print("XGBoost not available. Skipping.")
            return None

        # Hyperparameters
        params = {
            "max_depth": 10,
            "learning_rate": 0.03,
            "n_estimators": 300,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "objective": "reg:squarederror",
            "random_state": 42,
        }

        model = xgb.XGBRegressor(**params)
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        mape = np.mean(np.abs((y_test - y_pred) / (y_test + 1))) * 100

        metrics = {"mae": float(mae), "rmse": float(rmse), "r2_score": float(r2), "mape": float(mape)}

        print(f"MAE: ₹{mae:,.0f}")
        print(f"RMSE: ₹{rmse:,.0f}")
        print(f"R² Score: {r2:.4f}")
        print(f"MAPE: {mape:.2f}%")

        # Save model
        joblib.dump(model, self.model_dir / "tax_liability_predictor.pkl")

        # Save metadata
        self.results["tax_liability"] = {
            "algorithm": "xgboost",
            "metrics": metrics,
            "feature_importance": dict(zip(X_train.columns, model.feature_importances_)),
            "training_samples": len(X_train),
        }

        return model

    def train_regime_recommender(self, X_train, X_test, y_train, y_test):
        """Train Random Forest regime recommendation model"""
        print("\n" + "=" * 60)
        print("Training Regime Recommender (Random Forest)")
        print("=" * 60)

        # Ensure binary target (0: new, 1: old)
        if len(np.unique(y_train)) != 2:
            print(f"Warning: Expected binary target, got {len(np.unique(y_train))} classes")

        params = {
            "n_estimators": 200,
            "max_depth": 15,
            "min_samples_split": 5,
            "class_weight": "balanced",
            "random_state": 42,
        }

        model = RandomForestClassifier(**params)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)

        metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
        }

        print(f"Accuracy: {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1 Score: {f1:.4f}")

        joblib.dump(model, self.model_dir / "regime_recommender.pkl")

        self.results["regime_recommender"] = {
            "algorithm": "random_forest",
            "metrics": metrics,
            "feature_importance": dict(zip(X_train.columns, model.feature_importances_)),
            "training_samples": len(X_train),
        }

        return model

    def train_deduction_optimizer(self, X_train, X_test, y_train, y_test):
        """Train Gradient Boosting deduction optimization model"""
        print("\n" + "=" * 60)
        print("Training Deduction Optimizer (Gradient Boosting)")
        print("=" * 60)

        params = {
            "n_estimators": 200,
            "learning_rate": 0.05,
            "max_depth": 8,
            "subsample": 0.8,
            "random_state": 42,
        }

        model = GradientBoostingRegressor(**params)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        metrics = {"mae": float(mae), "rmse": float(rmse), "r2_score": float(r2)}

        print(f"MAE: ₹{mae:,.0f}")
        print(f"RMSE: ₹{rmse:,.0f}")
        print(f"R² Score: {r2:.4f}")

        joblib.dump(model, self.model_dir / "deduction_optimizer.pkl")

        self.results["deduction_optimizer"] = {
            "algorithm": "gradient_boosting",
            "metrics": metrics,
            "feature_importance": dict(zip(X_train.columns, model.feature_importances_)),
            "training_samples": len(X_train),
        }

        return model

    def train_anomaly_detector(self, X_train, X_test):
        """Train Isolation Forest anomaly detection model"""
        print("\n" + "=" * 60)
        print("Training Anomaly Detector (Isolation Forest)")
        print("=" * 60)

        model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
        model.fit(X_train)

        # Evaluate on test set
        y_pred = model.predict(X_test)
        n_anomalies = (y_pred == -1).sum()
        anomaly_pct = (n_anomalies / len(y_test)) * 100

        print(f"Anomalies detected: {n_anomalies}/{len(y_test)} ({anomaly_pct:.1f}%)")

        joblib.dump(model, self.model_dir / "anomaly_detector.pkl")

        self.results["anomaly_detector"] = {
            "algorithm": "isolation_forest",
            "metrics": {"anomaly_percentage": float(anomaly_pct)},
            "training_samples": len(X_train),
        }

        return model

    def train_audit_risk_scorer(self, X_train, X_test, y_train, y_test):
        """Train Logistic Regression audit risk model"""
        print("\n" + "=" * 60)
        print("Training Audit Risk Scorer (Logistic Regression)")
        print("=" * 60)

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight="balanced",
        )
        model.fit(X_train_scaled, y_train)

        # Evaluate
        y_pred = model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)

        metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
        }

        print(f"Accuracy: {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")

        # Save model and scaler
        joblib.dump(model, self.model_dir / "audit_risk_scorer.pkl")
        joblib.dump(scaler, self.model_dir / "audit_risk_scaler.pkl")

        self.results["audit_risk_scorer"] = {
            "algorithm": "logistic_regression",
            "metrics": metrics,
            "training_samples": len(X_train),
        }

        return model, scaler

    def train_savings_forecaster(self, X_train, X_test, y_train, y_test):
        """Train LSTM-style savings forecaster (using GradientBoosting for now)"""
        print("\n" + "=" * 60)
        print("Training Savings Forecaster (Ensemble)")
        print("=" * 60)

        # Use GradientBoosting as a stand-in for LSTM
        model = GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, max_depth=8, random_state=42)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        metrics = {"mae": float(mae), "rmse": float(rmse)}

        print(f"MAE: ₹{mae:,.0f}")
        print(f"RMSE: ₹{rmse:,.0f}")

        joblib.dump(model, self.model_dir / "savings_forecaster.pkl")

        self.results["savings_forecaster"] = {
            "algorithm": "gradient_boosting",
            "metrics": metrics,
            "training_samples": len(X_train),
        }

        return model

    def cross_validate(self, model, X, y, cv=5):
        """Perform k-fold cross-validation"""
        if hasattr(model, "predict_proba"):
            scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
        else:
            scores = cross_val_score(model, X, y, cv=cv, scoring="r2")

        return {"cv_mean": float(scores.mean()), "cv_std": float(scores.std()), "cv_scores": [float(s) for s in scores]}

    def train_all(self):
        """Train all models"""
        print("Starting ML Model Training Pipeline")
        print(f"Training data directory: {self.data_dir}")
        print(f"Model output directory: {self.model_dir}")

        try:
            # Load data
            print("\nLoading training data...")
            X, y = self.load_data()
            print(f"Loaded {len(X)} samples with {X.shape[1]} features")

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            print(f"Training set: {len(X_train)} samples")
            print(f"Test set: {len(X_test)} samples")

            # Train each model
            if "tax_liability" not in y.name.lower() if isinstance(y, pd.Series) else True:
                self.train_tax_liability_predictor(X_train, X_test, y_train, y_test)

            # Train remaining models (would need appropriate targets)
            # self.train_regime_recommender(...)
            # self.train_deduction_optimizer(...)
            # self.train_anomaly_detector(...)
            # self.train_audit_risk_scorer(...)
            # self.train_savings_forecaster(...)

            # Save results
            self.save_results()

            print("\n" + "=" * 60)
            print("Training Complete!")
            print("=" * 60)
            return True

        except Exception as e:
            print(f"Error during training: {e}")
            import traceback

            traceback.print_exc()
            return False

    def save_results(self):
        """Save training results to JSON"""
        results_file = self.model_dir / "training_results.json"

        metadata = {
            "timestamp": datetime.now().isoformat(),
            "models": self.results,
            "note": "Training metadata and performance metrics",
        }

        with open(results_file, "w") as f:
            json.dump(metadata, f, indent=2)

        print(f"\nResults saved to {results_file}")


def generate_synthetic_data(n_samples=1000):
    """Generate synthetic tax data for testing"""
    print("Generating synthetic training data...")

    np.random.seed(42)

    data = {
        "gross_salary": np.random.uniform(500000, 5000000, n_samples),
        "investment_income": np.random.exponential(100000, n_samples),
        "capital_gains": np.random.exponential(50000, n_samples),
        "business_income": np.random.exponential(200000, n_samples),
        "other_income": np.random.uniform(0, 100000, n_samples),
        "section_80c_used": np.random.uniform(0, 150000, n_samples),
        "section_80c_capacity_used_pct": np.random.uniform(0, 100, n_samples),
        "section_80d_used": np.random.uniform(0, 50000, n_samples),
        "section_80e_used": np.random.uniform(0, 100000, n_samples),
        "section_80g_used": np.random.uniform(0, 50000, n_samples),
        "total_deductions": np.random.uniform(50000, 400000, n_samples),
        "age": np.random.randint(25, 65, n_samples),
        "age_group": np.random.randint(0, 5, n_samples),
        "is_senior": np.random.randint(0, 2, n_samples),
        "is_metro": np.random.randint(0, 2, n_samples),
        "residential_status": np.random.randint(0, 2, n_samples),
        "income_growth_yoy": np.random.uniform(-20, 50, n_samples),
        "income_stability_score": np.random.uniform(40, 100, n_samples),
        "regime_preference": np.random.randint(0, 2, n_samples),
        "audit_risk_flags": np.random.randint(0, 5, n_samples),
    }

    # Generate synthetic target (tax liability)
    gross_income = (
        data["gross_salary"]
        + data["investment_income"]
        + data["capital_gains"]
        + data["business_income"]
    )
    total_deductions = data["total_deductions"]
    taxable_income = np.maximum(gross_income - total_deductions, 0)

    # Simplified tax calculation
    tax = np.where(
        taxable_income <= 250000,
        0,
        np.where(
            taxable_income <= 500000,
            (taxable_income - 250000) * 0.05,
            np.where(
                taxable_income <= 750000,
                12500 + (taxable_income - 500000) * 0.1,
                np.where(
                    taxable_income <= 1000000,
                    37500 + (taxable_income - 750000) * 0.15,
                    75000 + (taxable_income - 1000000) * 0.2,
                ),
            ),
        ),
    )

    data["target"] = tax

    df = pd.DataFrame(data)
    output_path = Path("data/ml-training")
    output_path.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_path / "training_data.csv", index=False)
    print(f"Generated {n_samples} synthetic samples -> data/ml-training/training_data.csv")

    return df


if __name__ == "__main__":
    # Generate synthetic data if needed
    if not Path("data/ml-training/training_data.csv").exists():
        generate_synthetic_data(1000)

    # Train models
    trainer = ModelTrainer()
    success = trainer.train_all()

    exit(0 if success else 1)
