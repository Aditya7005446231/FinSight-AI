import { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
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

  // Color mapping for asset allocation categories
  const ASSET_COLORS = {
    Equity: '#6366f1', // Indigo
    Hybrid: '#a855f7', // Purple
    Debt: '#38bdf8'    // Sky Blue
  };

  // Format currency in Indian Rupees style
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              FinSight AI
            </h1>
            <p className="text-slate-400 mt-2">Personalized AI Mutual Fund Advisor & Portfolio Planner</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-slate-300 font-medium">FastAPI Engine Online</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Form (Takes up 2/5 columns on large screens) */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Briefcase className="text-indigo-400 h-5 w-5" /> Investment Preferences
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Age Input */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-300">Investor Age</label>
                  <span className="text-sm font-bold text-indigo-400">{formData.age} years</span>
                </div>
                <input
                  type="range" min="18" max="75"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Goal Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Financial Goal</label>
                <select
                  value={formData.financial_goal}
                  onChange={(e) => setFormData({ ...formData, financial_goal: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Wealth Creation">Wealth Creation</option>
                  <option value="Retirement">Retirement</option>
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
                      className={`py-2.5 px-4 rounded-lg font-semibold border text-center transition-all cursor-pointer ${
                        formData.investment_mode === mode
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {mode === 'SIP' ? 'Monthly SIP' : 'One-Time Lumpsum'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget / Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {formData.investment_mode === 'SIP' ? 'Monthly Investment Amount' : 'Lumpsum Investment Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number" min="500" step="500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-850 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Duration Years Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-300">Investment Horizon</label>
                  <span className="text-sm font-bold text-indigo-400">{formData.duration_years} Years</span>
                </div>
                <input
                  type="range" min="1" max="15"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
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
                      className={`py-2 px-2 text-xs rounded-lg font-bold border transition-all cursor-pointer ${
                        formData.risk_profile === risk
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800'
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
          <div className="lg:col-span-3 min-h-[500px] space-y-6">
            
            {/* Loading Placeholder */}
            {loading && (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center space-y-4 border border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/10">
                <Loader2 className="animate-spin text-indigo-500 h-12 w-12" />
                <p className="text-slate-400 font-medium">FinSight AI is processing historical CSV data and unpickling ML estimators...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!plan && !loading && !error && (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/10">
                <ShieldCheck className="text-indigo-500/30 h-16 w-16" />
                <h3 className="text-lg font-bold text-slate-300">Generate Your Personalized Plan</h3>
                <p className="text-slate-400 text-sm max-w-sm">Select your preferences on the left and submit. We'll run the random forest predictor to allocate assets and recommend top mutual funds.</p>
              </div>
            )}

            {/* Result Render */}
            {plan && !loading && !error && (
              <div className="space-y-6 animate-fade-in">
                
                {/* 1. Projections Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-indigo-900/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <TrendingUp className="h-32 w-32" />
                  </div>
                  
                  <h3 className="text-xs uppercase tracking-wider text-indigo-400 font-extrabold mb-2">Portfolio Projections</h3>
                  <div className="grid grid-cols-2 gap-6 my-4">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Projected Portfolio Value</p>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-400">{formatCurrency(plan.projected_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Estimated Wealth Gains</p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-200">{formatCurrency(plan.projected_gain)}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-800/80 pt-4 mt-2">
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{plan.summary_message}</p>
                  </div>
                </div>

                {/* 2. Visual Graphs Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Donut Chart (Asset Allocation) */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <Coins className="text-purple-400 h-4 w-4" /> Asset Class Allocation
                    </h3>
                    <div className="h-52 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={plan.asset_allocation}
                            dataKey="allocated_amount"
                            nameKey="category"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                          >
                            {plan.asset_allocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.category] || '#ccc'} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [formatCurrency(value), 'Allocated']}
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Donut Legend */}
                    <div className="flex justify-center gap-6 mt-2 text-xs flex-wrap">
                      {plan.asset_allocation.map((asset) => (
                        <div key={asset.category} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ASSET_COLORS[asset.category] }} />
                          <span className="font-semibold text-slate-300">{asset.category}: {asset.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Line Chart (Wealth Growth Timeline) */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <TrendingUp className="text-emerald-400 h-4 w-4" /> Wealth Growth Projection
                    </h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={plan.projection_timeline} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="year" stroke="#64748b" fontSize={11} label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
                          <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                          />
                          <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                          <Area name="Projected Value" type="monotone" dataKey="projected_value" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProj)" />
                          <Area name="Total Invested" type="monotone" dataKey="cumulative_investment" stroke="#6366f1" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* 3. Recommended Mutual Funds List */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    <Award className="text-amber-400 h-4 w-4" /> Portfolio Mutual Funds Allocation
                  </h3>
                  
                  <div className="grid gap-4">
                    {plan.fund_distribution.map((fund, index) => (
                      <div
                        key={index}
                        className="bg-slate-900/20 border border-slate-800/80 hover:border-indigo-900/30 transition-all rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-100">{fund.scheme_name}</span>
                            <span
                              className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${ASSET_COLORS[fund.category]}15`,
                                color: ASSET_COLORS[fund.category]
                              }}
                            >
                              {fund.category}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              fund.ai_quality_tag === 'Good' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              AI Rating: {fund.ai_quality_tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{fund.sub_category} • AUM: ₹{fund.fund_size_cr.toLocaleString('en-IN')} Cr</p>
                        </div>
                        
                        <div className="flex items-center gap-6 justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Predicted Return</p>
                            <p className="text-sm font-black text-indigo-400">+{fund.predicted_return}%</p>
                          </div>
                          <div className="text-right border-l border-slate-850 pl-4">
                            <p className="text-xs text-slate-500">Allocation</p>
                            <p className="text-sm font-bold text-slate-200">{fund.allocation_percentage}% ({formatCurrency(fund.allocated_amount)})</p>
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
