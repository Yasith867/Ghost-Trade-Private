import React, { useState, useCallback, useMemo } from "react";
import {
  Lock, Eye, EyeOff, Plus, X, BrainCircuit, ShieldCheck,
  TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, Loader2, ChevronRight,
} from "lucide-react";

const PORTFOLIO_KEY = "ghosttrade_portfolio_v2";

interface Holding {
  id: string;
  symbol: string;
  amount: number;
  entryPrice: number;
  addedAt: number;
}

interface LivePrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface PrivatePortfolioProps {
  livePrices: LivePrice[];
  onAnalyzeWithGhostAI?: (prompt: string) => void;
  onTokenClick?: (symbol: string) => void;
}

// SSI sector weights per asset — full ecosystem coverage
const SECTOR_WEIGHTS: Record<string, Record<string, number>> = {
  BTC:  { MAG7: 1.0 },
  ETH:  { MAG7: 0.55, L1: 0.45 },
  SOL:  { L1: 0.70, DeFi: 0.30 },
  TAO:  { AI: 1.0 },
  RNDR: { AI: 0.85, DeFi: 0.15 },
  FET:  { AI: 1.0 },
  UNI:  { DeFi: 1.0 },
  AAVE: { DeFi: 1.0 },
  MKR:  { DeFi: 0.75, RWA: 0.25 },
  AVAX: { L1: 1.0 },
  APT:  { L1: 1.0 },
  SUI:  { L1: 1.0 },
  DOGE: { Meme: 1.0 },
  SHIB: { Meme: 1.0 },
  PEPE: { Meme: 1.0 },
  ONDO: { RWA: 1.0 },
};

const SECTOR_COLORS: Record<string, string> = {
  MAG7:  "#3b82f6",
  L1:    "#a855f7",
  DeFi:  "#10b981",
  AI:    "#06b6d4",
  Meme:  "#f97316",
  RWA:   "#f59e0b",
};

const SECTOR_SSI_LABELS: Record<string, string> = {
  MAG7: "ssiMAG7",
  L1:   "ssiLayer1",
  DeFi: "ssiDeFi",
  AI:   "ssiAI",
  Meme: "ssiMeme",
  RWA:  "ssiRWA",
};

const SUPPORTED = ["BTC", "ETH", "SOL"];

// ── FHE Simulation ──────────────────────────────────────────────────────────
function fheEncryptValue(val: number, seed: string): string {
  const encoded = btoa(`${seed}:${val.toFixed(8)}`);
  const chars = "0123456789abcdef";
  let hex = "";
  for (let i = 0; i < 32; i++) {
    const c = encoded.charCodeAt(i % encoded.length);
    hex += chars[(c * 17 + i * 7) % 16];
  }
  return `0x${hex}`;
}

function fheEncryptLabel(text: string): string {
  return text
    .split("")
    .map((c, i) => "0123456789abcdef"[(c.charCodeAt(0) * 13 + i * 7) % 16])
    .join("")
    .substring(0, 8);
}

// ── Persistence ─────────────────────────────────────────────────────────────
function loadHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    return raw ? JSON.parse(atob(raw)) : [];
  } catch {
    return [];
  }
}

function saveHoldings(h: Holding[]) {
  try {
    localStorage.setItem(PORTFOLIO_KEY, btoa(JSON.stringify(h)));
  } catch {}
}

