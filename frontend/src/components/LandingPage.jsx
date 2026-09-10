import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Shield, Search, TrendingUp, Sliders,
  BarChart3, Brain, Zap, ArrowRight, ChevronDown,
  Target, Layers, LineChart, Award, Activity,
  Globe, Database, Cpu, Lock, MousePointer2,
} from 'lucide-react';

/* ─── Intersection Observer Hook for scroll-reveal ─── */
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, isInView];
};

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Gradient Mesh Canvas ─── */
const GradientMeshCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: 0.3, y: 0.3, r: 280, color: 'rgba(99,102,241,0.12)', speed: 0.0008 },
      { x: 0.7, y: 0.6, r: 320, color: 'rgba(139,92,246,0.10)', speed: 0.0006 },
      { x: 0.5, y: 0.8, r: 260, color: 'rgba(59,130,246,0.08)', speed: 0.001 },
      { x: 0.2, y: 0.7, r: 200, color: 'rgba(168,85,247,0.06)', speed: 0.0012 },
    ];

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      blobs.forEach((b) => {
        const cx = w * b.x + Math.sin(t * b.speed * 1000 + b.x * 10) * 60;
        const cy = h * b.y + Math.cos(t * b.speed * 800 + b.y * 8) * 40;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        gradient.addColorStop(0, b.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      t++;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ filter: 'blur(60px)' }}
    />
  );
};

/* ─── Floating Particles ─── */
const FloatingParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let mouse = { x: null, y: null };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleLeave = () => { mouse.x = null; mouse.y = null; };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);

    const symbols = ['₹', '◆', '●', '▲', '+', '○', '◇'];
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 10 + 8,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      speedY: -(Math.random() * 0.5 + 0.15),
      speedX: Math.random() * 0.3 - 0.15,
      alpha: Math.random() * 0.15 + 0.03,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        if (mouse.x !== null) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p.x += (dx / dist) * force * 2;
            p.y += (dy / dist) * force * 1;
          }
        }
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
        if (p.x < -20 || p.x > canvas.width + 20) { p.x = Math.random() * canvas.width; }
        ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
        ctx.font = `${p.size}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(p.symbol, p.x, p.y);
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />;
};

/* ─── Glowing Orb Decoration ─── */
const GlowOrb = ({ className }) => (
  <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />
);

/* ─── Feature Card ─── */
const FeatureCard = ({ icon: Icon, title, description, accent, delay, onClick }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      onClick={onClick}
      className="group relative bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/80 rounded-2xl p-7 cursor-pointer transition-all duration-500 hover:border-neutral-700 hover:bg-neutral-900/80 hover:shadow-2xl hover:-translate-y-1"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accent}08, transparent 60%)` }}
      />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110`}
        style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}25` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <h3 className="text-sm font-bold text-white mb-2 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-xs text-neutral-500 leading-relaxed font-light">{description}</p>
      <div className="mt-5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1"
        style={{ color: accent }}
      >
        Explore <ArrowRight className="h-3 w-3" />
      </div>
    </div>
  );
};

