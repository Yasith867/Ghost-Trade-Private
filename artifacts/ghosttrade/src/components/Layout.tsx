import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Home, Terminal, BrainCircuit, BarChart3, Thermometer, Coins,
  Wallet, BookMarked, Settings, ChevronLeft, ChevronRight, Shield,
  Activity, BookOpen, Lock, Loader2, AlertTriangle, LogOut, X, FlaskConical,
  LineChart,
} from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

const NAV_ITEMS = [
  { href: "/",           icon: Home,         label: "Home",        color: "text-white/60" },
  { href: "/terminal",   icon: Terminal,      label: "Terminal",    color: "text-primary" },
  { href: "/ghostai",    icon: BrainCircuit,  label: "GhostAI",     color: "text-primary" },
  { href: "/live-charts", icon: LineChart,     label: "Live Charts", color: "text-emerald-400" },
  { href: "/ssi",        icon: BarChart3,     label: "SSI Indexes", color: "text-blue-400" },
  { href: "/sectors",    icon: Thermometer,   label: "Sectors",     color: "text-purple-400" },
  { href: "/ecosystem",  icon: Coins,         label: "Ecosystem",   color: "text-amber-400" },
  { href: "/portfolio",  icon: Wallet,        label: "Portfolio",   color: "text-emerald-400" },
  { href: "/watchlists", icon: BookMarked,    label: "Watchlists",  color: "text-cyan-400" },
  { href: "/settings",   icon: Settings,      label: "Settings",    color: "text-muted-foreground/60" },
  { href: "/judges",     icon: BookOpen,      label: "Judges",      color: "text-purple-400/70" },
];

interface LayoutProps {
  children: React.ReactNode;
}

// ── Sidebar wallet section ────────────────────────────────────────────────────
function WalletSidebarSection({ collapsed }: { collapsed: boolean }) {
  const { address, status, fheMode, networkName, connect, disconnect, isRestoringSession } = useWallet();

  // ── Collapsed icon ─────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <button
        onClick={status === "connected" ? undefined : connect}
        title={
          status === "connected"
            ? `${address?.substring(0, 6)}...${address?.slice(-4)} · ${networkName}`
            : "Connect Wallet"
        }
        className="w-full flex items-center justify-center py-2 rounded-xl transition-all"
      >
        {isRestoringSession ? (
          <Loader2 className="w-3.5 h-3.5 text-primary/40 animate-spin" />
        ) : status === "connecting" ? (
          <Loader2 className="w-3.5 h-3.5 text-primary/50 animate-spin" />
        ) : status === "connected" ? (
          <div className="relative">
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${fheMode === "real" ? "bg-primary animate-pulse" : "bg-orange-400"}`} />
          </div>
        ) : (
          <div className="relative">
            <Wallet className="w-3.5 h-3.5 text-muted-foreground/30" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500/30 animate-pulse" />
          </div>
        )}
      </button>
    );
  }

  // ── Restoring session ──────────────────────────────────────────────────────
  if (isRestoringSession) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-white/6 bg-white/2">
        <Loader2 className="w-3 h-3 text-primary/40 animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-mono text-primary/40">Restoring encrypted session...</div>
        </div>
      </div>
    );
  }

  // ── Connecting ─────────────────────────────────────────────────────────────
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-primary/15 bg-primary/4">
        <Loader2 className="w-3 h-3 text-primary/60 animate-spin shrink-0" />
        <div className="text-[9px] font-mono text-primary/60">Awaiting approval...</div>
      </div>
    );
  }

  // ── Disconnected ───────────────────────────────────────────────────────────
  if (status === "disconnected") {
    return (
      <button
        onClick={connect}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
      >
        <Wallet className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <div className="text-[9px] font-mono text-muted-foreground/35 group-hover:text-primary/60 transition-colors leading-none">Connect Wallet</div>
          <div className="text-[8px] font-mono text-muted-foreground/20 mt-0.5 leading-none">MetaMask · Rabby · Injected</div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40 animate-pulse shrink-0" />
      </button>
    );
  }

  // ── Connected ──────────────────────────────────────────────────────────────
  const isRealFHE = fheMode === "real";
  const truncated = address ? `${address.substring(0, 6)}…${address.slice(-4)}` : "";

  return (
    <div
      className={`rounded-xl border p-2 space-y-1.5 transition-all duration-500 ${
        isRealFHE
          ? "border-primary/20 bg-primary/4"
          : "border-orange-500/12 bg-orange-500/3"
      }`}
      style={isRealFHE ? {
        boxShadow: "0 0 12px rgba(16,185,129,0.06)",
      } : undefined}
    >
      {/* Address row */}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRealFHE ? "bg-primary animate-pulse" : "bg-orange-400"}`} />
        <span className="text-[9px] font-mono text-white/60 flex-1 truncate">{truncated}</span>
        <button
          onClick={disconnect}
          title="Disconnect wallet"
          className="text-muted-foreground/20 hover:text-red-400/60 transition-colors shrink-0"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>

      {/* Mode badge */}
      <div className={`flex items-center gap-1 px-1.5 py-1 rounded-md ${isRealFHE ? "bg-primary/10" : "bg-orange-500/8"}`}>
        {isRealFHE
          ? <Lock className="w-2.5 h-2.5 text-primary/70 shrink-0" style={{ filter: "drop-shadow(0 0 3px rgba(16,185,129,0.6))" }} />
          : <AlertTriangle className="w-2.5 h-2.5 text-orange-400/70 shrink-0" />
        }
        <span className={`text-[8px] font-mono truncate leading-none ${isRealFHE ? "text-primary/70" : "text-orange-400/60"}`}>
          {isRealFHE ? `Privacy Sim · ${networkName}` : `Demo · ${networkName}`}
        </span>
      </div>

      {/* Permit row */}
      {isRealFHE && (
        <div className="flex items-center gap-1 px-1">
          <div className="w-1 h-1 rounded-full bg-primary/30" />
          <span className="text-[7px] font-mono text-primary/30">Permit initialized · Session encrypted</span>
        </div>
      )}
    </div>
  );
}

