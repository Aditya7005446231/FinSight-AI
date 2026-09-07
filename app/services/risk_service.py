"""
FinSight AI Risk Profiler & Mutual Fund Recommendation Engine.

Loads XGBoost risk model and funds_clean.csv dataset from models/risk_model/
and exposes inference pipeline & performance lookup functions.
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


# ── Public API ───────────────────────────────────────────────────────

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

        # 1. Try exact match
        match = _funds_df[_funds_df["scheme_name"] == name]

        # 2. Case-insensitive & trimmed fallback match if exact match yields empty
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
