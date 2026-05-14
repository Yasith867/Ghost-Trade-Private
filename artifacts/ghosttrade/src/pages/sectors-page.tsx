import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Thermometer } from "lucide-react";
import Layout from "@/components/Layout";
import SectorHeatmap from "@/components/SectorHeatmap";
import GhostAIChat from "@/components/GhostAIChat";
import { apiUrl } from "@/lib/api";

export default function SectorsPage() {
  const [ghostPrompt, setGhostPrompt] = useState("");
  const [ghostKey, setGhostKey] = useState(0);

  const { data: allMarket } = useQuery<any[]>({
    queryKey: ["/api/market-data"],
    queryFn: () => fetch(apiUrl("/api/market-data")).then(r => r.json()),
    staleTime: 30_000,
  });
  const { data: sectors } = useQuery<any[]>({
    queryKey: ["market-data-sectors"],
    queryFn: () => fetch(apiUrl("/api/market-data/sectors")).then(r => r.json()),
    staleTime: 60_000,
  });

  const btc = allMarket?.find((a: any) => a.symbol === "BTC");
  const eth = allMarket?.find((a: any) => a.symbol === "ETH");
  const sol = allMarket?.find((a: any) => a.symbol === "SOL");
  const btcChange = btc?.change24h ?? 0;
  const ethChange = eth?.change24h ?? 0;
  const solChange = sol?.change24h ?? 0;

  const realSectorChanges: Record<string, number> = Object.fromEntries(
    (sectors ?? []).filter((s: any) => s.tokenCount > 0).map((s: any) => [s.sector, s.change24h])
  );

  const handleSectorClick = useCallback((sector: string, momentum: number) => {
    const dir = momentum > 1 ? "bullish" : momentum < -1 ? "bearish" : "neutral";
    const prompt = `Analyze the ${sector} crypto sector currently showing ${momentum.toFixed(1)}% momentum (${dir}). 1) Capital rotation insights — where is money flowing? 2) Key risk factors right now. 3) Should I increase or reduce exposure? Reference SSI index context.`;
    setGhostPrompt(prompt);
    setGhostKey(k => k + 1);
  }, []);

  const marketContext = btc ? {
    symbol: "BTC", price: btc.price ?? 0, change24h: btcChange,
    sentimentScore: btc.sentimentScore ?? 0.5,
    ssiMAG7: btc.indexData?.ssiMAG7 ?? 0, ssiDeFi: btc.indexData?.ssiDeFi ?? 0,
  } : undefined;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Thermometer className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-mono font-black text-white/90">Sector Rotation</div>
            <div className="text-[9px] font-mono text-muted-foreground/40">Live heatmap · 8 sectors · Real CoinGecko data</div>
          </div>
          <div className="ml-auto text-[9px] font-mono text-muted-foreground/30">
            Click any sector tile for AI analysis →
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Heatmap — large */}
            <div className="xl:col-span-2 rounded-2xl border border-white/6 bg-white/2 p-6">
              <SectorHeatmap
                btcChange={btcChange}
                ethChange={ethChange}
                solChange={solChange}
                realSectorChanges={realSectorChanges}
                onSectorClick={handleSectorClick}
              />
            </div>

            {/* GhostAI sector analysis */}
            <div className="xl:col-span-1">
              <div className="text-[8px] font-mono text-muted-foreground/35 uppercase tracking-widest mb-3">
                GhostAI · Sector Intel
              </div>
              <GhostAIChat
                marketContext={marketContext}
                triggerPrompt={ghostPrompt}
                triggerKey={ghostKey}
              />
            </div>
          </div>

          {/* Sector ranking table */}
          {sectors && sectors.length > 0 && (
            <div className="mt-6 rounded-2xl border border-white/6 bg-white/2 p-6">
              <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-4">Sector Ranking · 24h Performance</div>
              <div className="space-y-2">
                {[...sectors]
                  .filter((s: any) => s.tokenCount > 0)
                  .sort((a: any, b: any) => b.change24h - a.change24h)
                  .map((s: any, i: number) => {
                    const up = s.change24h >= 0;
                    const pct = Math.min(Math.abs(s.change24h) / 5, 1) * 100;
                    return (
                      <div key={s.sector} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-white/10 bg-black/20 transition-all">
                        <span className="text-[10px] font-mono text-muted-foreground/30 w-5 text-right">#{i + 1}</span>
                        <span className="text-[11px] font-mono font-bold text-white/75 w-20">{s.sector}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: up ? "#10b981" : "#ef4444" }} />
                        </div>
                        <span className={`text-[11px] font-mono font-bold w-16 text-right ${up ? "text-emerald-400" : "text-red-400"}`}>
                          {up ? "+" : ""}{s.change24h.toFixed(2)}%
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground/30 w-20 text-right">
                          {s.tokenCount} tokens
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
