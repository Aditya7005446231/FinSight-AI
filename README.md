# FinSight AI 📈

FinSight AI is a personalized, AI-driven mutual fund investment advisor and portfolio planner. It uses machine learning models (Random Forest estimators) to predict mutual fund returns and quality metrics, combines them with dynamic asset allocation algorithms, and outputs custom-tailored investment plans based on user profiles.

---

## 🌟 Key Features

* **AI-Powered Recommendations:** Evaluates mutual funds using pre-trained regression models to predict annualized 3-year returns and classifiers to assign quality ratings (`Good`, `Average`, etc.).
* **Dynamic Asset Allocation:** Maps risk appetites (`Conservative`, `Balanced`, `Growth`, `Aggressive`) into optimal Equity/Debt/Hybrid splits.
* **Volatility Protection Overrides:**
  * **Short Horizon (1-2 years):** Overrides allocations to 80% Debt and 20% Hybrid to protect capital against market fluctuations.
  * **Medium Horizon (3-4 years):** Caps high-risk Equity exposure to a maximum of 40%.
* **Wealth Projections:** Implements compound growth formulas for **Lumpsum** (single deposits) and **SIP** (monthly compounding recurring investments).
* **Modern Dashboard Interface:** Built with React, Vite, and Tailwind CSS v4, providing sliders, input forms, and dynamic asset class visualization.

---

## 🛠️ Technology Stack

### Backend
* **FastAPI** — High-performance, asynchronous web framework.
* **Uvicorn** — Ultra-fast ASGI server.
* **Pydantic** — Strict type-hinting and data validation.
* **Scikit-Learn & Joblib** — Machine learning pipeline and model loading.
* **Pandas & NumPy** — Numerical operations and dataset processing.

### Frontend
* **React** — Component-driven client UI.
* **Vite** — Fast, modern frontend build tool.
* **Tailwind CSS v4** — High-performance utility-first styling with native Vite integration.
* **Lucide Icons** — Lightweight icon library.

---

## 📁 Project Structure

```
FinSight-AI/
├── app/
│   ├── main.py              # FastAPI application root & middleware setup
│   ├── ml_service.py        # Core advisor logic, ML inference & financial math
│   ├── schemas.py           # Pydantic request/response payload schemas
│   └── routers/
│       ├── recommend.py     # Endpoint for matching individual funds (/funds)
│       └── plan.py          # Endpoint for generating full portfolios (/plan)
├── data/
│   └── fastapi_funds_dataset.csv  # Mutual funds database
├── models/
│   ├── returns_3yr_predictor.joblib  # Return prediction regressor
│   ├── fund_classifier.joblib        # Quality rating classifier
│   └── fund_label_encoder.joblib     # Label encoder classes
├── frontend/                # Vite + React single-page application
│   ├── src/
│   │   ├── App.jsx          # Dashboard layout & request connections
│   │   ├── index.css        # Tailwind v4 styles entry
│   │   └── main.jsx
│   └── vite.config.js       # Vite configuration with @tailwindcss/vite
├── backend_info.txt         # Explanations of core calculations and structures
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### 1. Run the Backend Server
Make sure you have Python installed, then run the following commands in the root directory:

```bash
# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --reload
```
The API documentation will be interactive and available at: **`http://127.0.0.1:8000/docs`**

### 2. Run the React Frontend
Open a separate terminal window, navigate to the `frontend` directory, and run:

```bash
# Navigate to frontend folder
cd frontend

# Install package dependencies
npm install

# Start the local development server
npm run dev
```
Open **`http://localhost:5173`** in your browser to interact with the dashboard.

---

## 🔌 API Documentation

### `POST /plan`
Generates a complete investment distribution and future wealth projections.

* **Request Body:**
```json
{
  "age": 30,
  "financial_goal": "Retirement",
  "investment_mode": "SIP",
  "amount": 5000,
  "duration_years": 7,
  "risk_profile": "Growth"
}
```

* **Response Body:**
```json
{
  "status": "success",
  "risk_profile": "Growth",
  "investment_mode": "SIP",
  "total_amount": 5000,
  "duration_years": 7,
  "projected_value": 3844850.93,
  "projected_gain": 3424850.93,
  "asset_allocation": [
    { "category": "Debt", "percentage": 10, "allocated_amount": 500 },
    { "category": "Hybrid", "percentage": 20, "allocated_amount": 1000 },
    { "category": "Equity", "percentage": 70, "allocated_amount": 3500 }
  ],
  "fund_distribution": [
    {
      "scheme_name": "Quant Small Cap Fund",
      "category": "Equity",
      "sub_category": "Small Cap Mutual Funds",
      "allocation_percentage": 35,
      "allocated_amount": 1750,
      "predicted_return": 59.6,
      "ai_quality_tag": "Good",
      "latest_1yr_return": 5.4,
      "fund_size_cr": 3301
    }
    // ...other recommended funds
  ],
  "summary_message": "Based on your profile (Age 30, Risk: Growth)... Expected portfolio return is 50.6%..."
}
```
