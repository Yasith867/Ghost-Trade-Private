import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, TrendingDown, Activity, Zap, X, ArrowRight, ArrowDown, ArrowUp, Shield, ChevronDown, ChevronUp } from "lucide-react";
import Layout from "@/components/Layout";
import SsiIndexBoard from "@/components/SsiIndexBoard";
import { apiUrl } from "@/lib/api";

interface SsiDef {
  key: string;
  label: string;
  desc: string;
  color: string;
  emoji: string;
  btcCorr: number;
  risk: string;
  riskColor: string;
  tokens: { symbol: string; weight: number }[];
  purpose: string;
}

const SSI_DEFS: SsiDef[] = [
  {
    key: "ssiMAG7", label: "ssiMAG7", desc: "Mega Cap Weighted — BTC + ETH composite",
    color: "#3b82f6", emoji: "🏔", btcCorr: 0.95, risk: "LOW", riskColor: "#10b981",
    tokens: [{ symbol: "BTC", weight: 70 }, { symbol: "ETH", weight: 30 }],
    purpose: "The benchmark index. Tracks the two largest assets by market cap — the primary capital reservoir of crypto markets. Institutional allocation baseline.",
  },
  {
    key: "ssiAI", label: "ssiAI", desc: "AI Ecosystem — RNDR, FET, TAO, AKT, WLD",
    color: "#10b981", emoji: "🤖", btcCorr: 0.78, risk: "HIGH", riskColor: "#f59e0b",
    tokens: [{ symbol: "TAO", weight: 25 }, { symbol: "RNDR", weight: 25 }, { symbol: "FET", weight: 20 }, { symbol: "AKT", weight: 15 }, { symbol: "WLD", weight: 15 }],
    purpose: "Tracks decentralized AI infrastructure and compute networks. TAO leads model training incentives, RNDR powers GPU rendering, FET enables autonomous AI agents.",
  },
  {
    key: "ssiDeFi", label: "ssiDeFi", desc: "DeFi Protocol — UNI, AAVE, MKR, COMP, CRV",
    color: "#a855f7", emoji: "🔗", btcCorr: 0.82, risk: "MEDIUM", riskColor: "#f59e0b",
    tokens: [{ symbol: "UNI", weight: 25 }, { symbol: "AAVE", weight: 25 }, { symbol: "MKR", weight: 20 }, { symbol: "COMP", weight: 15 }, { symbol: "CRV", weight: 15 }],
    purpose: "Protocol revenue and TVL composite. AAVE leads lending, MKR governs DAI stablecoin, UNI tracks DEX swap volume. Primary capital flow indicator for DeFi activity.",
  },
  {
    key: "ssiLayer1", label: "ssiLayer1", desc: "Layer 1 Networks — ETH, SOL, AVAX, APT, SUI",
    color: "#f59e0b", emoji: "⛓", btcCorr: 0.88, risk: "MEDIUM", riskColor: "#f59e0b",
    tokens: [{ symbol: "ETH", weight: 35 }, { symbol: "SOL", weight: 30 }, { symbol: "AVAX", weight: 15 }, { symbol: "APT", weight: 10 }, { symbol: "SUI", weight: 10 }],
    purpose: "Tracks L1 blockchain networks by validator economics and on-chain activity. ETH leads smart contract settlement, SOL dominates high-frequency transaction volume.",
  },
  {
    key: "ssiMeme", label: "ssiMeme", desc: "Meme Sector — DOGE, SHIB, PEPE, WIF",
    color: "#f97316", emoji: "💊", btcCorr: 0.65, risk: "VERY HIGH", riskColor: "#ef4444",
    tokens: [{ symbol: "DOGE", weight: 45 }, { symbol: "SHIB", weight: 30 }, { symbol: "PEPE", weight: 15 }, { symbol: "WIF", weight: 10 }],
    purpose: "Retail sentiment and speculative appetite index. DOGE anchors institutional meme exposure, PEPE and WIF track newer speculative cycles. High volatility, low correlation to fundamentals.",
  },
  {
    key: "ssiRWA", label: "ssiRWA", desc: "Real World Assets — ONDO, MKR, REAL",
    color: "#06b6d4", emoji: "🏦", btcCorr: 0.42, risk: "LOW", riskColor: "#10b981",
    tokens: [{ symbol: "ONDO", weight: 40 }, { symbol: "MKR", weight: 35 }, { symbol: "REAL", weight: 25 }],
    purpose: "Tokenized real-world asset adoption. ONDO leads T-bill tokenization, MKR governs real asset collateral. Lowest BTC correlation — acts as a hedge during crypto-specific drawdowns.",
  },
  {
    key: "ssiSocialFi", label: "ssiSocialFi", desc: "Social Finance — emerging tokens",
    color: "#ec4899", emoji: "💬", btcCorr: 0.55, risk: "VERY HIGH", riskColor: "#ef4444",
    tokens: [{ symbol: "DESO", weight: 50 }, { symbol: "FRIEND", weight: 30 }, { symbol: "RALLY", weight: 20 }],
    purpose: "Social token participation and creator economy metrics. Tracks monetized social graphs and creator monetization protocols. Early-stage, high-risk sector with narrative-driven moves.",
  },
];

