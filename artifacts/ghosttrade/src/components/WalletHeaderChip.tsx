import React, { useEffect, useMemo, useState } from "react";
import {
  Lock, Wallet, LogOut, ChevronDown, Shield, Zap,
  AlertTriangle, Loader2, Copy, CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function AddressAvatar({ address }: { address: string }) {
  const hue = parseInt(address.slice(2, 6), 16) % 360;
  return (
    <div
      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-mono font-black text-black"
      style={{ background: `hsl(${hue}, 70%, 55%)` }}
    >
      {address.slice(2, 4).toUpperCase()}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WalletHeaderChip() {
  const {
    address, fheMode, networkName, status,
    lastConnectedAt, connect, disconnect, switchToFhenix,
  } = useWallet();

  const [now,     setNow]     = useState(Date.now());
  const [copied,  setCopied]  = useState(false);

  // Update elapsed time every 30s
  useEffect(() => {
    if (!lastConnectedAt) return;
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, [lastConnectedAt]);

  const sessionDuration = useMemo(() =>
    lastConnectedAt ? formatDuration(now - lastConnectedAt) : null,
  [now, lastConnectedAt]);

  const truncated = address
    ? `${address.substring(0, 6)}…${address.slice(-4)}`
    : null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Reconnecting ──────────────────────────────────────────────────────────
  if (status === "reconnecting") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 font-mono text-[10px] text-white/40">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Restoring session...</span>
      </div>
    );
  }

  // ── Connecting ────────────────────────────────────────────────────────────
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/6 border border-primary/15 font-mono text-[10px] text-primary/60">
        <Loader2 className="w-3 h-3 animate-spin text-primary" />
        <span>Awaiting approval...</span>
      </div>
    );
  }

  // ── Disconnected ──────────────────────────────────────────────────────────
  if (!address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-[10px] border-orange-500/25 bg-orange-500/6 text-orange-400/80 hidden sm:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400/50 animate-pulse mr-1.5" />
          Simulation · FHE-ready
        </Badge>
        <Button
          onClick={connect}
          variant="outline"
          size="sm"
          className="border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-primary text-xs font-mono transition-all hover:shadow-[0_0_16px_rgba(16,185,129,0.25)] group"
        >
          <Wallet className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" />
          Connect Wallet
        </Button>
      </div>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  const isRealFHE = fheMode === "real";

  return (
    <div className="flex items-center gap-2">
      {/* FHE mode badge */}
      <div
        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[10px] transition-all duration-500 ${
          isRealFHE
            ? "border-primary/30 bg-primary/8 text-primary"
            : "border-orange-500/20 bg-orange-500/6 text-orange-400/80"
        }`}
        style={isRealFHE ? {
          boxShadow: "0 0 12px rgba(16,185,129,0.2), inset 0 0 12px rgba(16,185,129,0.05)",
          animation: "fheGlow 2.5s ease-in-out infinite",
        } : undefined}
      >
        {isRealFHE
          ? <><Lock className="w-2.5 h-2.5" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.8))" }} /> Privacy Sim · {networkName}</>
          : <><AlertTriangle className="w-2.5 h-2.5" /> Demo · {networkName}</>
        }
      </div>

      {/* Address dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all duration-200 hover:bg-white/6 outline-none ${
            isRealFHE
              ? "border-primary/20 bg-primary/4 hover:border-primary/35"
              : "border-white/10 bg-white/3 hover:border-white/16"
          }`}>
            <AddressAvatar address={address} />
            <span className="text-white/70">{truncated}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 font-mono bg-[#0a0e14] border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.06)] p-0 overflow-hidden"
        >
          {/* Header */}
          <div className={`px-4 py-4 border-b border-white/6 ${isRealFHE ? "bg-primary/4" : "bg-white/2"}`}>
            <div className="flex items-center gap-3 mb-3">
              <AddressAvatar address={address} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/80 font-bold truncate">{truncated}</div>
                <div className="text-[9px] text-muted-foreground/40 mt-0.5">{networkName}</div>
              </div>
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                isRealFHE ? "bg-primary/15 text-primary border border-primary/25" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
              }`}>
                {isRealFHE ? <Lock className="w-2 h-2" /> : <AlertTriangle className="w-2 h-2" />}
                <span>{isRealFHE ? "PRIV SIM" : "DEMO"}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "MODE",    value: isRealFHE ? "Priv Sim" : "Demo" },
                { label: "SESSION", value: sessionDuration ?? "—" },
                { label: "PERMIT",  value: isRealFHE ? "Prototype" : "N/A" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-black/30 rounded-lg px-2 py-1.5 border border-white/4">
                  <div className="text-[7px] text-muted-foreground/30 tracking-wider">{label}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${isRealFHE && label !== "SESSION" ? "text-primary/70" : "text-white/60"}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FHE status row */}
          {isRealFHE && (
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-primary/60 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  {["Session initialized", "Privacy sim active", "Strategy concealment prototype"].map(s => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      <span className="text-[8px] text-primary/50">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2 space-y-0.5">
            <DropdownMenuItem
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[11px] text-muted-foreground/60 hover:text-white/80 hover:bg-white/4 focus:bg-white/4"
            >
              {copied
                ? <><CheckCheck className="w-3.5 h-3.5 text-primary" /> Copied!</>
                : <><Copy className="w-3.5 h-3.5" /> Copy address</>
              }
            </DropdownMenuItem>

            {!isRealFHE && (
              <DropdownMenuItem
                onClick={switchToFhenix}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[11px] text-primary/70 hover:text-primary hover:bg-primary/6 focus:bg-primary/6"
              >
                <Zap className="w-3.5 h-3.5" /> Switch to Fhenix · Enable Privacy Sim
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-white/5 my-1" />

            <DropdownMenuItem
              onClick={disconnect}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/6 focus:bg-red-500/6"
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect wallet
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <style>{`
        @keyframes fheGlow {
          0%,100% { box-shadow: 0 0 8px rgba(16,185,129,0.15), inset 0 0 8px rgba(16,185,129,0.04); }
          50%      { box-shadow: 0 0 20px rgba(16,185,129,0.3), inset 0 0 16px rgba(16,185,129,0.08); }
        }
      `}</style>
    </div>
  );
}
