import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, AlertCircle, Loader2, Coins, Search, BookOpen, Copy, Sparkles, BarChart3 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [formData, setFormData] = useState({
    age: 30,
    financial_goal: 'Wealth Creation',
    investment_mode: 'SIP',
    amount: 5000,
    duration_years: 5,
    risk_profile: 'Balanced',
  });

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('landing');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Server returned an error.');
      }
      const data = await response.json();
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const PIE_COLORS = { Equity: '#818cf8', Hybrid: '#60a5fa', Debt: '#34d399' };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 space-y-8">

        {/* ─── Header ─── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div onClick={() => setCurrentPage('landing')} className="cursor-pointer hover:opacity-80 transition-opacity space-y-0.5">
            <h1 className="text-lg font-bold text-white tracking-tight">FinSight AI</h1>
            <p className="text-xs text-neutral-500 mt-0.5">AI-Powered Portfolio Planner & Market Intelligence</p>
          </div>
          <nav className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            {['planner', 'market'].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {page === 'planner' ? 'Portfolio Planner' : 'Market Research'}
              </button>
            ))}
          </nav>
        </header>

        {/* ─── Page Content ─── */}
        {currentPage === 'landing' ? (
          <LandingPage onNavigate={(page) => setCurrentPage(page)} />
        ) : currentPage === 'planner' ? (
          <div className="grid lg:grid-cols-12 gap-10">

            {/* ─── Sidebar: Controls ─── */}
            <aside className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-neutral-300 mb-6">Investment Parameters</h2>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Age */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 font-medium">Age</span>
                    <span className="text-white font-semibold">{formData.age} yrs</span>
                  </div>
                  <input type="range" min="18" max="75" value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: +e.target.value })}
                    className="w-full h-1.5 rounded-full bg-neutral-800 accent-indigo-400 cursor-pointer" />
                </div>

                {/* Goal */}
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1.5">Financial Goal</label>
                  <select value={formData.financial_goal}
                    onChange={(e) => setFormData({ ...formData, financial_goal: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {['Wealth Creation', 'Retirement', 'House Purchase', 'Education'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Mode */}
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1.5">Investment Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['SIP', 'Lumpsum'].map((mode) => (
                      <button key={mode} type="button"
                        onClick={() => setFormData({ ...formData, investment_mode: mode })}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          formData.investment_mode === mode
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                        }`}>
                        {mode === 'SIP' ? 'Monthly SIP' : 'Lumpsum'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1.5">
                    {formData.investment_mode === 'SIP' ? 'Monthly Amount' : 'Investment Amount'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500 text-xs">₹</span>
                    <input type="number" min="500" step="500" value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: +e.target.value || 0 })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-7 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 font-medium">Duration</span>
                    <span className="text-white font-semibold">{formData.duration_years} yrs</span>
                  </div>
                  <input type="range" min="1" max="15" value={formData.duration_years}
                    onChange={(e) => setFormData({ ...formData, duration_years: +e.target.value })}
                    className="w-full h-1.5 rounded-full bg-neutral-800 accent-indigo-400 cursor-pointer" />
                </div>

                {/* Risk */}
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1.5">Risk Profile</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Conservative', 'Balanced', 'Growth', 'Aggressive'].map((r) => (
                      <button key={r} type="button"
                        onClick={() => setFormData({ ...formData, risk_profile: r })}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          formData.risk_profile === r
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                        }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Generate Portfolio'}
                </button>
              </form>
            </aside>

            {/* ─── Main: Results ─── */}
            <main className="lg:col-span-8 space-y-8 min-h-[500px]">

              {loading && (
                <div className="h-96 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                  <Loader2 className="animate-spin text-indigo-400 h-8 w-8" />
                  <p className="text-neutral-400 text-xs">Running ML models...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-xs">{error}</p>
                </div>
              )}

              {!plan && !loading && !error && (
                <div className="h-96 flex flex-col items-center justify-center bg-neutral-900/50 border border-neutral-800 border-dashed rounded-2xl space-y-3">
                  <BarChart3 className="text-neutral-700 h-10 w-10" />
                  <p className="text-neutral-500 text-xs font-medium">Configure parameters and generate a portfolio</p>
                </div>
              )}

              {plan && !loading && (
                <div className="space-y-8">

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-1">Projected Value</p>
                      <p className="text-2xl font-bold text-white">{fmt(plan.projected_value)}</p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-1">Estimated Gain</p>
                      <p className="text-2xl font-bold text-emerald-400">+{fmt(plan.projected_gain)}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
                    <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-2">Summary</p>
                    <p className="text-xs text-neutral-300 leading-relaxed">{plan.summary_message}</p>
                  </div>

                  {/* Charts Row */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Donut */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5" /> Asset Allocation
                      </p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={plan.asset_allocation} dataKey="allocated_amount" nameKey="category"
                              innerRadius={48} outerRadius={70} paddingAngle={4} strokeWidth={0}>
                              {plan.asset_allocation.map((e, i) => (
                                <Cell key={i} fill={PIE_COLORS[e.category] || '#666'} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => [fmt(v), 'Allocated']}
                              contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', fontSize: '11px', color: '#e5e5e5' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 text-[10px] mt-2">
                        {plan.asset_allocation.map((a) => (
                          <span key={a.category} className="flex items-center gap-1.5 text-neutral-400">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[a.category] }} />
                            {a.category} {a.percentage}%
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Growth Chart */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" /> Growth Projection
                      </p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={plan.projection_timeline} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                            <defs>
                              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="year" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#525252" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => fmt(v)}
                              contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', fontSize: '11px', color: '#e5e5e5' }} />
                            <Area type="monotone" dataKey="projected_value" stroke="#818cf8" fill="url(#grad)" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="cumulative_investment" stroke="#525252" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Fund List */}
                  <div>
                    <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" /> Recommended Funds
                    </p>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800 overflow-hidden">
                      {plan.fund_distribution.map((fund, i) => (
                        <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white truncate">{fund.scheme_name}</span>
                              <span className="shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700">
                                {fund.category}
                              </span>
                              <span className="shrink-0 text-[10px] text-neutral-500">{fund.ai_quality_tag}</span>
                            </div>
                            <p className="text-[10px] text-neutral-500">{fund.sub_category} · AUM ₹{fund.fund_size_cr.toLocaleString('en-IN')} Cr</p>
                          </div>
                          <div className="flex items-center gap-6 shrink-0 text-right">
                            <div>
                              <p className="text-[10px] text-neutral-500">Return</p>
                              <p className="font-bold text-emerald-400">+{fund.predicted_return}%</p>
                            </div>
                            <div className="border-l border-neutral-800 pl-4">
                              <p className="text-[10px] text-neutral-500">Allocation</p>
                              <p className="font-semibold text-neutral-200">{fund.allocation_percentage}% · {fmt(fund.allocated_amount)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </main>
          </div>

        ) : (
          <MarketResearcher />
        )}
      </div>
    </div>
  );
}

/* ─── Markdown Parser ─── */
const md = (text) => {
  if (!text) return '';
  let h = text;
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  h = h.replace(/^### (.*$)/gim, '<h4 class="text-xs font-bold text-neutral-300 uppercase tracking-wider mt-5 mb-2">$1</h4>');
  h = h.replace(/^## (.*$)/gim, '<h3 class="text-sm font-bold text-neutral-200 border-b border-neutral-800 pb-2 mt-6 mb-3">$1</h3>');
  h = h.replace(/^# (.*$)/gim, '<h2 class="text-base font-bold text-white mt-8 mb-3">$1</h2>');
  h = h.replace(/^\s*-\s*(.*$)/gim, '<li class="ml-4 list-disc text-neutral-400 my-1 text-xs leading-relaxed">$1</li>');
  return h.split('\n').map(l => {
    if (l.trim().startsWith('<')) return l;
    return l.trim() ? `<p class="text-xs text-neutral-400 leading-relaxed my-2">${l}</p>` : '';
  }).join('');
};

/* ─── Market Research Page ─── */
const MarketResearcher = () => {
  const [topic, setTopic] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('');
  const [copied, setCopied] = useState(false);

  const run = async (t) => {
    const q = t || topic;
    if (!q || q.trim().length < 3) return;
    setLoading(true); setError(null); setReport('');
    setStage('Agent 1 → Searching Google via Serper API...');
    const t1 = setTimeout(() => setStage('Agent 1 → Extracting financial data & news...'), 4000);
    const t2 = setTimeout(() => setStage('Agent 2 → Performing analysis & writing report...'), 8000);
    try {
      const res = await fetch(`${API_URL}/market-report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: q }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
      const data = await res.json();
      setReport(data.report);
    } catch (e) { setError(e.message); }
    finally { clearTimeout(t1); clearTimeout(t2); setLoading(false); setStage(''); }
  };

  const chips = ["Reliance Industries", "Tata Motors", "Nifty 50 Index", "HDFC Bank"];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Search */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-1">
            <Sparkles className="text-indigo-400 h-4 w-4" /> AI Market Intelligence
          </h2>
          <p className="text-xs text-neutral-500">Two AI agents crawl the web, extract financial data, and generate an investment analysis report.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-neutral-500 h-4 w-4" />
            <input type="text" placeholder="Enter a stock, fund, or market topic..."
              value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={loading || !topic.trim()}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Analyze'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {chips.map(c => (
            <button key={c} type="button" onClick={() => { setTopic(c); run(c); }} disabled={loading}
              className="text-[10px] font-medium px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all cursor-pointer disabled:opacity-50">
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <Loader2 className="animate-spin text-indigo-400 h-6 w-6" />
          <p className="text-neutral-300 text-xs font-medium">{stage}</p>
          <p className="text-[10px] text-neutral-600">Multi-agent pipeline running on Llama 3.1...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" /><p className="text-xs">{error}</p>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
            <span className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <BookOpen className="h-4 w-4 text-indigo-400" /> Investment Analysis Report
            </span>
            <button onClick={() => { navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-500 hover:text-white bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
              <Copy className="h-3 w-3" /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="max-w-none" dangerouslySetInnerHTML={{ __html: md(report) }} />
        </div>
      )}
    </div>
  );
};

