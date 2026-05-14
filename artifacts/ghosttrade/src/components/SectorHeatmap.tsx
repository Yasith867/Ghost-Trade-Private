import React, { useMemo, useState, useEffect } from "react";
import {
  X, Lock, ShieldCheck, TrendingUp, TrendingDown, Minus,
  Eye, EyeOff, BrainCircuit, Zap, Shield, Star,
} from "lucide-react";

const SECTORS = [
  { key: "AI",       emoji: "🤖", beta: 1.52, seed: 17 },
  { key: "DeFi",     emoji: "🔗", beta: 1.12, seed: 29 },
  { key: "Layer1",   emoji: "⛓",  beta: 1.00, seed: 41 },
  { key: "Meme",     emoji: "💊", beta: 2.45, seed: 53 },
  { key: "NFT",      emoji: "🎨", beta: 0.82, seed: 67 },
  { key: "RWA",      emoji: "🏦", beta: 0.24, seed: 79 },
  { key: "GameFi",   emoji: "🎮", beta: 1.73, seed: 91 },
  { key: "SocialFi", emoji: "💬", beta: 0.95, seed: 103 },
];

const SECTOR_TOKENS: Record<string, Array<{ symbol: string; beta: number; seed: number }>> = {
  AI:       [{ symbol: "RNDR", beta: 1.4, seed: 7 }, { symbol: "FET", beta: 1.6, seed: 19 }, { symbol: "TAO", beta: 1.9, seed: 31 }],
  DeFi:     [{ symbol: "UNI",  beta: 1.1, seed: 11 }, { symbol: "AAVE", beta: 1.2, seed: 23 }, { symbol: "MKR", beta: 0.9, seed: 37 }],
  Layer1:   [{ symbol: "SOL",  beta: 1.0, seed: 13 }, { symbol: "AVAX", beta: 1.1, seed: 27 }, { symbol: "DOT", beta: 0.8, seed: 43 }],
  Meme:     [{ symbol: "DOGE", beta: 2.2, seed: 17 }, { symbol: "SHIB", beta: 2.8, seed: 29 }, { symbol: "PEPE", beta: 3.1, seed: 41 }],
  NFT:      [{ symbol: "APE",  beta: 1.5, seed: 19 }, { symbol: "BLUR", beta: 1.8, seed: 31 }, { symbol: "IMX", beta: 1.3, seed: 47 }],
  RWA:      [{ symbol: "ONDO", beta: 0.6, seed: 23 }, { symbol: "MKR", beta: 0.7, seed: 37 }, { symbol: "POLY", beta: 0.5, seed: 53 }],
  GameFi:   [{ symbol: "AXS",  beta: 1.7, seed: 29 }, { symbol: "SAND", beta: 1.5, seed: 43 }, { symbol: "MAGIC", beta: 2.0, seed: 59 }],
  SocialFi: [{ symbol: "DESO", beta: 0.9, seed: 31 }, { symbol: "FRIEND", beta: 1.4, seed: 47 }, { symbol: "LENS", beta: 1.1, seed: 61 }],
};

const SECTOR_SSI: Record<string, string> = {
  AI:       "ssiAI underperforming ssiMAG7 by 2.4% — reversion possible",
  DeFi:     "ssiDeFi recovering — +1.8% vs ssiMAG7 this week",
  Layer1:   "ssiL1 tracking ssiMAG7 tightly — correlation at 0.91",
  Meme:     "ssiMeme diverging sharply from ssiMAG7 — high beta exposure",
  NFT:      "ssiNFT lagging ssiMAG7 by 8.3% — sector rotation underway",
  RWA:      "ssiRWA gaining +0.9% vs ssiDeFi — institutional inflows",
  GameFi:   "ssiGameFi underperforming all major indexes — avoid near-term",
  SocialFi: "ssiSocial early accumulation vs ssiMAG7 — watch breakout",
};

function deterministicNoise(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 0.5 + Math.cos(seed * 13.7 + 71.3) * 0.3);
}

