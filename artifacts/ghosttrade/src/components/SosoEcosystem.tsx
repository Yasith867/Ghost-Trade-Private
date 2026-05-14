import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Zap, Shield, BarChart2, Activity, Link2, ArrowRight, Layers, Coins, Globe, ChevronDown, ChevronUp } from "lucide-react";

interface SosoEcosystemProps {
  btcChange?: number;
  ethChange?: number;
}

function useLiveValue(base: number, seed: number, interval = 8000) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      const t = Date.now() / 1000;
      const noise = Math.sin(t * 0.15 + seed * 2.1) * 0.6 + Math.cos(t * 0.08 + seed * 0.9) * 0.4;
      setOffset(noise);
    }, interval);
    return () => clearInterval(iv);
  }, [seed, interval]);
  return base + offset;
}

function MiniSparkline({ trend, color, seed }: { trend: number; color: string; seed: number }) {
  const pts = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const noise = Math.sin(seed * 2.1 + i * 1.9) * 5 + Math.cos(seed * 0.8 + i * 2.7) * 3;
      const drift = trend * 1.0 * t * -1;
      const y = Math.max(2, Math.min(22, 12 + drift + noise));
      arr.push(`${i === 0 ? "M" : "L"} ${t * 90} ${y}`);
    }
    return arr.join(" ");
  }, [trend, seed]);
  return (
    <svg width="90" height="24" viewBox="0 0 90 24" className="opacity-70">
      <path d={pts} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const ECOSYSTEM_PRODUCTS = [
  {
    key: "sodex",
    label: "SoDEX",
    tagline: "Encrypted Index DEX",
    icon: Shield,
    color: "#10b981",
    purpose: "An FHE-inspired decentralized exchange prototype for SSI sector basket trading. Designed for privacy-first order flow — reducing strategy exposure between traders and on-chain observers.",
    role: "Conceptual execution layer for SSI index strategies. Designed to let traders rotate between sectors with minimal strategy visibility — a prototype for private on-chain trading.",
    tvl: 48.2,
    volume: 12.7,
    activity: "Active",
    activityColor: "#10b981",
    metricLabel: "TVL",
    metricVal: "$48.2M",
    change: +2.4,
    narrative: "SoDEX volume tracks SSI rotation activity. When sector rotation accelerates, SoDEX privacy-simulation order flow increases — an FHE-inspired execution prototype.",
  },
  {
    key: "tokenbar",
    label: "TokenBar",
    tagline: "Tokenized Index Bar",
    icon: BarChart2,
    color: "#3b82f6",
    purpose: "Retail access layer for SSI sector exposure. Wraps SSI baskets into single ERC-20 tokens — enabling anyone to hold diversified sector exposure without managing multiple assets.",
    role: "Demand driver for SSI Protocol and SOSO token. Each TokenBar mint creates protocol revenue and increases SOSO staking demand. Currently supporting ssiMAG7, ssiAI, ssiDeFi bars.",
    tvl: 31.5,
    volume: 8.3,
    activity: "Growing",
    activityColor: "#3b82f6",
    metricLabel: "Volume",
    metricVal: "$12.7M",
    change: +5.1,
    narrative: "TokenBar minting correlates to retail SSI adoption. ssiMAG7 bar is the highest demand product — BTC/ETH basket exposure without custody complexity.",
  },
  {
    key: "ssi",
    label: "SSI Protocol",
    tagline: "Smart Sector Index Engine",
    icon: Activity,
    color: "#a855f7",
    purpose: "The core on-chain index protocol powering all SSI sectors. Dynamically weights constituent tokens based on market cap, liquidity, and sector momentum scoring — updated in real time.",
    role: "Foundation layer of the SoSoValue ecosystem. All SoDEX trades, TokenBar mints, and SOSO governance decisions reference SSI Protocol weightings. 9 live sector indexes.",
    tvl: 0,
    volume: 0,
    activity: "9 Live Indexes",
    activityColor: "#a855f7",
    metricLabel: "Indexes",
    metricVal: "9 Active",
    change: +1.2,
    narrative: "SSI Protocol dynamically rebalances sector weights every epoch. AI sector weighting increased 3.2% last cycle as TAO market cap expanded. DeFi stable at 22% of eligible universe.",
  },
  {
    key: "valuechain",
    label: "ValueChain",
    tagline: "On-Chain Index Rails",
    icon: Link2,
    color: "#f59e0b",
    purpose: "Settlement, custody, and finality infrastructure for the SSI ecosystem. Handles cross-chain index delivery, permit-based decryption handoffs, and on-chain audit trails for index strategies.",
    role: "The settlement backbone connecting SoDEX execution to TokenBar custody and SSI Protocol rebalancing. Handles index finality, permit resolution, and cross-chain strategy delivery.",
    tvl: 0,
    volume: 0,
    activity: "24.3K TX/day",
    activityColor: "#f59e0b",
    metricLabel: "TX/day",
    metricVal: "24.3K",
    change: +3.8,
    narrative: "ValueChain settlement volume correlates to SoDEX activity. Rising TX/day signals increasing SSI strategy execution and index rotation across all sectors.",
  },
];

export default function SosoEcosystem({ btcChange = 0, ethChange = 0 }: SosoEcosystemProps) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const sosoBase = 0.0427;
  const sosoLive = useLiveValue(sosoBase, 7);
  const sosoChange = btcChange * 0.62 + ethChange * 0.28 + 0.4;
  const sosoMcap = useLiveValue(42.7, 11);
  const sosoVol = useLiveValue(8.3, 3);
  const sosoDexCorr = 0.62;
  const sosoSSIAdoption = useLiveValue(73, 5);
  const sosoStakers = useLiveValue(12840, 9);
  const sosoEcosystemScore = useMemo(() => {
    const score = 50 + (btcChange * 0.4 + ethChange * 0.2) * 5;
    return Math.min(95, Math.max(15, score));
  }, [btcChange, ethChange]);

  const up = sosoChange >= 0;

  const sosoNarrative = useMemo(() => {
    if (sosoChange > 2) return "SOSO token surging alongside elevated SSI adoption. SoDEX volume and TokenBar mints both positive — ecosystem momentum at cycle highs.";
    if (sosoChange > 0) return "SOSO ecosystem activity expanding. SSI rotation driving incremental SoDEX volume. TokenBar demand steady with protocol fundamentals intact.";
    if (sosoChange > -1) return "SOSO token consolidating. SoDEX order flow reducing. SSI sector rotation slowing — watch for resumed momentum as sector leaders stabilize.";
    return "SOSO token under pressure alongside broader sector weakness. Ecosystem usage metrics softening. Monitor SSI sector recovery for re-entry signal.";
  }, [sosoChange]);

  return (
    <div className="space-y-6">

      {/* SOSO Token Intelligence Panel */}
      <div className="rounded-2xl border relative overflow-hidden"
        style={{ borderColor: "rgba(59,130,246,0.25)", background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(168,85,247,0.04) 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/35 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                <span className="text-xs font-black text-blue-400">S</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-black text-white/90">SOSO</span>
                  <span className="text-[8px] font-mono text-muted-foreground/40 bg-white/4 border border-white/8 rounded px-1.5 py-0.5">SoSoValue Governance</span>
                </div>
                <div className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">Governance · Utility · SSI Adoption Driver · SoDEX Fee Capture</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-black text-white/90">${sosoLive.toFixed(4)}</div>
              <div className={`flex items-center gap-0.5 text-[11px] font-mono font-bold justify-end mt-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {up ? "+" : ""}{sosoChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* SOSO Stats Grid */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "MARKET CAP", value: `$${sosoMcap.toFixed(1)}M`, sub: "circulating" },
              { label: "24H VOLUME", value: `$${sosoVol.toFixed(1)}M`, sub: "trading volume" },
              { label: "SSI ADOPTION", value: `${sosoSSIAdoption.toFixed(0)}%`, sub: "ecosystem usage" },
              { label: "STAKERS", value: sosoStakers.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","), sub: "governance active" },
            ].map((s) => (
              <div key={s.label} className="bg-black/30 rounded-xl p-3 border border-white/5">
                <div className="text-[7px] font-mono text-muted-foreground/35 tracking-wider mb-1">{s.label}</div>
                <div className="text-sm font-mono font-black text-white/85">{s.value}</div>
                <div className="text-[7px] font-mono text-muted-foreground/25 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Ecosystem Score */}
          <div className="rounded-xl border border-white/6 bg-black/20 p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">Ecosystem Momentum Score</span>
              <span className="text-[11px] font-mono font-black text-blue-400">{sosoEcosystemScore.toFixed(0)} / 100</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${sosoEcosystemScore}%`, background: sosoEcosystemScore > 65 ? "linear-gradient(90deg, #3b82f6, #10b981)" : sosoEcosystemScore > 40 ? "linear-gradient(90deg, #f59e0b, #3b82f6)" : "linear-gradient(90deg, #ef4444, #f59e0b)" }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[7px] font-mono text-muted-foreground/25">SoDEX vol · SSI adoption · TokenBar demand</span>
              <span className="text-[7px] font-mono text-muted-foreground/25">{sosoEcosystemScore > 65 ? "STRONG" : sosoEcosystemScore > 40 ? "MODERATE" : "WEAK"}</span>
            </div>
          </div>

          {/* Activity metrics */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-center">
              <div className="text-[7px] font-mono text-muted-foreground/30 tracking-wider mb-1">SoDEX CORR.</div>
              <div className="text-[13px] font-mono font-bold text-blue-400">{sosoDexCorr}</div>
              <div className="text-[7px] font-mono text-muted-foreground/25">SOSO↔SoDEX vol</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-center">
              <div className="text-[7px] font-mono text-muted-foreground/30 tracking-wider mb-1">SSI INDEXES</div>
              <div className="text-[13px] font-mono font-bold text-purple-400">9</div>
              <div className="text-[7px] font-mono text-muted-foreground/25">live & weighted</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-center">
              <div className="text-[7px] font-mono text-muted-foreground/30 tracking-wider mb-1">PROTOCOL REV.</div>
              <div className="text-[13px] font-mono font-bold text-emerald-400">{up ? "↑" : "↓"}</div>
              <div className="text-[7px] font-mono text-muted-foreground/25">{up ? "Expanding" : "Compressing"}</div>
            </div>
          </div>

          {/* SOSO Narrative */}
          <div className="rounded-xl border border-blue-500/12 bg-blue-500/4 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-2.5 h-2.5 text-blue-400/60" />
              <span className="text-[7px] font-mono text-blue-400/50 uppercase tracking-widest">GhostAI Ecosystem Read</span>
            </div>
            <p className="text-[10px] font-mono text-foreground/55 leading-relaxed">{sosoNarrative}</p>
          </div>
        </div>
      </div>

      {/* Ecosystem Products */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Ecosystem Products — Click to Inspect</span>
        </div>
        <div className="space-y-2">
          {ECOSYSTEM_PRODUCTS.map((p) => {
            const Icon = p.icon;
            const isOpen = expandedProduct === p.key;
            const upChange = p.change >= 0;
            return (
              <div key={p.key}>
                <button
                  className="w-full rounded-2xl border p-4 relative overflow-hidden text-left transition-all duration-200 hover:scale-[1.005]"
                  style={{
                    borderColor: isOpen ? `${p.color}35` : `${p.color}20`,
                    background: isOpen ? `linear-gradient(135deg, ${p.color}09 0%, transparent 60%)` : `${p.color}06`,
                  }}
                  onClick={() => setExpandedProduct(isOpen ? null : p.key)}
                >
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.color}50, transparent)` }} />

                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0" style={{ borderColor: `${p.color}25`, background: `${p.color}12` }}>
                      <Icon className="w-4 h-4" style={{ color: p.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono font-black text-white/85">{p.label}</span>
                        <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: `${p.activityColor}25`, color: p.activityColor, background: `${p.activityColor}08` }}>{p.activity}</span>
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground/35">{p.tagline}</div>
                    </div>

                    <MiniSparkline trend={p.change} color={p.color} seed={p.key.charCodeAt(0)} />

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono font-bold" style={{ color: `${p.color}cc` }}>{p.metricVal}</div>
                      <div className={`text-[9px] font-mono font-bold ${upChange ? "text-emerald-400" : "text-red-400"}`}>{upChange ? "+" : ""}{p.change}%</div>
                    </div>

                    <div className="text-muted-foreground/30 shrink-0">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="rounded-2xl border p-5 mt-2 mb-1 relative overflow-hidden"
                    style={{ borderColor: `${p.color}25`, background: `linear-gradient(135deg, ${p.color}06 0%, transparent 70%)` }}>
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.color}50, transparent)` }} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-[8px] font-mono uppercase tracking-widest mb-2" style={{ color: `${p.color}80` }}>Purpose</div>
                        <p className="text-[10px] font-mono text-foreground/60 leading-relaxed">{p.purpose}</p>
                      </div>
                      <div>
                        <div className="text-[8px] font-mono uppercase tracking-widest mb-2" style={{ color: `${p.color}80` }}>Role in Ecosystem</div>
                        <p className="text-[10px] font-mono text-foreground/60 leading-relaxed">{p.role}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-black/20 p-3" style={{ borderColor: `${p.color}15` }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Zap className="w-2.5 h-2.5" style={{ color: `${p.color}80` }} />
                        <span className="text-[7px] font-mono uppercase tracking-widest" style={{ color: `${p.color}60` }}>Market Intelligence</span>
                      </div>
                      <p className="text-[10px] font-mono text-foreground/55 leading-relaxed">{p.narrative}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ecosystem Flow Diagram */}
      <div className="rounded-2xl border border-white/6 bg-black/30 p-5">
        <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-4">Ecosystem Capital Flow</div>
        <div className="flex items-center justify-between gap-2">
          {[
            { label: "SSI Protocol", sub: "Index weights", color: "#a855f7" },
            { label: "→", sub: "", color: "transparent" },
            { label: "SoDEX", sub: "Privacy DEX", color: "#10b981" },
            { label: "→", sub: "", color: "transparent" },
            { label: "TokenBar", sub: "Retail access", color: "#3b82f6" },
            { label: "→", sub: "", color: "transparent" },
            { label: "SOSO", sub: "Fee capture", color: "#f59e0b" },
          ].map((node, i) => (
            <div key={i} className={`${node.color === "transparent" ? "text-muted-foreground/20 text-lg font-mono" : "flex-1 rounded-xl border p-2 text-center"}`}
              style={node.color !== "transparent" ? { borderColor: `${node.color}20`, background: `${node.color}07` } : {}}>
              {node.color !== "transparent" ? (
                <>
                  <div className="text-[9px] font-mono font-bold" style={{ color: node.color }}>{node.label}</div>
                  <div className="text-[7px] font-mono text-muted-foreground/30 mt-0.5">{node.sub}</div>
                </>
              ) : "→"}
            </div>
          ))}
        </div>
        <p className="text-[9px] font-mono text-muted-foreground/35 mt-3 leading-relaxed">SSI Protocol defines sector weights → SoDEX handles privacy-inspired sector trades → TokenBar wraps exposures into ERC-20 tokens → SOSO captures protocol fees and governance power. Every SSI rotation creates activity across all four layers.</p>
      </div>
    </div>
  );
}
