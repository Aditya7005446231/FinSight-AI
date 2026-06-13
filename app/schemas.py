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

# --- 5. INVESTMENT PLAN SCHEMAS ---
class InvestmentPlanRequest(BaseModel):
    age: int = Field(default=30, ge=18, le=100, description="Age of the investor")
    financial_goal: str = Field(default="Wealth Creation", description="Financial goal (e.g. Retirement, Wealth Creation)")
    investment_mode: Literal["SIP", "Lumpsum"] = "SIP"
    amount: float = Field(default=5000, ge=500, description="Monthly SIP amount or one-time Lumpsum budget")
    duration_years: int = Field(default=5, ge=1, le=15, description="Investment duration in years")
    risk_profile: Literal["Conservative", "Balanced", "Growth", "Aggressive"] = "Balanced"

    model_config = {
        "json_schema_extra": {
            "example": {
                "age": 30,
                "financial_goal": "Retirement",
                "investment_mode": "SIP",
                "amount": 5000,
                "duration_years": 7,
                "risk_profile": "Growth"
            }
        }
    }

class AssetAllocation(BaseModel):
    category: str
    percentage: float
    allocated_amount: float

class AllocatedFund(BaseModel):
    scheme_name: str
    category: str
    sub_category: str
    allocation_percentage: float
    allocated_amount: float
    predicted_return: float
    ai_quality_tag: str
    latest_1yr_return: float
    fund_size_cr: float

class InvestmentPlanResponse(BaseModel):
    status: str
    risk_profile: str
    investment_mode: str
    total_amount: float
    duration_years: int
    projected_value: float
    projected_gain: float
    asset_allocation: List[AssetAllocation]
    fund_distribution: List[AllocatedFund]
    summary_message: str