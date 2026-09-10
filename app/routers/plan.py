"""
POST /api/plan (and /plan) — personalized mutual fund wealth portfolio planning endpoint.
"""

from fastapi import APIRouter, HTTPException
from app.schemas import InvestmentPlanRequest, InvestmentPlanResponse
from app.services import generate_investment_plan

router = APIRouter()


@router.post("/api/plan", response_model=InvestmentPlanResponse)
@router.post("/plan", response_model=InvestmentPlanResponse)
def generate_plan(request: InvestmentPlanRequest):
    """
    Generate a personalized mutual fund investment plan.
    - Resolves asset allocation targets (Equity / Debt / Hybrid)
    - Queries top funds for each asset class from funds_clean.csv
    - Projects future compound value for SIP or Lumpsum
    """
    try:
        plan_data = generate_investment_plan(
            age=request.age,
            financial_goal=request.financial_goal,
            investment_mode=request.investment_mode,
            amount=request.amount,
            duration_years=request.duration_years,
            risk_profile=request.risk_profile,
        )
        return plan_data
    except RuntimeError as service_err:
        raise HTTPException(
            status_code=53,
            detail="Portfolio Planner service is currently unavailable. Please try again later.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating investment plan: {str(e)}",
        )
