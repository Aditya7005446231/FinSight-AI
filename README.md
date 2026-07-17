# FinSight AI

An AI-powered investment advisor that helps users plan mutual fund portfolios. Built this as a full-stack project to explore how machine learning + LLMs can be combined to solve real financial planning problems.

**Live Demo:** [finsight-ai.vercel.app](https://finsight-ai.vercel.app) (frontend)

## What it does

- Takes your age, risk appetite, investment amount, and duration as input
- Uses trained ML models (Random Forest) to predict fund returns and rate fund quality
- Generates a complete portfolio with asset allocation (Equity/Debt/Hybrid split)
- Projects future wealth using SIP and Lumpsum compound growth formulas
- Has a **Market Research** section where two AI agents crawl the web and write investment reports on any stock/topic
- Fetches **live stock data** (price, charts, P/E, market cap) from Yahoo Finance API

## Screenshots

> _Add your own screenshots here_

## Tech Stack

**Backend:** FastAPI, Python, Scikit-learn, Groq (Llama 3.1), yfinance, Pandas

**Frontend:** React, Vite, Tailwind CSS v4, Recharts, Lucide Icons

**Deployment:** Vercel (frontend), Render (backend)

## Project Structure

```
FinSight-AI/
├── app/
│   ├── main.py                # FastAPI app setup + CORS
│   ├── ml_service.py          # ML inference, asset allocation, fund matching
│   ├── agent_service.py       # LLM analyst (Groq API)
│   ├── crew_service.py        # Multi-agent pipeline (researcher + analyst)
│   ├── schemas.py             # Pydantic models for plan/recommend
│   ├── schemas_agent.py       # Pydantic models for agents
│   └── routers/
│       ├── plan.py            # POST /plan - generate portfolio
│       ├── recommend.py       # POST /funds - match funds
│       ├── analyst.py         # POST /analyst - AI analysis
│       ├── researcher.py      # POST /researcher - Q&A
│       └── market_report.py   # POST /market-report + GET /stock-data
├── data/
│   └── fastapi_funds_dataset.csv
├── models/
│   ├── returns_3yr_predictor.joblib
│   ├── fund_classifier.joblib
│   └── fund_label_encoder.joblib
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── vite.config.js
├── requirements.txt
└── vercel.json
```

## How to run locally

You need Python and Node.js installed.

### Backend

```bash
# install dependencies
pip install -r requirements.txt

# create a .env file with your API keys
# GROQ_API_KEY=your_key
# SERPER_API_KEY=your_key

# start the server
python -m uvicorn app.main:app --reload
```

Server runs at `http://127.0.0.1:8000`. API docs at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/plan` | Generate full investment portfolio |
| POST | `/funds` | Get fund recommendations |
| POST | `/analyst` | AI-powered analysis of any data |
| POST | `/researcher` | Ask financial questions |
| POST | `/market-report` | Multi-agent market research report |
| GET | `/stock-data?symbol=` | Live stock price + chart data from Yahoo Finance |

### Example - Generate a plan

```json
POST /plan
{
  "age": 25,
  "financial_goal": "Wealth Creation",
  "investment_mode": "SIP",
  "amount": 5000,
  "duration_years": 5,
  "risk_profile": "Growth"
}
```

Returns asset allocation, fund recommendations with predicted returns, and projected portfolio value.

## How the ML model works

- Trained a Random Forest regressor on mutual fund data to predict 3-year annualized returns
- Trained a classifier to tag funds as "Good", "Average", etc.
- Asset allocation is based on risk profile with safety overrides for short durations (1-2 years caps equity exposure)
- SIP projections use monthly compounding formula, Lumpsum uses standard compound interest

## How the AI agents work

The market research feature uses two agents running sequentially:

1. **Researcher Agent** - Searches Google using Serper API, collects recent news and financial data
2. **Analyst Agent** - Takes the research output and writes a structured investment report using Llama 3.1 (via Groq)

The stock data endpoint separately pulls live prices and 6-month history from Yahoo Finance (no API key needed).

## Environment Variables

```
GROQ_API_KEY=       # for LLM inference (free tier works)
SERPER_API_KEY=     # for Google search in market research
```

## Future Improvements

- User authentication and saved portfolios
- Database integration (PostgreSQL)
- Portfolio backtesting with historical data
- Stock vs Index comparison
- Real-time sector heatmap

---

Built by **Aditya Rai**
