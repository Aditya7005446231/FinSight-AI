"""Smoke test for lookup_fund_performance and the chart endpoint logic."""
import warnings
warnings.filterwarnings("ignore")

from app.ml_service.predictor import lookup_fund_performance

# Test 1: All found
print("=== TEST 1: All names exist ===")
r1 = lookup_fund_performance([
    "Canara Robeco Small Cap Fund",
    "Tata Small Cap Fund",
])
print(f"  found:     {len(r1['found'])} funds")
for f in r1["found"]:
    print(f"    {f['scheme_name']:45s}  1yr={f['returns_1yr']}  3yr={f['returns_3yr']}  5yr={f['returns_5yr']}")
print(f"  not_found: {r1['not_found']}")

# Test 2: Mix of found + not found (partial result)
print("\n=== TEST 2: Partial match ===")
r2 = lookup_fund_performance([
    "Canara Robeco Small Cap Fund",
    "DOES NOT EXIST Fund",
    "Quant Small Cap Fund",
])
print(f"  found:     {len(r2['found'])} funds")
for f in r2["found"]:
    print(f"    {f['scheme_name']}")
print(f"  not_found: {r2['not_found']}")
assert len(r2["found"]) == 2
assert r2["not_found"] == ["DOES NOT EXIST Fund"]

# Test 3: None found (would trigger 404)
print("\n=== TEST 3: Zero match ===")
r3 = lookup_fund_performance(["Fake Fund A", "Fake Fund B"])
print(f"  found:     {len(r3['found'])} funds")
print(f"  not_found: {r3['not_found']}")
assert len(r3["found"]) == 0

print("\nAll tests passed.")
