import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import GhostAIChat from "@/components/GhostAIChat";
import { apiUrl } from "@/lib/api";

export default function GhostAIPage() {
  const { data: allMarket } = useQuery<any[]>({
    queryKey: ["/api/market-data"],
    queryFn: () => fetch(apiUrl("/api/market-data")).then(r => r.json()),
    staleTime: 30_000,
  });
  const btc = allMarket?.find((a: any) => a.symbol === "BTC");
  const eth = allMarket?.find((a: any) => a.symbol === "ETH");
  const sol = allMarket?.find((a: any) => a.symbol === "SOL");

  const marketContext = btc ? {
    symbol: "BTC",
    price: btc.price ?? 0,
    change24h: btc.change24h ?? 0,
    sentimentScore: btc.sentimentScore ?? 0.5,
    ssiMAG7: btc.indexData?.ssiMAG7 ?? 0,
    ssiDeFi: btc.indexData?.ssiDeFi ?? 0,
  } : undefined;

  return (
    <Layout>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.2)]">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-mono font-black text-white/90">GhostAI Terminal</div>
            <div className="text-[9px] font-mono text-muted-foreground/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
              Live · @cf/meta/llama-3-8b-instruct · Market context injected
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {btc && (
              <>
                {[
                  { sym: "BTC", d: btc }, { sym: "ETH", d: eth }, { sym: "SOL", d: sol }
                ].filter(x => x.d).map(({ sym, d }) => (
                  <div key={sym} className="text-right hidden md:block">
                    <div className="text-[8px] font-mono text-muted-foreground/35 tracking-widest">{sym}</div>
                    <div className="text-[11px] font-mono font-bold text-white/80">
                      ${(d.price ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-[8px] font-mono ${(d.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(d.change24h ?? 0) >= 0 ? "+" : ""}{(d.change24h ?? 0).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Main — full height chat */}
        <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
          {/* Chat — takes most space */}
          <div className="flex-1 p-6 flex flex-col" style={{ minHeight: 0 }}>
            <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
              <GhostAIChat marketContext={marketContext} fullHeight />
            </div>
          </div>

          {/* Context sidebar */}
          <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-white/6 p-4 space-y-4 shrink-0 bg-black/30">
            <div className="text-[8px] font-mono text-muted-foreground/35 uppercase tracking-widest">Market Context</div>
            {btc && (
              <div className="space-y-2">
                {[
                  { label: "BTC", d: btc, color: "#f7931a" },
                  { label: "ETH", d: eth, color: "#627eea" },
                  { label: "SOL", d: sol, color: "#9945ff" },
                ].filter(x => x.d).map(({ label, d, color }) => (
                  <div key={label} className="flex items-center justify-between p-2.5 rounded-xl border border-white/6 bg-white/2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <span className="text-[7px] font-bold" style={{ color }}>{label[0]}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white/70">{label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-bold text-white/80">${(d.price ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
                      <div className={`text-[9px] font-mono ${(d.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(d.change24h ?? 0) >= 0 ? "+" : ""}{(d.change24h ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="text-[8px] font-mono text-muted-foreground/35 uppercase tracking-widest">SSI Context</div>
              {btc?.indexData && (
                <div className="space-y-1.5">
                  <div className="flex justify-between p-2 rounded-lg border border-blue-500/12 bg-blue-500/4">
                    <span className="text-[9px] font-mono text-blue-400/60">ssiMAG7</span>
                    <span className="text-[9px] font-mono font-bold text-blue-300/70">${(btc.indexData.ssiMAG7 / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg border border-emerald-500/12 bg-emerald-500/4">
                    <span className="text-[9px] font-mono text-emerald-400/60">ssiDeFi</span>
                    <span className="text-[9px] font-mono font-bold text-emerald-300/70">${btc.indexData.ssiDeFi.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 p-2.5 rounded-xl border border-primary/12 bg-primary/4">
                <Zap className="w-2.5 h-2.5 text-primary/50 shrink-0" />
                <span className="text-[8px] font-mono text-primary/50 leading-snug">GhostAI has full market context, SSI index data, and sector rotation signals loaded.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