function computeRotationSignal(sectorChange: number, btcChange: number): "INFLOW" | "OUTFLOW" | "NEUTRAL" {
  const diff = sectorChange - btcChange;
  if (diff > 0.8) return "INFLOW";
  if (diff < -0.8) return "OUTFLOW";
  return "NEUTRAL";
}

function computeMomentumScore(change: number): number {
  return Math.min(100, Math.max(0, 50 + change * 8));
}

function generateNarrative(ssi: SsiDef, change: number, btcChange: number): string {
  const rotation = computeRotationSignal(change, btcChange);
  const leader = ssi.tokens[0].symbol;
  const second = ssi.tokens[1]?.symbol;
  const up = change >= 0;

  if (ssi.key === "ssiMAG7") {
    return `${ssi.label} ${up ? "holding positive" : "under pressure"} at ${change >= 0 ? "+" : ""}${change.toFixed(2)}% 24h. BTC-ETH composite ${rotation === "INFLOW" ? "outperforming altcoin sector" : rotation === "OUTFLOW" ? "lagging sector rotation" : "tracking inline with broader market"}. Institutional baseline ${up ? "supporting" : "softening"}.`;
  }
  if (ssi.key === "ssiAI") {
    return `${leader} ${up ? "leading" : "dragging"} ssiAI ${up ? "upward" : "lower"} — AI compute demand ${up ? "accelerating" : "cooling"}. ${second} GPU rendering network ${rotation === "INFLOW" ? "attracting fresh capital inflows" : rotation === "OUTFLOW" ? "seeing rotation out" : "range-bound"}. Sector ${rotation === "INFLOW" ? "outperforming" : rotation === "OUTFLOW" ? "underperforming" : "pacing"} BTC.`;
  }
  if (ssi.key === "ssiDeFi") {
    return `ssiDeFi protocol revenue ${up ? "expanding" : "contracting"} — ${leader} and ${second} leading ${up ? "TVL inflows" : "TVL outflows"}. Capital ${rotation === "INFLOW" ? "rotating into DeFi from speculative sectors" : rotation === "OUTFLOW" ? "rotating out toward L1 and MAG7" : "stable across DeFi protocols"}. MKR DAI metrics ${up ? "healthy" : "under watch"}.`;
  }
  if (ssi.key === "ssiLayer1") {
    return `L1 network activity ${up ? "rising" : "softening"} — ${leader} validator economics ${up ? "strengthening" : "weakening"}, ${second} high-frequency volume ${up ? "scaling" : "declining"}. Capital ${rotation === "INFLOW" ? "flowing into L1 blockspace" : rotation === "OUTFLOW" ? "exiting L1 toward MAG7 safety" : "stable across L1 networks"}. BTC correlation 0.88 — closely tracking benchmark.`;
  }
  if (ssi.key === "ssiMeme") {
    return `Retail appetite ${up ? "heating up" : "cooling off"} — ssiMeme ${up ? "+" : ""}${change.toFixed(2)}% signals ${up ? "risk-on speculative flow" : "risk-off rotation out of high-beta"}. ${leader} leads meme exposure. ${rotation === "OUTFLOW" ? "Capital rotating from Meme into RWA and DeFi — defensive repositioning." : rotation === "INFLOW" ? "Fresh speculative capital entering meme sector — elevated short-term risk." : "Meme sector range-bound, retail indecision."}`;
  }
  if (ssi.key === "ssiRWA") {
    return `ssiRWA ${up ? "gaining" : "softening"} — ${leader} T-bill tokenization ${up ? "attracting institutional flows" : "pausing"}. Lowest BTC correlation (0.42) — acting as ${rotation === "INFLOW" ? "defensive haven, capital rotating in from volatile sectors" : "stable allocation"}. Real-world asset adoption ${up ? "accelerating" : "steady"}.`;
  }
  return `${ssi.label} ${up ? "positive" : "negative"} — ${leader} ${up ? "leading gains" : "under pressure"}. ${rotation === "INFLOW" ? "Sector attracting capital inflows above BTC baseline." : rotation === "OUTFLOW" ? "Underperforming BTC, rotation risk elevated." : "Pacing inline with benchmark."}`;
}

