from fastapi import APIRouter, HTTPException, Query
from app.schemas_agent import MarketReportRequest, MarketReportResponse
from app.crew_service import crew_service
import yfinance as yf
import httpx

router = APIRouter()


async def resolve_ticker(query: str) -> str:
    """
    Resolves a human-readable stock name (e.g. 'Reliance', 'Tesla')
    to an exact Yahoo Finance ticker symbol (e.g. 'RELIANCE.NS', 'TSLA').
    Falls back to the raw query if resolution fails.
    """
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=5&newsCount=0"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            data = resp.json()
            quotes = data.get("quotes", [])
            if quotes:
                # Prefer equity type results
                for q in quotes:
                    if q.get("quoteType") == "EQUITY":
                        return q["symbol"]
                return quotes[0]["symbol"]
    except Exception:
        pass
    return query


@router.get("/stock-data")
async def get_stock_data(symbol: str = Query(..., min_length=1, description="Stock name or ticker")):
    """
    Fetches real-time stock info + 6-month historical prices from Yahoo Finance.
    Accepts both ticker symbols (TSLA) and company names (Tesla).
    """
    try:
        # 1. Resolve the query to a ticker
        ticker_symbol = await resolve_ticker(symbol)

        # 2. Get stock info and history
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info

        if not info or not info.get("longName"):
            raise HTTPException(404, f"Could not find stock data for '{symbol}'")

        # 3. Key metrics
        current_price = info.get("currentPrice") or info.get("regularMarketPrice") or 0
        previous_close = info.get("regularMarketPreviousClose") or info.get("previousClose") or 0
        price_change = round(current_price - previous_close, 2) if current_price and previous_close else 0
        price_change_pct = round((price_change / previous_close) * 100, 2) if previous_close else 0

        metrics = {
            "name": info.get("longName", ticker_symbol),
            "symbol": ticker_symbol,
            "currency": info.get("currency", "INR"),
            "currentPrice": current_price,
            "priceChange": price_change,
            "priceChangePct": price_change_pct,
            "marketCap": info.get("marketCap"),
            "trailingPE": info.get("trailingPE"),
            "dividendYield": info.get("dividendYield"),
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        }

        # 4. Historical prices (6 months of daily close)
        hist = ticker.history(period="6mo")
        history = []
        if not hist.empty:
            for date, row in hist.iterrows():
                history.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "price": round(float(row["Close"]), 2)
                })

        return {
            "status": "success",
            "metrics": metrics,
            "history": history,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch stock data: {str(e)}")


@router.post("/market-report", response_model=MarketReportResponse)
def generate_market_report(request: MarketReportRequest):
    """
    Multi-agent pipeline:
    Researcher (Serper search) -> Analyst (writes report)
    """
    try:
        report = crew_service.run_crew(request.topic)

        return MarketReportResponse(
            status="success",
            report=report
        )

    except Exception as e:
        raise HTTPException(500, f"Market report failed: {str(e)}")
