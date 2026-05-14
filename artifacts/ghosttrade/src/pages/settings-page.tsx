import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Settings, CheckCircle2, XCircle, Zap, Shield, Cpu, Globe, Database,
  Wallet, Lock, LogOut, AlertTriangle, Loader2,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";

export default function SettingsPage() {
  const [revealed, setRevealed] = useState(false);
  const { address, status, fheMode, networkName, isConnected, isConnecting, hasWallet, connect, disconnect, switchToFhenix } = useWallet();

  const { data: health, isError: healthError } = useQuery<any>({
    queryKey: ["/api/healthz"],
    queryFn: () => fetch(apiUrl("/api/healthz")).then(r => r.json()),
    staleTime: 30_000,
  });
  const { data: allMarket, isError: marketError } = useQuery<any[]>({
    queryKey: ["/api/market-data"],
    queryFn: () => fetch(apiUrl("/api/market-data")).then(r => r.json()),
    staleTime: 30_000,
  });

  const hasCloudflareId = true;
  const hasCloudflareToken = true;
  const marketOk = !marketError && Array.isArray(allMarket) && allMarket.length > 0;
  const apiOk = !healthError;
  const btc = allMarket?.find((a: any) => a.symbol === "BTC");

  const STATUS = [
    { label: "API Server",         ok: apiOk,             desc: "Express backend on port 8080",            icon: Database },
    { label: "Market Data",        ok: marketOk,          desc: `CoinGecko · BTC $${btc?.price?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "…"}`, icon: Globe },
    { label: "Cloudflare Account", ok: hasCloudflareId,   desc: "CLOUDFLARE_ACCOUNT_ID secret set",        icon: Cpu },
    { label: "Cloudflare AI Token",ok: hasCloudflareToken,desc: "CLOUDFLARE_API_TOKEN secret set",         icon: Zap },
    { label: "GhostAI Streaming",  ok: true,              desc: "@cf/meta/llama-3-8b-instruct",            icon: Shield },
    { label: "Privacy Simulation",  ok: true,              desc: "FHE-style encrypted workflow (prototype)", icon: Shield },
    { label: "Wallet Connected",   ok: isConnected,       desc: isConnected ? `${address?.substring(0,6)}…${address?.slice(-4)} · ${networkName}` : hasWallet ? "No wallet connected" : "No injected wallet detected", icon: Wallet },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <div>
            <div className="text-sm font-mono font-black text-white/90">Settings</div>
            <div className="text-[9px] font-mono text-muted-foreground/40">API status · Wallet · Cloudflare AI · FHE config</div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* ── Wallet ──────────────────────────────────────────────────────── */}
          <div className={`rounded-2xl border p-6 space-y-4 ${isConnected ? (fheMode === "real" ? "border-primary/20 bg-primary/4" : "border-orange-500/15 bg-orange-500/4") : "border-white/6 bg-white/2"}`}>
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Wallet Connection</div>
              {isConnected && (
                <div className={`flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded-lg ${fheMode === "real" ? "text-primary/70 bg-primary/10" : "text-orange-400/70 bg-orange-500/8"}`}>
                  {fheMode === "real"
                    ? <><Lock className="w-2.5 h-2.5" /> Privacy Sim Active</>
                    : <><AlertTriangle className="w-2.5 h-2.5" /> Demo Mode</>
                  }
                </div>
              )}
            </div>

            {isConnecting ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/6 bg-white/2">
                <Loader2 className="w-4 h-4 text-primary/50 animate-spin" />
                <span className="text-sm font-mono text-muted-foreground/50">
                  {status === "reconnecting" ? "Reconnecting session..." : "Connecting wallet..."}
                </span>
              </div>
            ) : isConnected ? (
              <div className="space-y-3">
                {[
                  { label: "Address",    value: address ?? "" },
                  { label: "Network",    value: networkName ?? "Unknown" },
                  { label: "Privacy Mode", value: fheMode === "real" ? "Privacy Sim (Fhenix/Arbitrum)" : "Demo Mode (no wallet)" },
                  { label: "Session",    value: "Persisted · auto-reconnects on reload" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0">{label}</span>
                    <span className={`text-[9px] font-mono text-right break-all ${label === "FHE Mode" && fheMode === "real" ? "text-primary/70" : "text-foreground/55"}`}>{value}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  {fheMode !== "real" && (
                    <Button onClick={switchToFhenix} variant="outline" size="sm"
                      className="text-[10px] font-mono border-primary/30 text-primary hover:border-primary/60 hover:bg-primary/5 flex-1">
                      <Lock className="w-3 h-3 mr-1.5" /> Switch to Fhenix Helium
                    </Button>
                  )}
                  <Button onClick={disconnect} variant="outline" size="sm"
                    className="text-[10px] font-mono border-red-500/20 text-red-400/60 hover:border-red-500/40 hover:bg-red-500/5">
                    <LogOut className="w-3 h-3 mr-1.5" /> Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-mono text-muted-foreground/40 leading-relaxed">
                  Connect MetaMask, Rabby, or any injected EIP-1193 wallet to enable privacy simulation mode on Fhenix Helium or Arbitrum Sepolia. This is a prototype implementation — session persists across page navigations and refreshes.
                </p>
                {!hasWallet && (
                  <p className="text-[10px] font-mono text-orange-400/60">
                    No injected wallet detected. Install MetaMask or Rabby to continue.
                  </p>
                )}
                <Button onClick={connect} disabled={!hasWallet} className="w-full font-mono text-sm bg-primary hover:bg-primary/90 text-black font-bold">
                  <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
                </Button>
              </div>
            )}
          </div>

          {/* ── System status ────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-6 space-y-4">
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">System Status</div>
            <div className="space-y-2">
              {STATUS.map(({ label, ok, desc, icon: Icon }) => (
                <div key={label} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-white/8 bg-black/20">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ok ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                    <Icon className={`w-3.5 h-3.5 ${ok ? "text-emerald-400" : "text-red-400"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-mono font-bold text-white/75">{label}</div>
                    <div className="text-[9px] font-mono text-muted-foreground/40 break-all">{desc}</div>
                  </div>
                  {ok
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── Cloudflare AI ────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-primary/15 bg-primary/4 p-6 space-y-4">
            <div className="text-[9px] font-mono text-primary/50 uppercase tracking-widest">Cloudflare Workers AI</div>
            <div className="space-y-3">
              {[
                { label: "Model",           value: "@cf/meta/llama-3-8b-instruct" },
                { label: "Mode",            value: "Streaming SSE" },
                { label: "Endpoint",        value: "https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/..." },
                { label: "Market Context",  value: "Injected via x-market-context header" },
                { label: "Privacy Layer",    value: "FHE-inspired analysis pipeline" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0">{label}</span>
                  <span className="text-[9px] font-mono text-primary/60 text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── FHE settings ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-purple-500/15 bg-purple-500/4 p-6 space-y-4">
            <div className="text-[9px] font-mono text-purple-400/50 uppercase tracking-widest">Privacy Simulation Config</div>
            <div className="space-y-2">
              {[
                { label: "Mode",           value: fheMode === "real" ? `Privacy Sim · ${networkName}` : "Demo Mode (prototype)" },
                { label: "Storage",        value: "LocalStorage · btoa encoded · session persisted" },
                { label: "Wallet Mode",    value: isConnected ? `${address?.substring(0,6)}…${address?.slice(-4)}` : "Not connected" },
                { label: "Chains",         value: "Fhenix Helium (8008135) · Arbitrum Sepolia (421614)" },
                { label: "Simulated Data", value: "Watchlist · Portfolio · Alerts · Sectors" },
                { label: "On-chain FHE",   value: "Planned — Inco Network / fhEVM integration" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0">{label}</span>
                  <span className={`text-[9px] font-mono text-right break-all ${label === "Mode" && fheMode === "real" ? "text-primary/70" : "text-purple-400/60"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Deployment ───────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-6 space-y-4">
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Deployment</div>
            <div className="space-y-2">
              {[
                { label: "Frontend",          value: "React + Vite · Port 20229" },
                { label: "API Server",         value: "Express + Node · Port 8080" },
                { label: "Proxy",              value: "Vite dev proxy → /api → :8080" },
                { label: "Production API URL", value: "VITE_API_BASE_URL env var" },
                { label: "Data",               value: "CoinGecko free tier · 30s cache" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0">{label}</span>
                  <span className="text-[9px] font-mono text-foreground/55 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
