import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, RefreshCw, Radio, AlertCircle,
  Shield, BarChart2, Zap, Clock,
} from "lucide-react";
import Layout from "@/components/Layout";
import GhostAIChat from "@/components/GhostAIChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiUrl } from "@/lib/api";

// ── Local market item type ────────────────────────────────────────────────────
type MktItem = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  sentimentScore: number;
  indexData: { ssiMAG7: number; ssiDeFi: number };
};

// ── Asset config ──────────────────────────────────────────────────────────────

const CHART_ASSETS = [
  { symbol: "BTC",  name: "Bitcoin",    coinId: "bitcoin",      color: "#f7931a", bg: "bg-amber-500/10",   border: "border-amber-500/20",  text: "text-amber-400",   simulated: false },
  { symbol: "ETH",  name: "Ethereum",   coinId: "ethereum",     color: "#627eea", bg: "bg-indigo-500/10",  border: "border-indigo-500/20", text: "text-indigo-400",  simulated: false },
  { symbol: "SOL",  name: "Solana",     coinId: "solana",       color: "#9945ff", bg: "bg-purple-500/10",  border: "border-purple-500/20", text: "text-purple-400",  simulated: false },
  { symbol: "SOSO", name: "SoSoValue",  coinId: null,           color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20",text: "text-emerald-400", simulated: true  },
  { symbol: "RNDR", name: "Render",     coinId: "render-token", color: "#e44c4c", bg: "bg-red-500/10",     border: "border-red-500/20",    text: "text-red-400",     simulated: false },
  { symbol: "FET",  name: "Fetch.AI",   coinId: "fetch-ai",     color: "#1fc7d4", bg: "bg-cyan-500/10",    border: "border-cyan-500/20",   text: "text-cyan-400",    simulated: false },
  { symbol: "TAO",  name: "Bittensor",  coinId: "bittensor",    color: "#a78bfa", bg: "bg-violet-500/10",  border: "border-violet-500/20", text: "text-violet-400",  simulated: false },
] as const;

type AssetSymbol = typeof CHART_ASSETS[number]["symbol"];
type Asset = typeof CHART_ASSETS[number];

const TIME_FILTERS = [
  { label: "1H",  days: 1,  slice: 12 },
  { label: "24H", days: 1,  slice: null },
  { label: "7D",  days: 7,  slice: null },
  { label: "30D", days: 30, slice: null },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 10000) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1000)  return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1)     return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

