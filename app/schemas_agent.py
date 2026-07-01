from pydantic import BaseModel, Field
from typing import List


# ---------- ANALYST ----------

class AnalystRequest(BaseModel):
    context: dict              # Any JSON data to analyze (plan, fund, anything)
    instructions: str = ""     # Optional: user can guide what kind of analysis they want


class AnalystResponse(BaseModel):
    status: str
    analysis: str              # Markdown-formatted deep analysis from the LLM


# ---------- RESEARCHER ----------

class ResearcherRequest(BaseModel):
    query: str = Field(..., min_length=3, description="User's question")


class ResearcherResponse(BaseModel):
    status: str
    answer: str                # LLM's text answer
    sources: List[dict]        # Raw matched records from DB, whatever shape they are
