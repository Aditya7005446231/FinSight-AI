"""
FinSight AI Risk Profiler & Mutual Fund Recommendation Engine.

Single Source of Truth for ML Risk Profiling, Fund Recommendations,
Search, and Wealth Portfolio Planning using models/risk_model/ and funds_clean.csv.
"""

import logging
from pathlib import Path
import warnings
import joblib
import pandas as pd
from sklearn.exceptions import InconsistentVersionWarning

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

logger = logging.getLogger("finsight.risk_service")

# Resolve directory containing risk model artifacts
BASE_DIR = Path(__file__).resolve().parents[2]
RISK_MODEL_DIR = BASE_DIR / "models" / "risk_model"

# Service initialization state
_service_ready = False
_init_error = ""

_model = None
_encoders = None
_label_enc = None
_feature_cols = None
_funds_df = None

try:
    _model = joblib.load(RISK_MODEL_DIR / "risk_model.joblib")
    _encoders = joblib.load(RISK_MODEL_DIR / "feature_encoders.joblib")
    _label_enc = joblib.load(RISK_MODEL_DIR / "label_encoder.joblib")
    _feature_cols = joblib.load(RISK_MODEL_DIR / "feature_cols.joblib")
    _funds_df = pd.read_csv(RISK_MODEL_DIR / "funds_clean.csv")

    _service_ready = True
    logger.info(
        "[risk_service] Loaded risk model, %d features, %d funds",
        len(_feature_cols),
        len(_funds_df),
    )
except Exception as err:
    _service_ready = False
    _init_error = str(err)
    logger.critical(
        "[risk_service] Failed to initialize risk ML model artifacts from %s: %s",
        RISK_MODEL_DIR,
        err,
        exc_info=True,
    )


def _check_readiness():
    """Internal helper to ensure service assets are loaded."""
    if not _service_ready:
        raise RuntimeError(
            f"Risk ML Service is not available due to initialization failure: {_init_error}"
        )


# ── Public Risk Profiler & Fund Recommendation API ─────────────────────

def predict_risk_profile(answers: dict) -> tuple[str, dict]:
    """
    Predict the investor's risk profile from questionnaire answers.
    """
    _check_readiness()

    row = {
        "age": answers["age"],
        "monthly_income": answers["monthly_income"],
        "dependents": answers["dependents"],
        "horizon_years": answers["horizon_years"],
        "emergency_fund_enc": _encoders["emergency_fund"].transform(
            [answers["emergency_fund"]]
        )[0],
        "drop_reaction_enc": _encoders["drop_reaction"].transform(
            [answers["drop_reaction"]]
        )[0],
        "goal_type_enc": _encoders["goal_type"].transform(
            [answers["goal_type"]]
        )[0],
        "experience_enc": _encoders["experience"].transform(
            [answers["experience"]]
        )[0],
        "monthly_investable": answers["monthly_investable"],
    }

    X = pd.DataFrame([row])[_feature_cols]
    pred = _model.predict(X)[0]
    proba = _model.predict_proba(X)[0]

    profile = _label_enc.classes_[pred]
    confidence = dict(zip(_label_enc.classes_, proba.round(3).tolist()))
    return profile, confidence


def recommend_funds(
    risk_profile: str,
    goal_type: str | None = None,
    top_n: int = 5,
    category_filter: str | None = None,
) -> list[dict]:
    """
    Rule-based filter + rank for risk-matched mutual funds.
    """
    _check_readiness()

    pool = _funds_df[_funds_df["risk_profile"] == risk_profile].copy()

    if category_filter:
        pool = pool[pool["category"] == category_filter]

    if goal_type == "tax_saving":
        elss = pool[
            pool["sub_category"].str.contains("ELSS", case=False, na=False)
        ]
        if len(elss) >= top_n:
            pool = elss

    if pool.empty:
        logger.warning(
            "[risk_service] Empty fund pool for risk_profile='%s', category='%s', goal='%s'",
            risk_profile,
            category_filter,
            goal_type,
        )
        return []

    pool = pool.sort_values("composite_score", ascending=False)

    cols = [
        "scheme_name",
        "category",
        "sub_category",
        "amc_name",
        "risk_profile",
        "expense_ratio",
        "sharpe",
        "returns_1yr",
        "returns_3yr",
        "returns_5yr",
        "rating",
        "composite_score",
    ]
    return pool[cols].head(top_n).to_dict(orient="records")


def lookup_fund_performance(scheme_names: list[str]) -> dict:
    """
    Look up return metrics (1yr/3yr/5yr) for a list of scheme names.
    Supports exact matching and case-insensitive/whitespace fallback matching.
    """
    _check_readiness()

    found = []
    not_found = []

    for raw_name in scheme_names:
        name = raw_name.strip()
        if not name:
            continue

        match = _funds_df[_funds_df["scheme_name"] == name]

        if match.empty:
            clean_target = name.lower()
            match = _funds_df[
                _funds_df["scheme_name"].str.strip().str.lower() == clean_target
            ]

        if match.empty:
            not_found.append(raw_name)
        else:
            row = match.iloc[0]
            found.append(
                {
                    "scheme_name": row["scheme_name"],
                    "returns_1yr": (
                        float(row["returns_1yr"])
                        if pd.notna(row["returns_1yr"])
                        else None
                    ),
                    "returns_3yr": (
                        float(row["returns_3yr"])
                        if pd.notna(row["returns_3yr"])
                        else None
                    ),
                    "returns_5yr": (
                        float(row["returns_5yr"])
                        if pd.notna(row["returns_5yr"])
                        else None
                    ),
                }
            )

    return {"found": found, "not_found": not_found}


