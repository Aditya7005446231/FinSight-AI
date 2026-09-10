"""
FinSight AI Services Package.

Unified single-engine interface for Risk Profiling, Mutual Fund Recommendations,
Search, and Wealth Portfolio Planning.
"""

from app.services.risk_service import (
    predict_risk_profile,
    recommend_funds,
    lookup_fund_performance,
    generate_investment_plan,
    search_funds,
)

__all__ = [
    "predict_risk_profile",
    "recommend_funds",
    "lookup_fund_performance",
    "generate_investment_plan",
    "search_funds",
]
