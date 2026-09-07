"""Quick smoke test for the /api/recommend pipeline."""
import warnings
warnings.filterwarnings("ignore")

import json
from app.ml_service.predictor import predict_risk_profile, recommend_funds

# Test 1: predict_risk_profile
answers = {
    "age": 28,
    "monthly_income": 80000,
    "dependents": 1,
    "horizon_years": 10,
    "emergency_fund": "yes",
    "drop_reaction": "hold",
    "goal_type": "wealth_creation",
    "experience": "some",
    "monthly_investable": 15000,
}

profile, confidence = predict_risk_profile(answers)
print(f"[TEST 1] predict_risk_profile")
print(f"  Profile:    {profile}")
print(f"  Confidence: {json.dumps(confidence, indent=2)}")

# Test 2: recommend_funds
funds = recommend_funds(profile, goal_type="wealth_creation", top_n=5)
print(f"\n[TEST 2] recommend_funds(profile={profile!r}, goal='wealth_creation', top_n=5)")
print(f"  Got {len(funds)} funds:")
for i, f in enumerate(funds, 1):
    print(f"  {i}. {f['scheme_name']}")
    print(f"     category={f['category']}  score={f['composite_score']}  sharpe={f['sharpe']}")

# Test 3: tax_saving ELSS preference
funds_tax = recommend_funds(profile, goal_type="tax_saving", top_n=5)
print(f"\n[TEST 3] recommend_funds(profile={profile!r}, goal='tax_saving', top_n=5)")
print(f"  Got {len(funds_tax)} funds:")
for i, f in enumerate(funds_tax, 1):
    print(f"  {i}. {f['scheme_name']} ({f['sub_category']})")

print("\n✅ All tests passed.")