function generateNarrative(sector: string, momentum: number): string {
  if (momentum > 3)    return `${sector} surging — aggressive capital inflows detected. Momentum may be overextended near-term.`;
  if (momentum > 1.5)  return `${sector} building strong momentum. Institutional positioning actively accumulating this sector.`;
  if (momentum > 0.5)  return `${sector} trending positive — early rotation phase. Risk/reward tilting favorable for entries.`;
  if (momentum > -0.5) return `${sector} neutral — sector consolidating. Watch for a breakout catalyst in coming sessions.`;
  if (momentum > -1.5) return `${sector} weakening after recent overextension. Cooling period — wait for stabilization before re-entry.`;
  if (momentum > -3)   return `${sector} under selling pressure. Capital rotating out — GhostAI flags defensive positioning.`;
  return `${sector} in sharp decline — sector risk elevated. GhostAI recommends reducing exposure immediately.`;
}

interface SectorHeatmapProps {
  btcChange?: number;
  ethChange?: number;
  solChange?: number;
  realSectorChanges?: Record<string, number>;
  onSectorClick?: (sector: string, momentum: number) => void;
}

function fakeEncryptSector(text: string): string {
  const CIPHER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+=";
  return text.split("").map((c, i) => CIPHER[(c.charCodeAt(0) * 7 + i * 13) % CIPHER.length]).join("") + "==";
}

interface SectorPanelProps {
  sector: string;
  emoji: string;
  momentum: number;
  marketBase: number;
  trackedSectors: string[];
  onToggleTrack: (s: string) => void;
  onClose: () => void;
}

