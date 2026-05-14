import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  useGetMarketData,
  getGetMarketDataQueryKey,
  useGetAllMarketData,
  getGetAllMarketDataQueryKey,
  useAnalyzeAsset,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { useWallet } from "@/lib/wallet-context";
import WalletHeaderChip from "@/components/WalletHeaderChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Shield,
  Wallet,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  Terminal,
  BrainCircuit,
  Zap,
  Database,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import FhePanel from "@/components/fhe-panel";
import SignalHistory, { HistoryEntry } from "@/components/signal-history";
import GhostAIChat from "@/components/GhostAIChat";
import SsiIndexBoard from "@/components/SsiIndexBoard";
import SectorHeatmap from "@/components/SectorHeatmap";
import NarrativeFeed from "@/components/NarrativeFeed";
import PrivateWatchlist from "@/components/PrivateWatchlist";
import SosoEcosystem from "@/components/SosoEcosystem";
import PrivatePortfolio from "@/components/PrivatePortfolio";
import AlertsPanel from "@/components/AlertsPanel";
import Layout from "@/components/Layout";
import TokenDetailDrawer from "@/components/TokenDetailDrawer";
import { prepareTradeExecution, formatTradeObjectForDisplay } from "@/lib/executionEngine";

const ASSETS = ["BTC", "ETH", "SOL"];
const REFRESH_INTERVAL = 30;
const HISTORY_KEY = "ghosttrade_signal_history";

const LOADING_STEPS = [
  { label: "Encrypting strategy preferences...", icon: "🔐" },
  { label: "Running encrypted sector analysis...", icon: "⚡" },
  { label: "Comparing SSI momentum vectors...", icon: "📊" },
  { label: "Decrypting result via permit...", icon: "🔓" },
];

function formatCurrency(val: number) {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);
}

function useSignalHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
  });
  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 10);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  }, []);
  return { history, addEntry, clearHistory };
}

function useRefreshCountdown(refetchFn: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setIsRefreshing(true);
          refetchFn();
          setTimeout(() => setIsRefreshing(false), 600);
          return REFRESH_INTERVAL;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [refetchFn]);
  const manualRefresh = () => {
    setIsRefreshing(true);
    refetchFn();
    setSecondsLeft(REFRESH_INTERVAL);
    setTimeout(() => setIsRefreshing(false), 600);
  };
  return { secondsLeft, isRefreshing, manualRefresh };
}

function SignalGlow({ signal }: { signal: "BUY" | "SELL" | "HOLD" }) {
  const colors = {
    BUY: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    SELL: "from-red-500/20 via-red-500/5 to-transparent",
    HOLD: "from-yellow-500/20 via-yellow-500/5 to-transparent",
  };
  return <div className={`absolute inset-0 bg-gradient-to-b ${colors[signal]} pointer-events-none rounded-xl`} />;
}

function SentimentBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct > 60 ? "bg-emerald-500" : pct < 40 ? "bg-red-500" : "bg-yellow-500";
  const label = pct > 60 ? "Bullish" : pct < 40 ? "Bearish" : "Neutral";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono text-muted-foreground">
        <span>SENTIMENT</span>
        <span className={pct > 60 ? "text-emerald-400" : pct < 40 ? "text-red-400" : "text-yellow-400"}>
          {label} · {pct}/100
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ConfidenceBar({ confidence, signal }: { confidence: number; signal: string }) {
  const color = signal === "BUY" ? "bg-emerald-500" : signal === "SELL" ? "bg-red-500" : "bg-yellow-500";
  const shadow = signal === "BUY"
    ? "shadow-[0_0_12px_rgba(16,185,129,0.6)]"
    : signal === "SELL" ? "shadow-[0_0_12px_rgba(239,68,68,0.6)]"
    : "shadow-[0_0_12px_rgba(234,179,8,0.6)]";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono text-muted-foreground">
        <span>CONFIDENCE</span>
        <span className="text-foreground font-bold">{confidence}%</span>
      </div>
      <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color} ${shadow}`} style={{ width: `${confidence}%` }} />
      </div>
    </div>
  );
}

function CinematicLoader() {
  const [stepIdx, setStepIdx] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 900);
    const dotTimer = setInterval(() => {
      setDotCount(d => (d + 1) % 4);
    }, 350);
    return () => { clearInterval(stepTimer); clearInterval(dotTimer); };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
      {/* Animated orb */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border border-primary/10 border-t-primary/60 animate-spin" />
        <div className="absolute inset-2 rounded-full border border-primary/5 border-b-primary/40 animate-spin [animation-direction:reverse] [animation-duration:1.4s]" />
        <div className="absolute inset-4 rounded-full border border-primary/5 border-l-primary/20 animate-spin [animation-duration:2s]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <Lock className="w-3.5 h-3.5 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 w-full max-w-xs">
        {LOADING_STEPS.map((step, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 transition-all duration-400 ${
                active ? "opacity-100 scale-100" : done ? "opacity-40" : "opacity-15"
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 transition-all duration-300 ${
                active
                  ? "bg-primary/20 border border-primary/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : done ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-white/4 border border-white/8"
              }`}>
                {done ? "✓" : active ? step.icon : "·"}
              </div>
              <span className={`text-xs font-mono ${active ? "text-primary" : done ? "text-muted-foreground/40 line-through" : "text-muted-foreground/20"}`}>
                {step.label}{active ? ".".repeat(dotCount) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RefreshRing({ secondsLeft, isRefreshing, onClick }: { secondsLeft: number; isRefreshing: boolean; onClick: () => void }) {
  const pct = secondsLeft / REFRESH_INTERVAL;
  const r = 10;
  const c = 2 * Math.PI * r;
  return (
    <button onClick={onClick} title={`Auto-refresh in ${secondsLeft}s`} className="relative w-8 h-8 flex items-center justify-center group hover:scale-110 transition-transform">
      <svg className="absolute inset-0 w-8 h-8 -rotate-90" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/6" />
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          className="text-primary/50 transition-all duration-1000" />
      </svg>
      <RefreshCw className={`w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors ${isRefreshing ? "animate-spin text-primary" : ""}`} />
    </button>
  );
}

const signalColors = {
  BUY:  { text: "text-emerald-400", glow: "drop-shadow-[0_0_24px_rgba(16,185,129,0.8)]",  border: "border-emerald-500/30", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  SELL: { text: "text-red-400",     glow: "drop-shadow-[0_0_24px_rgba(239,68,68,0.8)]",   border: "border-red-500/30",     badge: "border-red-500/30 bg-red-500/10 text-red-400" },
  HOLD: { text: "text-yellow-400",  glow: "drop-shadow-[0_0_24px_rgba(234,179,8,0.8)]",   border: "border-yellow-500/30",  badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" },
};

export default function Dashboard() {
  const [symbol, setSymbol] = useState("BTC");
  const { address: walletAddress, fheMode } = useWallet();
  const [showFhePanel, setShowFhePanel] = useState(false);
  const [showExecPayload, setShowExecPayload] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [ghostTriggerKey, setGhostTriggerKey] = useState(0);
  const [ghostPrompt, setGhostPrompt] = useState("");

  useQueryClient();
  const { history, addEntry, clearHistory } = useSignalHistory();

  const lastValidMarketData = useRef<typeof marketData | null>(null);
  const lastValidAllMarketData = useRef<typeof allMarketData | null>(null);

  const { data: marketData, isLoading: isMarketLoading, isError: isMarketError, refetch: refetchMarket } =
    useGetMarketData(symbol, { query: { enabled: !!symbol, queryKey: getGetMarketDataQueryKey(symbol), retry: 3, retryDelay: 2000, staleTime: 25_000 } });

  const { data: allMarketData, refetch: refetchAll } = useGetAllMarketData({
    query: { queryKey: getGetAllMarketDataQueryKey(), retry: 3, retryDelay: 2000, staleTime: 25_000 },
  });

  // Preserve last valid data — never show stale zeros
  useEffect(() => {
    if (marketData?.price && marketData.price > 0) {
      lastValidMarketData.current = marketData;
    }
  }, [marketData]);
  useEffect(() => {
    if (Array.isArray(allMarketData) && allMarketData.length > 0) {
      lastValidAllMarketData.current = allMarketData;
    }
  }, [allMarketData]);

  const safeMarketData = (marketData?.price && marketData.price > 0)
    ? marketData
    : lastValidMarketData.current ?? marketData;

  const safeAllMarketData = (Array.isArray(allMarketData) && allMarketData.length > 0)
    ? allMarketData
    : (lastValidAllMarketData.current ?? allMarketData);

  const refetchBoth = useCallback(() => { refetchMarket(); refetchAll(); }, [refetchMarket, refetchAll]);
  const { secondsLeft, isRefreshing, manualRefresh } = useRefreshCountdown(refetchBoth);
  const analyzeMutation = useAnalyzeAsset();

  // Real sector data from CoinGecko — RNDR/FET/TAO for AI, etc.
  const { data: sectorData } = useQuery<Array<{ sector: string; change24h: number; tokenCount: number }>>({
    queryKey: ["market-data-sectors"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/market-data/sectors"));
      if (!res.ok) throw new Error("sector fetch failed");
      return res.json();
    },
    staleTime: 60_000,
    retry: 2,
  });

  const allMarketDataArr = Array.isArray(safeAllMarketData) ? safeAllMarketData : [];
  const btcChange = allMarketDataArr.find(a => a.symbol === "BTC")?.change24h ?? 0;
  const ethChange = allMarketDataArr.find(a => a.symbol === "ETH")?.change24h ?? 0;
  const solChange = allMarketDataArr.find(a => a.symbol === "SOL")?.change24h ?? 0;

  // Map real sector changes into a lookup — keyed by sector name
  const realSectorChanges = useMemo<Record<string, number>>(() => {
    if (!sectorData) return {};
    return Object.fromEntries(
      sectorData.filter(s => s.tokenCount > 0).map(s => [s.sector, s.change24h])
    );
  }, [sectorData]);

  const SECTOR_TO_SSI: Record<string, string> = {
    AI:       "ssiAI",
    DeFi:     "ssiDeFi",
    Layer1:   "ssiLayer1",
    Meme:     "ssiMeme",
    NFT:      "ssiNFT",
    RWA:      "ssiRWA",
    GameFi:   "ssiGameFi",
    SocialFi: "ssiSocialFi",
  };

  const handleSectorClick = useCallback((sector: string, momentum: number) => {
    const ssiName = SECTOR_TO_SSI[sector] ?? `ssi${sector}`;
    const dir = momentum > 1.5 ? "bullish breakout" : momentum > 0.3 ? "positive momentum" : momentum < -1.5 ? "bearish breakdown" : momentum < -0.3 ? "weakening" : "neutral consolidation";
    const prompt = `${ssiName} is showing ${momentum.toFixed(2)}% — ${dir}. Give me: 1) SSI rotation read — how is ${ssiName} positioned vs ssiMAG7 benchmark? 2) Token leaders driving this move — who is leading and who is lagging within the sector? 3) Capital flow direction — inflows or outflows relative to ssiDeFi and ssiAI? Keep it institutional and SSI-native.`;
    setGhostPrompt(prompt);
    setGhostTriggerKey(k => k + 1);
  }, []);

  const handleSsiIndexClick = useCallback((indexName: string, trend: number) => {
    const dir = trend > 1.5 ? "surging" : trend > 0.3 ? "positive" : trend < -1.5 ? "declining sharply" : trend < -0.3 ? "weakening" : "consolidating";
    const prompt = `${indexName} is ${dir} at ${trend >= 0 ? "+" : ""}${trend.toFixed(2)}% trend. Give me: 1) Where is ${indexName} in the current SSI sector rotation — is it leading or lagging vs ssiMAG7? 2) Which token leaders or laggards are driving ${indexName} right now? 3) Capital inflow or outflow signal — what does SOSO ecosystem activity and SoDEX encrypted order flow tell us about ${indexName} near-term?`;
    setGhostPrompt(prompt);
    setGhostTriggerKey(k => k + 1);
  }, []);

  const handlePortfolioAnalysis = useCallback((prompt: string) => {
    setGhostPrompt(prompt);
    setGhostTriggerKey(k => k + 1);
  }, []);

  const [tokenDetail, setTokenDetail] = useState<string | null>(null);

  const livePricesForPortfolio = useMemo(() => allMarketDataArr.map(a => ({
    symbol: a.symbol,
    price: a.price ?? 0,
    change24h: a.change24h ?? 0,
  })), [allMarketDataArr]);

  const handleAnalyze = () => {
    setRevealed(false);
    setShowFhePanel(false);
    setShowExecPayload(false);
    analyzeMutation.mutate({ data: { symbol, walletConnected: !!walletAddress } });
  };

  useEffect(() => {
    if (analyzeMutation.isSuccess && analyzeMutation.data) {
      const t = setTimeout(() => {
        setRevealed(true);
        const r = analyzeMutation.data!;
        addEntry({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          symbol: r.marketData.symbol,
          signal: r.signal as "BUY" | "SELL" | "HOLD",
          confidence: r.confidence,
          price: r.marketData.price,
          change24h: r.marketData.change24h,
          sentiment: r.marketData.sentimentScore,
          explanation: r.explanation,
          timestamp: Date.now(),
          fheMode: fheMode,
        });
      }, 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [analyzeMutation.isSuccess, analyzeMutation.data]);

  const result = analyzeMutation.data;
  const sig = result?.signal as "BUY" | "SELL" | "HOLD" | undefined;

  const tradeObject = useMemo(() => {
    if (!result) return null;
    return prepareTradeExecution(
      result.signal as "BUY" | "SELL" | "HOLD",
      result.marketData.symbol,
      result.confidence,
      result.encryptedInputsPreview,
      walletAddress,
      walletAddress ? "real" : "simulation",
    );
  }, [result, walletAddress]);

  // Derive all SSI index approximations from live market data
  const ssiAIApprox   = safeMarketData ? 15240 + (safeMarketData.change24h ?? 0) * 118 : undefined;
  const ssiLayer1Approx = allMarketDataArr.length > 0
    ? 24180 + ((btcChange + ethChange + solChange) / 3) * 82
    : undefined;
  const ssiMemeApprox = safeMarketData ? 3080 + (safeMarketData.change24h ?? 0) * 142 : undefined;
  const ssiRWAApprox  = safeMarketData ? 8620 + (safeMarketData.change24h ?? 0) * 18 : undefined;

  const marketContextForAI = safeMarketData ? {
    symbol,
    price: safeMarketData.price ?? 0,
    change24h: safeMarketData.change24h ?? 0,
    sentimentScore: safeMarketData.sentimentScore ?? 0.5,
    ssiMAG7: safeMarketData.indexData?.ssiMAG7 ?? 0,
    ssiDeFi: safeMarketData.indexData?.ssiDeFi ?? 0,
    ssiAI:    ssiAIApprox,
    ssiLayer1: ssiLayer1Approx,
    ssiMeme:  ssiMemeApprox,
    ssiRWA:   ssiRWAApprox,
    signal: result?.signal,
    confidence: result?.confidence,
  } : undefined;

  return (
    <Layout>
    <div className="min-h-screen bg-[#060a0f] text-foreground flex flex-col font-sans">
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-blue-500/3 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[200px] -translate-x-1/2 -translate-y-1/2 bg-purple-500/2 rounded-full blur-[80px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <Shield className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight leading-none font-mono">Ghost Trade</h1>
                  <span className="text-primary font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">PRIVATE</span>
                </div>
                <p className="text-[9px] text-muted-foreground/40 font-mono mt-0.5">FHE-inspired · SoSoValue SSI · Privacy-first</p>
              </div>
            </div>

            {/* Live narrative ticker in header */}
            <div className="hidden lg:flex items-center gap-2 border-l border-white/5 pl-6">
              <NarrativeFeed btcChange={btcChange} ethChange={ethChange} solChange={solChange} />
            </div>
          </div>

          <WalletHeaderChip />
        </div>
      </header>

      {/* ── Main 3-column grid ── */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative">

        {/* ══ LEFT COLUMN (col-span-3) ══ */}
        <div className="lg:col-span-3 space-y-4">

          {/* Market Data */}
          <Card className="border-white/6 bg-white/2 backdrop-blur-sm">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-primary" /> Market Data
                </CardTitle>
                <RefreshRing secondsLeft={secondsLeft} isRefreshing={isRefreshing} onClick={manualRefresh} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-muted-foreground/40 tracking-wider">ASSET</label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="w-full bg-black/40 border-white/8 font-mono text-sm h-10 hover:border-white/15 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1117] border-white/10">
                    {ASSETS.map(a => (
                      <SelectItem key={a} value={a} className="font-mono hover:bg-white/5">{a} / USD</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isMarketLoading && !safeMarketData ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-9 w-2/3 bg-white/5" />
                  <Skeleton className="h-2 w-full bg-white/5" />
                  <Skeleton className="h-2 w-4/5 bg-white/5" />
                </div>
              ) : isMarketError && !safeMarketData ? (
                <div className="flex flex-col items-center gap-2 py-4 text-red-400">
                  <AlertCircle className="w-6 h-6" />
                  <p className="font-mono text-xs text-center">Market data unavailable</p>
                  <Button variant="outline" size="sm" className="font-mono text-xs border-white/10" onClick={() => refetchMarket()}>Retry</Button>
                </div>
              ) : safeMarketData ? (
                <div className="space-y-3">
                  <div>
                    <div className={`text-2xl font-mono font-black text-white transition-opacity duration-300 ${isRefreshing ? "opacity-60" : "opacity-100"}`}>
                      {formatCurrency(safeMarketData.price ?? 0)}
                      {isMarketError && <span className="ml-2 text-[9px] font-normal text-orange-400/60 align-middle">cached</span>}
                    </div>
                    <div className={`flex items-center gap-1 font-mono text-sm mt-1 ${(safeMarketData.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(safeMarketData.change24h ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="font-semibold">{(safeMarketData.change24h ?? 0) > 0 ? "+" : ""}{(safeMarketData.change24h ?? 0).toFixed(2)}%</span>
                      <span className="text-muted-foreground/40 text-xs">24h</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/4">
                    {[
                      { label: "VOLUME", value: formatCurrency(safeMarketData.volume ?? 0) },
                      { label: "MKT CAP", value: formatCurrency(safeMarketData.marketCap ?? 0) },
                      { label: "SSI MAG7", value: formatCurrency(safeMarketData.indexData?.ssiMAG7 ?? 0) },
                      { label: "SSI DEFI", value: (safeMarketData.indexData?.ssiDeFi ?? 0).toFixed(2) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-black/30 rounded-lg p-2 border border-white/4">
                        <div className="text-[8px] text-muted-foreground/40 font-mono tracking-wider mb-0.5">{label}</div>
                        <div className="text-xs font-mono font-semibold text-white/85">{value}</div>
                      </div>
                    ))}
                  </div>

                  <SentimentBar score={safeMarketData.sentimentScore ?? 0.5} />

                  <div className="text-[8px] text-muted-foreground/25 font-mono flex items-center gap-1">
                    <Database className="w-2 h-2" />
                    {safeMarketData.provider} · {new Date(safeMarketData.fetchedAt).toLocaleTimeString()}
                    <span className="ml-auto opacity-60">↻ {secondsLeft}s</span>
                  </div>
                </div>
              ) : null}

              <Button
                className="w-full h-11 font-mono font-bold text-sm tracking-widest relative overflow-hidden group transition-all duration-300 bg-primary hover:bg-primary/90 hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] disabled:opacity-40"
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || (isMarketLoading && !safeMarketData)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {analyzeMutation.isPending ? (
                  <span className="flex items-center gap-2"><BrainCircuit className="w-4 h-4 animate-pulse" /> ANALYZING...</span>
                ) : (
                  <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> ANALYZE PRIVATELY</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Market Overview */}
          {allMarketDataArr.length > 0 && (
            <Card className="border-white/6 bg-white/2 backdrop-blur-sm">
              <CardHeader className="pb-1.5 pt-3 px-4">
                <CardTitle className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Market Overview</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                {allMarketDataArr.map(asset => (
                  <button key={asset.symbol} onClick={() => setSymbol(asset.symbol)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all duration-200 ${
                      symbol === asset.symbol
                        ? "border-primary/25 bg-primary/6 shadow-[inset_0_0_12px_rgba(16,185,129,0.04)]"
                        : "border-white/5 hover:border-white/10 hover:bg-white/2"
                    }`}>
                    <span className={`font-bold text-xs ${symbol === asset.symbol ? "text-primary" : "text-foreground/70"}`}>{asset.symbol}</span>
                    <span className={`text-foreground/50 text-xs ${isRefreshing ? "opacity-40" : "opacity-100"} transition-opacity`}>{formatCurrency(asset.price ?? 0)}</span>
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${(asset.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(asset.change24h ?? 0) >= 0 ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                      {(asset.change24h ?? 0) > 0 ? "+" : ""}{(asset.change24h ?? 0).toFixed(2)}%
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Private Portfolio */}
          <PrivatePortfolio
            livePrices={livePricesForPortfolio}
            onAnalyzeWithGhostAI={handlePortfolioAnalysis}
            onTokenClick={setTokenDetail}
          />

          {/* Private Watchlist */}
          <PrivateWatchlist onTokenClick={setTokenDetail} />

          {/* FHE-Encrypted Alerts */}
          <AlertsPanel
            livePrices={livePricesForPortfolio}
            sectorChanges={realSectorChanges}
            onAlertTriggered={handlePortfolioAnalysis}
          />

          {/* Signal History */}
          <SignalHistory entries={history} onClear={clearHistory} />
        </div>

        {/* ══ CENTER COLUMN (col-span-6) ══ */}
        <div className="lg:col-span-6 space-y-4">

          {/* Analysis Output */}
          <Card className={`border-white/6 bg-white/2 backdrop-blur-sm min-h-[320px] flex flex-col relative overflow-hidden transition-all duration-500 ${sig && revealed ? signalColors[sig].border : ""}`}>
            {sig && revealed && <SignalGlow signal={sig} />}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <CardHeader className="pb-3 border-b border-white/4 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-primary" /> Analysis Output
                </CardTitle>
                {result && revealed && (
                  <Badge variant="outline" className={`font-mono text-[9px] ${fheMode === "real" ? "border-primary/25 bg-primary/8 text-primary" : "border-orange-500/25 bg-orange-500/8 text-orange-400"}`}>
                    {result.fheModeLabel}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-5 relative">
              {!result && !analyzeMutation.isPending ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/20 gap-4">
                  <div className="w-14 h-14 rounded-2xl border border-white/6 bg-white/2 flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm text-muted-foreground/30">Ready to analyze</p>
                    <p className="font-mono text-xs text-muted-foreground/20 mt-0.5">Select an asset and run the FHE pipeline</p>
                  </div>
                </div>
              ) : analyzeMutation.isPending ? (
                <CinematicLoader />
              ) : result && revealed ? (
                <div className="space-y-5" style={{ animation: "fadeScaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
                  {/* Signal row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-mono text-muted-foreground/40 tracking-widest mb-1">SIGNAL</div>
                      <div className={`text-6xl font-black tracking-tight leading-none ${sig ? signalColors[sig].text : ""} ${sig ? signalColors[sig].glow : ""}`}>
                        {result.signal}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <Button variant="outline" size="sm" onClick={() => setShowFhePanel(v => !v)}
                        className="font-mono text-[10px] border-white/8 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all gap-1.5">
                        <Unlock className="w-3 h-3" />{showFhePanel ? "Hide Process" : "Show FHE Process"}
                      </Button>
                      {tradeObject && (
                        <Button variant="outline" size="sm" onClick={() => setShowExecPayload(v => !v)}
                          className="font-mono text-[10px] border-white/8 hover:border-yellow-500/30 hover:bg-yellow-500/5 hover:text-yellow-400 transition-all gap-1.5">
                          <Zap className="w-3 h-3" />{showExecPayload ? "Hide TX" : "TX Payload"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <ConfidenceBar confidence={result.confidence} signal={result.signal} />

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "PRICE", value: formatCurrency(result.marketData.price), sub: result.marketData.symbol },
                      { label: "24H", value: `${result.marketData.change24h > 0 ? "+" : ""}${result.marketData.change24h.toFixed(2)}%`, className: result.marketData.change24h >= 0 ? "text-emerald-400" : "text-red-400" },
                      { label: "SENTIMENT", value: `${(result.marketData.sentimentScore * 100).toFixed(0)}/100`, sub: result.marketData.sentimentScore > 0.6 ? "Bullish" : result.marketData.sentimentScore < 0.4 ? "Bearish" : "Neutral", className: result.marketData.sentimentScore > 0.6 ? "text-emerald-400" : result.marketData.sentimentScore < 0.4 ? "text-red-400" : "text-yellow-400" },
                    ].map(item => (
                      <div key={item.label} className="bg-black/40 rounded-xl border border-white/5 p-3">
                        <div className="text-[8px] font-mono text-muted-foreground/35 tracking-wider">{item.label}</div>
                        <div className={`font-mono text-sm font-bold mt-0.5 ${(item as any).className ?? "text-white"}`}>{item.value}</div>
                        {(item as any).sub && <div className="text-[8px] font-mono text-muted-foreground/30">{(item as any).sub}</div>}
                      </div>
                    ))}
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2">
                    <div className="text-[9px] font-mono text-muted-foreground/40 flex items-center gap-1.5 tracking-wider">
                      <BrainCircuit className="w-3 h-3 text-primary" /> FHE REASONING TRACE
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/75">{result.explanation}</p>
                  </div>

                  {showExecPayload && tradeObject && (
                    <div className="bg-black/50 border border-yellow-500/15 rounded-xl p-4 space-y-2" style={{ animation: "fadeScaleIn 0.3s ease both" }}>
                      <div className="text-[9px] font-mono text-yellow-400/60 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> SODEX EXECUTION PAYLOAD (Wave 2)
                      </div>
                      <pre className="font-mono text-[9px] text-green-400/45 whitespace-pre-wrap break-all leading-relaxed">
                        {formatTradeObjectForDisplay(tradeObject)}
                        {"\n"}PERMIT: {tradeObject.decryptForTxPayload.permitHash.substring(0, 28)}...
                        {"\n"}CIPHER: {tradeObject.decryptForTxPayload.ciphertextRef.substring(0, 28)}...
                        {"\n"}CHAIN:  {tradeObject.decryptForTxPayload.readyForChain ? "READY · Arbitrum Sepolia" : "SIMULATION · Connect wallet"}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* FHE Pipeline Panel */}
          {showFhePanel && result && revealed && (
            <div style={{ animation: "fadeScaleIn 0.4s ease both" }}>
              <FhePanel steps={result.fheSteps} encryptedInputs={result.encryptedInputsPreview} decryptedOutput={result.decryptedOutput} />
            </div>
          )}

          {/* Sector Rotation Heatmap */}
          <Card className="border-white/6 bg-white/2 backdrop-blur-sm p-5">
            <SectorHeatmap
              btcChange={btcChange}
              ethChange={ethChange}
              solChange={solChange}
              realSectorChanges={realSectorChanges}
              onSectorClick={handleSectorClick}
            />
          </Card>

          {/* Private Intelligence Engine card */}
          <Card className="border-purple-500/15 bg-gradient-to-br from-purple-500/4 to-transparent backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/12 border border-purple-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white/80">Private Intelligence Engine</div>
                    <div className="text-[9px] font-mono text-muted-foreground/40">FHE-protected · End-to-end encrypted</div>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[8px] border-purple-500/20 bg-purple-500/6 text-purple-400/70">
                  FHE Pipeline
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Encrypted Watchlists",    desc: "Hidden from MEV bots" },
                  { label: "Encrypted Signals",        desc: "Logic runs on ciphertext" },
                  { label: "Confidential Strategy",    desc: "Zero on-chain exposure" },
                  { label: "FHE-Protected Analytics",  desc: "Private end-to-end" },
                ].map(item => (
                  <div key={item.label} className="rounded-lg p-2.5 border border-purple-500/10 bg-purple-500/4">
                    <div className="w-1 h-1 rounded-full bg-purple-400/40 mb-1.5" />
                    <div className="text-[9px] font-mono font-bold text-purple-300/65 leading-snug">{item.label}</div>
                    <div className="text-[8px] font-mono text-muted-foreground/30 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
              <a href="/judges" className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/25 hover:text-primary/60 transition-colors">
                <BookOpen className="w-2.5 h-2.5" />
                Technical FHE docs for judges & developers →
              </a>
            </CardContent>
          </Card>
        </div>

        {/* ══ RIGHT COLUMN (col-span-3) ══ */}
        <div className="lg:col-span-3 space-y-4">

          {/* GhostAI — always visible, prominent */}
          <GhostAIChat
            marketContext={marketContextForAI}
            triggerPrompt={ghostPrompt}
            triggerKey={ghostTriggerKey}
          />

          {/* SSI Index Board */}
          <Card className="border-white/6 bg-white/2 backdrop-blur-sm p-4">
            <SsiIndexBoard
              ssiMAG7={safeMarketData?.indexData?.ssiMAG7}
              ssiDeFi={safeMarketData?.indexData?.ssiDeFi}
              btcChange={btcChange}
              ethChange={ethChange}
              solChange={solChange}
              onIndexClick={handleSsiIndexClick}
            />
          </Card>

          {/* SoSoValue Ecosystem */}
          <Card className="border-white/6 bg-white/2 backdrop-blur-sm p-4">
            <SosoEcosystem btcChange={btcChange} ethChange={ethChange} />
          </Card>

        </div>
      </main>
    </div>

    {/* Token Detail Drawer */}
    {tokenDetail && (
      <TokenDetailDrawer
        symbol={tokenDetail}
        livePrices={livePricesForPortfolio}
        onClose={() => setTokenDetail(null)}
        onAnalyzeWithGhostAI={handlePortfolioAnalysis}
      />
    )}
    </Layout>
  );
}
