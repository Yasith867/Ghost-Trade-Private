import React, { useCallback, useEffect, useRef, useState } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle2, Loader2, X, Wallet, ArrowRight, Zap } from "lucide-react";
import { useWallet, FHE_CHAINS, getEthereum } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
type ModalStep =
  | "select"
  | "awaiting"
  | "verifying"
  | "wrong_network"
  | "switching"
  | "fhe_init"
  | "success"
  | "error";

const FHE_INIT_STEPS = [
  "Wallet connected",
  "Chain verified",
  "Permit initialized",
  "FHE session encrypted",
  "Real FHE mode active",
];

// ── Wallet detector ───────────────────────────────────────────────────────────
function detectWalletType(): "metamask" | "rabby" | "injected" | "none" {
  const eth = getEthereum();
  if (!eth) return "none";
  if (eth.isRabby)    return "rabby";
  if (eth.isMetaMask) return "metamask";
  return "injected";
}

// ── Sub-components ────────────────────────────────────────────────────────────
function WalletOption({
  name, desc, icon, detected, onClick,
}: {
  name: string; desc: string; icon: React.ReactNode;
  detected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group text-left
        ${detected
          ? "border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]"
          : "border-white/8 bg-white/2 hover:border-white/16 hover:bg-white/4"
        }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-all
        ${detected ? "bg-primary/12 border border-primary/25 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]" : "bg-white/6 border border-white/10"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-mono font-bold ${detected ? "text-white/90" : "text-white/50"}`}>{name}</div>
        <div className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">{desc}</div>
      </div>
      {detected && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-mono text-primary/60 uppercase tracking-wider">Detected</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      )}
      {!detected && (
        <span className="text-[9px] font-mono text-muted-foreground/25 shrink-0">Not installed</span>
      )}
    </button>
  );
}

function StepRow({ label, state }: { label: string; state: "pending" | "active" | "done" }) {
  return (
    <div className={`flex items-center gap-3 transition-all duration-500 ${
      state === "done"    ? "opacity-60"
      : state === "active"  ? "opacity-100"
      : "opacity-20"
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
        state === "done"   ? "bg-primary/20 border border-primary/40"
        : state === "active" ? "border border-primary/30 bg-primary/10"
        : "border border-white/10 bg-white/3"
      }`}>
        {state === "done" ? (
          <CheckCircle2 className="w-3 h-3 text-primary" />
        ) : state === "active" ? (
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
        ) : (
          <div className="w-1 h-1 rounded-full bg-white/20" />
        )}
      </div>
      <span className={`text-xs font-mono ${
        state === "done"    ? "text-primary/60 line-through decoration-primary/30"
        : state === "active"  ? "text-primary"
        : "text-muted-foreground/25"
      }`}>{label}</span>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function WalletModal() {
  const { modalOpen, closeModal, requestConnection, switchToFhenix, fheMode, networkName } = useWallet();

  const [step, setStep]           = useState<ModalStep>("select");
  const [fheStep, setFheStep]     = useState(-1);
  const [errorMsg, setErrorMsg]   = useState("");
  const [chainId, setChainId]     = useState<number | null>(null);
  const mountedRef                = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (modalOpen) {
      setStep("select");
      setFheStep(-1);
      setErrorMsg("");
      setChainId(null);
    }
  }, [modalOpen]);

  const walletType = detectWalletType();
  const hasWallet  = walletType !== "none";

  // ── FHE init animation ────────────────────────────────────────────────────
  const runFheInit = useCallback(() => {
    setStep("fhe_init");
    setFheStep(0);

    let i = 0;
    const advance = () => {
      if (!mountedRef.current) return;
      i++;
      setFheStep(i);
      if (i < FHE_INIT_STEPS.length) {
        setTimeout(advance, 550);
      } else {
        setTimeout(() => {
          if (mountedRef.current) {
            setStep("success");
            setTimeout(() => {
              if (mountedRef.current) closeModal();
            }, 1200);
          }
        }, 400);
      }
    };
    setTimeout(advance, 550);
  }, [closeModal]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    if (!hasWallet) {
      window.open("https://metamask.io", "_blank");
      return;
    }

    setStep("awaiting");
    setErrorMsg("");

    try {
      const result = await requestConnection();
      if (!result || !mountedRef.current) return;

      setStep("verifying");
      setChainId(result.chainId);

      await new Promise(r => setTimeout(r, 700));
      if (!mountedRef.current) return;

      if (FHE_CHAINS.has(result.chainId)) {
        runFheInit();
      } else {
        setStep("wrong_network");
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (err?.code === 4001) {
        setStep("select");
      } else {
        setErrorMsg(err?.message ?? "Connection failed");
        setStep("error");
      }
    }
  }, [hasWallet, requestConnection, runFheInit]);

  // ── Switch to Fhenix ──────────────────────────────────────────────────────
  const handleSwitch = useCallback(async () => {
    setStep("switching");
    try {
      await switchToFhenix();
      if (mountedRef.current) {
        await new Promise(r => setTimeout(r, 800));
        if (mountedRef.current) runFheInit();
      }
    } catch {
      if (mountedRef.current) setStep("wrong_network");
    }
  }, [switchToFhenix, runFheInit]);

  // ── Skip network check and continue in sim mode ───────────────────────────
  const handleStayOnNetwork = useCallback(() => {
    setStep("success");
    setTimeout(() => { if (mountedRef.current) closeModal(); }, 1000);
  }, [closeModal]);

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => step === "select" && closeModal()}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.06)]"
        style={{ background: "linear-gradient(135deg, #0a0e14 0%, #060a0f 100%)" }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 ${
              step === "fhe_init" || step === "success"
                ? "bg-primary/15 border-primary/30 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
                : "bg-white/6 border-white/10"
            }`}>
              {step === "fhe_init" || step === "success"
                ? <Lock className="w-4 h-4 text-primary animate-pulse" />
                : <Wallet className="w-4 h-4 text-muted-foreground/60" />
              }
            </div>
            <div>
              <div className="text-sm font-mono font-black text-white/90">
                {step === "select"        && "Connect Wallet"}
                {step === "awaiting"      && "Awaiting Approval"}
                {step === "verifying"     && "Verifying Chain"}
                {step === "wrong_network" && "Wrong Network"}
                {step === "switching"     && "Switching Chain"}
                {step === "fhe_init"      && "Initializing FHE"}
                {step === "success"       && "Connected"}
                {step === "error"         && "Connection Failed"}
              </div>
              <div className="text-[9px] font-mono text-muted-foreground/35 mt-0.5">
                {step === "select"        && "Select your wallet to continue"}
                {step === "awaiting"      && "Check your wallet extension..."}
                {step === "verifying"     && "Checking chain compatibility..."}
                {step === "wrong_network" && "Switch to Fhenix Helium for Real FHE"}
                {step === "switching"     && "Confirm network switch in wallet..."}
                {step === "fhe_init"      && "Setting up encrypted session..."}
                {step === "success"       && "Encrypted session active"}
                {step === "error"         && "Please try again"}
              </div>
            </div>
          </div>
          {(step === "select" || step === "wrong_network" || step === "error") && (
            <button
              onClick={closeModal}
              className="w-7 h-7 rounded-lg border border-white/8 flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground/70 hover:border-white/15 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">

          {/* ── SELECT ── */}
          {step === "select" && (
            <>
              {!hasWallet && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/8 border border-orange-500/15 mb-4">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-mono text-orange-400/80 leading-relaxed">
                    No wallet detected. Install MetaMask or Rabby to connect.
                  </p>
                </div>
              )}
              <WalletOption
                name="MetaMask"
                desc="The most popular Ethereum wallet"
                icon={<span className="text-orange-400 text-base">🦊</span>}
                detected={walletType === "metamask"}
                onClick={handleConnect}
              />
              <WalletOption
                name="Rabby"
                desc="Security-first DeFi wallet"
                icon={<span className="text-purple-400 text-base">🐰</span>}
                detected={walletType === "rabby"}
                onClick={handleConnect}
              />
              {walletType === "injected" && (
                <WalletOption
                  name="Injected Wallet"
                  desc="Browser extension detected"
                  icon={<Wallet className="w-5 h-5 text-primary" />}
                  detected={true}
                  onClick={handleConnect}
                />
              )}
              {!hasWallet && (
                <button
                  onClick={() => window.open("https://metamask.io", "_blank")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-[11px] font-mono text-primary/70 hover:text-primary"
                >
                  Install MetaMask <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </>
          )}

          {/* ── AWAITING ── */}
          {step === "awaiting" && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border border-primary/10 border-t-primary/60 animate-spin absolute inset-0" />
                <div className="w-20 h-20 rounded-full border border-primary/5 border-b-primary/30 animate-spin [animation-duration:1.6s] [animation-direction:reverse] absolute inset-0" />
                <div className="w-20 h-20 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-primary/60" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-mono font-bold text-white/70">Awaiting wallet approval...</p>
                <p className="text-[10px] font-mono text-muted-foreground/35">
                  Confirm the connection request in your wallet extension
                </p>
              </div>
            </div>
          )}

          {/* ── VERIFYING ── */}
          {step === "verifying" && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-mono font-bold text-white/70">Verifying chain...</p>
                <p className="text-[10px] font-mono text-muted-foreground/35">
                  Checking compatibility with Fhenix FHE network
                </p>
              </div>
            </div>
          )}

          {/* ── WRONG NETWORK ── */}
          {step === "wrong_network" && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/8 border border-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-mono font-bold text-orange-400">Wrong network detected</p>
                  <p className="text-[10px] font-mono text-muted-foreground/50 mt-1 leading-relaxed">
                    Real FHE mode requires Fhenix Helium or Arbitrum Sepolia. You're currently on <span className="text-white/60">{networkName ?? "unknown chain"}</span>.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSwitch}
                className="w-full font-mono font-bold text-sm bg-primary hover:bg-primary/90 text-black h-11 hover:shadow-[0_0_24px_rgba(16,185,129,0.4)]"
              >
                <Lock className="w-4 h-4 mr-2" />
                Switch to Fhenix Helium
              </Button>
              <button
                onClick={handleStayOnNetwork}
                className="w-full text-center text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors py-1"
              >
                Continue in simulation mode →
              </button>
            </div>
          )}

          {/* ── SWITCHING ── */}
          {step === "switching" && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border border-blue-400/20 border-t-blue-400/60 animate-spin" />
                <div className="absolute inset-2 rounded-full border border-blue-400/10 border-b-blue-400/40 animate-spin [animation-duration:1.4s] [animation-direction:reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-mono font-bold text-white/70">Switching to Fhenix Helium...</p>
                <p className="text-[10px] font-mono text-muted-foreground/35">
                  Confirm the network switch in your wallet
                </p>
              </div>
            </div>
          )}

          {/* ── FHE INIT ── */}
          {step === "fhe_init" && (
            <div className="py-3 space-y-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/12 border border-primary/25 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                  <Shield className="w-5 h-5 text-primary" style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.6))" }} />
                </div>
              </div>
              <div className="space-y-3">
                {FHE_INIT_STEPS.map((label, i) => {
                  const state = i < fheStep ? "done" : i === fheStep ? "active" : "pending";
                  return <StepRow key={label} label={label} state={state} />;
                })}
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center border border-primary/30 bg-primary/10"
                style={{ boxShadow: "0 0 32px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.08)" }}
              >
                <CheckCircle2 className="w-8 h-8 text-primary" style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.8))" }} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-mono font-bold text-primary">
                  {fheMode === "real" ? "Real FHE mode active" : "Wallet connected"}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/40">
                  {fheMode === "real" ? "Encrypted session initialized · Permit ready" : "Simulation mode active"}
                </p>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === "error" && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-mono font-bold text-red-400">Connection failed</p>
                  <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">{errorMsg}</p>
                </div>
              </div>
              <Button onClick={() => setStep("select")} variant="outline"
                className="w-full font-mono text-sm border-white/10 hover:border-white/20">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer note */}
        {step === "select" && (
          <div className="px-6 pb-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/2 border border-white/5">
              <Lock className="w-2.5 h-2.5 text-primary/40 shrink-0" />
              <p className="text-[9px] font-mono text-muted-foreground/30 leading-relaxed">
                Your session is encrypted and persisted locally. No keys are stored on-chain.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
