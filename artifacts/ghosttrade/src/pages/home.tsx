import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Shield, BrainCircuit, BarChart3, Thermometer, Coins, Lock, Zap,
  ArrowRight, Radio, ExternalLink, Activity, BookOpen,
} from "lucide-react";
import Layout from "@/components/Layout";

const FEATURES = [
  { icon: BrainCircuit, title: "GhostAI",           desc: "Cloudflare Workers AI streaming intelligence with full market context injection.", color: "#10b981", href: "/ghostai" },
  { icon: BarChart3,    title: "SSI Indexes",        desc: "SoSoValue-style smart sector indexes: ssiMAG7, ssiAI, ssiDeFi, ssiL1, and more.", color: "#3b82f6", href: "/ssi" },
  { icon: Thermometer,  title: "Sector Rotation",    desc: "Real-time sector heatmap with 8 sectors powered by live CoinGecko data.", color: "#a855f7", href: "/sectors" },
  { icon: Lock,         title: "Private Signals",    desc: "FHE-encrypted analysis — strategies stay encrypted end-to-end, no on-chain exposure.", color: "#f59e0b", href: "/terminal" },
  { icon: Coins,        title: "SOSO Ecosystem",     desc: "SOSO token, SoDEX, TokenBar, SSI Protocol, and ValueChain all in one view.", color: "#06b6d4", href: "/ecosystem" },
  { icon: Shield,       title: "Private Portfolio",  desc: "FHE-encrypted holdings with live P&L and SSI sector allocation breakdown.", color: "#8b5cf6", href: "/portfolio" },
  { icon: Activity,     title: "Private Watchlists", desc: "Encrypted token watchlists hidden from on-chain observers and MEV bots.", color: "#f97316", href: "/watchlists" },
];

const LIVE_NARRATIVES = [
  "ssiMAG7 holding +0.7% — BTC & ETH momentum intact",
  "DeFi sector rotating up — UNI, AAVE showing strength",
  "AI sector correcting after overbought signal — watch TAO",
  "Layer1 correlation with BTC at 0.91 — index tracking tight",
  "FHE pipeline processing encrypted strategies silently",
  "Capital flowing from NFT → RWA — institutional signal",
  "GhostAI: Sector rotation to DeFi confirmed — SSI trigger",
  "ssiLayer1 +0.5% — SOL & AVAX both positive 24h",
  "Meme sector cooling — high beta exposure warning",
  "SoDEX volume uptick — encrypted execution rising",
  "GameFi underperforming all SSI indexes — reduce exposure",
  "RWA sector gaining traction — ondo-finance +2.1%",
];

const PRIVATE_ENGINE_FEATURES = [
  { label: "Encrypted Watchlists",       desc: "Token positions hidden from MEV bots" },
  { label: "Encrypted Signals",          desc: "Buy/sell logic runs on ciphertext" },
  { label: "Confidential Strategies",    desc: "Zero on-chain exposure to observers" },
  { label: "FHE-Protected Analytics",    desc: "Analysis stays private end-to-end" },
];

function useTicker(items: string[], interval = 3600) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx(i => (i + 1) % items.length); setFade(true); }, 280);
    }, interval);
    return () => clearInterval(iv);
  }, [items.length, interval]);
  return { text: items[idx], fade };
}