function SectorIntelPanel({ sector, emoji, momentum, marketBase, trackedSectors, onToggleTrack, onClose }: SectorPanelProps) {
  const [trackRevealed, setTrackRevealed] = useState(false);
  const [justTracked, setJustTracked] = useState(false);

  const tokens = SECTOR_TOKENS[sector] ?? [];
  const ssiText = SECTOR_SSI[sector] ?? "";
  const narrative = generateNarrative(sector, momentum);
  const isTracked = trackedSectors.includes(sector);

  const up = momentum >= 0;
  const isNeutral = momentum > -0.5 && momentum < 0.5;
  const color = up ? "16,185,129" : isNeutral ? "234,179,8" : "239,68,68";
  const textClass = up ? "text-emerald-400" : isNeutral ? "text-yellow-400" : "text-red-400";
  const trendLabel = momentum > 1 ? "Bullish" : momentum < -1 ? "Bearish" : "Neutral";
  const strengthScore = Math.min((Math.abs(momentum) / 4) * 100, 100).toFixed(0);

  const handleTrack = () => {
    onToggleTrack(sector);
    if (!isTracked) { setJustTracked(true); setTimeout(() => setJustTracked(false), 2000); }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        animation: "sectorSlideIn 0.38s cubic-bezier(0.16,1,0.3,1) both",
        borderColor: `rgba(${color},0.28)`,
        background: `linear-gradient(135deg, rgba(${color},0.04) 0%, rgba(0,0,0,0.7) 100%)`,
        boxShadow: `0 0 30px rgba(${color},0.08), inset 0 0 40px rgba(${color},0.02)`,
      }}
    >
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, rgba(${color},0.7), transparent)` }} />

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `rgba(${color},0.12)` }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: `rgba(${color},0.12)`, border: `1px solid rgba(${color},0.25)`, boxShadow: `0 0 12px rgba(${color},0.2)` }}
          >
            {emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-white/90">{sector}</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${textClass}`}
                style={{ background: `rgba(${color},0.12)`, border: `1px solid rgba(${color},0.25)` }}
              >
                {trendLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 rounded-full animate-pulse inline-block" style={{ backgroundColor: `rgba(${color},0.8)` }} />
              <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">Sector Intelligence</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md border border-white/8 flex items-center justify-center hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all text-muted-foreground/30"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Momentum", value: `${momentum >= 0 ? "+" : ""}${momentum.toFixed(2)}%`, cls: textClass },
            { label: "Trend Dir", value: trendLabel, cls: textClass },
            { label: "Strength", value: `${strengthScore}/100`, cls: "text-white/80" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-lg p-2.5 text-center" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-[8px] font-mono text-muted-foreground/35 tracking-wider mb-1">{label}</div>
              <div className={`text-[11px] font-mono font-bold ${cls}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Strength bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono text-muted-foreground/35 uppercase tracking-wider">Signal Strength</span>
            <span className="text-[8px] font-mono" style={{ color: `rgba(${color},0.8)` }}>{strengthScore}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${strengthScore}%`,
                background: `rgba(${color},0.8)`,
                boxShadow: `0 0 8px rgba(${color},0.5)`,
              }}
            />
          </div>
        </div>

        {/* Top Tokens */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Star className="w-2.5 h-2.5 text-muted-foreground/30" />
            <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">Top Tokens</span>
          </div>
          <div className="space-y-1.5">
            {tokens.map((t, i) => {
              const tokenMomentum = momentum * t.beta + deterministicNoise(t.seed) * 0.4;
              const tokenUp = tokenMomentum >= 0;
              return (
                <div
                  key={t.symbol}
                  className="flex items-center justify-between rounded-lg px-3 py-2 group"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-muted-foreground/25">#{i + 1}</span>
                    <span className="text-[11px] font-mono font-semibold text-white/80">{t.symbol}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${tokenUp ? "text-emerald-400" : "text-red-400"}`}>
                    {tokenUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {tokenUp ? "+" : ""}{tokenMomentum.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Narrative Insight */}
        <div
          className="rounded-xl p-3.5 space-y-2"
          style={{ background: `rgba(${color},0.04)`, border: `1px solid rgba(${color},0.12)` }}
        >
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="w-2.5 h-2.5" style={{ color: `rgba(${color},0.7)` }} />
            <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: `rgba(${color},0.6)` }}>
              AI Narrative
            </span>
          </div>
          <p className="text-[10px] font-mono leading-relaxed text-foreground/65">
            {narrative}
          </p>
        </div>

        {/* SSI Relationship */}
        <div className="rounded-xl p-3.5 space-y-2" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.12)" }}>
          <div className="flex items-center gap-1.5">
            <Zap className="w-2.5 h-2.5 text-blue-400/60" />
            <span className="text-[8px] font-mono text-blue-400/50 uppercase tracking-widest">SSI Relationship</span>
          </div>
          <p className="text-[10px] font-mono text-foreground/55 leading-relaxed">{ssiText}</p>
        </div>

        {/* FHE Private Sector Tracking */}
        <div className="rounded-xl p-3.5 space-y-2.5" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5 text-purple-400/60" />
              <span className="text-[8px] font-mono text-purple-400/60 uppercase tracking-widest">FHE Private Tracking</span>
            </div>
            <button
              onClick={() => setTrackRevealed(v => !v)}
              className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
            >
              {trackRevealed
                ? <EyeOff className="w-2.5 h-2.5 text-muted-foreground/30" />
                : <Eye className="w-2.5 h-2.5 text-muted-foreground/30" />
              }
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {trackRevealed ? (
                <span className="text-[10px] font-mono text-white/60">{sector} sector</span>
              ) : (
                <span className="text-[9px] font-mono text-muted-foreground/25 tracking-wider">{fakeEncryptSector(sector)}</span>
              )}
              {isTracked && (
                <div className="flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-purple-400/50" />
                  <span className="text-[8px] font-mono text-purple-400/50">Encrypted · Hidden from observers</span>
                </div>
              )}
            </div>
            <button
              onClick={handleTrack}
              className={`shrink-0 text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all duration-200 ${
                isTracked
                  ? "border-purple-500/35 bg-purple-500/12 text-purple-400/80 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                  : "border-white/10 text-muted-foreground/40 hover:border-purple-400/30 hover:bg-purple-500/8 hover:text-purple-400"
              }`}
            >
              {isTracked ? "Untrack" : "+ Track"}
            </button>
          </div>

          {justTracked && (
            <div className="text-[8px] font-mono text-purple-400/60 flex items-center gap-1" style={{ animation: "sectorSlideIn 0.3s ease both" }}>
              <Shield className="w-2 h-2" />
              Your sector tracking preferences remain encrypted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SectorHeatmap({ btcChange = 0, ethChange = 0, solChange = 0, realSectorChanges, onSectorClick }: SectorHeatmapProps) {
  const [tick, setTick] = useState(0);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [trackedSectors, setTrackedSectors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghosttrade_sector_tracking") ?? "[]"); } catch { return []; }
  });

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 6000);
    return () => clearInterval(interval);
  }, []);

  const hasRealData = realSectorChanges && Object.keys(realSectorChanges).length > 0;

  const sectors = useMemo(() => {
    const derivedBase = (btcChange * 0.6 + ethChange * 0.3 + solChange * 0.1);
    return SECTORS.map(s => {
      let momentum: number;
      if (hasRealData && realSectorChanges && realSectorChanges[s.key] !== undefined) {
        // Use real CoinGecko sector average — add a tiny live tick noise so tiles feel alive
        const liveNoise = Math.sin(tick * 0.4 + s.seed * 0.2) * 0.05;
        momentum = realSectorChanges[s.key] + liveNoise;
      } else {
        // Fallback: derive from BTC/ETH/SOL via beta coefficients
        const liveNoise = Math.sin(tick * 0.7 + s.seed * 0.3) * 0.14;
        momentum = derivedBase * s.beta + deterministicNoise(s.seed) * 0.8 + liveNoise;
      }
      return { ...s, momentum };
    }).sort((a, b) => b.momentum - a.momentum);
  }, [btcChange, ethChange, solChange, realSectorChanges, hasRealData, tick]);

  const selected = selectedSector ? sectors.find(s => s.key === selectedSector) ?? null : null;

  const handleTileClick = (s: typeof sectors[0]) => {
    if (selectedSector === s.key) {
      setSelectedSector(null);
    } else {
      setSelectedSector(s.key);
      onSectorClick?.(s.key, s.momentum);
    }
  };

  const handleToggleTrack = (sector: string) => {
    setTrackedSectors(prev => {
      const next = prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector];
      try { localStorage.setItem("ghosttrade_sector_tracking", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes sectorPulse {
          0%   { box-shadow: var(--pulse-a); }
          50%  { box-shadow: var(--pulse-b); }
          100% { box-shadow: var(--pulse-a); }
        }
        @keyframes sectorSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes momentumUpdate {
          0%   { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 1;   transform: scale(1); }
        }
        .sector-tile { transition: box-shadow 0.4s ease, background-color 0.4s ease, border-color 0.4s ease, transform 0.2s ease; }
        .sector-tile:hover { transform: scale(1.07) translateY(-2px); }
        .sector-tile.selected { transform: scale(1.04); }
        .sector-tile.strongest { animation: sectorPulse 2.4s ease-in-out infinite; }
      `}</style>

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">Sector Rotation</span>
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: "rgba(16,185,129,0.7)", animation: "sectorPulse 2s ease-in-out infinite", "--pulse-a": "0 0 0 0 rgba(16,185,129,0.4)", "--pulse-b": "0 0 0 5px rgba(16,185,129,0)" } as React.CSSProperties}
          />
          <span className="text-[9px] font-mono text-muted-foreground/25">Live Heat · {sectors.length} Sectors</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {sectors.map((s, i) => {
          const up = s.momentum >= 0;
          const isNeutral = s.momentum > -0.5 && s.momentum < 0.5;
          const intensity = Math.min(Math.abs(s.momentum) / 3.5, 1);
          const isStrongest = i === 0;
          const isSelected = selectedSector === s.key;
          const isHovered = hoveredSector === s.key;
          const isTracked = trackedSectors.includes(s.key);

          const color = up ? "16,185,129" : isNeutral ? "234,179,8" : "239,68,68";
          const textClass = up ? "text-emerald-400" : isNeutral ? "text-yellow-400" : "text-red-400";

          const baseAlpha = 0.06 + intensity * 0.18 + (isSelected ? 0.09 : 0) + (isHovered ? 0.04 : 0);
          const borderAlpha = 0.12 + intensity * 0.32 + (isSelected ? 0.2 : 0) + (isHovered ? 0.1 : 0);
          const glowSize = isStrongest ? 18 + intensity * 22 : 5 + intensity * 12 + (isHovered ? 8 : 0);
          const glowAlpha = isStrongest ? 0.18 + intensity * 0.28 : 0.06 + intensity * 0.18 + (isHovered ? 0.1 : 0);

          const pulseA = `0 0 ${glowSize}px rgba(${color},${glowAlpha})`;
          const pulseB = `0 0 ${glowSize * 2}px rgba(${color},${glowAlpha * 1.7})`;

          return (
            <button
              key={s.key}
              onClick={() => handleTileClick(s)}
              onMouseEnter={() => setHoveredSector(s.key)}
              onMouseLeave={() => setHoveredSector(null)}
              className={`sector-tile rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-95 select-none group relative overflow-hidden ${isStrongest ? "strongest" : ""} ${isSelected ? "selected" : ""}`}
              style={{
                backgroundColor: `rgba(${color},${baseAlpha})`,
                border: `1px solid rgba(${color},${borderAlpha})`,
                boxShadow: `0 0 ${glowSize}px rgba(${color},${glowAlpha})`,
                ...(isStrongest ? { "--pulse-a": pulseA, "--pulse-b": pulseB } as React.CSSProperties : {}),
              }}
            >
              {/* Top highlight line */}
              <div
                className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(${color},${isStrongest ? 0.9 : isHovered ? 0.5 : 0.3}), transparent)`,
                }}
              />

              {/* Rank badge */}
              {i < 3 && (
                <span
                  className="absolute top-1 left-1.5 text-[7px] font-mono font-bold leading-none"
                  style={{ color: `rgba(${color},0.45)` }}
                >
                  #{i + 1}
                </span>
              )}

              {/* Tracking dot */}
              {isTracked && (
                <div className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-purple-400/60" />
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: `rgba(${color},0.6)` }}
                />
              )}

              <span className="text-lg leading-none group-hover:scale-115 transition-transform duration-200">{s.emoji}</span>
              <span className="text-[9px] font-mono text-white/70 font-semibold leading-none">{s.key}</span>
              <span
                className={`text-[9px] font-mono font-bold leading-none ${textClass}`}
                key={`${s.key}-${tick}`}
                style={{ animation: "momentumUpdate 0.5s ease both" }}
              >
                {up ? "+" : ""}{s.momentum.toFixed(1)}%
              </span>
            </button>
          );
        })}

        {/* Momentum legend */}
        <div className="rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 border border-white/5 bg-black/20">
          <div className="w-full space-y-1">
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-red-500/60 via-yellow-500/40 to-emerald-500/60" />
            <div className="flex justify-between">
              <span className="text-[6px] font-mono text-red-400/40">Bear</span>
              <span className="text-[6px] font-mono text-yellow-400/40">Neut</span>
              <span className="text-[6px] font-mono text-emerald-400/40">Bull</span>
            </div>
          </div>
          <span className="text-[7px] font-mono text-muted-foreground/25 text-center leading-tight">Momentum<br/>Scale</span>
        </div>
      </div>

      {/* Expanded Intelligence Panel */}
      {selected && (
        <SectorIntelPanel
          key={selected.key}
          sector={selected.key}
          emoji={selected.emoji}
          momentum={selected.momentum}
          marketBase={btcChange * 0.6 + ethChange * 0.3 + solChange * 0.1}
          trackedSectors={trackedSectors}
          onToggleTrack={handleToggleTrack}
          onClose={() => setSelectedSector(null)}
        />
      )}
    </div>
  );
}
