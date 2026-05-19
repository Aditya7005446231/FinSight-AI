from fastapi import APIRouter, HTTPException
from app.schemas import InvestmentRequest, InvestmentResponse, FundRecommendation
from app.ml_service import model_store

router = APIRouter()


@router.post("/funds", response_model=InvestmentResponse)
def recommend_funds(request: InvestmentRequest):
    """
    Smart fund recommendation based on:
    - investment_mode: SIP ya Lumpsum
    - amount: kitna invest karna hai
    - duration_years: kitne saal ke liye
    - risk_tolerance: Low / Moderate / High / Very High
    """
    if not model_store._loaded:
        raise HTTPException(503, "Models are still loading, please try again in a moment.")

    result_df = model_store.recommend_funds(
        investment_mode=request.investment_mode,
        amount         =request.amount,
        duration_years =request.duration_years,
        risk_tolerance =request.risk_tolerance,
        top_n          =request.top_n
    )

    if result_df.empty:
        raise HTTPException(
            404,
            f"Koi fund nahi mila — "
            f"risk: {request.risk_tolerance}, "
            f"duration: {request.duration_years} yr, "
            f"amount: ₹{request.amount}"
        )

    funds = [
        FundRecommendation(
            scheme_name     = row['scheme_name'],
            category        = str(row['category']),
            sub_category    = str(row['sub_category']),
            risk_level      = int(row['risk_level'] or 0),
            ai_quality_tag  = str(row['ai_quality_tag']),
            predicted_return= float(row['predicted_return']),
            latest_1yr_return= float(row['returns_1yr'] or 0),
            fund_size_cr    = float(row['fund_size_cr'] or 0)
        )
        for _, row in result_df.iterrows()
    ]

    # smart message generate karo
    message = (
        f"₹{request.amount} {request.investment_mode} ke liye "
        f"{request.duration_years} saal mein "
        f"{request.risk_tolerance} risk ke saath "
        f"top {len(funds)} funds"
    )

    return InvestmentResponse(
        status           ="success",
        message          =message,
        recommended_funds=funds
    )