function FeatureCard({ icon: Icon, title, desc, color, href, delay }: typeof FEATURES[0] & { delay: number }) {
  return (
    <Link href={href}
      className="block rounded-2xl border p-5 cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        borderColor: `${color}20`,
        background: `linear-gradient(135deg, ${color}06 0%, transparent 60%)`,
        animation: `fadeUp 0.6s ease both ${delay}ms`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300 opacity-40 group-hover:opacity-80"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
        style={{ background: `${color}12`, border: `1px solid ${color}25`, boxShadow: `0 0 16px ${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-sm font-mono font-bold text-white/85 mb-1.5">{title}</div>
      <div className="text-[11px] font-mono text-muted-foreground/45 leading-relaxed">{desc}</div>
      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[9px] font-mono tracking-wider" style={{ color }}>Open</span>
        <ArrowRight className="w-2.5 h-2.5" style={{ color }} />
      </div>
    </Link>
  );
}

export default function Home() {
  const { text, fade } = useTicker(LIVE_NARRATIVES, 3600);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <Layout>
      <style>{`
        @keyframes homePulse {
          0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.08; }
          50% { transform: translate(-50%,-50%) scale(1.18); opacity: 0.14; }
        }
        @keyframes heroTextGlow {
          0%,100% { text-shadow: 0 0 40px rgba(16,185,129,0.3), 0 0 80px rgba(16,185,129,0.1); }
          50% { text-shadow: 0 0 70px rgba(16,185,129,0.55), 0 0 140px rgba(16,185,129,0.2), 0 0 220px rgba(16,185,129,0.08); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanPulse {
          0%,100% { opacity: 0.03; }
          50% { opacity: 0.055; }
        }
        @keyframes orbitA {
          from { transform: rotate(0deg) translateX(180px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(180px) rotate(-360deg); }
        }
        @keyframes orbitB {
          from { transform: rotate(120deg) translateX(140px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(140px) rotate(-480deg); }
        }
        @keyframes orbitC {
          from { transform: rotate(240deg) translateX(220px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(220px) rotate(-600deg); }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">

        {/* ── Ambient background ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)", animation: "homePulse 7s ease-in-out infinite", transform: "translate(-50%,-50%)" }} />
          <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", animation: "homePulse 10s ease-in-out infinite reverse" }} />
          <div className="absolute bottom-1/4 right-1/4 w-[280px] h-[280px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(168,85,246,0.05) 0%, transparent 70%)", animation: "homePulse 8s ease-in-out infinite 2s" }} />
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(16,185,129,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.025) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            animation: "scanPulse 6s ease-in-out infinite",
          }} />
        </div>

        {/* ── Hero ── */}
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center">

          {/* Orbital ring decorations */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="relative w-1 h-1">
              <div className="absolute w-2 h-2 rounded-full bg-primary/30" style={{ animation: "orbitA 18s linear infinite" }} />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/25" style={{ animation: "orbitB 24s linear infinite" }} />
              <div className="absolute w-1 h-1 rounded-full bg-purple-400/20" style={{ animation: "orbitC 32s linear infinite" }} />
            </div>
          </div>

          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2 mb-10 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm"
            style={{ animation: "fadeUp 0.4s ease both 100ms" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-[9px] font-mono text-primary/70 tracking-widest uppercase">
              Live · AI-Powered · SoSoValue Ecosystem
            </span>
          </div>

          {/* Title */}
          <div
            className="relative mb-5 select-none"
            style={{ animation: "fadeUp 0.6s ease both 200ms" }}
          >
            <h1
              className="font-black tracking-tight leading-[0.9] pb-2"
              style={{
                fontSize: "clamp(64px, 10vw, 144px)",
                background: "linear-gradient(135deg, #ffffff 0%, #10b981 40%, #3b82f6 70%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: mounted
                  ? "heroTextGlow 5s ease-in-out infinite, fadeUp 0.6s ease both 200ms"
                  : "fadeUp 0.6s ease both 200ms",
              }}
            >
              Ghost Trade
            </h1>
          </div>

          {/* Subtitle */}
          <p
            className="text-base font-mono text-muted-foreground/55 mb-2 tracking-wide max-w-lg"
            style={{ animation: "fadeUp 0.6s ease both 350ms" }}
          >
            Private SoSoValue Intelligence Terminal
          </p>
          <p
            className="text-sm font-mono text-muted-foreground/30 max-w-md mb-12 leading-relaxed"
            style={{ animation: "fadeUp 0.6s ease both 440ms" }}
          >
            FHE-encrypted strategies · Live SSI sector indexes · Cloudflare AI intelligence · Zero on-chain exposure
          </p>

          {/* CTAs */}
          <div
            className="flex items-center gap-4 flex-wrap justify-center mb-14"
            style={{ animation: "fadeUp 0.6s ease both 530ms" }}
          >
            <Link href="/terminal"
              className="group relative flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-mono font-bold text-sm text-black bg-primary hover:bg-primary/85 transition-all duration-200 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_55px_rgba(16,185,129,0.55)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Shield className="w-4 h-4 shrink-0" />
              Enter Terminal
            </Link>
            <Link href="/ghostai"
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-mono font-bold text-sm text-primary border border-primary/30 bg-primary/6 hover:border-primary/60 hover:bg-primary/12 transition-all duration-200">
              <BrainCircuit className="w-4 h-4 shrink-0" />
              Launch GhostAI
            </Link>
          </div>

          {/* Live intel ticker */}
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-white/6 bg-black/40 backdrop-blur-sm w-full max-w-md"
            style={{ animation: "fadeUp 0.6s ease both 620ms" }}
          >
            <Radio className="w-3 h-3 text-primary/50 animate-pulse shrink-0" />
            <span className="text-[8px] font-mono text-primary/50 uppercase tracking-widest shrink-0">LIVE INTEL</span>
            <p
              className="text-[10px] font-mono text-foreground/45 truncate transition-all duration-280"
              style={{ opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(-3px)" }}
            >
              {text}
            </p>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20"
            style={{ animation: "fadeUp 0.6s ease both 900ms" }}>
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-primary/60" />
            <div className="text-[8px] font-mono text-primary/60 tracking-widest uppercase">Scroll</div>
          </div>
        </section>

        {/* ── Feature Grid ── */}
        <section className="relative px-8 py-20 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[9px] font-mono text-primary/50 uppercase tracking-widest mb-3">Platform Features</div>
            <h2 className="text-3xl font-mono font-black text-white/85">Intelligence. Privacy. Edge.</h2>
            <p className="text-sm font-mono text-muted-foreground/40 mt-2 max-w-lg mx-auto">
              Every feature is built around SoSoValue's SSI index ecosystem with FHE-grade privacy.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 80} />
            ))}
          </div>
        </section>

        {/* ── Private Intelligence Engine ── */}
        <section className="relative px-8 py-20">
          <div className="max-w-4xl mx-auto rounded-2xl border border-purple-500/20 p-10 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(0,0,0,0.6) 100%)" }}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="w-12 h-12 rounded-xl bg-purple-500/12 border border-purple-500/25 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-mono font-black text-white/85 mb-3">Private Intelligence Engine</h2>
            <p className="text-sm font-mono text-muted-foreground/45 max-w-xl mx-auto mb-8 leading-relaxed">
              Every signal, watchlist, and strategy runs through an FHE-protected pipeline. Your on-chain footprint stays invisible — no MEV exposure, no front-running risk.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {PRIVATE_ENGINE_FEATURES.map(item => (
                <div key={item.label} className="rounded-xl p-3.5 border border-purple-500/12 bg-purple-500/4 text-left">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 mb-2" />
                  <div className="text-[10px] font-mono font-bold text-purple-300/70 mb-1 leading-snug">{item.label}</div>
                  <div className="text-[9px] font-mono text-muted-foreground/35 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/judges"
              className="inline-flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/35 hover:text-primary/60 transition-colors border border-white/8 hover:border-primary/20 rounded-lg px-3 py-1.5">
              <BookOpen className="w-2.5 h-2.5" />
              Technical FHE documentation for judges & developers
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative px-8 py-12 border-t border-white/5">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-mono font-black text-white/80">Ghost Trade <span className="text-primary/60">Private</span></div>
                <div className="text-[8px] font-mono text-muted-foreground/30">SoSoValue Intelligence Terminal · AI-powered</div>
              </div>
            </div>
            <div className="flex items-center gap-5 flex-wrap justify-center">
              {[
                { label: "SoSoValue", href: "#" },
                { label: "SoDEX",     href: "#" },
                { label: "SSI Protocol", href: "#" },
                { label: "GitHub",    href: "#" },
              ].map(l => (
                <a key={l.label} href={l.href}
                  className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/35 hover:text-muted-foreground/70 transition-colors">
                  {l.label} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              ))}
              <Link href="/judges"
                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/30 hover:text-primary/60 transition-colors">
                <BookOpen className="w-2.5 h-2.5 opacity-50" /> Judges & Developers
              </Link>
            </div>
            <div className="text-[8px] font-mono text-muted-foreground/20">
              © 2026 Ghost Trade · All strategies FHE-encrypted
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}
