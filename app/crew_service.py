import os
import json
import httpx
from dotenv import load_dotenv
from groq import Groq

load_dotenv()


class CrewService:
    """
    Custom multi-agent system (no CrewAI needed).
    Two agents cooperate in sequence:
      1. Researcher — searches Google via Serper API
      2. Analyst — reads research and writes investment report

    Same workflow as CrewAI, built with just Groq + httpx.
    """

    def __init__(self):
        groq_key = os.getenv("Groq_API_key")
        serper_key = os.getenv("SERPER_API_KEY")

        if not groq_key:
            raise ValueError("Groq_API_key not found in .env")

        self.client = Groq(api_key=groq_key)
        self.serper_key = serper_key
        self.model = "llama3-8b-8192"

    # ── TOOL: Serper Google Search ────────────────────────────

    def _search_google(self, query: str) -> str:
        """
        Calls Serper API to search Google.
        Returns formatted search results as text.
        """
        if not self.serper_key:
            return "Serper API key not configured. No live data available."

        response = httpx.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": self.serper_key},
            json={"q": query, "num": 8}
        )
        data = response.json()

        results = []

        # Organic search results
        for item in data.get("organic", []):
            results.append(
                f"- **{item.get('title', '')}**\n"
                f"  {item.get('snippet', '')}\n"
                f"  Source: {item.get('link', '')}"
            )

        # Knowledge graph (if available)
        kg = data.get("knowledgeGraph", {})
        if kg:
            results.append(
                f"\n**Knowledge Panel: {kg.get('title', '')}**\n"
                f"  {kg.get('description', '')}"
            )

        return "\n\n".join(results) if results else "No search results found."

    # ── AGENT 1: Researcher ───────────────────────────────────

    def _run_researcher(self, topic: str) -> str:
        """
        Agent 1: Searches Google, then asks LLM to organize findings.
        """
        # Step 1: Search Google via Serper
        search_results = self._search_google(f"{topic} latest financial data 2026")

        # Step 2: Ask LLM to synthesize the raw search results
        system_prompt = (
            "You are a Senior Financial Researcher. You have just searched "
            "Google and received the search results below. Your job is to:\n"
            "1. Extract all relevant financial data (prices, returns, metrics)\n"
            "2. Identify key news and recent developments\n"
            "3. Note any risks or concerns mentioned\n"
            "4. Organize everything into a clear research brief\n\n"
            "Be factual. Only report what the search results say. "
            "Cite sources where possible."
        )

        user_message = (
            f"**Research Topic:** {topic}\n\n"
            f"**Google Search Results:**\n{search_results}"
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        return response.choices[0].message.content

    # ── AGENT 2: Analyst ──────────────────────────────────────

    def _run_analyst(self, topic: str, research_brief: str) -> str:
        """
        Agent 2: Reads the researcher's brief, writes a professional report.
        """
        system_prompt = (
            "You are a CFA-certified Senior Financial Analyst. "
            "A researcher has prepared a brief for you. Your job is to write "
            "a professional investment analysis report with:\n"
            "1. **Executive Summary** — Key takeaways in 2-3 sentences\n"
            "2. **Performance Overview** — Recent returns and price action\n"
            "3. **Fundamental Analysis** — Key metrics and what they indicate\n"
            "4. **Risk Assessment** — Major risks and concerns\n"
            "5. **Market Sentiment** — News and analyst opinions\n"
            "6. **Recommendation** — Buy/Hold/Sell with reasoning\n\n"
            "Format in clean Markdown. Be data-driven and specific."
        )

        user_message = (
            f"**Topic:** {topic}\n\n"
            f"**Research Brief from our Researcher:**\n\n{research_brief}"
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.6,
            max_tokens=2000
        )
        return response.choices[0].message.content

    # ── CREW: Sequential Pipeline ─────────────────────────────

    def run_crew(self, topic: str) -> str:
        """
        Runs the full multi-agent pipeline:
          Researcher (search + synthesize) → Analyst (write report)
        """
        # Agent 1 does research
        research_brief = self._run_researcher(topic)

        # Agent 2 analyzes the research
        report = self._run_analyst(topic, research_brief)

        return report


# Singleton
crew_service = CrewService()
