from fastapi import APIRouter, HTTPException
from app.schemas import InvestmentPlanRequest, InvestmentPlanResponse
from app.ml_service import model_store

router = APIRouter()

@router.post("/plan", response_model=InvestmentPlanResponse)
def generate_plan(request: InvestmentPlanRequest):
    """
    Generate a personalized mutual fund investment plan.
    - Resolves asset allocation targets (Equity / Debt / Hybrid)
    - Dynamically queries top ML-recommended funds for each asset class
    - Projects future compound value for SIP or Lumpsum
    """
    if not model_store._loaded:
        raise HTTPException(status_code=503, detail="Models are still loading, please try again.")
        
    try:
        plan_data = model_store.generate_investment_plan(
            age=request.age,
            financial_goal=request.financial_goal,
            investment_mode=request.investment_mode,
            amount=request.amount,
            duration_years=request.duration_years,
            risk_profile=request.risk_profile
        )
        return plan_data
    except Exception as e:
        raise HTTPException(500, f"Error generating plan: {str(e)}")