// ── Session restore banner ─────────────────────────────────────────────────────
function SessionRestoreBanner() {
  const { isRestoringSession } = useWallet();
  if (!isRestoringSession) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center gap-2 px-4 py-1.5 border-b border-primary/15 bg-primary/6 backdrop-blur-sm">
      <Loader2 className="w-2.5 h-2.5 text-primary/60 animate-spin shrink-0" />
      <span className="text-[9px] font-mono text-primary/60 tracking-wide">Restoring encrypted session...</span>
      <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse ml-1" />
    </div>
  );
}

// ── Demo mode banner ───────────────────────────────────────────────────────────
function DemoBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("gt_demo_banner_dismissed") === "1"; } catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try { sessionStorage.setItem("gt_demo_banner_dismissed", "1"); } catch {}
    setDismissed(true);
  };

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/8 via-primary/5 to-blue-500/6 backdrop-blur-sm">
      {/* Badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        <FlaskConical className="w-3 h-3 text-purple-400/70" />
        <span className="text-[8px] font-mono font-black text-purple-400/80 uppercase tracking-widest px-1.5 py-0.5 rounded border border-purple-500/25 bg-purple-500/10">
          Buildathon Demo
        </span>
      </div>

      <div className="w-px h-3 bg-white/10 shrink-0" />

      {/* Message */}
      <p className="text-[9px] font-mono text-muted-foreground/50 flex-1 min-w-0 truncate">
        Ghost Trade Private is a{" "}
        <span className="text-white/50">prototype</span>
        {" "}— FHE simulation, SSI sector intelligence, and AI analytics powered by SoSoValue.
      </p>

      {/* Judges link */}
      <Link
        href="/judges"
        className="shrink-0 flex items-center gap-1 text-[8px] font-mono text-purple-400/60 hover:text-purple-300/80 border border-purple-500/20 hover:border-purple-500/40 rounded-lg px-2 py-1 transition-all duration-150"
      >
        <BookOpen className="w-2.5 h-2.5" />
        Docs
      </Link>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground/25 hover:text-muted-foreground/60 hover:bg-white/6 transition-all duration-150"
        aria-label="Dismiss demo banner"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ── Global FHE status footer ──────────────────────────────────────────────────
function GlobalFHEStatus({ collapsed }: { collapsed: boolean }) {
  const { fheMode, isConnected } = useWallet();
  if (collapsed) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all duration-500 ${
      isConnected && fheMode === "real"
        ? "border-primary/12 bg-primary/4"
        : "border-white/5 bg-white/1"
    }`}>
      <Activity className={`w-2.5 h-2.5 shrink-0 ${isConnected && fheMode === "real" ? "text-primary/60" : "text-muted-foreground/30"}`} />
      <span className={`text-[8px] font-mono truncate ${isConnected && fheMode === "real" ? "text-primary/50" : "text-muted-foreground/30"}`}>
        {isConnected && fheMode === "real"
          ? "Privacy Sim · Live · CoinGecko"
          : "Demo Mode · Live · CoinGecko"
        }
      </span>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ children }: LayoutProps) {
  const [location]  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarW = collapsed ? 52 : 220;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full z-40 flex flex-col border-r border-white/6 bg-black/80 backdrop-blur-xl transition-all duration-300"
        style={{ width: sidebarW }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-4 border-b border-white/6 h-14 shrink-0 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-mono font-black text-white/90 tracking-wide leading-none">Ghost Trade</div>
              <div className="text-[8px] font-mono text-muted-foreground/35 tracking-widest uppercase mt-0.5">Private</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ href, icon: Icon, label, color }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer overflow-hidden
                  ${isActive
                    ? "bg-primary/10 border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                    : "border border-transparent hover:bg-white/4 hover:border-white/6"
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? "text-primary" : `${color} group-hover:text-white/70`}`} />
                {!collapsed && (
                  <span className={`text-[11px] font-mono font-semibold tracking-wide whitespace-nowrap transition-colors duration-150 ${isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-white/60"}`}>
                    {label}
                  </span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-primary animate-pulse shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/6 p-2 space-y-1.5 shrink-0">
          <GlobalFHEStatus collapsed={collapsed} />
          <WalletSidebarSection collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-xl border border-white/6 hover:border-white/12 text-muted-foreground/30 hover:text-muted-foreground/60 transition-all"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed
              ? <ChevronRight className="w-3 h-3" />
              : <><ChevronLeft className="w-3 h-3" /><span className="text-[9px] font-mono">Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen transition-all duration-300 flex flex-col" style={{ marginLeft: sidebarW }}>
        <DemoBanner />
        <SessionRestoreBanner />
        {children}
      </div>
    </div>
  );
}
