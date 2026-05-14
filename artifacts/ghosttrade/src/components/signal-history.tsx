import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HistoryEntry {
  id: string;
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  price: number;
  change24h: number;
  sentiment: number;
  explanation: string;
  timestamp: number;
  fheMode: string;
}

interface SignalHistoryProps {
  entries: HistoryEntry[];
  onClear: () => void;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(val);
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

const signalConfig = {
  BUY: {
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: TrendingUp,
    dot: "bg-emerald-400",
  },
  SELL: {
    text: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: TrendingDown,
    dot: "bg-red-400",
  },
  HOLD: {
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
    badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    icon: Minus,
    dot: "bg-yellow-400",
  },
};

export default function SignalHistory({ entries, onClear }: SignalHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <Card className="border-white/8 bg-white/3 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-primary" /> Signal History
            <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px]">
              {entries.length}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-[10px] font-mono text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-2">
        {entries.map((entry, i) => {
          const cfg = signalConfig[entry.signal];
          const Icon = cfg.icon;
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.border} ${cfg.bg} transition-all duration-200 hover:brightness-110`}
              style={{
                animation: i === 0 ? "fadeScaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both" : undefined,
              }}
            >
              <style>{`
                @keyframes fadeScaleIn {
                  from { opacity: 0; transform: scale(0.97) translateY(-4px); }
                  to { opacity: 1; transform: scale(1) translateY(0); }
                }
              `}</style>

              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-mono font-black text-xs ${cfg.text}`}>{entry.signal}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">{entry.symbol}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/35">{formatCurrency(entry.price)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground/40 font-mono truncate">{entry.explanation}</div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className={`font-mono text-xs font-bold ${cfg.text}`}>{entry.confidence}%</span>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/30">{timeAgo(entry.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
