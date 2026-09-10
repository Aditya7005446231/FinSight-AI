import { useState } from 'react';
import { AdaptiveSlider } from './AdaptiveSlider';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend,
} from 'recharts';
import {
  Loader2, AlertCircle, Shield, ChevronRight, Star,
  TrendingUp, User, Briefcase, Clock, Wallet, HelpCircle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/* ── colour tokens (keep in sync with the rest of the app) ── */
const PROFILE_COLORS = {
  Conservative: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', bar: '#34d399' },
  Moderate:     { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    bar: '#60a5fa' },
  Aggressive:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   bar: '#fbbf24' },
};

const BAR_COLORS = { '1 Year': '#818cf8', '3 Year': '#60a5fa', '5 Year': '#34d399' };

/* ── helpers ── */
const ratingStars = (n) =>
  Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-3 w-3 ${i < n ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'}`} />
  ));

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 shadow-xl space-y-1">
      <p className="text-[10px] text-neutral-400 font-medium truncate max-w-[200px]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value != null ? `${p.value}%` : 'N/A'}
        </p>
      ))}
    </div>
  );
};


/* ════════════════════════════════════════════════════════════════════
   RISK PROFILER — full-page component
   ════════════════════════════════════════════════════════════════════ */
const RiskProfiler = () => {

  /* ── form state ── */
  const [form, setForm] = useState({
    age: 28,
    monthly_income: 50000,
    dependents: 0,
    horizon_years: 5,
    emergency_fund: 'yes',
    drop_reaction: 'hold',
    goal_type: 'wealth_creation',
    experience: 'none',
    monthly_investable: 10000,
  });

  /* ── result state ── */
  const [result, setResult] = useState(null);     // /api/recommend response
  const [chartData, setChartData] = useState(null); // /api/funds/performance-chart
  const [notFound, setNotFound] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm({ ...form, [key]: val });

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setChartData(null);
    setNotFound([]);

    try {
      /* Step 1 — risk profile + recommended funds */
      const res = await fetch(`${API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(
          typeof e.detail === 'string'
            ? e.detail
            : e.detail?.message || 'Recommendation failed.'
        );
      }
      const data = await res.json();
      setResult(data);

      /* Step 2 — performance chart data */
      const names = data.recommended_funds.map((f) => f.scheme_name).join(',');
      const chartRes = await fetch(
        `${API_URL}/api/funds/performance-chart?scheme_names=${encodeURIComponent(names)}`
      );
      if (chartRes.ok) {
        const cd = await chartRes.json();
        /* Reshape for Recharts grouped bar chart */
        const shaped = cd.chart_data.map((f) => ({
          name: f.scheme_name.length > 30
            ? f.scheme_name.slice(0, 28) + '...'
            : f.scheme_name,
          fullName: f.scheme_name,
          '1 Year': f.returns_1yr,
          '3 Year': f.returns_3yr,
          '5 Year': f.returns_5yr,
        }));
        setChartData(shaped);
        setNotFound(cd.not_found || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  /* ════════ RENDER ════════ */
  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ─── Questionnaire Form ─── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-1">
            <Shield className="text-indigo-400 h-4 w-4" />
            AI Risk Profiler
          </h2>
          <p className="text-xs text-neutral-500">
            Answer a few questions and our ML model will determine your risk
            profile, then recommend top-rated funds tailored to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Row 1 — numeric sliders */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Age */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-medium flex items-center gap-1">
                  <User className="h-3 w-3" /> Age
                </span>
                <span className="text-white font-semibold">{form.age} yrs</span>
              </div>
              <AdaptiveSlider
                min={18}
                max={75}
                value={form.age}
                onChange={(e) => set('age', +e.target.value)}
              />
            </div>

            {/* Monthly Income */}
            <div>
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1 mb-1.5">
                <Briefcase className="h-3 w-3" /> Monthly Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-500 text-xs">&#8377;</span>
                <input type="number" min="5000" step="5000" value={form.monthly_income}
                  onChange={(e) => set('monthly_income', +e.target.value || 0)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-7 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            {/* Dependents */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-medium">Dependents</span>
                <span className="text-white font-semibold">{form.dependents}</span>
              </div>
              <AdaptiveSlider
                min={0}
                max={10}
                value={form.dependents}
                onChange={(e) => set('dependents', +e.target.value)}
              />
            </div>

            {/* Horizon */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Investment Horizon
                </span>
                <span className="text-white font-semibold">{form.horizon_years} yrs</span>
              </div>
              <AdaptiveSlider
                min={1}
                max={30}
                value={form.horizon_years}
                onChange={(e) => set('horizon_years', +e.target.value)}
              />
            </div>

            {/* Monthly Investable */}
            <div>
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1 mb-1.5">
                <Wallet className="h-3 w-3" /> Monthly Investable
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-500 text-xs">&#8377;</span>
                <input type="number" min="500" step="500" value={form.monthly_investable}
                  onChange={(e) => set('monthly_investable', +e.target.value || 0)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-7 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Row 2 — select / button-group fields */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Emergency Fund */}
            <ToggleGroup
              label="Emergency Fund?"
              options={['yes', 'no']}
              value={form.emergency_fund}
              onChange={(v) => set('emergency_fund', v)}
              labels={{ yes: 'Yes', no: 'No' }}
            />

            {/* Drop Reaction */}
            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-1.5">
                If portfolio drops 20%?
              </label>
              <select value={form.drop_reaction}
                onChange={(e) => set('drop_reaction', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="sell">Sell everything</option>
                <option value="hold">Hold and wait</option>
                <option value="buy_more">Buy more</option>
              </select>
            </div>

            {/* Goal Type */}
            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-1.5">
                Financial Goal
              </label>
              <select value={form.goal_type}
                onChange={(e) => set('goal_type', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="wealth_creation">Wealth Creation</option>
                <option value="retirement">Retirement</option>
                <option value="child_education">Child Education</option>
                <option value="tax_saving">Tax Saving (ELSS)</option>
                <option value="short_term">Short Term</option>
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-1.5">
                Investment Experience
              </label>
              <select value={form.experience}
                onChange={(e) => set('experience', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="none">None / Beginner</option>
                <option value="some">Some experience</option>
                <option value="experienced">Experienced</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white py-2.5 px-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20">
            {loading
              ? <><Loader2 className="animate-spin h-4 w-4" /> Analyzing...</>
              : <><ChevronRight className="h-4 w-4" /> Find My Risk Profile & Funds</>
            }
          </button>
        </form>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* ─── Loading ─── */}
      {loading && (
        <div className="h-64 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <Loader2 className="animate-spin text-indigo-400 h-8 w-8" />
          <p className="text-neutral-400 text-xs">Running XGBoost risk model...</p>
        </div>
      )}

      {/* ═══════ RESULTS SECTION ═══════ */}
      {result && !loading && (
        <div className="space-y-6">

          {/* ─── Risk Profile + Confidence ─── */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">
                  ML-Predicted Risk Profile
                </p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${
                    (PROFILE_COLORS[result.risk_profile] || PROFILE_COLORS.Moderate).text
                  }`}>
                    {result.risk_profile}
                  </span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    (PROFILE_COLORS[result.risk_profile] || PROFILE_COLORS.Moderate).bg
                  } ${
                    (PROFILE_COLORS[result.risk_profile] || PROFILE_COLORS.Moderate).border
                  } ${
                    (PROFILE_COLORS[result.risk_profile] || PROFILE_COLORS.Moderate).text
                  }`}>
                    {(result.confidence[result.risk_profile] * 100).toFixed(1)}% confidence
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-3 w-3 text-neutral-600" />
                <span className="text-[10px] text-neutral-600">
                  Based on your {form.horizon_years}-year horizon &amp; {form.goal_type.replace('_', ' ')} goal
                </span>
              </div>
            </div>

            {/* Confidence breakdown bars */}
            <div className="space-y-2">
              <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">
                Class Probabilities
              </p>
              <div className="space-y-1.5">
                {Object.entries(result.confidence)
                  .sort(([, a], [, b]) => b - a)
                  .map(([label, prob]) => {
                    const pct = (prob * 100).toFixed(1);
                    const colors = PROFILE_COLORS[label] || PROFILE_COLORS.Moderate;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-[10px] text-neutral-400 w-24 text-right font-medium">
                          {label}
                        </span>
                        <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: colors.bar,
                              opacity: prob === Math.max(...Object.values(result.confidence)) ? 1 : 0.35,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono w-12">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ─── Grouped Bar Chart ─── */}
          {chartData && chartData.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Fund Performance Comparison
              </p>
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                    barCategoryGap="20%"
                    barGap={3}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#262626"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#525252' }}
                      tickLine={false}
                      axisLine={false}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#525252' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar dataKey="1 Year"  fill={BAR_COLORS['1 Year']}  radius={[4, 4, 0, 0]} />
                    <Bar dataKey="3 Year"  fill={BAR_COLORS['3 Year']}  radius={[4, 4, 0, 0]} />
                    <Bar dataKey="5 Year"  fill={BAR_COLORS['5 Year']}  radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Not-found warning */}
              {notFound.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-2.5 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-400/80">
                    Chart data unavailable for: {notFound.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Fund List Table ─── */}
          <div>
            <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Recommended Funds ({result.recommended_funds.length})
            </p>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-800 text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                <span className="col-span-5">Fund Name</span>
                <span className="col-span-2">Category</span>
                <span className="col-span-2 text-right">Expense Ratio</span>
                <span className="col-span-3 text-right">Rating</span>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-neutral-800">
                {result.recommended_funds.map((fund, i) => (
                  <div
                    key={i}
                    className="grid sm:grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-neutral-800/30 transition-colors"
                  >
                    {/* Name */}
                    <div className="sm:col-span-5 space-y-0.5">
                      <p className="text-xs font-semibold text-white truncate">
                        {fund.scheme_name}
                      </p>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {fund.amc_name}
                      </p>
                    </div>

                    {/* Category */}
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {fund.category}
                      </span>
                    </div>

                    {/* Expense Ratio */}
                    <div className="sm:col-span-2 text-right">
                      <span className="text-xs text-neutral-300 font-mono">
                        {fund.expense_ratio}%
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="sm:col-span-3 flex items-center justify-end gap-1">
                      {ratingStars(fund.rating)}
                      <span className="text-[10px] text-neutral-500 ml-1">
                        ({fund.rating}/5)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};


/* ── Small reusable toggle group ── */
const ToggleGroup = ({ label, options, value, onChange, labels = {} }) => (
  <div>
    <label className="text-xs text-neutral-400 font-medium block mb-1.5">{label}</label>
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            value === opt
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {labels[opt] || opt}
        </button>
      ))}
    </div>
  </div>
);


export default RiskProfiler;
