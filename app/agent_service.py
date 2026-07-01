import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

class AgentService:
    """
    Wraps the Groq LLM client.
    Two capabilities:
      1. Analyze any context data (analyst)
      2. Answer questions with database context (researcher)
    """

    def __init__(self):
        api_key = os.getenv("Groq_API_key")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found. Set it in your .env file.")

        self.client = Groq(api_key=api_key)
        self.model = "llama3-8b-8192"


    def analyze(self, context: dict, instructions: str = "") -> str:
        """
        Takes any context dict and optional instructions,
        asks the LLM to produce a professional analysis report.
        """

        system_prompt = (
             "You are FinSight AI Analyst — a senior financial portfolio analyst. "
            "You receive JSON data and must produce a detailed, professional "
            "Markdown report covering:\n"
            "1. **Overview** — Summarize the key data points.\n"
            "2. **Strengths** — What looks good in this data.\n"
            "3. **Risk Assessment** — Highlight any concerns or red flags.\n"
            "4. **Recommendations** — Suggest 2-3 actionable improvements.\n\n"
            "Use professional language. Format with Markdown headers, "
            "bullet points, and bold key metrics. Keep it under 800 words."
        )
        user_message = ""
        if instructions:
            user_message += f"**Special Instructions:** {instructions}\n\n"
        user_message += f"Analyze this data:\n\n```json\n{json.dumps(context,indent=2)}\n```"

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role":"system","content": system_prompt},
                {"role":"user","content":user_message}
            ],
            temperature=0.6,
            max_tokens=1500
        )
        return response.choices[0].message.content


    def research(self, query: str, context: str) -> str:

        system_prompt = (
             "You are FinSight AI Research Assistant — a knowledgeable financial advisor. "
            "You answer user questions using ONLY the data provided below. "
            "If the data doesn't contain enough information, say so honestly.\n\n"
            "Rules:\n"
            "- Always reference specific names and numbers from the data.\n"
            "- Use simple, clear language with Markdown formatting.\n"
            "- Never make up names or statistics that aren't in the data.\n"
            "- If no matching data is found, suggest the user try different search terms.\n"
            "- Keep responses concise (under 400 words)."
        )
        user_message = (
            f"**Usetr Question:** {query}\n\n"
            f"**Data from our Database:**\n{context}"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.4,
            max_tokens=800
        )
        return response.choices[0].message.content
# Create a singleton instance (same pattern as model_store)
agent_service = AgentService()

