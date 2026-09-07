"""
POST /api/recommend — risk-profiling + fund recommendation endpoint.
GET /api/funds/performance-chart — return performance metrics for recommended funds.
"""

import json
import logging
from typing import Literal
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field, ValidationError

from app.services import (
    predict_risk_profile,
    recommend_funds,
    lookup_fund_performance,
)

logger = logging.getLogger("finsight.risk_recommend")

router = APIRouter()


# ── Request schema ───────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    age: int = Field(
        ..., ge=18, le=100,
        description="Investor age in years"
    )
    monthly_income: float = Field(
        ..., gt=0,
        description="Gross monthly income"
    )
    dependents: int = Field(
        ..., ge=0,
        description="Number of financial dependents"
    )
    horizon_years: int = Field(
        ..., ge=1, le=30,
        description="Investment time horizon in years"
    )
    emergency_fund: Literal["yes", "no"] = Field(
        ..., description="Does the investor have an emergency fund?"
    )
    drop_reaction: Literal["sell", "hold", "buy_more"] = Field(
        ..., description="Reaction when portfolio drops 20%"
    )
    goal_type: Literal[
        "child_education", "retirement", "short_term",
        "tax_saving", "wealth_creation"
    ] = Field(
        ..., description="Primary financial goal"
    )
    experience: Literal["none", "some", "experienced"] = Field(
        ..., description="Investment experience level"
    )
    monthly_investable: float = Field(
        ..., gt=0,
        description="Amount available to invest each month"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "age": 28,
                "monthly_income": 80000,
                "dependents": 1,
                "horizon_years": 10,
                "emergency_fund": "yes",
                "drop_reaction": "hold",
                "goal_type": "wealth_creation",
                "experience": "some",
                "monthly_investable": 15000,
            }
        }
    }


# ── Endpoint: Recommendation ─────────────────────────────────────────

@router.post("/api/recommend")
async def recommend_endpoint(request: Request):
    """
    Risk-profile a user from questionnaire answers, then return the
    top-5 mutual fund recommendations for that profile.

    Error Responses:
    - 400 Bad Request: Malformed JSON or invalid schema values.
    - 500 Internal Server Error: ML service uninitialized or internal server error.
    """

    # 1. Parse JSON body  →  400 on invalid syntax
    try:
        body = await request.json()
    except (json.JSONDecodeError, Exception) as parse_err:
        logger.info("Malformed JSON request body received: %s", parse_err)
        raise HTTPException(
            status_code=400,
            detail="Request body must be valid JSON format."
        )

    # 2. Validate against Pydantic schema  →  400 on validation failure
    try:
        data = RecommendRequest(**body)
    except ValidationError as val_err:
        errors = []
        for err in val_err.errors():
            loc = " → ".join(str(l) for l in err["loc"])
            errors.append(f"{loc}: {err['msg']}")

        logger.info("Validation failed for /api/recommend: %s", errors)
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed. Check input fields.",
                "errors": errors,
            },
        )
    except Exception as exc:
        logger.info("Unexpected schema construction error: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="Validation failed. Please check your request parameters."
        )

    # 3. Run ML prediction & fund recommendations
    answers = data.model_dump()
    try:
        profile, confidence = predict_risk_profile(answers)
        funds = recommend_funds(
            risk_profile=profile,
            goal_type=answers["goal_type"],
            top_n=5,
        )
    except RuntimeError as service_err:
        # ML Model uninitialized / missing model file
        logger.error("[/api/recommend] ML Service unavailable: %s", service_err, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="ML Recommendation service is currently unavailable. Please try again later."
        )
    except Exception as exc:
        # Unexpected internal runtime error
        logger.exception("[/api/recommend] Internal error during inference: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating fund recommendations."
        )

    return {
        "risk_profile": profile,
        "confidence": confidence,
        "recommended_funds": funds,
    }


# ── Endpoint: Performance Chart ───────────────────────────────────────

@router.get("/api/funds/performance-chart")
def performance_chart(
    scheme_names: str = Query(
        ...,
        min_length=1,
        description=(
            "Comma-separated list of scheme names "
            "(as returned by /api/recommend)"
        ),
    ),
):
    """
    Return returns_1yr / returns_3yr / returns_5yr for each requested
    scheme, shaped for a grouped bar chart.

    - **200 OK** — at least one scheme found.
    - **400 Bad Request** — empty or whitespace-only query string.
    - **404 Not Found** — none of the requested schemes exist in dataset.
    - **500 Internal Server Error** — service uninitialized or dataset error.
    """

    # 1. Parse + deduplicate, strip whitespace
    names = [n.strip() for n in scheme_names.split(",") if n.strip()]

    if not names:
        logger.info("Empty scheme_names parameter received in chart query")
        raise HTTPException(
            status_code=400,
            detail="Query parameter 'scheme_names' must contain at least one valid non-empty scheme name.",
        )

    # 2. Look up in data layer
    try:
        result = lookup_fund_performance(names)
    except RuntimeError as service_err:
        logger.error("[/api/funds/performance-chart] Service unavailable: %s", service_err, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Performance chart service is currently unavailable."
        )
    except Exception as exc:
        logger.exception("[/api/funds/performance-chart] Internal lookup error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching performance chart data."
        )

    # 3. If nothing was found at all  →  404
    if not result["found"]:
        logger.warning(
            "[/api/funds/performance-chart] No matching funds found for query: %s",
            names
        )
        raise HTTPException(
            status_code=404,
            detail={
                "message": "None of the requested fund schemes were found in the dataset.",
                "not_found": result["not_found"],
            },
        )

    # Log partial lookup warnings if applicable
    if result["not_found"]:
        logger.warning(
            "[/api/funds/performance-chart] Partial match result. Found %d, Missing %d: %s",
            len(result["found"]),
            len(result["not_found"]),
            result["not_found"],
        )

    # 4. Return chart-ready payload
    return {
        "chart_data": result["found"],
        "not_found": result["not_found"],
    }
