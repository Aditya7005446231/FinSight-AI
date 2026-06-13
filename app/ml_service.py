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

    def generate_investment_plan(
        self,
        age: int,
        financial_goal: str,
        investment_mode: str,
        amount: float,
        duration_years: int,
        risk_profile: str
    ) -> dict:
        # 1. Base Asset Allocation percentages
        allocation_map = {
            "Conservative": {"Debt": 0.70, "Hybrid": 0.30, "Equity": 0.00},
            "Balanced":     {"Debt": 0.30, "Hybrid": 0.40, "Equity": 0.30},
            "Growth":       {"Debt": 0.10, "Hybrid": 0.20, "Equity": 0.70},
            "Aggressive":   {"Debt": 0.00, "Hybrid": 0.10, "Equity": 0.90}
        }
        
        allocation = allocation_map.get(risk_profile, allocation_map["Balanced"]).copy()
        
        # 2. Safety override based on short durations (safety first)
        if duration_years <= 2:
            allocation = {"Debt": 0.80, "Hybrid": 0.20, "Equity": 0.00}
        elif duration_years <= 4:
            if allocation["Equity"] > 0.40:
                diff = allocation["Equity"] - 0.40
                allocation["Equity"] = 0.40
                allocation["Hybrid"] += diff
                
        df = self.dataset.copy()
        
        # Ensure correct numeric types for regression features
        for col in self.reg_features:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        for col in self.clf_features:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
        allocated_funds = []
        asset_alloc_details = []
        
        active_categories = {cat: pct for cat, pct in allocation.items() if pct > 0}
        
        # 3. Filter and select funds per category
        for category, percentage in active_categories.items():
            allocated_amount = amount * percentage
            asset_alloc_details.append({
                "category": category,
                "percentage": percentage * 100,
                "allocated_amount": round(allocated_amount, 2)
            })
            
            # Filter dataset by category
            cat_mask = df['category'].str.lower() == category.lower()
            cat_df = df[cat_mask].copy()
            
            if cat_df.empty:
                continue
                
            # Filter out funds that don't satisfy the minimum investment criteria
            if investment_mode == "SIP":
                filtered_by_amt = cat_df[cat_df['min_sip'] <= allocated_amount]
            else:
                filtered_by_amt = cat_df[cat_df['min_lumpsum'] <= allocated_amount]
                
            if not filtered_by_amt.empty:
                cat_df = filtered_by_amt.copy()
                
            # Predict 3yr returns using the regressor
            cat_df['predicted_return'] = self.regressor.predict(cat_df[self.reg_features]).round(2)
            
            # Predict quality tag using classifier
            clf_proba = self.classifier.predict_proba(cat_df[self.clf_features])
            best_idx = clf_proba.argmax(axis=1)
            cat_df['ai_quality_tag'] = self.label_encoder.classes_[best_idx]
            
            # Sort by predicted return and pick the top 2 funds to diversify
            top_funds = cat_df.nlargest(2, 'predicted_return')
            num_funds = len(top_funds)
            
            if num_funds > 0:
                fund_weight = percentage / num_funds
                fund_amount = allocated_amount / num_funds
                
                for _, row in top_funds.iterrows():
                    allocated_funds.append({
                        "scheme_name": row['scheme_name'],
                        "category": category,
                        "sub_category": str(row['sub_category']),
                        "allocation_percentage": round(fund_weight * 100, 2),
                        "allocated_amount": round(fund_amount, 2),
                        "predicted_return": float(row['predicted_return']),
                        "ai_quality_tag": str(row['ai_quality_tag']),
                        "latest_1yr_return": float(row['returns_1yr'] or 0),
                        "fund_size_cr": float(row['fund_size_cr'] or 0)
                    })
        
        # 4. Projected Value Calculations
        total_percentage = sum(f["allocation_percentage"] for f in allocated_funds)
        if total_percentage > 0:
            weighted_rate = sum(f["predicted_return"] * (f["allocation_percentage"] / 100) for f in allocated_funds)
        else:
            weighted_rate = 12.0
            
        r = weighted_rate / 100.0
        
        # Calculate yearly projection timeline for charts
        projection_timeline = []
        if investment_mode == "SIP":
            r_monthly = r / 12.0
            months = duration_years * 12
            total_invested = amount * months
            if r_monthly > 0:
                projected_value = amount * (((1 + r_monthly) ** months - 1) / r_monthly) * (1 + r_monthly)
            else:
                projected_value = total_invested
                
            # Populate year-by-year coordinates
            for y in range(1, duration_years + 1):
                y_months = y * 12
                y_cum_invest = amount * y_months
                if r_monthly > 0:
                    y_proj_val = amount * (((1 + r_monthly) ** y_months - 1) / r_monthly) * (1 + r_monthly)
                else:
                    y_proj_val = y_cum_invest
                projection_timeline.append({
                    "year": y,
                    "cumulative_investment": round(y_cum_invest, 2),
                    "projected_value": round(y_proj_val, 2)
                })
        else:
            total_invested = amount
            projected_value = amount * ((1 + r) ** duration_years)
            
            # Populate year-by-year coordinates
            for y in range(1, duration_years + 1):
                y_proj_val = amount * ((1 + r) ** y)
                projection_timeline.append({
                    "year": y,
                    "cumulative_investment": round(amount, 2),
                    "projected_value": round(y_proj_val, 2)
                })
            
        projected_value = round(projected_value, 2)
        projected_gain = round(projected_value - total_invested, 2)
        
        summary_message = (
            f"Based on your profile (Age {age}, Risk: {risk_profile}), we have created a "
            f"{duration_years}-year personalized {investment_mode} investment plan for your {financial_goal.lower()} goal. "
            f"Expected portfolio annualised return is {round(weighted_rate, 2)}%. "
            f"Total investment of ₹{round(total_invested, 2):,} is projected to grow to ₹{round(projected_value, 2):,} "
            f"with an estimated gain of ₹{round(projected_gain, 2):,}."
        )
        
        return {
            "status": "success",
            "risk_profile": risk_profile,
            "investment_mode": investment_mode,
            "total_amount": amount,
            "duration_years": duration_years,
            "projected_value": projected_value,
            "projected_gain": projected_gain,
            "asset_allocation": asset_alloc_details,
            "fund_distribution": allocated_funds,
            "projection_timeline": projection_timeline,
            "summary_message": summary_message
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

