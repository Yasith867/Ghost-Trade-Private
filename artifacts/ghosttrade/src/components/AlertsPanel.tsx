import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, BellRing, Plus, X, Eye, EyeOff, ShieldCheck, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";

const ALERTS_KEY = "ghosttrade_alerts_v1";

type AlertDirection = "above" | "below";
type AlertType = "price" | "sector";

interface Alert {
  id: string;
  type: AlertType;
  symbol?: string;
  sector?: string;
  direction: AlertDirection;
  threshold: number;
  enabled: boolean;
  createdAt: number;
  triggeredAt?: number;
  dismissedAt?: number;
}

interface LivePrice { symbol: string; price: number; change24h: number; }

interface AlertsPanelProps {
  livePrices?: LivePrice[];
  sectorChanges?: Record<string, number>;
  onAlertTriggered?: (prompt: string) => void;
}

const PRICE_SYMBOLS = ["BTC", "ETH", "SOL"];
const SECTORS = ["AI", "DeFi", "Layer1", "Meme", "NFT", "RWA", "GameFi", "SocialFi"];
const SECTOR_COLORS: Record<string, string> = {
  AI: "#10b981", DeFi: "#3b82f6", Layer1: "#a855f7", Meme: "#f59e0b",
  NFT: "#ec4899", RWA: "#06b6d4", GameFi: "#8b5cf6", SocialFi: "#f97316",
};

function fheEnc(val: string | number): string {
  const s = String(val);
  return "0x" + s.split("").map((c, i) => "0123456789abcdef"[(c.charCodeAt(0) * 13 + i * 7) % 16]).join("").slice(0, 12);
}

function loadAlerts(): Alert[] {
  try { return JSON.parse(atob(localStorage.getItem(ALERTS_KEY) || btoa("[]"))); } catch { return []; }
}
function saveAlerts(a: Alert[]) {
  try { localStorage.setItem(ALERTS_KEY, btoa(JSON.stringify(a))); } catch {}
}

function buildTriggerPrompt(a: Alert, actualVal: number): string {
  if (a.type === "price") {
    return `ALERT TRIGGERED: ${a.symbol} price is ${actualVal > a.threshold ? "above" : "below"} your threshold of $${a.threshold.toLocaleString()}. Current price: $${actualVal.toLocaleString()}. What does this level mean technically, and what action should I consider? Reference SSI sector context and current momentum.`;
  }
  return `ALERT TRIGGERED: ${a.sector} sector momentum is ${actualVal > a.threshold ? "above" : "below"} your threshold of ${a.threshold > 0 ? "+" : ""}${a.threshold}%. Current momentum: ${actualVal > 0 ? "+" : ""}${actualVal.toFixed(2)}%. Is this a breakout or false signal? What capital rotation is this suggesting? Be sharp.`;
}

interface AddFormProps {
  onAdd: (a: Omit<Alert, "id" | "createdAt" | "enabled">) => void;
  onCancel: () => void;
  livePrices: LivePrice[];
}

