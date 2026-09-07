"""
FinSight AI Services Package.

Exposes unified interfaces for Fund Analysis & Prediction and Risk Profiling.
"""

from app.services.fund_service import model_store
from app.services.risk_service import (
    predict_risk_profile,
    recommend_funds,
    lookup_fund_performance,
)

__all__ = [
    "model_store",
    "predict_risk_profile",
    "recommend_funds",
    "lookup_fund_performance",
]
