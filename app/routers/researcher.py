from fastapi import APIRouter, HTTPException
from app.schemas_agent import ResearcherRequest, ResearcherResponse
from app.agent_service import agent_service
from app.ml_service import model_store

router = APIRouter()


@router.post("/researcher", response_model=ResearcherResponse)
def research_query(request: ResearcherRequest):
    try:
        matched_df = model_store.search_funds(request.query, top_n=10)

        if matched_df.empty:
            db_context = "No matching records found in the database."
            sources = []
        else:
            lines = []
            sources = []

            for _, row in matched_df.iterrows():
                lines.append(
                    f"- {row['scheme_name']} | Category: {row['category']} | "
                    f"Sub: {row['sub_category']} | AUM: ₹{row['fund_size_cr']} Cr | "
                    f"1Y Return: {row['returns_1yr']}% | Sharpe: {row['sharpe']}"
                )
                sources.append(row.to_dict())

            db_context = "\n".join(lines)

        answer = agent_service.research(request.query, db_context)

        return ResearcherResponse(
            status="success",
            answer=answer,
            sources=sources
        )

    except Exception as e:
        raise HTTPException(500, f"Research query failed: {str(e)}")