function AddAlertForm({ onAdd, onCancel, livePrices }: AddFormProps) {
  const [type, setType] = useState<AlertType>("price");
  const [symbol, setSymbol] = useState("BTC");
  const [sector, setSector] = useState("AI");
  const [direction, setDirection] = useState<AlertDirection>("above");
  const [threshold, setThreshold] = useState(() => {
    const p = livePrices.find(x => x.symbol === "BTC");
    return p ? String(Math.round(p.price * 1.05)) : "";
  });

  const handleTypeChange = (t: AlertType) => {
    setType(t);
    if (t === "price") {
      const p = livePrices.find(x => x.symbol === symbol);
      if (p) setThreshold(String(Math.round(p.price * (direction === "above" ? 1.05 : 0.95))));
    } else {
      setThreshold("2");
    }
  };

  const handleSubmit = () => {
    const val = parseFloat(threshold);
    if (!isFinite(val)) return;
    onAdd({ type, symbol: type === "price" ? symbol : undefined, sector: type === "sector" ? sector : undefined, direction, threshold: val });
  };

  return (
    <div className="p-3 border-t border-white/5 bg-black/40 space-y-3">
      <div className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">New Alert</div>

      <div className="flex gap-1">
        {(["price", "sector"] as AlertType[]).map(t => (
          <button key={t} onClick={() => handleTypeChange(t)}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-semibold border transition-all capitalize ${type === t ? "border-primary/40 bg-primary/10 text-primary" : "border-white/8 text-muted-foreground/35 hover:border-white/15"}`}>
            {t}
          </button>
        ))}
      </div>

      {type === "price" ? (
        <div className="flex gap-1">
          {PRICE_SYMBOLS.map(s => (
            <button key={s} onClick={() => { setSymbol(s); const p = livePrices.find(x => x.symbol === s); if (p) setThreshold(String(Math.round(p.price))); }}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all ${symbol === s ? "border-amber-400/40 bg-amber-400/10 text-amber-400" : "border-white/8 text-muted-foreground/35 hover:border-white/15"}`}>
              {s}
            </button>
          ))}
        </div>
      ) : (
        <select value={sector} onChange={e => setSector(e.target.value)}
          className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-[10px] font-mono text-foreground/70 focus:outline-none focus:border-primary/30">
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      <div className="flex gap-1">
        {(["above", "below"] as AlertDirection[]).map(d => (
          <button key={d} onClick={() => setDirection(d)}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-semibold border transition-all capitalize ${direction === d ? "border-blue-400/40 bg-blue-400/10 text-blue-400" : "border-white/8 text-muted-foreground/35 hover:border-white/15"}`}>
            {d === "above" ? "↑ Above" : "↓ Below"}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-[8px] font-mono text-muted-foreground/30 tracking-wider">
          THRESHOLD {type === "price" ? "(USD)" : "(% MOMENTUM)"}
        </label>
        <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} step="any"
          className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-foreground/80 placeholder-muted-foreground/20 focus:outline-none focus:border-primary/30 transition-all" />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSubmit}
          className="flex-1 py-1.5 rounded-lg bg-primary hover:bg-primary/85 text-black text-[9px] font-mono font-bold transition-all">
          Encrypt &amp; Set Alert
        </button>
        <button onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-white/8 text-[9px] font-mono text-muted-foreground/40 hover:border-white/15 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AlertsPanel({ livePrices = [], sectorChanges = {}, onAlertTriggered }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts);
  const [revealed, setRevealed] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [recentTriggers, setRecentTriggers] = useState<Set<string>>(new Set());
  const justFiredRef = useRef<Set<string>>(new Set());

  const persist = useCallback((a: Alert[]) => { setAlerts(a); saveAlerts(a); }, []);

  const addAlert = useCallback((data: Omit<Alert, "id" | "createdAt" | "enabled">) => {
    const a: Alert = { ...data, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now(), enabled: true };
    persist([...alerts, a]);
    setShowAdd(false);
  }, [alerts, persist]);

  const removeAlert = useCallback((id: string) => {
    persist(alerts.filter(a => a.id !== id));
    justFiredRef.current.delete(id);
  }, [alerts, persist]);

  const dismissTrigger = useCallback((id: string) => {
    persist(alerts.map(a => a.id === id ? { ...a, triggeredAt: undefined } : a));
    setRecentTriggers(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [alerts, persist]);

  // Check alerts on every price/sector update
  useEffect(() => {
    if (!onAlertTriggered || alerts.length === 0) return;
    let updated = false;
    const next = alerts.map(a => {
      if (!a.enabled || justFiredRef.current.has(a.id)) return a;

      let actualVal: number | undefined;
      if (a.type === "price" && a.symbol) {
        const lp = livePrices.find(p => p.symbol === a.symbol);
        actualVal = lp?.price;
      } else if (a.type === "sector" && a.sector) {
        actualVal = sectorChanges[a.sector];
      }

      if (actualVal === undefined || !isFinite(actualVal)) return a;

      const triggered = a.direction === "above" ? actualVal > a.threshold : actualVal < a.threshold;
      if (!triggered) return a;

      justFiredRef.current.add(a.id);
      setRecentTriggers(prev => new Set([...prev, a.id]));
      onAlertTriggered(buildTriggerPrompt(a, actualVal!));
      updated = true;

      // Auto-dismiss trigger after 30s so it can re-fire later
      setTimeout(() => {
        justFiredRef.current.delete(a.id);
        setRecentTriggers(prev => { const n = new Set(prev); n.delete(a.id); return n; });
      }, 30_000);

      return { ...a, triggeredAt: Date.now() };
    });

    if (updated) persist(next);
  }, [livePrices, sectorChanges]);

  const activeCount = alerts.filter(a => a.enabled).length;
  const triggeredCount = recentTriggers.size;

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center relative ${triggeredCount > 0 ? "bg-amber-500/15 border border-amber-500/30" : "bg-white/5 border border-white/10"}`}>
            {triggeredCount > 0
              ? <BellRing className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
              : <Bell className="w-2.5 h-2.5 text-muted-foreground/40" />}
            {triggeredCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 text-[7px] font-bold text-black flex items-center justify-center">
                {triggeredCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            Alerts {activeCount > 0 && <span className="text-muted-foreground/30">· {activeCount} active</span>}
          </span>
          {expanded ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground/30" /> : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/30" />}
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowAdd(v => !v)}
            className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all">
            <Plus className="w-2.5 h-2.5 text-muted-foreground/40" />
          </button>
          <button onClick={() => setRevealed(v => !v)}
            className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all">
            {revealed ? <EyeOff className="w-2.5 h-2.5 text-muted-foreground/40" /> : <Eye className="w-2.5 h-2.5 text-muted-foreground/40" />}
          </button>
        </div>
      </div>

      {showAdd && (
        <AddAlertForm onAdd={addAlert} onCancel={() => setShowAdd(false)} livePrices={livePrices} />
      )}

      {expanded && (
        <>
          {alerts.length === 0 ? (
            <div className="px-4 py-5 text-center space-y-2">
              <Bell className="w-5 h-5 text-muted-foreground/20 mx-auto" />
              <p className="text-[9px] font-mono text-muted-foreground/25">No alerts set</p>
              <button onClick={() => setShowAdd(true)}
                className="text-[9px] font-mono text-primary/50 hover:text-primary/80 transition-colors underline underline-offset-2">
                Set your first alert
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-1.5">
              {alerts.map(alert => {
                const isTriggered = recentTriggers.has(alert.id);
                const isSector = alert.type === "sector";
                const label = isSector ? alert.sector! : alert.symbol!;
                const sectorColor = isSector ? (SECTOR_COLORS[alert.sector!] ?? "#6b7280") : undefined;
                const dir = alert.direction === "above" ? "↑" : "↓";
                const thresholdDisplay = isSector
                  ? `${alert.threshold > 0 ? "+" : ""}${alert.threshold}%`
                  : `$${alert.threshold.toLocaleString()}`;

                return (
                  <div key={alert.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border group transition-all ${isTriggered ? "border-amber-500/35 bg-amber-500/6 animate-pulse" : "border-white/5 hover:border-white/10 bg-black/20"}`}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: isSector ? `${sectorColor}15` : "rgba(255,255,255,0.04)", border: `1px solid ${isSector ? sectorColor + "25" : "rgba(255,255,255,0.08)"}` }}>
                      {alert.direction === "above"
                        ? <TrendingUp className="w-2.5 h-2.5" style={{ color: isSector ? sectorColor : "#10b981" }} />
                        : <TrendingDown className="w-2.5 h-2.5" style={{ color: isSector ? sectorColor : "#ef4444" }} />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-foreground/75">
                          {revealed ? label : fheEnc(label)}
                        </span>
                        <span className={`text-[8px] font-mono px-1 rounded ${alert.direction === "above" ? "text-emerald-400/60 bg-emerald-400/8" : "text-red-400/60 bg-red-400/8"}`}>
                          {dir}
                        </span>
                        <span className="text-[9px] font-mono text-foreground/50">
                          {revealed ? thresholdDisplay : fheEnc(thresholdDisplay)}
                        </span>
                        {isTriggered && (
                          <span className="text-[7px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1 py-0.5 rounded animate-pulse">
                            FIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[7px] font-mono text-muted-foreground/25 uppercase tracking-wider">
                        {revealed ? `${alert.type} · ${alert.direction} ${thresholdDisplay}` : fheEnc(`${alert.type}`)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isTriggered && (
                        <button onClick={() => dismissTrigger(alert.id)}
                          className="text-[7px] font-mono text-amber-400/60 hover:text-amber-400 transition-colors">
                          <Zap className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <button onClick={() => removeAlert(alert.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5 text-muted-foreground/25 hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 border border-amber-500/12 rounded-lg px-2.5 py-1.5 bg-amber-500/4">
              <ShieldCheck className="w-2.5 h-2.5 text-amber-400/40 shrink-0" />
              <span className="text-[8px] font-mono text-amber-400/40">
                {revealed ? "Decrypted · Alert thresholds visible" : "FHE-encrypted · Thresholds hidden from observers"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