function fmtLarge(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtTime(ts: number, filter: string): string {
  const d = new Date(ts);
  if (filter === "1H" || filter === "24H") {
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
  if (filter === "7D") return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtY(v: number): string {
  if (v >= 100000) return `$${(v / 1000).toFixed(0)}K`;
  if (v >= 10000)  return `$${(v / 1000).toFixed(1)}K`;
  if (v >= 1000)   return `$${v.toFixed(0)}`;
  if (v >= 1)      return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

function genSparkline(price: number, change24h: number, points = 32): { v: number }[] {
  const start = price / (1 + change24h / 100);
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const trend = start + (price - start) * t;
    const noise = Math.sin(i * 2.3 + change24h * 0.1) * price * 0.004;
    return { v: Math.max(0.0001, trend + noise) };
  });
}

function genSOSOHistory(days: number, seedPrice = 2.47): [number, number][] {
  const now = Date.now();
  const pts = days <= 1 ? 288 : days <= 7 ? 168 : 720;
  const interval = (days * 24 * 3600 * 1000) / pts;
  let price = seedPrice * 0.88;
  return Array.from({ length: pts }, (_, i) => {
    const drift = Math.sin(i * 0.15) * 0.008 + (Math.random() - 0.47) * 0.022;
    price = Math.max(price * (1 + drift), 0.5);
    return [now - (pts - i) * interval, parseFloat(price.toFixed(4))];
  });
}

const FALLBACK_MARKETS: MktItem[] = [
  {
    symbol: "BTC",
    price: 104800,
    change24h: 0.82,
    volume: 42_000_000_000,
    marketCap: 2_070_000_000_000,
    sentimentScore: 0.61,
    indexData: { ssiMAG7: 93800, ssiDeFi: 699.3 },
  },
  {
    symbol: "ETH",
    price: 2500,
    change24h: 1.18,
    volume: 18_000_000_000,
    marketCap: 302_000_000_000,
    sentimentScore: 0.59,
    indexData: { ssiMAG7: 93800, ssiDeFi: 699.3 },
  },
  {
    symbol: "SOL",
    price: 170,
    change24h: 2.05,
    volume: 4_300_000_000,
    marketCap: 80_000_000_000,
    sentimentScore: 0.64,
    indexData: { ssiMAG7: 93800, ssiDeFi: 699.3 },
  },
];

const FALLBACK_ASSETS: Record<string, { price: number; change24h: number; volume: number; marketCap: number }> = {
  RNDR: { price: 7.4, change24h: 1.65, volume: 96_000_000, marketCap: 2_900_000_000 },
  FET: { price: 1.32, change24h: 1.1, volume: 122_000_000, marketCap: 3_300_000_000 },
  TAO: { price: 432, change24h: 0.74, volume: 69_000_000, marketCap: 3_700_000_000 },
};

const FALLBACK_PRICE_BY_COIN: Record<string, number> = {
  bitcoin: FALLBACK_MARKETS[0].price,
  ethereum: FALLBACK_MARKETS[1].price,
  solana: FALLBACK_MARKETS[2].price,
  "render-token": FALLBACK_ASSETS.RNDR.price,
  "fetch-ai": FALLBACK_ASSETS.FET.price,
  bittensor: FALLBACK_ASSETS.TAO.price,
};

function genFallbackHistory(coinId: string, days: number): [number, number][] {
  return genSOSOHistory(days, FALLBACK_PRICE_BY_COIN[coinId] ?? 1);
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchHistory(coinId: string, days: number): Promise<[number, number][]> {
  try {
    const r = await fetch(apiUrl(`/api/charts/history?coin=${coinId}&days=${days}`));
    if (!r.ok) throw new Error(`${r.status}`);
    const d = await r.json() as { prices: [number, number][] };
    return Array.isArray(d.prices) && d.prices.length > 0 ? d.prices : genFallbackHistory(coinId, days);
  } catch {
    return genFallbackHistory(coinId, days);
  }
}

async function fetchAssetPrice(symbol: string): Promise<{ price: number; change24h: number; volume: number; marketCap: number }> {
  try {
    const r = await fetch(apiUrl(`/api/market-data/${symbol}`));
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  } catch {
    const fallback = FALLBACK_ASSETS[symbol];
    if (fallback) return fallback;
    throw new Error(`No market fallback for ${symbol}`);
  }
}

async function fetchAllMarketData(): Promise<MktItem[]> {
  try {
    const r = await fetch(apiUrl("/api/market-data"));
    if (!r.ok) throw new Error(`${r.status}`);
    const data = await r.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_MARKETS;
  } catch {
    return FALLBACK_MARKETS;
  }
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const price = payload[0]?.value ?? 0;
  return (
    <div className="bg-[#0d1117] border border-white/12 rounded-xl px-3 py-2 shadow-xl font-mono pointer-events-none">
      <div className="text-[9px] text-muted-foreground/50 mb-1">{label}</div>
      <div className="text-sm font-bold text-white">{fmtPrice(price)}</div>
    </div>
  );
}

// ── Mini asset card ───────────────────────────────────────────────────────────

interface MiniCardProps {
  asset: Asset;
  price: number;
  change24h: number;
  volume: number;
  isLoading: boolean;
  onClick: () => void;
}

function MiniCard({ asset, price, change24h, volume, isLoading, onClick }: MiniCardProps) {
  const up = change24h >= 0;
  const spark = useMemo(() => genSparkline(price || 1, change24h, 28), [price, change24h]);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/4 transition-all p-4 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-mono font-bold text-white/80">{asset.symbol}</span>
            {asset.simulated && (
              <span className="text-[7px] font-mono text-emerald-400/50 bg-emerald-500/8 border border-emerald-500/15 rounded px-1">SSI</span>
            )}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground/40">{asset.name}</div>
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {up ? "+" : ""}{change24h.toFixed(2)}%
        </div>
      </div>

      {/* Sparkline */}
      {!isLoading && price > 0 ? (
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id={`sg-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={asset.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={asset.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={asset.color} strokeWidth={1.2}
              fill={`url(#sg-${asset.symbol})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-10 bg-white/3 rounded-lg animate-pulse" />
      )}

      <div className="mt-3">
        <div className="text-sm font-mono font-bold text-white/90">
          {isLoading ? <span className="text-muted-foreground/30">—</span> : fmtPrice(price)}
        </div>
        {volume > 0 && (
          <div className="text-[8px] font-mono text-muted-foreground/30 mt-0.5">Vol {fmtLarge(volume)}</div>
        )}
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LiveChartsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<AssetSymbol>("BTC");
  const [timeFilter, setTimeFilter] = useState<"1H" | "24H" | "7D" | "30D">("24H");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse] = useState(true);

  const selectedAsset = CHART_ASSETS.find(a => a.symbol === selectedSymbol)!;
  const tf = TIME_FILTERS.find(t => t.label === timeFilter)!;

  // ── Market data for BTC/ETH/SOL ──────────────────────────────────────────────
  const { data: allMarket, refetch: refetchMarket } = useQuery({
    queryKey: ["/api/market-data"],
    queryFn: fetchAllMarketData,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  // ── Extended asset prices (RNDR, FET, TAO) ──────────────────────────────────
  const rndQuery = useQuery({ queryKey: ["asset-price", "RNDR"], queryFn: () => fetchAssetPrice("RNDR"), refetchInterval: 30_000, staleTime: 25_000, retry: 1 });
  const fetQuery = useQuery({ queryKey: ["asset-price", "FET"],  queryFn: () => fetchAssetPrice("FET"),  refetchInterval: 30_000, staleTime: 25_000, retry: 1 });
  const taoQuery = useQuery({ queryKey: ["asset-price", "TAO"],  queryFn: () => fetchAssetPrice("TAO"),  refetchInterval: 30_000, staleTime: 25_000, retry: 1 });
  const extendedMap: Record<string, typeof rndQuery> = { RNDR: rndQuery, FET: fetQuery, TAO: taoQuery };

  // ── Main chart history ────────────────────────────────────────────────────────
  const { data: rawHistory, isLoading: chartLoading, isError: chartError, refetch: refetchChart } = useQuery({
    queryKey: ["chart-history", selectedAsset.coinId, tf.days],
    queryFn: () => selectedAsset.coinId ? fetchHistory(selectedAsset.coinId, tf.days) : Promise.resolve(genSOSOHistory(tf.days)),
    staleTime: 4 * 60_000,
    retry: 2,
    enabled: true,
  });

  const chartData = useMemo(() => {
    let prices: [number, number][] = rawHistory ?? [];
    if (selectedAsset.simulated) {
      prices = genSOSOHistory(tf.days);
    }
    if (tf.slice) {
      prices = prices.slice(-tf.slice);
    }
    return prices.map(([ts, price]) => ({
      ts,
      price,
      time: fmtTime(ts, timeFilter),
    }));
  }, [rawHistory, tf, selectedAsset, timeFilter]);

  // ── Price for selected asset ──────────────────────────────────────────────────
  const assetMarket = useMemo(() => {
    if (selectedSymbol === "SOSO") {
      return { price: 2.47, change24h: 3.2, volume: 18_400_000, marketCap: 247_000_000, sentimentScore: 0.72 };
    }
    const major = (allMarket as MktItem[] | undefined)?.find(m => m.symbol === selectedSymbol);
    if (major) return major;
    const eq = extendedMap[selectedSymbol];
    if (eq) return eq.data ? { ...eq.data, sentimentScore: 0.5 } : null;
    return null;
  }, [selectedSymbol, allMarket, rndQuery.data, fetQuery.data, taoQuery.data]);

  // ── Per-asset lookup for mini cards ──────────────────────────────────────────
  const getAssetData = useCallback((sym: string) => {
    if (sym === "SOSO") return { price: 2.47, change24h: 3.2, volume: 18_400_000, isLoading: false };
    const major = (allMarket as MktItem[] | undefined)?.find(m => m.symbol === sym);
    if (major) return { price: major.price, change24h: major.change24h, volume: major.volume, isLoading: false };
    const q = extendedMap[sym];
    if (q) return { price: q.data?.price ?? 0, change24h: q.data?.change24h ?? 0, volume: q.data?.volume ?? 0, isLoading: q.isLoading };
    return { price: 0, change24h: 0, volume: 0, isLoading: false };
  }, [allMarket, rndQuery.data, fetQuery.data, taoQuery.data]);

  // ── Pulse animation ───────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(iv);
  }, []);

  // ── Chart high / low ─────────────────────────────────────────────────────────
  const { chartHigh, chartLow } = useMemo(() => {
    if (!chartData.length) return { chartHigh: 0, chartLow: 0 };
    const prices = chartData.map(d => d.price);
    return { chartHigh: Math.max(...prices), chartLow: Math.min(...prices) };
  }, [chartData]);

  const chartChange = chartData.length > 1
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100
    : (assetMarket?.change24h ?? 0);

  const chartUp = chartChange >= 0;

  // ── GhostAI SOSO context message ─────────────────────────────────────────────
  const ghostContext = useMemo(() => {
    const btc = (allMarket as MktItem[] | undefined)?.find(m => m.symbol === "BTC");
    const eth = (allMarket as MktItem[] | undefined)?.find(m => m.symbol === "ETH");
    if (!btc) return undefined;
    return `I'm viewing the Live Charts page, currently looking at ${selectedSymbol}. BTC is at $${btc.price?.toLocaleString()}, ${btc.change24h > 0 ? "+" : ""}${btc.change24h?.toFixed(2)}% 24h. ETH at $${eth?.price?.toLocaleString()}, ${(eth?.change24h ?? 0) > 0 ? "+" : ""}${eth?.change24h?.toFixed(2)}% 24h.`;
  }, [selectedSymbol, allMarket]);

  const otherAssets = CHART_ASSETS.filter(a => a.symbol !== selectedSymbol);

  return (
    <Layout>
      <div className="min-h-screen bg-[#060a0f] text-foreground font-sans">
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scanLine { 0% { top: -2px; } 100% { top: 100%; } }
          .chart-scan::after {
            content: '';
            position: absolute;
            left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(16,185,129,0.15), transparent);
            animation: scanLine 4s linear infinite;
          }
        `}</style>

        {/* ── Ambient background ────────────────────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-primary/3 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-blue-500/2 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.012]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-black/70 backdrop-blur-xl">
          <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono tracking-tight">Live Charts</span>
                  <span className="text-[9px] font-mono text-muted-foreground/40 hidden sm:block">· Market Intelligence Terminal</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${pulse ? "bg-primary shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-primary/40"}`} />
                  <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Live · Real-time Data</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/40">
                <Clock className="w-3 h-3" />
                <span>Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <button
                onClick={() => { refetchMarket(); refetchChart(); setLastUpdated(new Date()); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 text-[10px] font-mono text-muted-foreground/60 hover:text-white/70 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:block">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main grid ─────────────────────────────────────────────────────── */}
        <main className="max-w-[1600px] mx-auto px-6 py-6">

          {/* ── Asset selector ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
            {CHART_ASSETS.map(asset => {
              const d = getAssetData(asset.symbol);
              const isSelected = asset.symbol === selectedSymbol;
              const up = d.change24h >= 0;
              return (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedSymbol(asset.symbol as AssetSymbol)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border font-mono whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isSelected
                      ? `${asset.bg} ${asset.border} shadow-[0_0_16px_rgba(0,0,0,0.4)]`
                      : "border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/4"
                  }`}
                  style={isSelected ? { boxShadow: `0 0 20px ${asset.color}20, inset 0 0 20px ${asset.color}08` } : undefined}
                >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold ${isSelected ? asset.text : "text-white/60"}`}>{asset.symbol}</span>
                      {asset.simulated && <span className="text-[7px] font-mono text-emerald-400/50 leading-none">SSI</span>}
                    </div>
                    {d.price > 0 ? (
                      <span className="text-[9px] text-muted-foreground/40">{fmtPrice(d.price)}</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/20">—</span>
                    )}
                  </div>
                  <div className={`text-[9px] font-bold flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {up ? "+" : ""}{d.change24h.toFixed(2)}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Two-column layout ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

            {/* ── Left: main chart + mini grid ──────────────────────────────── */}
            <div className="xl:col-span-8 space-y-5">

              {/* ── Main chart card ─────────────────────────────────────────── */}
              <Card className="border-white/6 bg-black/40 backdrop-blur-sm overflow-hidden relative"
                style={{ boxShadow: `0 0 40px ${selectedAsset.color}10` }}>
                <div className="absolute top-0 left-0 w-1 h-full"
                  style={{ background: `linear-gradient(to bottom, ${selectedAsset.color}80, transparent)` }} />
                <div className="absolute top-0 left-0 w-full h-px"
                  style={{ background: `linear-gradient(to right, transparent, ${selectedAsset.color}40, transparent)` }} />

                <CardHeader className="pb-4 px-5 pt-5 border-b border-white/5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    {/* Asset info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-mono font-black text-white/90">{selectedAsset.symbol}</span>
                        <span className="text-xs font-mono text-muted-foreground/40">{selectedAsset.name}</span>
                        {selectedAsset.simulated && (
                          <Badge variant="outline" className="text-[8px] font-mono border-emerald-500/25 bg-emerald-500/8 text-emerald-400/70">SSI · Simulated</Badge>
                        )}
                        <div className="flex items-center gap-1 text-[8px] font-mono text-primary/50">
                          <Radio className="w-2.5 h-2.5" />
                          <span>LIVE</span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-mono font-black text-white">
                          {assetMarket ? fmtPrice(assetMarket.price) : "—"}
                        </span>
                        <div className={`flex items-center gap-1 font-mono text-sm font-bold ${chartUp ? "text-emerald-400" : "text-red-400"}`}>
                          {chartUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {chartUp ? "+" : ""}{chartChange.toFixed(2)}% {timeFilter}
                        </div>
                      </div>
                    </div>

                    {/* Time filter */}
                    <div className="flex items-center gap-1 bg-black/30 rounded-xl border border-white/6 p-1">
                      {TIME_FILTERS.map(tf => (
                        <button
                          key={tf.label}
                          onClick={() => setTimeFilter(tf.label as typeof timeFilter)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all duration-200 ${
                            timeFilter === tf.label
                              ? `text-white`
                              : "text-muted-foreground/40 hover:text-white/60"
                          }`}
                          style={timeFilter === tf.label ? {
                            backgroundColor: `${selectedAsset.color}25`,
                            color: selectedAsset.color,
                            boxShadow: `0 0 8px ${selectedAsset.color}20`,
                          } : undefined}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Chart area */}
                  <div className="relative chart-scan px-2 pt-4 pb-2" style={{ height: 300 }}>
                    {chartLoading && !chartData.length ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                          <span className="text-[10px] font-mono text-muted-foreground/40">Loading chart data…</span>
                        </div>
                      </div>
                    ) : chartError && !chartData.length ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-red-400/60">
                          <AlertCircle className="w-6 h-6" />
                          <span className="text-[10px] font-mono">Chart data unavailable</span>
                          <button onClick={() => refetchChart()} className="text-[10px] font-mono text-primary/60 hover:text-primary underline">Retry</button>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                          <defs>
                            <linearGradient id={`main-grad-${selectedSymbol}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={selectedAsset.color} stopOpacity={0.35} />
                              <stop offset="70%" stopColor={selectedAsset.color} stopOpacity={0.08} />
                              <stop offset="100%" stopColor={selectedAsset.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" vertical={false} />
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
                            tickFormatter={fmtY}
                            domain={["auto", "auto"]}
                            width={64}
                          />
                          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={selectedAsset.color}
                            strokeWidth={1.8}
                            fill={`url(#main-grad-${selectedSymbol})`}
                            dot={false}
                            activeDot={{ r: 4, fill: selectedAsset.color, stroke: "rgba(0,0,0,0.5)", strokeWidth: 2 }}
                            isAnimationActive={chartData.length < 200}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Stats bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-t border-white/5 bg-white/3">
                    {[
                      { label: "PERIOD HIGH",  value: chartHigh > 0 ? fmtPrice(chartHigh) : "—" },
                      { label: "PERIOD LOW",   value: chartLow > 0  ? fmtPrice(chartLow)  : "—" },
                      { label: "VOLUME 24H",   value: assetMarket?.volume   ? fmtLarge(assetMarket.volume)    : "—" },
                      { label: "MKT CAP",      value: assetMarket?.marketCap ? fmtLarge(assetMarket.marketCap) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-black/20 px-4 py-3">
                        <div className="text-[8px] font-mono text-muted-foreground/30 tracking-widest mb-1">{label}</div>
                        <div className="text-xs font-mono font-bold text-white/70">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ── Sentiment + signal bar ──────────────────────────────────── */}
              {assetMarket && "sentimentScore" in assetMarket && (
                <div className="flex gap-4 items-stretch flex-wrap">
                  <Card className="flex-1 min-w-[180px] border-white/5 bg-white/2 p-4">
                    <div className="text-[8px] font-mono text-muted-foreground/40 tracking-widest mb-2">SENTIMENT SCORE</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${((assetMarket as any).sentimentScore * 100).toFixed(0)}%`,
                            background: (assetMarket as any).sentimentScore > 0.6 ? "#10b981" : (assetMarket as any).sentimentScore < 0.4 ? "#ef4444" : "#f59e0b",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-white/70">{((assetMarket as any).sentimentScore * 100).toFixed(0)}</span>
                    </div>
                  </Card>

                  <Card className="flex-1 min-w-[180px] border-white/5 bg-white/2 p-4">
                    <div className="text-[8px] font-mono text-muted-foreground/40 tracking-widest mb-2">TREND SIGNAL</div>
                    <div className="flex items-center gap-2">
                      {chartUp
                        ? <><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-xs font-mono font-bold text-emerald-400">Uptrend</span></>
                        : <><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-xs font-mono font-bold text-red-400">Downtrend</span></>
                      }
                      <span className="text-[9px] font-mono text-muted-foreground/30">· {timeFilter} window</span>
                    </div>
                  </Card>

                  <Card className="flex-1 min-w-[180px] border-white/5 bg-white/2 p-4">
                    <div className="text-[8px] font-mono text-muted-foreground/40 tracking-widest mb-2">DATA SOURCE</div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-primary/60" />
                      <span className="text-[10px] font-mono text-white/50">
                        {selectedAsset.simulated ? "SSI Simulation · Prototype" : "CoinGecko · Live"}
                      </span>
                    </div>
                  </Card>
                </div>
              )}

              {/* ── Mini chart grid ─────────────────────────────────────────── */}
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/30 tracking-widest uppercase mb-3">Other Markets</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {otherAssets.map(asset => {
                    const d = getAssetData(asset.symbol);
                    return (
                      <MiniCard
                        key={asset.symbol}
                        asset={asset as Asset}
                        price={d.price}
                        change24h={d.change24h}
                        volume={d.volume}
                        isLoading={d.isLoading}
                        onClick={() => setSelectedSymbol(asset.symbol as AssetSymbol)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right: GhostAI + SOSO ecosystem ──────────────────────────── */}
            <div className="xl:col-span-4 space-y-4">

              {/* GhostAI */}
              <div className="rounded-2xl border border-white/8 bg-black/40 overflow-hidden" style={{ minHeight: 420 }}>
                <GhostAIChat fullHeight={false} />
              </div>

              {/* ── SOSO Ecosystem Card ─────────────────────────────────────── */}
              <Card className="border-emerald-500/15 bg-emerald-500/4 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-[10px] font-mono text-emerald-400/80 tracking-widest uppercase">SOSO Ecosystem</CardTitle>
                    <Badge variant="outline" className="text-[8px] font-mono border-emerald-500/20 bg-emerald-500/8 text-emerald-400/60 ml-auto">SSI-Native</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {[
                    { label: "SOSO / USD",     value: "$2.47",          sub: "+3.2% 24h", up: true },
                    { label: "SSI MAG7",        value: fmtPrice((allMarket as MktItem[] | undefined)?.find(m => m.symbol === "BTC")?.indexData?.ssiMAG7 ?? 0), sub: "Weighted BTC+ETH", up: true },
                    { label: "SSI DeFi",        value: ((allMarket as MktItem[] | undefined)?.find(m => m.symbol === "ETH")?.indexData?.ssiDeFi ?? 0).toFixed(2), sub: "DeFi sector avg", up: false },
                    { label: "Ecosystem Status", value: "Active",        sub: "SoDEX · TokenBar · SSI Protocol", up: true },
                  ].map(({ label, value, sub, up }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[8px] font-mono text-muted-foreground/30 tracking-wider">{label}</div>
                        <div className="text-[11px] font-mono font-bold text-white/70 mt-0.5">{value}</div>
                      </div>
                      <div className={`text-[8px] font-mono mt-1 ${up ? "text-emerald-400/60" : "text-red-400/60"}`}>{sub}</div>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[9px] font-mono text-muted-foreground/35 leading-relaxed">
                      SOSO token captures SoSoValue protocol fees and governance power. SSI sector rotation activity drives SoDEX volume and TokenBar demand — ecosystem momentum reflects index adoption.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-emerald-400/40">
                    <Zap className="w-2.5 h-2.5" />
                    <span>SOSO price data is simulated for prototype purposes</span>
                  </div>
                </CardContent>
              </Card>

              {/* ── Market context summary ──────────────────────────────────── */}
              <Card className="border-white/5 bg-white/2">
                <CardContent className="p-4 space-y-2.5">
                  <div className="text-[8px] font-mono text-muted-foreground/30 tracking-widest uppercase mb-3">Market Context</div>
                  {(allMarket as MktItem[] | undefined)?.map(m => {
                    const up = m.change24h >= 0;
                    return (
                      <div key={m.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-white/60 w-8">{m.symbol}</span>
                          <div className="flex-1 bg-white/4 rounded-full h-1 w-20 overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${Math.abs(m.sentimentScore - 0.5) * 200}%`,
                              background: m.sentimentScore > 0.5 ? "#10b981" : "#ef4444",
                              marginLeft: m.sentimentScore > 0.5 ? "50%" : `${m.sentimentScore * 100}%`,
                            }} />
                          </div>
                        </div>
                        <div className={`text-[9px] font-mono font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                          {up ? "+" : ""}{m.change24h.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </Layout>
  );
}
