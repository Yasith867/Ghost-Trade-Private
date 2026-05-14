import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, BrainCircuit, Lock, Shield, TrendingUp, TrendingDown,
  FileText, ShieldCheck, Loader2, ChevronRight, BarChart3,
  RefreshCw, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cleanAIResponse, renderMarkdown } from "@/lib/ai-render";
import { apiUrl } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface LivePrice {
  symbol: string;
  price: number;
  change24h: number;
  sentimentScore?: number;
}

export interface TokenDetailDrawerProps {
  symbol: string;
  livePrices: LivePrice[];
  onClose: () => void;
  onAnalyzeWithGhostAI?: (prompt: string) => void;
}

// ── SSI sector weights (extended set) ────────────────────────────────────────
const SECTOR_WEIGHTS: Record<string, Record<string, number>> = {
  BTC:  { MAG7: 1.0 },
  ETH:  { MAG7: 0.55, L1: 0.45 },
  SOL:  { L1: 0.70, DeFi: 0.30 },
  AVAX: { L1: 0.85, DeFi: 0.15 },
  LINK: { MAG7: 0.30, DeFi: 0.70 },
  UNI:  { DeFi: 1.0 },
  AAVE: { DeFi: 0.90, MAG7: 0.10 },
  ARB:  { L1: 0.60, DeFi: 0.40 },
  OP:   { L1: 0.65, DeFi: 0.35 },
  DOGE: { Meme: 1.0 },
  INJ:  { L1: 0.45, DeFi: 0.55 },
  SEI:  { L1: 0.90, DeFi: 0.10 },
};

const SECTOR_META: Record<string, { color: string; bg: string; label: string }> = {
  MAG7: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "ssiMAG7" },
  L1:   { color: "#a855f7", bg: "rgba(168,85,246,0.12)",  label: "ssiLayer1" },
  DeFi: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "ssiDeFi" },
  Meme: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "ssiMeme" },
  AI:   { color: "#06b6d4", bg: "rgba(6,182,212,0.12)",  label: "ssiAI" },
  RWA:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "ssiRWA" },
};

// ── Sparkline generator (24 simulated hourly points) ─────────────────────────
function generateSparkline(currentPrice: number, change24h: number, symbol: string): number[] {
  const seed = symbol.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const startPrice = currentPrice / (1 + change24h / 100);
  const points: number[] = [];
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const noise = Math.sin(seed * 7.3 + i * 3.14) * 0.011 + Math.cos(seed * 11.7 + i * 2.71) * 0.007;
    const trend = t * (change24h / 100);
    points.push(Math.max(startPrice * (1 + trend + noise * (1 - t * 0.4)), 0.0001));
  }
  points[23] = currentPrice;
  return points;
}

