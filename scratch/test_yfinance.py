import yfinance as yf
import json

def test():
    symbol = "RELIANCE.NS"
    print(f"Fetching data for {symbol}...")
    ticker = yf.Ticker(symbol)
    
    # 1. Info (price, market cap, name, etc.)
    # In newer yfinance versions, ticker.info can sometimes be empty or fail if Yahoo block rate limits.
    # But usually, it returns a dict.
    try:
        info = ticker.info
        print("Keys in info:", list(info.keys())[:10] if info else "Empty")
        print("Long name:", info.get("longName"))
        print("Current Price:", info.get("currentPrice") or info.get("regularMarketPrice"))
    except Exception as e:
        print("Failed to fetch info:", e)
        
    # 2. History (daily close prices for 1mo or 6mo)
    print("\nFetching history...")
    hist = ticker.history(period="1mo")
    print("History shape:", hist.shape)
    if not hist.empty:
        print("Columns:", list(hist.columns))
        print("First row close:", hist['Close'].iloc[0])
        print("Last row close:", hist['Close'].iloc[-1])

if __name__ == "__main__":
    test()
