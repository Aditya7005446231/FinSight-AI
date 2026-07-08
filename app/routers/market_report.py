from fastapi import APIRouter, HTTPException
from app.schemas_agent import MarketReportRequest, MarketReportResponse
from app.crew_service import crew_service

router = APIRouter()


@router.post("/market-report", response_model=MarketReportResponse)
def generate_market_report(request: MarketReportRequest):
    """
    Multi-agent pipeline:
    Researcher (Serper search) → Analyst (writes report)
    """
    try:
        report = crew_service.run_crew(request.topic)

        return MarketReportResponse(
            status="success",
            report=report
        )

    except Exception as e:
        raise HTTPException(500, f"Market report failed: {str(e)}")
