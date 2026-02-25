import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useTranslation';
import {
  Users, WifiOff, Award, TrendingUp, Leaf, ShieldCheck,
  ArrowRight, Play, Trees, ChevronDown, Sparkles, Globe, Lock, Zap, Link as LinkIcon,
} from 'lucide-react';

/* ─── Scroll reveal hook ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    el.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ─── Counter ─── */
function CountUp({ target, duration = 2000, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(start)); }, 16);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref} className="count-up">{val}{suffix}</span>;
}

/* ─── Fireflies (organic particles) ─── */
function Fireflies({ count = 18 }: { count?: number }) {
  const items = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${10 + Math.random() * 80}%`,
      tx: `${(Math.random() - 0.5) * 60}px`,
      ty: `${(Math.random() - 0.5) * 60}px`,
      duration: `${5 + Math.random() * 10}s`,
      delay: `${Math.random() * 8}s`,
      size: `${4 + Math.random() * 8}px`,
      opacity: 0.3 + Math.random() * 0.5,
    })), [count]);

  return <>
    {items.map((f) => (
      <div key={f.id} className="firefly" style={{
        left: f.left, top: f.top, width: f.size, height: f.size,
        '--tx': f.tx, '--ty': f.ty, '--duration': f.duration,
        '--delay': f.delay, '--max-opacity': f.opacity,
      } as React.CSSProperties} />
    ))}
  </>;
}

/* ─── Custom Cursor ─── */
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ('ontouchstart' in window) return;
    const move = (e: MouseEvent) => {
      if (dotRef.current) dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${e.clientX - 18}px, ${e.clientY - 18}px)`;
    };
    const over = () => ringRef.current?.classList.add('hovering');
    const out = () => ringRef.current?.classList.remove('hovering');
    document.addEventListener('mousemove', move);
    document.querySelectorAll('a, button, .interactive').forEach((el) => {
      el.addEventListener('mouseenter', over);
      el.addEventListener('mouseleave', out);
    });
    return () => {
      document.removeEventListener('mousemove', move);
      document.querySelectorAll('a, button, .interactive').forEach((el) => {
        el.removeEventListener('mouseenter', over);
        el.removeEventListener('mouseleave', out);
      });
    };
  }, []);
  return <>
    <div ref={dotRef} className="cursor-dot hidden md:block" />
    <div ref={ringRef} className="cursor-ring hidden md:block" />
  </>;
}

