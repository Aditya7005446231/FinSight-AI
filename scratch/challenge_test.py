import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from app.ml_service import model_store

def run_challenge():
    print("====================================================")
    print("*** FINSIGHT AI - ENGINE LOGIC CHALLENGE TEST ***")
    print("====================================================\n")

    # 1. Check if models are loaded
    print(f"[STATUS] Loaded models and dataset: {model_store._loaded}")
    print(f"[STATUS] Total funds in database: {len(model_store.dataset)}\n")

    # SCENARIO 1: Aggressive Investor, 10-Year Horizon
    # Logic: Should allocate 90% to Equity, 10% to Hybrid, 0% to Debt.
    print("----------------------------------------------------")
    print("SCENARIO 1: Aggressive, High-Risk Profile (10 Years)")
    print("Expectation: High Equity exposure (90%), higher predicted returns.")
    print("----------------------------------------------------")
    plan1 = model_store.generate_investment_plan(
        age=30,
        financial_goal="Wealth Creation",
        investment_mode="SIP",
        amount=10000,
        duration_years=10,
        risk_profile="Aggressive"
    )
    for asset in plan1["asset_allocation"]:
        print(f"- {asset['category']}: {asset['percentage']}% (Rs.{asset['allocated_amount']})")
    
    print("\nSelected Funds & ML Predictions:")
    for fund in plan1["fund_distribution"]:
        print(f"  * {fund['scheme_name']} ({fund['category']})")
        print(f"    - ML Predicted Return: +{fund['predicted_return']}%")
        print(f"    - ML Quality Tag: {fund['ai_quality_tag']}")

    # SCENARIO 2: Aggressive Investor, 1-Year Horizon (SAFETY OVERRIDE CHALLENGE)
    # Logic: Even though risk is "Aggressive", the duration is short (1 year).
    # To protect capital, the system must override the allocation to 80% Debt, 20% Hybrid, 0% Equity.
    print("\n----------------------------------------------------")
    print("SCENARIO 2: Aggressive Profile but Short Term (1 Year)")
    print("Expectation: Safety Override triggers. 0% Equity, 80% Debt to protect capital.")
    print("----------------------------------------------------")
    plan2 = model_store.generate_investment_plan(
        age=30,
        financial_goal="Wealth Creation",
        investment_mode="SIP",
        amount=10000,
        duration_years=1,
        risk_profile="Aggressive"
    )
    for asset in plan2["asset_allocation"]:
        print(f"- {asset['category']}: {asset['percentage']}% (Rs.{asset['allocated_amount']})")
    
    print("\nSelected Funds & ML Predictions:")
    for fund in plan2["fund_distribution"]:
        print(f"  * {fund['scheme_name']} ({fund['category']})")
        print(f"    - ML Predicted Return: +{fund['predicted_return']}%")
        print(f"    - ML Quality Tag: {fund['ai_quality_tag']}")

    # SCENARIO 3: Low Budget SIP (Rs.1,000)
    # Logic: Splitting Rs.1,000 into 2 funds of Rs.500. Are we violating minimum investments?
    print("\n----------------------------------------------------")
    print("SCENARIO 3: Low Budget (Rs.1,000 SIP)")
    print("Expectation: Splits correctly without violating fund minimum SIP rules.")
    print("----------------------------------------------------")
    plan3 = model_store.generate_investment_plan(
        age=30,
        financial_goal="Wealth Creation",
        investment_mode="SIP",
        amount=1000,
        duration_years=5,
        risk_profile="Balanced"
    )
    for fund in plan3["fund_distribution"]:
        print(f"  * {fund['scheme_name']} (Allocation: {fund['allocation_percentage']}% = Rs.{fund['allocated_amount']})")

if __name__ == "__main__":
    run_challenge()