/* ─── Landing Page Component ─── */
const LandingPage = ({ onNavigate }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    const symbols = ['₹', '$', '€', '£', '%', '📈', '+', '📊'];
    const maxParticles = 60;

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * height;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 20 + 10;
        this.size = Math.random() * 12 + 10;
        this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
        this.speedY = -(Math.random() * 0.8 + 0.3);
        this.speedX = Math.random() * 0.4 - 0.2;
        this.alpha = Math.random() * 0.2 + 0.05;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        if (this.y < height * 0.4) {
          this.alpha -= 0.003;
        }

        if (this.y < -20 || this.alpha <= 0 || this.x < -20 || this.x > width + 20) {
          this.reset();
        }
      }

      draw() {
        ctx.fillStyle = `rgba(163, 163, 163, ${this.alpha})`;
        ctx.font = `${this.size}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(this.symbol, this.x, this.y);
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouse = { x: null, y: null };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            p.x += (dx / dist) * force * 3;
            p.y += (dy / dist) * force * 1.5;
          }
        }
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden py-12 rounded-3xl border border-neutral-900 bg-neutral-950">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      />

      <div className="relative z-10 text-center max-w-2xl px-6 space-y-8 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-[10px] font-semibold tracking-wider uppercase animate-pulse">
          <Sparkles className="h-3.5 w-3.5" /> Engine v1.0 Release
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Smart Portfolios.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 via-neutral-400 to-neutral-600">
              Real-Time Market Research.
            </span>
          </h2>
          <p className="text-sm text-neutral-500 font-light max-w-lg mx-auto leading-relaxed">
            Build optimized, risk-aware investment portfolios and run real-time analyst reports on any stock or sector in seconds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pointer-events-auto">
          <button
            onClick={() => onNavigate('planner')}
            className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-neutral-950 font-bold px-8 py-3 rounded-xl text-xs shadow-lg transition-all cursor-pointer hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Build Portfolio
          </button>
          <button
            onClick={() => onNavigate('market')}
            className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-semibold px-8 py-3 rounded-xl text-xs border border-neutral-800 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Research a Stock
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-3 gap-8 px-6 pt-16 mt-8 border-t border-neutral-900/50">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Wealth Planner</h4>
          <p className="text-[11px] text-neutral-600 leading-relaxed font-light font-sans">Input your age, goals, and risk profile to instantly generate a diversified, returns-optimized fund distribution.</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Live Market Intel</h4>
          <p className="text-[11px] text-neutral-600 leading-relaxed font-light font-sans">Type any stock or index to trigger live AI agents that search the web, compile news, and write expert briefs.</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Capital Shield</h4>
          <p className="text-[11px] text-neutral-600 leading-relaxed font-light font-sans">Smart duration-based overrides automatically protect short-term investments by switching splits to low-risk debt funds.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
