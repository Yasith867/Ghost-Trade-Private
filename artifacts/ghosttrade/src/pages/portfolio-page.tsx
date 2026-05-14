import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import Layout from "@/components/Layout";
import PrivatePortfolio from "@/components/PrivatePortfolio";
import GhostAIChat from "@/components/GhostAIChat";
import { apiUrl } from "@/lib/api";

export default function PortfolioPage() {
  const [ghostPrompt, setGhostPrompt] = useState("");
  const [ghostKey, setGhostKey] = useState(0);

  const { data: allMarket } = useQuery<any[]>({
    queryKey: ["/api/market-data"],
    queryFn: () => fetch(apiUrl("/api/market-data")).then(r => r.json()),
    staleTime: 30_000,
  });

  const livePrices = (allMarket ?? []).map((a: any) => ({
    symbol: a.symbol, price: a.price ?? 0, change24h: a.change24h ?? 0,
  }));

  const handleAnalyze = useCallback((prompt: string) => {
    setGhostPrompt(prompt);
    setGhostKey(k => k + 1);
  }, []);

  const btc = allMarket?.find((a: any) => a.symbol === "BTC");
  const eth = allMarket?.find((a: any) => a.symbol === "ETH");
  const sol = allMarket?.find((a: any) => a.symbol === "SOL");
  const btcChange = btc?.change24h ?? 0;
  const ethChange = eth?.change24h ?? 0;
  const solChange = sol?.change24h ?? 0;
  const marketContext = btc ? {
    symbol: "BTC",
    price: btc.price ?? 0,
    change24h: btcChange,
    sentimentScore: btc.sentimentScore ?? 0.5,
    ssiMAG7: btc.indexData?.ssiMAG7 ?? 0,
    ssiDeFi: btc.indexData?.ssiDeFi ?? 0,
    ssiAI: btcChange * 1.45,
    ssiLayer1: (ethChange + solChange) / 2,
    ssiMeme: btcChange * 2.15,
  } : undefined;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-mono font-black text-white/90">Private Portfolio</div>
            <div className="text-[9px] font-mono text-muted-foreground/40">FHE-encrypted holdings · Live P&amp;L · SSI sector allocation</div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <PrivatePortfolio livePrices={livePrices} onAnalyzeWithGhostAI={handleAnalyze} />
          </div>
          <div>
            <div className="text-[8px] font-mono text-muted-foreground/35 uppercase tracking-widest mb-3">GhostAI Portfolio Analysis</div>
            <GhostAIChat marketContext={marketContext} triggerPrompt={ghostPrompt} triggerKey={ghostKey} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
