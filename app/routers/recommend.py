"""
POST /funds — legacy recommendation endpoint mapped to unified risk service.
"""

from fastapi import APIRouter, HTTPException
from app.schemas import InvestmentRequest, InvestmentResponse, FundRecommendation
from app.services import recommend_funds as get_recommendations

router = APIRouter()

RISK_PROFILE_MAP = {
    "Low": "Conservative",
    "Moderate": "Moderate",
    "High": "Aggressive",
    "Very High": "Aggressive",
}


@router.post("/funds", response_model=InvestmentResponse)
def recommend_funds(request: InvestmentRequest):
    """
    Fund recommendation endpoint mapped to single unified ML risk dataset (funds_clean.csv).
    """
    mapped_profile = RISK_PROFILE_MAP.get(request.risk_tolerance, "Moderate")

    try:
        raw_funds = get_recommendations(
            risk_profile=mapped_profile,
            top_n=request.top_n,
        )
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching fund recommendations: {str(err)}",
        )

    if not raw_funds:
        raise HTTPException(
            status_code=404,
            detail=f"No funds found for risk tolerance: {request.risk_tolerance}",
        )

    funds = [
        FundRecommendation(
            scheme_name=row["scheme_name"],
            category=str(row["category"]),
            sub_category=str(row.get("sub_category", "")),
            risk_level=3,
            ai_quality_tag="Good",
            predicted_return=float(row.get("returns_3yr", 12.0) or 12.0),
            latest_1yr_return=float(row.get("returns_1yr", 0) or 0),
            fund_size_cr=float(row.get("expense_ratio", 0) or 0),
        )
        for row in raw_funds
    ]

    message = (
        f"Top {len(funds)} funds recommended for ₹{request.amount} {request.investment_mode} "
        f"({request.duration_years} yrs, {request.risk_tolerance} risk)"
    )

    return InvestmentResponse(
        status="success",
        message=message,
        recommended_funds=funds,
    )