def search_funds(query: str, top_n: int = 10) -> pd.DataFrame:
    """
    Search mutual funds dataset by scheme name substring.
    """
    _check_readiness()

    mask = _funds_df["scheme_name"].str.contains(query, case=False, na=False)
    cols = ["scheme_name", "category", "sub_category", "expense_ratio", "returns_1yr", "sharpe"]
    matched = _funds_df[mask].head(top_n).copy()
    if "fund_size_cr" not in matched.columns:
        matched["fund_size_cr"] = matched["expense_ratio"]
    return matched[["scheme_name", "category", "sub_category", "fund_size_cr", "returns_1yr", "sharpe"]]


# ── Public Wealth Plan Generator API ────────────────────────────────────

def generate_investment_plan(
    age: int,
    financial_goal: str,
    investment_mode: str,
    amount: float,
    duration_years: int,
    risk_profile: str,
) -> dict:
    """
    Generate a personalized mutual fund investment plan using funds_clean.csv.
    """
    _check_readiness()

    allocation_map = {
        "Conservative": {"Debt": 0.70, "Hybrid": 0.30, "Equity": 0.00},
        "Balanced":     {"Debt": 0.30, "Hybrid": 0.40, "Equity": 0.30},
        "Growth":       {"Debt": 0.10, "Hybrid": 0.20, "Equity": 0.70},
        "Aggressive":   {"Debt": 0.00, "Hybrid": 0.10, "Equity": 0.90},
    }

    allocation = allocation_map.get(
        risk_profile, allocation_map["Balanced"]
    ).copy()

    if duration_years <= 2:
        allocation = {"Debt": 0.80, "Hybrid": 0.20, "Equity": 0.00}
    elif duration_years <= 4:
        if allocation["Equity"] > 0.40:
            diff = allocation["Equity"] - 0.40
            allocation["Equity"] = 0.40
            allocation["Hybrid"] += diff

    df = _funds_df.copy()

    allocated_funds = []
    asset_alloc_details = []

    active_categories = {cat: pct for cat, pct in allocation.items() if pct > 0}

    for category, percentage in active_categories.items():
        allocated_amount = amount * percentage
        asset_alloc_details.append(
            {
                "category": category,
                "percentage": percentage * 100,
                "allocated_amount": round(allocated_amount, 2),
            }
        )

        cat_mask = df["category"].str.lower() == category.lower()
        cat_df = df[cat_mask].copy()

        if cat_df.empty:
            continue

        cat_df = cat_df.sort_values(
            by=["composite_score", "returns_3yr"], ascending=[False, False]
        )

        top_funds = cat_df.head(2)
        num_funds = len(top_funds)

        if num_funds > 0:
            fund_weight = percentage / num_funds
            fund_amount = allocated_amount / num_funds

            for _, row in top_funds.iterrows():
                rating = float(row.get("rating", 3) or 3)
                if rating >= 4:
                    quality_tag = "Good"
                elif rating <= 1:
                    quality_tag = "Risky"
                else:
                    quality_tag = "Average"

                predicted_ret = float(row.get("returns_3yr", 12.0) or 12.0)

                allocated_funds.append(
                    {
                        "scheme_name": row["scheme_name"],
                        "category": category,
                        "sub_category": str(row.get("sub_category", "")),
                        "allocation_percentage": round(fund_weight * 100, 2),
                        "allocated_amount": round(fund_amount, 2),
                        "predicted_return": round(predicted_ret, 2),
                        "ai_quality_tag": quality_tag,
                        "latest_1yr_return": float(row.get("returns_1yr", 0) or 0),
                        "fund_size_cr": float(row.get("expense_ratio", 0) or 0),
                    }
                )

    total_percentage = sum(f["allocation_percentage"] for f in allocated_funds)
    if total_percentage > 0:
        weighted_rate = sum(
            f["predicted_return"] * (f["allocation_percentage"] / 100)
            for f in allocated_funds
        )
    else:
        weighted_rate = 12.0

    r = weighted_rate / 100.0
    projection_timeline = []

    if investment_mode == "SIP":
        r_monthly = r / 12.0
        months = duration_years * 12
        total_invested = amount * months
        if r_monthly > 0:
            projected_value = amount * (
                ((1 + r_monthly) ** months - 1) / r_monthly
            ) * (1 + r_monthly)
        else:
            projected_value = total_invested

        for y in range(1, duration_years + 1):
            y_months = y * 12
            y_cum_invest = amount * y_months
            if r_monthly > 0:
                y_proj_val = amount * (
                    ((1 + r_monthly) ** y_months - 1) / r_monthly
                ) * (1 + r_monthly)
            else:
                y_proj_val = y_cum_invest
            projection_timeline.append(
                {
                    "year": y,
                    "cumulative_investment": round(y_cum_invest, 2),
                    "projected_value": round(y_proj_val, 2),
                }
            )
    else:
        total_invested = amount
        projected_value = amount * ((1 + r) ** duration_years)

        for y in range(1, duration_years + 1):
            y_proj_val = amount * ((1 + r) ** y)
            projection_timeline.append(
                {
                    "year": y,
                    "cumulative_investment": round(amount, 2),
                    "projected_value": round(y_proj_val, 2),
                }
            )

    projected_value = round(projected_value, 2)
    projected_gain = round(projected_value - total_invested, 2)

    summary_message = (
        f"Based on your profile (Age {age}, Risk: {risk_profile}), we have created a "
        f"{duration_years}-year personalized {investment_mode} investment plan for your {financial_goal.lower()} goal. "
        f"Expected portfolio annualised return is {round(weighted_rate, 1)}%. "
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
        "summary_message": summary_message,
    }
