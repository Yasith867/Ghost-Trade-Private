import { useEffect, useRef } from "react";
import { useWallet } from "@/lib/wallet-context";
import { useToast } from "@/hooks/use-toast";

export default function WalletToastManager() {
  const { address, status, fheMode, networkName } = useWallet();
  const { toast } = useToast();

  const prev = useRef({
    address:  null as string | null,
    status:   "disconnected" as string,
    fheMode:  "simulation" as string,
    networkName: null as string | null,
  });

  // Skip on first mount — no toasts for initial state
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      // First render — just capture state, don't fire
      mountedRef.current = true;
      prev.current = { address, status, fheMode, networkName };
      return;
    }

    const p = prev.current;

    // ── Session restored (reconnecting → connected) ──────────────────────────
    if (p.status === "reconnecting" && status === "connected" && address) {
      toast({
        title: "Encrypted session restored",
        description: `${address.substring(0, 6)}…${address.slice(-4)} · ${networkName ?? "Unknown chain"}`,
        duration: 4000,
      });
    }

    // ── Fresh connection (disconnected → connected) ───────────────────────────
    else if (!p.address && address && status === "connected") {
      if (fheMode === "real") {
        toast({
          title: "Real FHE mode activated",
          description: `Permit initialized · ${networkName} · Encrypted session active`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Wallet connected",
          description: `${address.substring(0, 6)}…${address.slice(-4)} · Simulation mode`,
          duration: 4000,
        });
      }
    }

    // ── FHE mode upgrade (same wallet, chain switched) ────────────────────────
    else if (p.fheMode !== "real" && fheMode === "real" && address) {
      toast({
        title: "Real FHE mode activated",
        description: `Chain verified · ${networkName} · FHE session encrypted`,
        duration: 5000,
      });
    }

    // ── FHE mode downgrade (wrong chain) ─────────────────────────────────────
    else if (p.fheMode === "real" && fheMode === "simulation" && address) {
      toast({
        title: "Chain changed",
        description: `Switched to ${networkName ?? "unknown chain"} · Simulation mode active`,
        duration: 4000,
      });
    }

    // ── Disconnected ─────────────────────────────────────────────────────────
    if (p.address && !address) {
      toast({
        title: "Wallet disconnected",
        description: "Session cleared · FHE simulation mode active",
        duration: 3000,
      });
    }

    prev.current = { address, status, fheMode, networkName };
  }, [address, status, fheMode, networkName]);

  return null;
}
