import { useState } from 'react';
import { TrendingUp, Wallet, Calendar, Award, AlertCircle, Loader2, Coins, Briefcase, ShieldCheck } from 'lucide-react';

function App() {
  // 1. STATE MANAGEMENT: Store form inputs
  const [formData, setFormData] = useState({
    age: 30,
    financial_goal: 'Wealth Creation',
    investment_mode: 'SIP',
    amount: 5000,
    duration_years: 5,
    risk_profile: 'Balanced',
  });

  // Store backend response data
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. CONNECT TO BACKEND: Fetch plan on submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Server returned an error. Please try again.');
      }

      const data = await response.json();
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
            FinSight AI
          </h1>
          <p className="text-slate-400 mt-2">Personalized AI Mutual Fund Advisor & Portfolio Planner</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">

          {/* LEFT COLUMN: Input Form (Takes up 2/5 columns) */}
          <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Briefcase className="text-indigo-400 h-5 w-5" /> Investment Preferences
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Age Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Age: {formData.age} yrs</label>
                <input
                  type="range" min="18" max="75"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-850 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Goal Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Financial Goal</label>
                <select
                  value={formData.financial_goal}
                  onChange={(e) => setFormData({ ...formData, financial_goal: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Wealth Creation">Wealth Creation</option>
                  <option value="Retirement">Retirement Goal</option>
                  <option value="House Purchase">House Purchase</option>
                  <option value="Education">Children's Education</option>
                </select>
              </div>

              {/* Investment Mode (SIP vs Lumpsum) */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Investment Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  {['SIP', 'Lumpsum'].map((mode) => (
                    <button
                      key={mode} type="button"
                      onClick={() => setFormData({ ...formData, investment_mode: mode })}
                      className={`py-2 px-4 rounded-lg font-medium border text-center transition-all cursor-pointer ${formData.investment_mode === mode
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget / Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {formData.investment_mode === 'SIP' ? 'Monthly SIP Amount' : 'Lumpsum Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input
                    type="number" min="500" step="500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-850 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Duration Years Slider */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Duration: {formData.duration_years} Years</label>
                <input
                  type="range" min="1" max="15"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-855 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Risk Profile Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Risk Appetite</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Conservative', 'Balanced', 'Growth', 'Aggressive'].map((risk) => (
                    <button
                      key={risk} type="button"
                      onClick={() => setFormData({ ...formData, risk_profile: risk })}
                      className={`py-2 px-2 text-xs rounded-lg font-medium border transition-all cursor-pointer ${formData.risk_profile === risk
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-slate-855 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-750 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate Plan'}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Results Plan Dashboard (Takes up 3/5 columns) */}
          <div className="md:col-span-3 min-h-[500px]">

            {/* Loading Placeholder */}
            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 border border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/10">
                <Loader2 className="animate-spin text-indigo-500 h-12 w-12" />
                <p className="text-slate-400 font-medium">AI Advisor is mapping asset allocations and selecting top-rated funds...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!plan && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/10">
                <ShieldCheck className="text-indigo-500/40 h-16 w-16" />
                <h3 className="text-lg font-bold text-slate-300">No Plan Generated Yet</h3>
                <p className="text-slate-400 text-sm max-w-sm">Enter your mutual fund preferences on the left and submit to let our AI build your plan.</p>
              </div>
            )}

            {/* Result Render */}
            {plan && !loading && (
              <div className="space-y-6 animate-fade-in">

                {/* 1. Projections Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <TrendingUp className="h-32 w-32" />
                  </div>

                  <h3 className="text-sm uppercase tracking-wider text-indigo-400 font-semibold mb-2">Estimated Projections</h3>
                  <div className="grid grid-cols-2 gap-4 my-4">
                    <div>
                      <p className="text-xs text-slate-400">Projected Portfolio Value</p>
                      <p className="text-2xl font-black text-emerald-400">₹{plan.projected_value.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Estimated Returns Earned</p>
                      <p className="text-2xl font-black text-slate-200">₹{plan.projected_gain.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-800/80 pt-4 mt-2">
                    <p className="text-sm text-slate-300 leading-relaxed">{plan.summary_message}</p>
                  </div>
                </div>

                {/* 2. Asset Allocation Breakdown */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Coins className="text-purple-400 h-4 w-4" /> Asset Class Distribution
                  </h3>
                  <div className="space-y-4">
                    {plan.asset_allocation.map((asset) => (
                      <div key={asset.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-300">{asset.category}</span>
                          <span className="text-slate-400">{asset.percentage}% (₹{asset.allocated_amount.toLocaleString('en-IN')})</span>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${asset.category === 'Equity' ? 'bg-indigo-500' : asset.category === 'Hybrid' ? 'bg-purple-500' : 'bg-blue-400'
                              }`}
                            style={{ width: `${asset.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Recommended Mutual Funds List */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    <Award className="text-amber-400 h-4 w-4" /> Best Matching Mutual Funds
                  </h3>

                  <div className="grid gap-4">
                    {plan.fund_distribution.map((fund, index) => (
                      <div
                        key={index}
                        className="bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-100">{fund.scheme_name}</span>
                            <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${fund.category === 'Equity' ? 'bg-indigo-500/10 text-indigo-400' : fund.category === 'Hybrid' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-400/10 text-blue-400'
                              }`}>
                              {fund.category}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fund.ai_quality_tag === 'Good' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                              AI: {fund.ai_quality_tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{fund.sub_category} • AUM: ₹{fund.fund_size_cr.toLocaleString('en-IN')} Cr</p>
                        </div>

                        <div className="flex items-center gap-6 justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Predicted Return</p>
                            <p className="text-sm font-black text-indigo-400">+{fund.predicted_return}%</p>
                          </div>
                          <div className="text-right border-l border-slate-800 pl-4">
                            <p className="text-xs text-slate-500">Plan Allocation</p>
                            <p className="text-sm font-bold text-slate-200">{fund.allocation_percentage}% (₹{fund.allocated_amount.toLocaleString('en-IN')})</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default App;