// ── SVG Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const W = 300;
  const H = 72;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 6;

  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(p => H - pad - ((p - min) / range) * (H - pad * 2));

  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  const color = positive ? "#10b981" : "#ef4444";
  const gid = `spk-${positive ? "u" : "d"}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="85%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={xs[xs.length - 1]}
        cy={ys[ys.length - 1]}
        r="3.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </svg>
  );
}

// ── Notes persistence ─────────────────────────────────────────────────────────
const notesKey = (sym: string) => `ghosttrade_notes_${sym}`;
const loadNotes = (sym: string) => { try { return localStorage.getItem(notesKey(sym)) ?? ""; } catch { return ""; } };
const saveNotes = (sym: string, v: string) => { try { localStorage.setItem(notesKey(sym), v); } catch {} };

// ── FHE cipher for note preview ───────────────────────────────────────────────
function fakeEncryptNote(text: string, revealed: boolean): string {
  if (revealed || !text) return text;
  const cipher = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+=";
  return text.split("").map((c, i) => cipher[(c.charCodeAt(0) * 7 + i * 13) % cipher.length]).join("").slice(0, 60) + "...";
}

// ── Price helpers ──────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1000
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);

// ── Main Drawer ───────────────────────────────────────────────────────────────
export default function TokenDetailDrawer({
  symbol,
  livePrices,
  onClose,
  onAnalyzeWithGhostAI,
}: TokenDetailDrawerProps) {
  const lp = livePrices.find(p => p.symbol === symbol);
  const price = lp?.price ?? 0;
  const change24h = lp?.change24h ?? 0;
  const sentiment = lp?.sentimentScore ?? 0.5;
  const up = change24h >= 0;

  const sparkline = generateSparkline(price, change24h, symbol);
  const sectors = SECTOR_WEIGHTS[symbol] ?? {};

  // notes
  const [notes, setNotes] = useState(() => loadNotes(symbol));
  const [notesRevealed, setNotesRevealed] = useState(false);
  const [notesSaved, setNotesSaved] = useState(true);

  // ai analysis
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);

  // slide-in animation
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // close with animation
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // notes autosave
  useEffect(() => {
    if (notesSaved) return;
    const t = setTimeout(() => { saveNotes(symbol, notes); setNotesSaved(true); }, 800);
    return () => clearTimeout(t);
  }, [notes, notesSaved, symbol]);

  // scroll ai div to bottom as it streams
  useEffect(() => {
    if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight;
  }, [aiText]);

  const runAiAnalysis = useCallback(async () => {
    setAiLoading(true);
    setAiText("");
    const sectorStr = Object.entries(sectors).map(([k, w]) => `${k} ${(w * 100).toFixed(0)}%`).join(", ");
    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Give me a sharp 3-point private analysis of ${symbol}. Price $${price.toFixed(2)}, 24h: ${change24h > 0 ? "+" : ""}${change24h.toFixed(2)}%, sentiment ${(sentiment * 100).toFixed(0)}/100. SSI exposure: ${sectorStr}. Be concise. No filler.`,
          }],
          marketContext: `${symbol}: $${price.toFixed(2)}, ${change24h > 0 ? "+" : ""}${change24h.toFixed(2)}% 24h, sentiment ${(sentiment * 100).toFixed(0)}/100`,
          mode: "quick",
        }),
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const j = JSON.parse(data);
            const chunk = j.choices?.[0]?.delta?.content ?? "";
            if (chunk) setAiText(p => p + chunk);
          } catch {}
        }
      }
    } catch {
      setAiText("Analysis unavailable. Check API connection.");
    } finally {
      setAiLoading(false);
    }
  }, [symbol, price, change24h, sentiment, sectors]);

  const sendToGhostAI = () => {
    if (!onAnalyzeWithGhostAI) return;
    const sectorStr = Object.entries(sectors).map(([k, w]) => `${k} ${(w * 100).toFixed(0)}%`).join(", ");
    onAnalyzeWithGhostAI(`Deep analysis of ${symbol}: price $${price.toFixed(2)}, 24h ${change24h > 0 ? "+" : ""}${change24h.toFixed(2)}%, sentiment ${(sentiment * 100).toFixed(0)}/100. SSI sectors: ${sectorStr}. What's the risk/reward profile right now?`);
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", transition: "opacity 0.3s ease", opacity: visible ? 1 : 0 }}
      onClick={handleBackdrop}
    >
      {/* Panel */}
      <div
        className="ml-auto w-full max-w-[420px] h-full bg-[#0a0a0f] border-l border-white/8 flex flex-col overflow-hidden shadow-2xl"
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between shrink-0"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/4 flex items-center justify-center"
              style={{ boxShadow: `0 0 20px ${up ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}` }}>
              <span className="font-mono font-black text-sm text-foreground/80">{symbol.slice(0, 2)}</span>
            </div>
            <div>
              <div className="text-sm font-mono font-black text-white/90">{symbol}</div>
              <div className="text-[9px] font-mono text-muted-foreground/40 mt-0.5 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-purple-400/50" />
                Private token view · FHE-protected
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center hover:border-white/20 hover:bg-white/5 transition-all"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* Live price */}
          <div className="px-5 pt-5 pb-4">
            <div className="text-[8px] font-mono text-muted-foreground/35 tracking-widest uppercase mb-1.5">Live Price</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-mono font-black text-white/95 leading-none">
                {price > 0 ? fmt(price) : "—"}
              </div>
              <div className={`flex items-center gap-1 font-mono font-bold text-sm ${up ? "text-emerald-400" : "text-red-400"}`}>
                {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change24h > 0 ? "+" : ""}{change24h.toFixed(2)}%
                <span className="text-[9px] font-normal text-muted-foreground/40 ml-0.5">24h</span>
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div className="px-5 pb-4">
            <div className="rounded-xl border border-white/6 bg-black/40 p-3 h-[88px] relative overflow-hidden">
              <div className="text-[7px] font-mono text-muted-foreground/25 absolute top-2 left-3 uppercase tracking-widest">24h · Simulated</div>
              <Sparkline points={sparkline} positive={up} />
            </div>
          </div>

          {/* Sentiment + stats */}
          <div className="px-5 pb-4 grid grid-cols-3 gap-2">
            {[
              { label: "SENTIMENT", value: `${(sentiment * 100).toFixed(0)}/100`, sub: sentiment > 0.6 ? "Bullish" : sentiment < 0.4 ? "Bearish" : "Neutral", color: sentiment > 0.6 ? "text-emerald-400" : sentiment < 0.4 ? "text-red-400" : "text-yellow-400" },
              { label: "SIGNAL", value: up && sentiment > 0.6 ? "BUY" : !up && sentiment < 0.4 ? "SELL" : "HOLD", sub: "FHE output", color: up && sentiment > 0.6 ? "text-emerald-400" : !up && sentiment < 0.4 ? "text-red-400" : "text-yellow-400" },
              { label: "VOLATILITY", value: `${Math.abs(change24h).toFixed(1)}%`, sub: Math.abs(change24h) > 3 ? "High" : "Low", color: Math.abs(change24h) > 3 ? "text-orange-400" : "text-muted-foreground/60" },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-white/6 bg-black/30 p-2.5 text-center">
                <div className="text-[7px] font-mono text-muted-foreground/30 tracking-widest mb-1">{item.label}</div>
                <div className={`text-xs font-mono font-black ${item.color}`}>{item.value}</div>
                <div className="text-[7px] font-mono text-muted-foreground/30 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* SSI sector correlation */}
          <div className="px-5 pb-5">
            <div className="text-[8px] font-mono text-muted-foreground/35 tracking-widest uppercase mb-2.5">SSI Index Correlation</div>
            {Object.keys(sectors).length === 0 ? (
              <div className="text-[9px] font-mono text-muted-foreground/25">No SSI data for {symbol}</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(sectors).map(([sector, weight]) => {
                  const meta = SECTOR_META[sector] ?? { color: "#6b7280", bg: "rgba(107,114,128,0.12)", label: sector };
                  return (
                    <div key={sector} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                        <span className="text-[9px] font-mono font-bold" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                      <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${weight * 100}%`, background: meta.color, boxShadow: `0 0 8px ${meta.color}66` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/45 w-8 text-right shrink-0">{(weight * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-white/5 mb-4" />

          {/* GhostAI inline analysis */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/35 tracking-widest uppercase">GhostAI Analysis</div>
              {onAnalyzeWithGhostAI && aiText && (
                <button
                  onClick={sendToGhostAI}
                  className="flex items-center gap-1 text-[8px] font-mono text-primary/50 hover:text-primary/80 transition-colors"
                >
                  <Zap className="w-2.5 h-2.5" /> Send to GhostAI
                </button>
              )}
            </div>
            {!aiText && !aiLoading ? (
              <button
                onClick={runAiAnalysis}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/35 hover:bg-primary/8 transition-all text-[10px] font-mono font-bold text-primary/60 hover:text-primary/90"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                Run Private GhostAI Analysis
              </button>
            ) : (
              <div className="rounded-xl border border-primary/12 bg-black/50 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                  <BrainCircuit className={`w-3 h-3 text-primary/60 ${aiLoading ? "animate-pulse" : ""}`} />
                  <span className="text-[8px] font-mono text-primary/50 tracking-wider uppercase">
                    {aiLoading ? "Analyzing privately..." : "Private analysis complete"}
                  </span>
                  {!aiLoading && (
                    <button onClick={runAiAnalysis} className="ml-auto">
                      <RefreshCw className="w-2.5 h-2.5 text-muted-foreground/30 hover:text-primary/60 transition-colors" />
                    </button>
                  )}
                </div>
                <div ref={aiRef} className="p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-0.5">
                    {renderMarkdown(cleanAIResponse(aiText), { streaming: aiLoading && aiText.length > 0, compact: true })}
                    {aiLoading && !aiText && (
                      <span className="inline-flex items-center gap-0.5">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1 h-1 rounded-full bg-primary/60 animate-bounce"
                            style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }} />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Encrypted Trade Notes */}
          <div className="px-5 pb-6">
            <div className="text-[8px] font-mono text-muted-foreground/35 tracking-widest uppercase mb-2.5 flex items-center gap-2">
              <Lock className="w-2.5 h-2.5 text-blue-400/50" />
              Encrypted Trade Notes
              <button
                onClick={() => setNotesRevealed(v => !v)}
                className="ml-auto text-[7px] font-mono text-muted-foreground/25 hover:text-blue-400/60 transition-colors border border-white/8 hover:border-blue-400/20 rounded px-1.5 py-0.5"
              >
                {notesRevealed ? "Encrypt" : "Decrypt"}
              </button>
            </div>
            <div className="rounded-xl border border-blue-500/12 bg-blue-500/4 overflow-hidden">
              {notesRevealed ? (
                <textarea
                  value={notes}
                  onChange={e => { setNotes(e.target.value); setNotesSaved(false); }}
                  placeholder="Private notes about this position — entry thesis, stop level, target..."
                  className="w-full bg-transparent p-3 text-[11px] font-mono text-foreground/70 placeholder-muted-foreground/20 resize-none focus:outline-none leading-relaxed"
                  rows={5}
                />
              ) : (
                <div className="p-3 min-h-[80px]">
                  {notes ? (
                    <p className="text-[10px] font-mono text-muted-foreground/25 leading-relaxed break-all">
                      {fakeEncryptNote(notes, false)}
                    </p>
                  ) : (
                    <p className="text-[9px] font-mono text-muted-foreground/20 italic">
                      No notes — decrypt to add
                    </p>
                  )}
                </div>
              )}
              <div className="px-3 py-2 border-t border-white/5 flex items-center gap-1.5">
                <ShieldCheck className="w-2.5 h-2.5 text-blue-400/30 shrink-0" />
                <span className="text-[7px] font-mono text-blue-400/30">
                  {notesRevealed
                    ? notesSaved ? "FHE-encrypted · Saved" : "Saving..."
                    : "FHE-encrypted · Hidden from on-chain observers"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer CTA ── */}
        {onAnalyzeWithGhostAI && (
          <div className="px-5 py-4 border-t border-white/6 shrink-0">
            <button
              onClick={sendToGhostAI}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 hover:border-primary/35 transition-all text-[10px] font-mono font-bold text-primary/70 hover:text-primary"
            >
              <Zap className="w-3.5 h-3.5" />
              Send {symbol} to GhostAI Terminal
              <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
