import joblib
import pandas as pd
import numpy as np
from pathlib import Path

RISK_MAP ={
    "Low": [1,2],
    "Moderate": [3,4],
    "High": [5,6],
    "Very High": [7,8,9,10]
}


DURATION_CATEGORY_MAP = {
    1: ["Debt"],
    2: ["Debt","Hybrid"],
    3: ["Hybrid","Equity"],
    5: ["Equity"],
    10: ["Equity"]
}

def get_category_for_duration(years : int) -> list:
    if years <= 1:
        return DURATION_CATEGORY_MAP[1]
    elif years <= 2:
        return DURATION_CATEGORY_MAP[2]
    elif years <= 3:
        return DURATION_CATEGORY_MAP[3]
    elif years <= 5:
        return DURATION_CATEGORY_MAP[5]
    else:
        return DURATION_CATEGORY_MAP[10]
    
class ModelStore:

    def __init__(self):
        self.regressor = None
        self.classifier = None
        self.label_encoder = None
        self.dataset = None
        self._loaded = False

        self.reg_features = [
            'sharpe', 'alpha', 'beta', 'sortino', 
            'fund_size_cr', 'min_sip', 'min_lumpsum'
        ]

        self.clf_features = [
            'sharpe', 'alpha', 'beta', 'sortino', 
            'fund_size_cr', 'expense_ratio', 'returns_1yr', 
            'risk_level', 'fund_age_yr'
        ]
        
        # Call load_all automatically when ModelStore is created
        self.load_all()

    def load_all(self):
        print("Loading models and dataset...")
        # Fixed typo: 'returns_3yr...' instead of 'return_3yr...'
        self.regressor = joblib.load(Path("models/returns_3yr_predictor.joblib"))
        self.classifier = joblib.load(Path("models/fund_classifier.joblib"))
        self.label_encoder = joblib.load(Path("models/fund_label_encoder.joblib"))
        self.dataset = pd.read_csv(Path("data/fastapi_funds_dataset.csv"))
        
        for col in set(self.reg_features + self.clf_features):
            if col in self.dataset.columns:
                self.dataset[col] = pd.to_numeric(
                    self.dataset[col], errors='coerce'
                )
        self._loaded = True
        print(f"{len(self.dataset)} funds loaded")


    def recommend_funds(self,
                        investment_mode: str,
                        amount: float,
                        duration_years: int,
                        risk_tolerance: str,
                        top_n: int) -> pd.DataFrame:
        df = self.dataset.copy()

        suitable_categories = get_category_for_duration(duration_years)
        cat_mask = df['category'].apply(
            lambda x: any(c.lower() in str(x).lower()
                          for c in suitable_categories)
        )
        filtered = df[cat_mask].copy()

        allowed_risk = RISK_MAP.get(risk_tolerance, [1,2,3,4,5,6,7])
        filtered = filtered[filtered['risk_level'].isin(allowed_risk)]

        if investment_mode == "SIP":
            filtered = filtered[filtered['min_sip'] <= amount]
        else:
            filtered = filtered[filtered['min_lumpsum'] <= amount]

        if filtered.empty:
            return pd.DataFrame()

        filtered['predicted_return'] = \
            self.regressor.predict(filtered[self.reg_features]).round(2)
        
        clf_proba = self.classifier.predict_proba(
            filtered[self.clf_features]
        )

        best_idx = clf_proba.argmax(axis=1)
        filtered['ai_quality_tag'] = self.label_encoder.classes_[best_idx]

        top = filtered.nlargest(top_n, 'predicted_return')

        return top[[
            'scheme_name','category','sub_category',
            'risk_level','ai_quality_tag','predicted_return',
            'returns_1yr','fund_size_cr'
        ]]
        

    def classify_quality(self, features: dict) -> dict:
        X      = pd.DataFrame([features])[self.clf_features]
        proba  = self.classifier.predict_proba(X)[0]
        classes= self.label_encoder.classes_
        best   = proba.argmax()
        return {
            "quality":       classes[best],
            "confidence":    round(float(proba[best]), 3),
            "probabilities": {
                c: round(float(p), 3)
                for c, p in zip(classes, proba)
            }
        }

    # ── SEARCH ───────────────────────────────────────────────────────────
    def search_funds(self, query: str, top_n: int = 10) -> pd.DataFrame:
        mask = self.dataset['scheme_name'].str.contains(
            query, case=False, na=False
        )
        return self.dataset[mask].head(top_n)[[
            'scheme_name', 'category', 'sub_category',
            'fund_size_cr', 'returns_1yr', 'sharpe'
        ]]


model_store = ModelStore()

