import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, ArrowRight, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import SosoEcosystem from "@/components/SosoEcosystem";
import { apiUrl } from "@/lib/api";

interface RotationSector {
  key: string;
  label: string;
  color: string;
  emoji: string;
  change: number;
  btcBeta: number;
}

function CapitalRotationEngine({ btcChange, ethChange, solChange }: { btcChange: number; ethChange: number; solChange: number }) {
  const sectors: RotationSector[] = useMemo(() => [
    { key: "ssiMAG7",   label: "ssiMAG7",   color: "#3b82f6", emoji: "🏔", change: btcChange * 0.7 + ethChange * 0.3, btcBeta: 0.95 },
    { key: "ssiAI",     label: "ssiAI",     color: "#10b981", emoji: "🤖", change: btcChange * 1.45,                  btcBeta: 1.45 },
    { key: "ssiDeFi",   label: "ssiDeFi",   color: "#a855f7", emoji: "🔗", change: (btcChange + ethChange) / 2 * 1.18, btcBeta: 1.18 },
    { key: "ssiLayer1", label: "ssiL1",     color: "#f59e0b", emoji: "⛓", change: (ethChange + solChange) / 2,        btcBeta: 0.92 },
    { key: "ssiMeme",   label: "ssiMeme",   color: "#f97316", emoji: "💊", change: btcChange * 2.15,                  btcBeta: 2.15 },
    { key: "ssiRWA",    label: "ssiRWA",    color: "#06b6d4", emoji: "🏦", change: btcChange * 0.28,                  btcBeta: 0.28 },
    { key: "ssiSocialFi", label: "ssiSocial", color: "#ec4899", emoji: "💬", change: btcChange * 0.82,                btcBeta: 0.82 },
  ], [btcChange, ethChange, solChange]);

  const sorted = useMemo(() => [...sectors].sort((a, b) => b.change - a.change), [sectors]);
  const avgChange = useMemo(() => sectors.reduce((s, x) => s + x.change, 0) / sectors.length, [sectors]);

  const gainers = sorted.filter(s => s.change > avgChange + 0.3);
  const losers = sorted.filter(s => s.change < avgChange - 0.3).reverse();

  const rotationNarratives = useMemo(() => {
    const lines: string[] = [];
    if (gainers.length > 0 && losers.length > 0) {
      lines.push(`Capital rotating from ${losers[0].label} → ${gainers[0].label} — ${(gainers[0].change - losers[0].change).toFixed(2)}% spread.`);
    }
    if (gainers.length > 1) {
      lines.push(`${gainers[0].label} and ${gainers[1].label} attracting institutional inflows — outperforming BTC baseline.`);
    }
    if (losers.length > 0) {
      lines.push(`${losers[0].label} ${losers[0].change < 0 ? "in drawdown" : "underperforming"} — watch for rotation into ${gainers[0]?.label ?? "MAG7"}.`);
    }
    const rwaVsMeme = sectors.find(s => s.key === "ssiRWA")!.change - sectors.find(s => s.key === "ssiMeme")!.change;
    if (rwaVsMeme > 1) {
      lines.push("Risk-off signal: ssiRWA outperforming ssiMeme — institutional defensiveness increasing.");
    } else if (rwaVsMeme < -1) {
      lines.push("Risk-on signal: ssiMeme outperforming ssiRWA — speculative appetite elevated.");
    }
    return lines;
  }, [gainers, losers, sectors]);

  return (
    <div className="rounded-2xl border border-white/6 bg-black/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-widest">Capital Rotation Engine</span>
        </div>
        <span className="text-[8px] font-mono text-muted-foreground/30">Live · SSI Sector Flow · {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Sector Performance Bars */}
      <div className="p-5 space-y-2">
        {sorted.map((sector) => {
          const relativeStrength = sector.change - btcChange;
          const isOutperform = relativeStrength > 0.3;
          const isUnderperform = relativeStrength < -0.3;
          const barWidth = Math.min(100, Math.max(0, 50 + sector.change * 6));

          return (
            <div key={sector.key} className="flex items-center gap-3">
              <div className="w-20 text-right">
                <span className="text-[9px] font-mono font-bold" style={{ color: sector.color }}>{sector.label}</span>
              </div>

              <div className="flex-1 relative h-5 flex items-center">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barWidth}%`, backgroundColor: sector.color, opacity: 0.8 }} />
                  {/* BTC baseline marker at 50% */}
                  <div className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: "50%" }} />
                </div>
              </div>

              <div className={`w-16 text-[10px] font-mono font-bold text-right ${sector.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {sector.change >= 0 ? "+" : ""}{sector.change.toFixed(2)}%
              </div>

              <div className="w-20 flex items-center gap-1">
                {isOutperform ? (
                  <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">INFLOW</span>
                ) : isUnderperform ? (
                  <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">OUTFLOW</span>
                ) : (
                  <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-white/4 border border-white/8 text-muted-foreground/30">NEUTRAL</span>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3 mt-1 pt-2 border-t border-white/5">
          <div className="w-20 text-right">
            <span className="text-[8px] font-mono text-muted-foreground/30">BTC</span>
          </div>
          <div className="flex-1 relative h-5 flex items-center">
            <div className="w-full h-px bg-white/10" />
            <div className="absolute w-px h-3 bg-white/30" style={{ left: "50%" }} />
          </div>
          <div className="w-16 text-[9px] font-mono text-muted-foreground/40 text-right">
            {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%
          </div>
          <div className="w-20">
            <span className="text-[7px] font-mono text-muted-foreground/25">Baseline</span>
          </div>
        </div>
      </div>

      {/* Flow arrows between top gainer and bottom loser */}
      {gainers.length > 0 && losers.length > 0 && (
        <div className="mx-5 mb-4 rounded-xl border border-white/5 bg-white/2 p-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-sm">{losers[0].emoji}</span>
            <div className="min-w-0">
              <div className="text-[9px] font-mono font-bold text-red-400">{losers[0].label}</div>
              <div className="text-[7px] font-mono text-muted-foreground/30">Capital leaving</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground/30">
            <ArrowRight className="w-4 h-4 text-primary/50" />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <div className="text-[9px] font-mono font-bold text-emerald-400">{gainers[0].label}</div>
              <div className="text-[7px] font-mono text-muted-foreground/30">Capital entering</div>
            </div>
            <span className="text-sm">{gainers[0].emoji}</span>
          </div>
        </div>
      )}

      {/* Rotation narratives */}
      <div className="px-5 pb-5 space-y-2">
        {rotationNarratives.map((line, i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl border border-white/5 bg-black/20">
            <Zap className="w-2.5 h-2.5 text-primary/40 mt-0.5 shrink-0" />
            <p className="text-[9px] font-mono text-foreground/50 leading-relaxed">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EcosystemPage() {
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

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-mono font-black text-white/90">SoSoValue Ecosystem</div>
            <div className="text-[9px] font-mono text-muted-foreground/40">SOSO · SoDEX · TokenBar · SSI Protocol · ValueChain · Capital Rotation</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 animate-pulse" />
            <span className="text-[9px] font-mono text-muted-foreground/35">Live · {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          <CapitalRotationEngine btcChange={btcChange} ethChange={ethChange} solChange={solChange} />
          <SosoEcosystem btcChange={btcChange} ethChange={ethChange} />
        </div>
      </div>
    </Layout>
  );
}
