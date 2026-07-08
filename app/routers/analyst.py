from fastapi import APIRouter, HTTPException
from app.schemas_agent import AnalystRequest, AnalystResponse
from app.agent_service import agent_service

router = APIRouter()

@router.post("/analyst",response_model=AnalystResponse)
def analyze_data(request: AnalystRequest):
    try:
        analysis_text = agent_service.analyze(
            context=request.context,
            instructions=request.instructions
        )

        return AnalystResponse(
            status="success",
            analysis=analysis_text
        )
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")