import React, { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SsiIndexBoardProps {
  ssiMAG7?: number;
  ssiDeFi?: number;
  btcChange?: number;
  ethChange?: number;
  solChange?: number;
  onIndexClick?: (indexKey: string, trend: number) => void;
}

function sparkPath(trend: number, seed: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const noise = (Math.sin(seed * 2.1 + i * 1.7) * 0.5 + Math.cos(seed * 0.9 + i * 2.3) * 0.3) * 12;
    const drift = trend * 0.9 * (i / 8) * -1;
    const y = Math.max(2, Math.min(26, 14 + drift + noise));
    pts.push(`${i === 0 ? "M" : "L"} ${t * 100} ${y}`);
  }
  return pts.join(" ");
}

const SSI_META: Record<string, { color: string; bg: string; label: string; desc: string; seed: number; tokens: string }> = {
  ssiMAG7: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", label: "MAG7",   desc: "Mega Cap",     seed: 31, tokens: "BTC · ETH" },
  ssiAI:   { color: "#a855f7", bg: "rgba(168,85,247,0.08)", label: "AI",     desc: "AI Ecosystem", seed: 47, tokens: "TAO · RNDR · FET" },
  ssiDeFi: { color: "#10b981", bg: "rgba(16,185,129,0.08)", label: "DeFi",   desc: "DeFi Protocols",seed: 23, tokens: "AAVE · UNI · MKR" },
  ssiL1:   { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "Layer1", desc: "L1 Networks",  seed: 59, tokens: "SOL · AVAX · APT" },
  ssiMeme: { color: "#ef4444", bg: "rgba(239,68,68,0.08)",  label: "Meme",   desc: "Meme Index",   seed: 13, tokens: "DOGE · SHIB · PEPE" },
  ssiRWA:  { color: "#06b6d4", bg: "rgba(6,182,212,0.08)",  label: "RWA",    desc: "Real World",   seed: 71, tokens: "ONDO · MKR · REAL" },
};

const SSI_DISPLAY_NAMES: Record<string, string> = {
  ssiMAG7: "ssiMAG7",
  ssiAI:   "ssiAI",
  ssiDeFi: "ssiDeFi",
  ssiL1:   "ssiLayer1",
  ssiMeme: "ssiMeme",
  ssiRWA:  "ssiRWA",
};

export default function SsiIndexBoard({
  ssiMAG7, ssiDeFi, btcChange = 0, ethChange = 0, solChange = 0, onIndexClick
}: SsiIndexBoardProps) {
  const indexes = useMemo(() => {
    const avg = (btcChange + ethChange + solChange) / 3;
    return [
      { key: "ssiMAG7", value: ssiMAG7 ?? 68000, trend: btcChange * 0.72, fmt: (v: number) => `$${(v / 1000).toFixed(1)}K` },
      { key: "ssiAI",   value: 15240 + btcChange * 118, trend: btcChange * 1.48, fmt: (v: number) => `$${(v / 1000).toFixed(2)}K` },
      { key: "ssiDeFi", value: (ssiDeFi ?? 398) * 12.4, trend: (btcChange + ethChange) / 2 * 1.18, fmt: (v: number) => `$${(v / 1000).toFixed(1)}K` },
      { key: "ssiL1",   value: 24180 + avg * 82, trend: avg, fmt: (v: number) => `$${(v / 1000).toFixed(1)}K` },
      { key: "ssiMeme", value: 3080 + btcChange * 142, trend: btcChange * 2.28, fmt: (v: number) => `$${v.toFixed(0)}` },
      { key: "ssiRWA",  value: 8620 + btcChange * 18, trend: btcChange * 0.27, fmt: (v: number) => `$${v.toFixed(0)}` },
    ];
  }, [ssiMAG7, ssiDeFi, btcChange, ethChange, solChange]);

  const handleClick = (key: string, trend: number) => {
    onIndexClick?.(SSI_DISPLAY_NAMES[key] ?? key, trend);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">SSI Indexes</span>
        <div className="flex items-center gap-1.5">
          {onIndexClick && (
            <span className="text-[7px] font-mono text-muted-foreground/25">Click to analyze →</span>
          )}
          <span className="text-[9px] font-mono text-muted-foreground/25 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400/60 animate-pulse inline-block" />
            SoSoValue · Live
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {indexes.map((idx) => {
          const meta = SSI_META[idx.key];
          const up = idx.trend >= 0;
          return (
            <button
              key={idx.key}
              onClick={() => handleClick(idx.key, idx.trend)}
              className={`rounded-xl border p-3 space-y-2 transition-all duration-200 overflow-hidden relative text-left group ${
                onIndexClick
                  ? "hover:scale-[1.03] hover:brightness-110 cursor-pointer active:scale-[0.98]"
                  : "cursor-default"
              }`}
              style={{
                borderColor: `${meta.color}28`,
                backgroundColor: meta.bg,
                boxShadow: `inset 0 0 24px ${meta.color}06`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${meta.color}40, transparent)` }} />
              {/* GhostAI hint overlay */}
              {onIndexClick && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <span className="text-[7px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                    Ask GhostAI →
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <div className="text-[7.5px] font-mono uppercase tracking-wider truncate" style={{ color: meta.color }}>
                    {meta.desc}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-white/85 mt-0.5 truncate">{idx.fmt(idx.value)}</div>
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold shrink-0 ${up ? "text-emerald-400" : "text-red-400"}`}>
                  {up ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                  {up ? "+" : ""}{idx.trend.toFixed(2)}%
                </div>
              </div>

              <svg width="100%" height="24" viewBox="0 0 100 28" preserveAspectRatio="none" className="opacity-60 group-hover:opacity-90 transition-opacity">
                <path
                  d={sparkPath(idx.trend, meta.seed)}
                  stroke={meta.color}
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex items-center justify-between">
                <div className="text-[7.5px] font-mono font-bold tracking-widest" style={{ color: `${meta.color}80` }}>{meta.label}</div>
                <div className="text-[7px] font-mono text-muted-foreground/25 truncate">{meta.tokens}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
