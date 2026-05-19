from pydantic import BaseModel, Field
from typing import List, Literal

# --- 1. USER INPUT PREFERENCES ---
class InvestmentRequest(BaseModel):
    investment_mode: Literal["SIP", "Lumpsum"] = "SIP"
    amount: float = Field(default=1000, ge=100, description="Invest amount")
    duration_years: int = Field(default=3, ge=1, le=10, description="Time horizon in years")
    risk_tolerance: Literal["Low", "Moderate", "High", "Very High"] = "Moderate"
    top_n: int = Field(default=5, ge=1, le=10)

    model_config = {
        "json_schema_extra":{
            "example":{
                "investment_mode": "SIP",
                "amount": 2500,
                "duration_years": 3,
                "risk_tolerance": "Moderate",
                "top_n": 5
            }
        }
    }

# --- 2. SINGLE FUND RESULT FORMAT ---
class FundRecommendation(BaseModel):
    scheme_name: str
    category: str
    sub_category: str
    risk_level: int
    ai_quality_tag: str          # Model dvara predicted (e.g. Good, Average)
    predicted_return: float      # Model dvara predicted %
    latest_1yr_return: float
    fund_size_cr: float

# --- 3. FINAL RESPONSE FORMAT ---
class InvestmentResponse(BaseModel):
    status: str
    message: str
    recommended_funds: List[FundRecommendation]

# --- 4. SERVER HEALTH ---
class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    dataset_size: int