/* ─── How-It-Works Step ─── */
const Step = ({ number, title, description, icon: Icon, isLast, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className="relative flex gap-6"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : 'translateX(-30px)',
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
          {number}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-indigo-500/20 to-transparent mt-2" />}
      </div>
      <div className={`pb-10 ${isLast ? '' : ''}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className="h-3.5 w-3.5 text-indigo-400" />
          <h4 className="text-sm font-semibold text-white">{title}</h4>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed font-light max-w-sm">{description}</p>
      </div>
    </div>
  );
};

/* ─── Tech Badge ─── */
const TechBadge = ({ icon: Icon, name, detail }) => (
  <div className="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800/60 rounded-xl px-4 py-3 hover:border-neutral-700/80 transition-all duration-300 hover:bg-neutral-900/80 group">
    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
      <Icon className="h-4 w-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
    </div>
    <div>
      <p className="text-xs font-semibold text-neutral-300">{name}</p>
      <p className="text-[10px] text-neutral-600 font-light">{detail}</p>
    </div>
  </div>
);

/* ─── FAQ Item ─── */
const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-xl transition-all duration-300 overflow-hidden ${
        open ? 'border-neutral-700 bg-neutral-900/60' : 'border-neutral-800/60 bg-neutral-900/30 hover:border-neutral-700/60'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
      >
        <span className="text-xs font-semibold text-neutral-200 pr-4">{question}</span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-500 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="px-6 pb-4 text-xs text-neutral-500 font-light leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ║                    LANDING PAGE                        ║
   ═══════════════════════════════════════════════════════════ */

const LandingPage = ({ onNavigate }) => {
  const [heroRef, heroInView] = useInView();
  const [metricsRef, metricsInView] = useInView();

  return (
    <div className="space-y-24 pb-16 overflow-hidden">

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-neutral-800/40"
        style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0d0d12 50%, #0a0a0a 100%)' }}
      >
        {/* Animated background layers */}
        <GradientMeshCanvas />
        <FloatingParticles />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Decorative orbs */}
        <GlowOrb className="w-96 h-96 -top-48 -left-48 bg-indigo-600/8" />
        <GlowOrb className="w-80 h-80 -bottom-40 -right-40 bg-violet-600/6" />

        {/* Hero content */}
        <div
          className="relative z-10 text-center max-w-3xl px-6 space-y-8 pointer-events-none"
          style={{
            opacity: heroInView ? 1 : 0,
            transform: heroInView ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 pointer-events-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <span className="text-indigo-400 text-[10px] font-semibold tracking-wider uppercase">Powered by Machine Learning</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Invest Smarter
              <br />
              <span className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 25%, #c4b5fd 50%, #93c5fd 75%, #818cf8 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 4s ease infinite',
                }}
              >
                with AI.
              </span>
            </h2>
            <p className="text-sm md:text-base text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
              Build risk-optimized portfolios, profile your investor DNA, and generate real-time market intelligence — all powered by trained ML models.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pointer-events-auto">
            <button
              onClick={() => onNavigate('risk')}
              className="w-full sm:w-auto group relative bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-3.5 rounded-xl text-xs shadow-xl shadow-indigo-500/25 transition-all duration-300 cursor-pointer hover:scale-[1.03] hover:shadow-indigo-500/40 flex items-center justify-center gap-2.5 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-white/10 to-indigo-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Shield className="h-4 w-4" /> Find My Risk Profile
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-1 group-hover:ml-0" />
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 backdrop-blur text-white font-semibold px-8 py-3.5 rounded-xl text-xs border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sliders className="h-3.5 w-3.5" /> Build a Portfolio
            </button>
            <button
              onClick={() => onNavigate('market')}
              className="w-full sm:w-auto text-neutral-400 hover:text-white font-medium px-6 py-3.5 rounded-xl text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 hover:bg-white/5"
            >
              <Search className="h-3.5 w-3.5" /> Research Stocks
            </button>
          </div>
        </div>

        {/* Bottom scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40 animate-bounce">
          <MousePointer2 className="h-4 w-4 text-neutral-500" />
          <span className="text-[9px] text-neutral-600 font-medium tracking-widest uppercase">Scroll</span>
        </div>
      </section>

      {/* ═══════════════ SOCIAL PROOF BAR ═══════════════ */}
      <section
        ref={metricsRef}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
        style={{
          opacity: metricsInView ? 1 : 0,
          transform: metricsInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {[
          { value: 771, suffix: '+', label: 'Tracked Mutual Funds', icon: Layers },
          { value: 10, suffix: 'ms', label: 'Optimization Latency', icon: Zap },
          { value: 100, suffix: '%', label: 'Data-Grounded Results', icon: Database },
          { value: 3, suffix: '', label: 'AI Engine Modules', icon: Brain },
        ].map(({ value, suffix, label, icon: Icon }, i) => (
          <div
            key={label}
            className="group relative bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 text-center hover:border-neutral-700/60 transition-all duration-300 hover:bg-neutral-900/60"
          >
            <Icon className="h-4 w-4 text-neutral-600 mx-auto mb-3 group-hover:text-indigo-400 transition-colors" />
            <p className="text-3xl font-extrabold text-white tracking-tight mb-1">
              <AnimatedCounter target={value} suffix={suffix} />
            </p>
            <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </section>

      {/* ═══════════════ FEATURE CARDS ═══════════════ */}
      <section className="space-y-12">
        <div className="text-center space-y-3 max-w-lg mx-auto">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Platform Capabilities</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Everything You Need to<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #c4b5fd)' }}>
              Invest with Confidence
            </span>
          </h2>
          <p className="text-xs text-neutral-500 font-light max-w-md mx-auto">
            Three powerful modules working together to give you an institutional-grade investment terminal.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Shield}
            title="AI Risk Profiler"
            description="Answer a quick questionnaire and our XGBoost classifier predicts your ideal risk profile with confidence scores, recommended allocation splits, and top-matched funds."
            accent="#818cf8"
            delay={0}
            onClick={() => onNavigate('risk')}
          />
          <FeatureCard
            icon={Sliders}
            title="Wealth Planner"
            description="Input your age, goals, amount, and risk tolerance. Our ML-powered engine instantly generates a diversified portfolio with projected returns and year-by-year growth timelines."
            accent="#a78bfa"
            delay={0.15}
            onClick={() => onNavigate('planner')}
          />
          <FeatureCard
            icon={Globe}
            title="Market Intelligence"
            description="Type any stock or index to trigger autonomous AI agents that crawl live Google results, pull Yahoo Finance data, and compile professional analyst-grade research reports."
            accent="#60a5fa"
            delay={0.3}
            onClick={() => onNavigate('market')}
          />
        </div>

        {/* Sub-features grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target, title: 'Goal-Based Planning', desc: 'Retirement, house, education' },
            { icon: Activity, title: 'Live Price Charts', desc: '6-month Yahoo Finance data' },
            { icon: Lock, title: 'Capital Shield', desc: 'Duration-based risk overrides' },
            { icon: Award, title: 'AI Quality Tags', desc: 'Smart fund scoring system' },
          ].map(({ icon: Icon, title, desc }, i) => {
            const [ref, inView] = useInView();
            return (
              <div
                key={title}
                ref={ref}
                className="bg-neutral-900/30 border border-neutral-800/40 rounded-xl p-5 hover:border-neutral-700/60 transition-all duration-300 hover:bg-neutral-900/50 group"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`,
                }}
              >
                <Icon className="h-4 w-4 text-neutral-600 mb-3 group-hover:text-indigo-400 transition-colors" />
                <h4 className="text-xs font-semibold text-neutral-300 mb-1">{title}</h4>
                <p className="text-[10px] text-neutral-600 font-light">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="grid md:grid-cols-2 gap-16 items-start">
        <div className="space-y-4 sticky top-20">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">How It Works</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            From Questionnaire<br />to Portfolio in{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #60a5fa)' }}>
              Seconds
            </span>
          </h2>
          <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-sm">
            Our unified ML pipeline handles everything — risk classification, fund matching, allocation optimization, and projection modeling — in a single API call.
          </p>
          <button
            onClick={() => onNavigate('risk')}
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer group"
          >
            Try it now <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="space-y-0">
          <Step
            number={1}
            icon={Shield}
            title="Take the Risk Assessment"
            description="Answer 6 intuitive questions about your financial situation, investment horizon, and comfort with volatility. No jargon — just clear, relatable scenarios."
            delay={0}
          />
          <Step
            number={2}
            icon={Brain}
            title="ML Model Classifies You"
            description="An XGBoost classifier trained on financial behavior data predicts whether you're Conservative, Moderate, or Aggressive — with probability scores for each class."
            delay={0.15}
          />
          <Step
            number={3}
            icon={Layers}
            title="Fund Matching & Allocation"
            description="Based on your profile, the engine scans 771+ mutual funds and selects top performers across Equity, Hybrid, and Debt categories with optimized weight distributions."
            delay={0.3}
          />
          <Step
            number={4}
            icon={LineChart}
            title="Portfolio & Growth Projection"
            description="Get a complete investment plan with year-by-year projections, expected returns, asset allocation charts, and personalized fund recommendations."
            delay={0.45}
            isLast
          />
        </div>
      </section>

      {/* ═══════════════ TECH STACK ═══════════════ */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Under the Hood</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Built with Modern Tech</h2>
          <p className="text-xs text-neutral-500 font-light max-w-md mx-auto">
            A production-grade stack engineered for speed, accuracy, and reliability.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TechBadge icon={Cpu} name="FastAPI" detail="Async Python Backend" />
          <TechBadge icon={Brain} name="XGBoost" detail="Risk Classification" />
          <TechBadge icon={BarChart3} name="scikit-learn" detail="Fund Prediction" />
          <TechBadge icon={Sparkles} name="Llama 3.1" detail="AI Research Agent" />
          <TechBadge icon={Globe} name="Yahoo Finance" detail="Live Market Data" />
          <TechBadge icon={Search} name="Serper API" detail="Web Search Grounding" />
          <TechBadge icon={Zap} name="React + Vite" detail="Frontend Runtime" />
          <TechBadge icon={Database} name="Recharts" detail="Data Visualization" />
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="space-y-8 max-w-2xl mx-auto w-full">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">FAQ</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Common Questions</h2>
        </div>

        <div className="space-y-3">
          <FAQItem
            question="How does the AI predict mutual fund returns?"
            answer="We train scikit-learn Random Forest regression models on historical mutual fund data, evaluating Sharpe ratios, Sortino scores, alpha/beta values, and AUM growth to project 3-year performance. The model is retrained periodically with updated fund data."
          />
          <FAQItem
            question="Is the market research report data reliable?"
            answer="Yes. Our research agent pulls direct snippets and citations from live Google search results via the Serper API and structures its analysis strictly from factual, real-time reports — preventing typical LLM hallucinations through search grounding."
          />
          <FAQItem
            question="How is my risk profile determined?"
            answer="An XGBoost gradient boosting classifier analyzes your questionnaire responses (age, income stability, investment horizon, loss tolerance) against trained patterns to classify you as Conservative, Moderate, or Aggressive with confidence probabilities."
          />
          <FAQItem
            question="Can I use this for actual investment decisions?"
            answer="FinSight AI is an educational and analytical tool. While our ML models provide data-driven insights grounded in real fund performance data, we recommend consulting with a SEBI-registered financial advisor before making actual investment decisions."
          />
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800/40 p-12 md:p-16 text-center"
        style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #111127 50%, #0d0d1a 100%)' }}
      >
        <GlowOrb className="w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600/10" />
        <div className="relative z-10 space-y-6 max-w-lg mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Ready to Build Your{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #c4b5fd)' }}>
              AI-Optimized Portfolio?
            </span>
          </h2>
          <p className="text-xs text-neutral-400 font-light">
            Start with a free risk assessment. It takes less than 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('risk')}
              className="group bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-10 py-4 rounded-xl text-xs shadow-xl shadow-indigo-500/25 transition-all duration-300 cursor-pointer hover:scale-[1.03] flex items-center gap-2"
            >
              <Shield className="h-4 w-4" /> Start Risk Assessment
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-neutral-800/40 pt-10 space-y-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">FinSight AI</h3>
            <p className="text-[11px] text-neutral-600 font-light leading-relaxed">
              Institutional-grade investment intelligence for the modern retail investor. Powered by machine learning and real-time data.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Platform</h4>
            <div className="space-y-2">
              <button onClick={() => onNavigate('risk')} className="block text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer">Risk Profiler</button>
              <button onClick={() => onNavigate('planner')} className="block text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer">Wealth Planner</button>
              <button onClick={() => onNavigate('market')} className="block text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer">Market Research</button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Technology</h4>
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">FastAPI + Python</p>
              <p className="text-xs text-neutral-500">XGBoost & scikit-learn</p>
              <p className="text-xs text-neutral-500">React + Vite</p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Legal</h4>
            <div className="space-y-2">
              <a href="#" className="block text-xs text-neutral-500 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="block text-xs text-neutral-500 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block text-xs text-neutral-500 hover:text-white transition-colors">Disclaimer</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-800/30 text-[10px] text-neutral-600">
          <p>© 2026 FinSight AI. Built for educational and analytical purposes.</p>
          <p className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            All systems operational
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