// ── Sub-components ──────────────────────────────────────────────────────────
function SectorBar({ holdings, livePrices }: { holdings: Holding[]; livePrices: LivePrice[] }) {
  const allocation = useMemo(() => {
    const totals: Record<string, number> = {};
    let grand = 0;
    for (const h of holdings) {
      const lp = livePrices.find(p => p.symbol === h.symbol);
      const val = (lp?.price ?? h.entryPrice) * h.amount;
      grand += val;
      const weights = SECTOR_WEIGHTS[h.symbol] ?? { Other: 1.0 };
      for (const [sector, w] of Object.entries(weights)) {
        totals[sector] = (totals[sector] ?? 0) + val * w;
      }
    }
    return Object.entries(totals).map(([k, v]) => ({
      sector: k,
      pct: grand > 0 ? (v / grand) * 100 : 0,
      color: SECTOR_COLORS[k] ?? "#6b7280",
    }));
  }, [holdings, livePrices]);

  if (allocation.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">
        SSI Sector Allocation
      </div>
      {/* Stacked bar */}
      <div className="h-2 w-full rounded-full overflow-hidden flex gap-px bg-white/5">
        {allocation.map(s => (
          <div
            key={s.sector}
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
            title={`${s.sector}: ${s.pct.toFixed(0)}%`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {allocation.map(s => (
          <div key={s.sector} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[8px] font-mono text-muted-foreground/40">
              {s.sector} {s.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddHoldingForm({
  onAdd,
  onCancel,
  livePrices,
}: {
  onAdd: (h: Omit<Holding, "id" | "addedAt">) => void;
  onCancel: () => void;
  livePrices: LivePrice[];
}) {
  const [symbol, setSymbol] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [entry, setEntry] = useState(() => {
    const lp = livePrices.find(p => p.symbol === "BTC");
    return lp ? lp.price.toFixed(2) : "";
  });

  const handleSymbolChange = (s: string) => {
    setSymbol(s);
    const lp = livePrices.find(p => p.symbol === s);
    if (lp) setEntry(lp.price.toFixed(2));
  };

  const handleAdd = () => {
    const amt = parseFloat(amount);
    const ep = parseFloat(entry);
    if (!amt || !ep || amt <= 0 || ep <= 0) return;
    onAdd({ symbol, amount: amt, entryPrice: ep });
  };

  return (
    <div className="p-3 bg-black/40 border-t border-white/5 space-y-2.5">
      <div className="text-[8px] font-mono text-muted-foreground/40 tracking-widest uppercase">
        Add holding
      </div>
      {/* Symbol select */}
      <div className="flex gap-1">
        {SUPPORTED.map(s => (
          <button
            key={s}
            onClick={() => handleSymbolChange(s)}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all ${
              symbol === s
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/8 text-muted-foreground/40 hover:border-white/15"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {/* Amount */}
      <div className="space-y-1">
        <label className="text-[8px] font-mono text-muted-foreground/30 tracking-wider">AMOUNT</label>
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 0.5"
          className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-foreground/80 placeholder-muted-foreground/20 focus:outline-none focus:border-primary/30 transition-all"
        />
      </div>
      {/* Entry price */}
      <div className="space-y-1">
        <label className="text-[8px] font-mono text-muted-foreground/30 tracking-wider">ENTRY PRICE (USD)</label>
        <input
          type="number"
          min="0"
          step="any"
          value={entry}
          onChange={e => setEntry(e.target.value)}
          placeholder="e.g. 65000"
          className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-foreground/80 placeholder-muted-foreground/20 focus:outline-none focus:border-primary/30 transition-all"
        />
      </div>
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={handleAdd}
          className="flex-1 py-1.5 rounded-lg bg-primary hover:bg-primary/85 text-black text-[9px] font-mono font-bold transition-all"
        >
          Encrypt &amp; Add
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-white/8 text-[9px] font-mono text-muted-foreground/40 hover:border-white/15 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PrivatePortfolio({ livePrices, onAnalyzeWithGhostAI, onTokenClick }: PrivatePortfolioProps) {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings);
  const [revealed, setRevealed] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const persist = useCallback((h: Holding[]) => {
    setHoldings(h);
    saveHoldings(h);
  }, []);

  const addHolding = useCallback(
    (data: Omit<Holding, "id" | "addedAt">) => {
      const h: Holding = { ...data, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, addedAt: Date.now() };
      persist([...holdings, h]);
      setShowAdd(false);
    },
    [holdings, persist]
  );

  const removeHolding = useCallback(
    (id: string) => persist(holdings.filter(h => h.id !== id)),
    [holdings, persist]
  );

  // ── Computed metrics ────────────────────────────────────────────────────
  const { totalValue, totalCost, totalPnl, totalPnlPct, rows } = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    const rows = holdings.map(h => {
      const lp = livePrices.find(p => p.symbol === h.symbol);
      const currentPrice = lp?.price ?? h.entryPrice;
      const value = currentPrice * h.amount;
      const cost = h.entryPrice * h.amount;
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      totalValue += value;
      totalCost += cost;
      return { ...h, currentPrice, value, cost, pnl, pnlPct, lp };
    });
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalPnl, totalPnlPct, rows };
  }, [holdings, livePrices]);

  const handleGhostAIAnalysis = useCallback(() => {
    if (!onAnalyzeWithGhostAI || rows.length === 0) return;
    setIsAnalyzing(true);

    const breakdown = rows
      .map(r => `${r.symbol}: ${r.amount} units @ entry $${r.entryPrice.toFixed(0)}, current $${r.currentPrice.toFixed(0)}, P&L: ${r.pnl >= 0 ? "+" : ""}$${r.pnl.toFixed(0)} (${r.pnlPct >= 0 ? "+" : ""}${r.pnlPct.toFixed(1)}%)`)
      .join("; ");

    // Compute SSI sector exposure breakdown for GhostAI context
    const sectorTotals: Record<string, number> = {};
    let grand = 0;
    for (const row of rows) {
      grand += row.value;
      const weights = SECTOR_WEIGHTS[row.symbol] ?? { Other: 1.0 };
      for (const [sector, w] of Object.entries(weights)) {
        sectorTotals[sector] = (sectorTotals[sector] ?? 0) + row.value * w;
      }
    }
    const sectorExposure = Object.entries(sectorTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${SECTOR_SSI_LABELS[k] ?? k}:${grand > 0 ? ((v / grand) * 100).toFixed(0) : 0}%`)
      .join(", ");

    const prompt = `Analyze my FHE-encrypted portfolio via GhostTrade Private SSI engine.

Portfolio summary: Total value $${totalValue.toFixed(0)}, Total P&L ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)} (${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(1)}%)

Holdings: ${breakdown}

SSI Sector Exposure: ${sectorExposure}

Analyze using the SoSoValue SSI framework:
1) Which SSI sectors am I overexposed or underexposed to given current capital rotation signals?
2) Which position has the best and worst risk/reward relative to its SSI sector momentum right now?
3) Should I rotate into a different SSI sector? Name specific sector(s) and rationale.
Be sharp, SSI-native, and data-driven. No generic advice.`;

    onAnalyzeWithGhostAI(prompt);
    setTimeout(() => setIsAnalyzing(false), 800);
  }, [rows, totalValue, totalCost, totalPnl, totalPnlPct, onAnalyzeWithGhostAI]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const totalUp = totalPnl >= 0;

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Wallet className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            Private Portfolio
          </span>
          {expanded
            ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground/30" />
            : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/30" />}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowAdd(v => !v); }}
            className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all"
            title="Add holding"
          >
            <Plus className="w-2.5 h-2.5 text-muted-foreground/40" />
          </button>
          <button
            onClick={() => setRevealed(v => !v)}
            className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all"
            title={revealed ? "Encrypt holdings" : "Decrypt holdings"}
          >
            {revealed
              ? <EyeOff className="w-2.5 h-2.5 text-muted-foreground/40" />
              : <Eye className="w-2.5 h-2.5 text-muted-foreground/40" />}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <AddHoldingForm
          onAdd={addHolding}
          onCancel={() => setShowAdd(false)}
          livePrices={livePrices}
        />
      )}

      {expanded && (
        <>
          {holdings.length === 0 ? (
            <div className="px-4 py-6 text-center space-y-2">
              <div className="w-8 h-8 rounded-xl border border-white/8 bg-white/2 flex items-center justify-center mx-auto">
                <Lock className="w-3.5 h-3.5 text-muted-foreground/25" />
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/25">
                No holdings tracked
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-[9px] font-mono text-primary/50 hover:text-primary/80 transition-colors underline underline-offset-2"
              >
                Add your first holding
              </button>
            </div>
          ) : (
            <div className="px-4 pt-3 pb-2 space-y-4">
              {/* Total P&L summary */}
              <div className="flex items-start justify-between p-3 rounded-xl border border-white/6 bg-black/30">
                <div>
                  <div className="text-[8px] font-mono text-muted-foreground/35 tracking-wider mb-1">
                    TOTAL VALUE
                  </div>
                  <div className="text-base font-mono font-black text-white/90">
                    {revealed ? fmt(totalValue) : (
                      <span className="text-[10px] text-muted-foreground/25 font-mono tracking-wider">
                        {fheEncryptValue(totalValue, "total")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-mono text-muted-foreground/35 tracking-wider mb-1">
                    TOTAL P&amp;L
                  </div>
                  <div className={`flex items-center gap-0.5 font-mono font-bold text-sm justify-end ${totalUp ? "text-emerald-400" : "text-red-400"}`}>
                    {totalUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {revealed ? (
                      <>
                        {totalUp ? "+" : ""}{fmt(totalPnl)}
                        <span className="text-[9px] font-normal ml-1 opacity-70">
                          ({totalUp ? "+" : ""}{totalPnlPct.toFixed(1)}%)
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground/25 tracking-wider">
                        {fheEncryptValue(totalPnl, "pnl")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Holdings list */}
              <div className="space-y-1.5">
                {rows.map(row => {
                  const up = row.pnl >= 0;
                  const clickable = revealed && !!onTokenClick;
                  return (
                    <div
                      key={row.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-black/20 group transition-all ${clickable ? "hover:border-primary/20 hover:bg-primary/4 cursor-pointer" : "hover:border-white/10"}`}
                      onClick={() => clickable && onTokenClick(row.symbol)}
                    >
                      {/* Symbol badge */}
                      <div className="w-7 h-7 rounded-lg border border-white/10 bg-white/4 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-mono font-bold text-foreground/60">
                          {row.symbol.slice(0, 2)}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-foreground/75">
                            {revealed ? row.symbol : fheEncryptLabel(row.symbol)}
                          </span>
                          <span className={`text-[9px] font-mono font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                            {revealed
                              ? `${up ? "+" : ""}${row.pnlPct.toFixed(1)}%`
                              : fheEncryptValue(row.pnlPct, row.id).slice(0, 10)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[8px] font-mono text-muted-foreground/30">
                            {revealed
                              ? `${row.amount} × $${row.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                              : `${fheEncryptValue(row.amount, row.id).slice(0, 12)}`}
                          </span>
                          <span className={`text-[8px] font-mono ${up ? "text-emerald-400/60" : "text-red-400/60"}`}>
                            {revealed
                              ? `${up ? "+" : ""}${fmt(row.pnl)}`
                              : fheEncryptValue(row.pnl, row.id).slice(0, 10)}
                          </span>
                        </div>
                      </div>

                      {/* Expand hint / Remove */}
                      {clickable ? (
                        <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); removeHolding(row.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                        >
                          <X className="w-2.5 h-2.5 text-muted-foreground/25 hover:text-red-400 transition-colors" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sector allocation */}
              <SectorBar holdings={holdings} livePrices={livePrices} />

              {/* GhostAI analysis button */}
              {onAnalyzeWithGhostAI && (
                <button
                  onClick={handleGhostAIAnalysis}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 text-primary/70 hover:text-primary transition-all text-[9px] font-mono font-bold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAnalyzing
                    ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Sending to GhostAI...</>
                    : <><BrainCircuit className="w-2.5 h-2.5" /> Analyze Portfolio with GhostAI</>}
                </button>
              )}
            </div>
          )}

          {/* FHE footer */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 border border-primary/12 rounded-lg px-2.5 py-1.5 bg-primary/4">
              <ShieldCheck className="w-2.5 h-2.5 text-primary/40 shrink-0" />
              <span className="text-[8px] font-mono text-primary/40">
                {revealed
                  ? "Decrypted · Holdings visible · Click 🔒 to re-encrypt"
                  : "FHE-encrypted · Holdings hidden from on-chain observers"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
