import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookMarked } from "lucide-react";
import Layout from "@/components/Layout";
import PrivateWatchlist from "@/components/PrivateWatchlist";
import AlertsPanel from "@/components/AlertsPanel";
import { apiUrl } from "@/lib/api";

export default function WatchlistsPage() {
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

  const livePrices = (allMarket ?? []).map((a: any) => ({
    symbol: a.symbol, price: a.price ?? 0, change24h: a.change24h ?? 0,
  }));

  const sectorChanges: Record<string, number> = Object.fromEntries(
    (sectors ?? []).filter((s: any) => s.tokenCount > 0).map((s: any) => [s.sector, s.change24h])
  );

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-mono font-black text-white/90">Watchlists &amp; Alerts</div>
            <div className="text-[9px] font-mono text-muted-foreground/40">FHE-encrypted · Price &amp; sector threshold alerts · GhostAI notifications</div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <PrivateWatchlist />
          </div>
          <div className="space-y-4">
            <AlertsPanel
              livePrices={livePrices}
              sectorChanges={sectorChanges}
              onAlertTriggered={(prompt) => console.log("Alert:", prompt)}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