/* ═══════════════════════════════════════════ */
export function Home() {
  const { t } = useAppTranslation();
  const sectionRef = useScrollReveal();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(() => { setScrollY(window.scrollY); ticking = false; }); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
  const heroProgress = Math.min(scrollY / heroHeight, 1);

  const features = [
    { icon: Users, title: t('home.feature_identity'), desc: t('home.feature_identity_desc'), stat: '100%', statLabel: t('home.stat_decentralized') },
    { icon: WifiOff, title: t('home.feature_offline'), desc: t('home.feature_offline_desc'), stat: '0', statLabel: t('home.stat_no_deps') },
    { icon: Award, title: t('home.feature_certification'), desc: t('home.feature_certification_desc'), stat: 'COMMCERT', statLabel: t('home.stat_stellar_asset') },
    { icon: TrendingUp, title: t('home.feature_reputation'), desc: t('home.feature_reputation_desc'), stat: 'MVRS', statLabel: t('home.stat_own_algo') },
    { icon: Leaf, title: t('home.feature_conservation'), desc: t('home.feature_conservation_desc'), stat: '6', statLabel: t('home.stat_action_cats') },
    { icon: ShieldCheck, title: t('home.feature_verification'), desc: t('home.feature_verification_desc'), stat: 'Multisig', statLabel: t('home.stat_multisig') },
  ];

  const stats = [
    { value: 10000, suffix: '+', label: t('home.stat_trees'), icon: Trees, detail: t('home.stat_trees_detail') },
    { value: 156, suffix: '', label: t('home.stat_communities'), icon: Users, detail: t('home.stat_communities_detail') },
    { value: 98, suffix: '%', label: t('home.stat_offline'), icon: WifiOff, detail: t('home.stat_offline_detail') },
    { value: 12, suffix: '', label: t('home.stat_ecosystems'), icon: Globe, detail: t('home.stat_ecosystems_detail') },
  ];

  const timeline = [
    {
      icon: '🐍',
      title: t('home.story1_title'),
      quote: t('home.story1_quote'),
      body: t('home.story1_body'),
      hasChain: true,
    },
    {
      icon: '🏘️',
      title: t('home.story2_title'),
      quote: t('home.story2_quote'),
      body: t('home.story2_body'),
      hasChain: false,
    },
    {
      icon: '🌿',
      title: t('home.story3_title'),
      quote: t('home.story3_quote'),
      body: t('home.story3_body'),
      hasChain: false,
    },
    {
      icon: '📊',
      title: t('home.story4_title'),
      quote: t('home.story4_quote'),
      body: t('home.story4_body'),
      hasChain: true,
    },
  ];

  return (
    <div className="cursor-custom flex flex-col" ref={sectionRef}>
      <CustomCursor />

      {/* ═══════════ HERO — scroll-driven parallax ═══════════ */}
      <section className="relative min-h-screen overflow-hidden text-white">
        {/* Video — becomes more visible as user scrolls (opacity increases) */}
        <div className="hero-video-container" style={{ transform: `scale(${1 + heroProgress * 0.08})` }}>
          <video
            autoPlay muted loop playsInline
            onCanPlay={() => setVideoLoaded(true)}
            ref={(el) => { if (el) el.playbackRate = 0.5; }}
            className="transition-opacity duration-700"
            style={{ opacity: videoLoaded ? 0.35 + heroProgress * 0.45 : 0 }}
          >
            <source src="/videos/amazon-canopy.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-emerald-950/40 to-emerald-950/90" />
        </div>

        {/* Gradient Fallback */}
        <div className={`hero-gradient-fallback transition-opacity duration-1000 ${videoLoaded ? 'opacity-20' : 'opacity-100'}`} />

        {/* Mist layers — slow drifting fog */}
        <div className="mist-layer" style={{ '--mist-speed': '25s' } as React.CSSProperties} />
        <div className="mist-layer" style={{ '--mist-speed': '40s', opacity: 0.5 } as React.CSSProperties} />

        {/* Fireflies */}
        <Fireflies count={20} />

        {/* Parallax orbs — move opposite to scroll */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-24 top-[20%] h-[500px] w-[500px] rounded-full bg-emerald-500/8 blur-[100px]"
            style={{ transform: `translateY(${scrollY * -0.12}px)` }} />
          <div className="absolute -right-24 top-[35%] h-[400px] w-[400px] rounded-full bg-teal-400/8 blur-[80px]"
            style={{ transform: `translateY(${scrollY * -0.08}px)` }} />
        </div>

        {/* Hero content — moves up with scroll for parallax feel */}
        <div
          className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6"
          style={{ transform: `translateY(${scrollY * 0.35}px)`, opacity: 1 - heroProgress * 0.8 }}
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-accent font-medium backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Stellar Testnet
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="font-display glow-text text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block">{t('home.hero_title').split(' ').slice(0, 3).join(' ')}</span>
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                {t('home.hero_title').split(' ').slice(3).join(' ')}
              </span>
            </h1>

            <p className="font-body mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              {t('home.hero_subtitle')}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/setup"
                className="btn-primary inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-emerald-800 shadow-xl">
                {t('home.cta_setup')} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/demo"
                className="btn-secondary inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm">
                <Play className="h-5 w-5" /> {t('home.cta_demo')}
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-accent">{t('home.scroll_label')}</span>
            <ChevronDown className="scroll-indicator h-5 w-5 text-white/50" />
            <div className="scroll-line" />
          </div>
        </div>

        {/* Nature silhouette — tree line at bottom */}
        <div className="nature-silhouette" />
      </section>

      {/* ═══════════ STATS GRID ═══════════ */}
      <section className="relative bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="reveal mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              {t('home.stats_title')}
            </h2>
            <p className="font-body mt-3 text-gray-500">
              {t('home.stats_subtitle')}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="reveal stat-card interactive rounded-2xl border border-gray-100 bg-white p-6"
                  style={{ transitionDelay: `${i * 120}ms` }}>
                  <Icon className="h-6 w-6 text-emerald-500" />
                  <p className="mt-3 font-display text-3xl font-bold text-gray-900">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="stat-detail mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs leading-relaxed text-gray-500">{stat.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ STORYTELLING — Premium Timeline ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#011a13] via-emerald-950 to-[#011a13] px-4 py-28 text-white sm:px-6">
        {/* Ambient blurs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-emerald-800/20 blur-[120px]"
            style={{ transform: `translateY(${Math.max(0, (scrollY - 500)) * -0.04}px)` }} />
          <div className="absolute right-[10%] bottom-[20%] h-80 w-80 rounded-full bg-teal-800/15 blur-[120px]"
            style={{ transform: `translateY(${Math.max(0, (scrollY - 500)) * -0.06}px)` }} />
        </div>

        <Fireflies count={10} />

        <div className="relative mx-auto max-w-4xl">
          {/* Section header */}
          <div className="reveal mb-20 text-center">
            <p className="font-accent text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400/80">{t('home.story_origins')}</p>
            <h2 className="font-display mt-4 text-4xl font-bold glow-text sm:text-5xl">{t('home.story_title')}</h2>
            <p className="font-body mx-auto mt-4 max-w-lg text-sm text-emerald-300/50">
              {t('home.story_subtitle')}
            </p>
          </div>

          {/* Timeline */}
          <div className="timeline-container">
            <div className="timeline-track" />

            <div className="space-y-20 md:space-y-24">
              {timeline.map((step, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div key={i}
                    className={`${isLeft ? 'reveal-left' : 'reveal-right'} relative`}
                    style={{ transitionDelay: `${i * 180}ms` }}
                  >
                    {/* Mobile: vertical layout. Desktop: side-by-side */}
                    <div className={`flex flex-col items-start gap-6 md:flex-row md:items-center ${isLeft ? '' : 'md:flex-row-reverse'}`}>

                      {/* Node (on the timeline track) */}
                      <div className={`flex-shrink-0 ${isLeft ? 'md:ml-auto' : 'md:mr-auto'} relative z-10`}>
                        <div className="timeline-node">
                          <span className="text-2xl">{step.icon}</span>
                        </div>
                      </div>

                      {/* Card */}
                      <div className={`timeline-card flex-1 ${isLeft ? 'md:mr-8' : 'md:ml-8'}`}>
                        {/* Decorative quote */}
                        <div className={`decorative-quote ${isLeft ? '-left-3 -top-6' : '-right-3 -top-6'}`}>"</div>

                        <h3 className="font-display text-xl font-bold neon-accent">{step.title}</h3>

                        <blockquote className="mt-3 border-l-2 border-emerald-500/30 pl-4 font-body text-sm italic text-emerald-200/60">
                          {step.quote}
                        </blockquote>

                        <p className="font-body mt-4 text-sm leading-relaxed text-white/70">{step.body}</p>

                        {step.hasChain && (
                          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                            <LinkIcon className="h-3.5 w-3.5 chain-glow" />
                            {t('home.chain_badge')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="reveal mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              {t('home.features_title')}
            </h2>
            <p className="font-body mt-3 text-gray-500">
              {t('home.features_subtitle')}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i}
                  className="reveal-scale interactive group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-lg"
                  style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.desc}</p>
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                    <span className="font-display text-lg font-bold text-emerald-600">{feature.stat}</span>
                    <span className="text-xs text-gray-400">{feature.statLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ ARCHITECTURE ═══════════ */}
      <section className="bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="reveal">
            <h2 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl">{t('home.arch_title')}</h2>
            <p className="font-body mt-3 text-gray-600">{t('home.arch_subtitle')}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-4">
            {[
              { step: '1', title: t('home.arch1_title'), desc: t('home.arch1_desc'), icon: '🏘️', detail: t('home.arch1_detail') },
              { step: '2', title: t('home.arch2_title'), desc: t('home.arch2_desc'), icon: '👤', detail: t('home.arch2_detail') },
              { step: '3', title: t('home.arch3_title'), desc: t('home.arch3_desc'), icon: '🔏', detail: t('home.arch3_detail') },
              { step: '4', title: t('home.arch4_title'), desc: t('home.arch4_desc'), icon: '📊', detail: t('home.arch4_detail') },
            ].map((item, i) => (
              <div key={item.step} className="reveal-scale stat-card interactive rounded-xl bg-white p-6 shadow-sm" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="text-4xl leaf-float">{item.icon}</div>
                <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {t('home.arch_step')} {item.step}
                </div>
                <h4 className="mt-2 font-display font-semibold text-gray-900">{item.title}</h4>
                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                <div className="stat-detail mt-3 border-t border-gray-100 pt-3">
                  <p className="text-xs leading-relaxed text-gray-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TECH STACK ═══════════ */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="reveal text-center">
            <h2 className="font-display text-2xl font-bold text-gray-900">{t('home.tech_title')}</h2>
            <p className="font-body mt-2 text-sm text-gray-500">{t('home.tech_subtitle')}</p>
          </div>
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              { name: 'React 19', icon: Zap }, { name: 'TypeScript', icon: Lock },
              { name: 'Stellar SDK', icon: Globe }, { name: 'Vite 7', icon: Zap },
              { name: 'TailwindCSS 4', icon: Sparkles }, { name: 'Dexie.js', icon: WifiOff },
              { name: 'i18next', icon: Globe }, { name: 'React Hook Form', icon: ShieldCheck },
              { name: 'Zod', icon: Lock }, { name: 'Lucide Icons', icon: Sparkles },
            ].map((tech) => {
              const TIcon = tech.icon;
              return (
                <span key={tech.name}
                  className="interactive inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5">
                  <TIcon className="h-3.5 w-3.5 text-emerald-500" /> {tech.name}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-20 text-center text-white sm:px-6">
        <Fireflies count={12} />
        <div className="relative reveal mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {t('home.cta_title')}
          </h2>
          <p className="font-body mt-4 text-emerald-100/80">
            {t('home.cta_subtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/setup"
              className="btn-primary inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-emerald-800 shadow-xl">
              {t('home.cta_setup')} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/demo"
              className="btn-secondary inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white">
              <Play className="h-5 w-5" /> {t('home.cta_demo')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