interface DetailPanelProps {
  ssi: SsiDef;
  change: number;
  btcChange: number;
  onClose: () => void;
}

function DetailPanel({ ssi, change, btcChange, onClose }: DetailPanelProps) {
  const up = change >= 0;
  const momentum = computeMomentumScore(change);
  const rotation = computeRotationSignal(change, btcChange);
  const narrative = generateNarrative(ssi, change, btcChange);

  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden mt-2 mb-4"
      style={{ borderColor: `${ssi.color}30`, background: `linear-gradient(135deg, ${ssi.color}08 0%, transparent 70%)` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${ssi.color}60, transparent)` }} />

      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ssi.emoji}</span>
          <div>
            <div className="text-sm font-mono font-black text-white/90">{ssi.label} — Intelligence Panel</div>
            <div className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">{ssi.desc}</div>
          </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center hover:border-white/25 text-muted-foreground/40 hover:text-white/60 transition-all">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Token Composition */}
        <div className="space-y-2">
          <div className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">Sector Composition</div>
          <div className="space-y-1.5">
            {ssi.tokens.map((t, i) => (
              <div key={t.symbol} className="flex items-center gap-2">
                <div className="text-[10px] font-mono font-bold w-12" style={{ color: ssi.color }}>{t.symbol}</div>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.weight}%`, backgroundColor: ssi.color, opacity: 1 - i * 0.12 }} />
                </div>
                <div className="text-[9px] font-mono text-muted-foreground/50 w-8 text-right">{t.weight}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/6 bg-black/30 p-3">
            <div className="text-[7px] font-mono text-muted-foreground/35 uppercase tracking-widest mb-1.5">Momentum</div>
            <div className="text-base font-mono font-black" style={{ color: ssi.color }}>{momentum.toFixed(0)}</div>
            <div className="text-[7px] font-mono text-muted-foreground/25 mt-0.5">/ 100 score</div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${momentum}%`, backgroundColor: ssi.color }} />
            </div>
          </div>

          <div className="rounded-xl border border-white/6 bg-black/30 p-3">
            <div className="text-[7px] font-mono text-muted-foreground/35 uppercase tracking-widest mb-1.5">BTC Correlation</div>
            <div className="text-base font-mono font-black text-white/80">{ssi.btcCorr.toFixed(2)}</div>
            <div className="text-[7px] font-mono text-muted-foreground/25 mt-0.5">coefficient</div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full bg-blue-400/60 transition-all duration-700" style={{ width: `${ssi.btcCorr * 100}%` }} />
            </div>
          </div>

          <div className="rounded-xl border border-white/6 bg-black/30 p-3">
            <div className="text-[7px] font-mono text-muted-foreground/35 uppercase tracking-widest mb-1.5">Capital Flow</div>
            <div className={`flex items-center gap-1 mt-1 ${rotation === "INFLOW" ? "text-emerald-400" : rotation === "OUTFLOW" ? "text-red-400" : "text-muted-foreground/50"}`}>
              {rotation === "INFLOW" ? <ArrowDown className="w-3.5 h-3.5" /> : rotation === "OUTFLOW" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-mono font-bold">{rotation}</span>
            </div>
            <div className="text-[7px] font-mono text-muted-foreground/25 mt-1">vs BTC baseline</div>
          </div>

          <div className="rounded-xl border border-white/6 bg-black/30 p-3">
            <div className="text-[7px] font-mono text-muted-foreground/35 uppercase tracking-widest mb-1.5">Risk Level</div>
            <div className="text-[10px] font-mono font-bold mt-1" style={{ color: ssi.riskColor }}>{ssi.risk}</div>
            <div className="flex items-center gap-0.5 mt-1.5">
              {["LOW", "MEDIUM", "HIGH", "VERY HIGH"].map((r, i) => (
                <div key={r} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i <= ["LOW", "MEDIUM", "HIGH", "VERY HIGH"].indexOf(ssi.risk) ? ssi.riskColor : "rgba(255,255,255,0.05)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 24h performance vs BTC */}
      <div className="rounded-xl border border-white/6 bg-black/20 p-3 mb-4">
        <div className="text-[8px] font-mono text-muted-foreground/35 uppercase tracking-widest mb-2">24h Performance vs BTC</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-muted-foreground/40">{ssi.label}</span>
            <span className={`text-[11px] font-mono font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{change.toFixed(2)}%</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-muted-foreground/40">BTC</span>
            <span className={`text-[11px] font-mono font-bold ${btcChange >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>{btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-muted-foreground/40">Delta</span>
            <span className={`text-[11px] font-mono font-bold ${change - btcChange >= 0 ? "text-blue-400" : "text-orange-400"}`}>{change - btcChange >= 0 ? "+" : ""}{(change - btcChange).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* AI Narrative */}
      <div className="rounded-xl border border-white/6 bg-black/20 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-2.5 h-2.5" style={{ color: ssi.color }} />
          <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: `${ssi.color}80` }}>Sector Intelligence</span>
        </div>
        <p className="text-[10px] font-mono text-foreground/60 leading-relaxed">{narrative}</p>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-[9px] font-mono text-muted-foreground/35 leading-relaxed">{ssi.purpose}</p>
      </div>
    </div>
  );
}

export default function SSIPage() {
  const [selectedSsi, setSelectedSsi] = useState<string | null>(null);

  const { data: allMarket } = useQuery<any[]>({
    queryKey: ["/api/market-data"],
    queryFn: () => fetch(apiUrl("/api/market-data")).then(r => r.json()),
    staleTime: 30_000,
  });

  const btc = allMarket?.find((a: any) => a.symbol === "BTC");
  const eth = allMarket?.find((a: any) => a.symbol === "ETH");
  const sol = allMarket?.find((a: any) => a.symbol === "SOL");

  const btcChange = btc?.change24h ?? 0;
  const ethChange = eth?.change24h ?? 0;
  const solChange = sol?.change24h ?? 0;

  const ssiValues: Record<string, { change: number }> = useMemo(() => ({
    ssiMAG7:     { change: btcChange * 0.7 + ethChange * 0.3 },
    ssiAI:       { change: btcChange * 1.45 },
    ssiDeFi:     { change: (btcChange + ethChange) / 2 * 1.18 },
    ssiLayer1:   { change: (ethChange + solChange) / 2 },
    ssiMeme:     { change: btcChange * 2.15 },
    ssiRWA:      { change: btcChange * 0.28 },
    ssiSocialFi: { change: btcChange * 0.82 },
  }), [btcChange, ethChange, solChange]);

  const sortedByChange = useMemo(() =>
    [...SSI_DEFS].sort((a, b) => (ssiValues[b.key]?.change ?? 0) - (ssiValues[a.key]?.change ?? 0)),
  [ssiValues]);

  const strongest = sortedByChange[0];
  const weakest = sortedByChange[sortedByChange.length - 1];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-mono font-black text-white/90">SSI Indexes</div>
            <div className="text-[9px] font-mono text-muted-foreground/40">Smart Sector Indexes · SoSoValue Protocol · Live · Click any index to inspect</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70 animate-pulse" />
            <span className="text-[9px] font-mono text-muted-foreground/35">CoinGecko · {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

          {/* Sector Summary Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">Strongest Sector</div>
                <div className="text-sm font-mono font-black text-emerald-400">{strongest?.label}</div>
                <div className="text-[9px] font-mono text-emerald-400/60">+{(ssiValues[strongest?.key]?.change ?? 0).toFixed(2)}% · Capital inflow</div>
              </div>
            </div>
            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">Weakest Sector</div>
                <div className="text-sm font-mono font-black text-red-400">{weakest?.label}</div>
                <div className="text-[9px] font-mono text-red-400/60">{(ssiValues[weakest?.key]?.change ?? 0).toFixed(2)}% · Rotation risk</div>
              </div>
            </div>
          </div>

          {/* SSI Index Board */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-6">
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-4">Live Index Board</div>
            <SsiIndexBoard
              ssiMAG7={btc?.indexData?.ssiMAG7}
              ssiDeFi={btc?.indexData?.ssiDeFi}
              btcChange={btcChange}
              ethChange={ethChange}
              solChange={solChange}
            />
          </div>

          {/* Interactive Index Cards */}
          <div>
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-4">Sector Intelligence — Click to Inspect</div>
            <div className="space-y-2">
              {SSI_DEFS.map((ssi) => {
                const val = ssiValues[ssi.key];
                const change = val?.change ?? 0;
                const up = change >= 0;
                const rotation = computeRotationSignal(change, btcChange);
                const isOpen = selectedSsi === ssi.key;
                const momentum = computeMomentumScore(change);

                return (
                  <div key={ssi.key}>
                    <button
                      className="w-full rounded-2xl border p-4 relative overflow-hidden text-left transition-all duration-200 hover:scale-[1.005] group"
                      style={{
                        borderColor: isOpen ? `${ssi.color}40` : `${ssi.color}20`,
                        background: isOpen
                          ? `linear-gradient(135deg, ${ssi.color}10 0%, transparent 60%)`
                          : `linear-gradient(135deg, ${ssi.color}05 0%, transparent 60%)`,
                      }}
                      onClick={() => setSelectedSsi(isOpen ? null : ssi.key)}
                    >
                      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${ssi.color}${isOpen ? "70" : "40"}, transparent)` }} />

                      <div className="flex items-center gap-4">
                        <span className="text-lg shrink-0">{ssi.emoji}</span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono font-black text-white/85">{ssi.label}</span>
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: `${ssi.riskColor}30`, color: ssi.riskColor, background: `${ssi.riskColor}10` }}>{ssi.risk} RISK</span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${rotation === "INFLOW" ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/8" : rotation === "OUTFLOW" ? "border-red-500/25 text-red-400 bg-red-500/8" : "border-white/10 text-muted-foreground/40 bg-white/3"}`}>
                              {rotation === "INFLOW" ? "↓ INFLOW" : rotation === "OUTFLOW" ? "↑ OUTFLOW" : "→ NEUTRAL"}
                            </span>
                          </div>
                          <div className="text-[9px] font-mono text-muted-foreground/35">{ssi.desc}</div>
                        </div>

                        {/* Token pills */}
                        <div className="hidden md:flex items-center gap-1">
                          {ssi.tokens.slice(0, 3).map(t => (
                            <span key={t.symbol} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/4 border border-white/6 text-muted-foreground/50">{t.symbol}</span>
                          ))}
                          {ssi.tokens.length > 3 && <span className="text-[8px] font-mono text-muted-foreground/30">+{ssi.tokens.length - 3}</span>}
                        </div>

                        {/* Momentum bar */}
                        <div className="hidden md:block w-16">
                          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${momentum}%`, backgroundColor: ssi.color }} />
                          </div>
                          <div className="text-[7px] font-mono text-muted-foreground/25 mt-0.5 text-center">{momentum.toFixed(0)} mom.</div>
                        </div>

                        <div className={`flex items-center gap-0.5 text-[12px] font-mono font-bold shrink-0 ${up ? "text-emerald-400" : "text-red-400"}`}>
                          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {up ? "+" : ""}{change.toFixed(2)}%
                        </div>

                        <div className="text-muted-foreground/30 shrink-0">
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <DetailPanel
                        ssi={ssi}
                        change={change}
                        btcChange={btcChange}
                        onClose={() => setSelectedSsi(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rotation Narrative */}
          <div className="rounded-2xl border border-white/6 bg-black/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary/60" />
              <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Capital Rotation Narrative</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { text: `ssiMAG7 ${(btcChange * 0.7 + ethChange * 0.3) >= 0 ? "positive" : "in drawdown"} — BTC-ETH composite tracking ${(btcChange * 0.7 + ethChange * 0.3) >= 0 ? "+" : ""}${(btcChange * 0.7 + ethChange * 0.3).toFixed(2)}%. Benchmark ${(btcChange * 0.7 + ethChange * 0.3) >= 0 ? "supporting risk appetite" : "signaling caution"}.` },
                { text: `ssiAI momentum ${(btcChange * 1.45) >= 0 ? "elevated" : "weakening"} — TAO and RNDR composite tracking BTC at 1.45x beta. ${(btcChange * 1.45) >= 0 ? "AI compute inflows active." : "Rotation risk from AI into MAG7 safety."}` },
                { text: `ssiDeFi ${((btcChange + ethChange) / 2 * 1.18) >= 0 ? "recovering" : "under pressure"} — AAVE and UNI leading. Protocol revenue ${((btcChange + ethChange) / 2 * 1.18) >= 0 ? "expanding, TVL positive" : "contracting, TVL watch"}.` },
                { text: `ssiRWA divergence from BTC: ${(btcChange * 0.28 - btcChange).toFixed(2)}% — Real-world assets ${btcChange * 0.28 > btcChange ? "outperforming" : "decoupled downward"}, 0.42 correlation acting as ${btcChange < 0 ? "partial hedge" : "drag in risk-on"}.` },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-white/5 bg-white/2">
                  <Zap className="w-2.5 h-2.5 text-primary/40 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-mono text-foreground/55 leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
