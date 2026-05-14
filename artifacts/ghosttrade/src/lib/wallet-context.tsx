import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ── Chain config ─────────────────────────────────────────────────────────────
const FHENIX_CHAIN_ID  = 8008135;  // Fhenix Helium
const ARBITRUM_SEPOLIA = 421614;   // Arbitrum Sepolia

export const FHE_CHAINS = new Set([FHENIX_CHAIN_ID, ARBITRUM_SEPOLIA]);

export function chainName(id: number): string {
  if (id === FHENIX_CHAIN_ID) return "Fhenix Helium";
  if (id === ARBITRUM_SEPOLIA) return "Arbitrum Sepolia";
  const names: Record<number, string> = {
    1: "Ethereum", 137: "Polygon", 56: "BSC", 43114: "Avalanche",
    42161: "Arbitrum", 10: "Optimism", 8453: "Base",
  };
  return names[id] ?? `Chain ${id}`;
}

// ── Storage ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = "ghosttrade_wallet_v3";

interface PersistedSession {
  address: string;
  chainId: number;
  connectedAt: number;
}

function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(s: PersistedSession) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "reconnecting"
  | "connected";

export type FHEMode = "simulation" | "real";

export interface WalletContextValue {
  // State
  address: string | null;
  chainId: number | null;
  networkName: string | null;
  status: WalletStatus;
  fheMode: FHEMode;
  isConnected: boolean;
  isConnecting: boolean;
  isRestoringSession: boolean;
  hasWallet: boolean;
  lastConnectedAt: number | null;
  modalOpen: boolean;
  // Actions
  connect: () => void;
  disconnect: () => void;
  openModal: () => void;
  closeModal: () => void;
  requestConnection: () => Promise<{ address: string; chainId: number } | null>;
  switchToFhenix: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const DEFAULT: WalletContextValue = {
  address: null, chainId: null, networkName: null,
  status: "disconnected", fheMode: "simulation",
  isConnected: false, isConnecting: false, isRestoringSession: false,
  hasWallet: false, lastConnectedAt: null, modalOpen: false,
  connect: () => {}, disconnect: () => {},
  openModal: () => {}, closeModal: () => {},
  requestConnection: async () => null,
  switchToFhenix: async () => {},
};

const WalletContext = createContext<WalletContextValue>(DEFAULT);

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getEthereum(): any | null {
  return (typeof window !== "undefined" && (window as any).ethereum) ?? null;
}

function hexToDecimal(hex: string): number {
  return parseInt(hex, 16);
}

function computeFheMode(chainId: number | null, address: string | null): FHEMode {
  if (!address || !chainId) return "simulation";
  return FHE_CHAINS.has(chainId) ? "real" : "simulation";
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address,      setAddress]      = useState<string | null>(null);
  const [chainId,      setChainId]      = useState<number | null>(null);
  const [connecting,   setConnecting]   = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [connectedAt,  setConnectedAt]  = useState<number | null>(() => {
    return loadSession()?.connectedAt ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Auto-reconnect on mount ────────────────────────────────────────────────
  useEffect(() => {
    const session = loadSession();
    const eth = getEthereum();
    if (!session || !eth) return;

    setReconnecting(true);

    (async () => {
      try {
        const accounts: string[] = await eth.request({ method: "eth_accounts" });
        const chainHex: string   = await eth.request({ method: "eth_chainId" });
        const cId = hexToDecimal(chainHex);

        if (accounts.length > 0 && mountedRef.current) {
          setAddress(accounts[0]);
          setChainId(cId);
          setConnectedAt(session.connectedAt);
          saveSession({ address: accounts[0], chainId: cId, connectedAt: session.connectedAt });
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        if (mountedRef.current) setReconnecting(false);
      }
    })();
  }, []);

  // ── Event listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    const onAccountsChanged = (accounts: string[]) => {
      if (!mountedRef.current) return;
      if (accounts.length === 0) {
        setAddress(null); setChainId(null); setConnectedAt(null);
        clearSession();
      } else {
        setAddress(accounts[0]);
        setChainId(prev => {
          if (prev !== null) {
            const at = Date.now();
            saveSession({ address: accounts[0], chainId: prev, connectedAt: at });
          }
          return prev;
        });
      }
    };

    const onChainChanged = (chainHex: string) => {
      if (!mountedRef.current) return;
      const cId = hexToDecimal(chainHex);
      setChainId(cId);
      setAddress(prev => {
        if (prev) {
          const session = loadSession();
          saveSession({ address: prev, chainId: cId, connectedAt: session?.connectedAt ?? Date.now() });
        }
        return prev;
      });
    };

    const onDisconnect = () => {
      if (!mountedRef.current) return;
      setAddress(null); setChainId(null); setConnectedAt(null);
      clearSession();
    };

    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged",    onChainChanged);
    eth.on("disconnect",      onDisconnect);

    return () => {
      eth.removeListener("accountsChanged", onAccountsChanged);
      eth.removeListener("chainChanged",    onChainChanged);
      eth.removeListener("disconnect",      onDisconnect);
    };
  }, []);

  // ── requestConnection — actual EIP-1193 call used by WalletModal ──────────
  const requestConnection = useCallback(async (): Promise<{ address: string; chainId: number } | null> => {
    const eth = getEthereum();
    if (!eth) return null;

    setConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const chainHex: string   = await eth.request({ method: "eth_chainId" });
      const cId = hexToDecimal(chainHex);

      if (accounts.length > 0 && mountedRef.current) {
        const at = Date.now();
        setAddress(accounts[0]);
        setChainId(cId);
        setConnectedAt(at);
        saveSession({ address: accounts[0], chainId: cId, connectedAt: at });
        return { address: accounts[0], chainId: cId };
      }
      return null;
    } catch (err: any) {
      if (err?.code !== 4001) console.error("Wallet connect error:", err);
      throw err;
    } finally {
      if (mountedRef.current) setConnecting(false);
    }
  }, []);

  // ── connect — opens modal ─────────────────────────────────────────────────
  const connect     = useCallback(() => setModalOpen(true), []);
  const openModal   = useCallback(() => setModalOpen(true), []);
  const closeModal  = useCallback(() => setModalOpen(false), []);

  // ── disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(null); setChainId(null); setConnectedAt(null);
    clearSession();
  }, []);

  // ── switchToFhenix ────────────────────────────────────────────────────────
  const switchToFhenix = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${FHENIX_CHAIN_ID.toString(16)}` }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${FHENIX_CHAIN_ID.toString(16)}`,
              chainName: "Fhenix Helium",
              nativeCurrency: { name: "FHE", symbol: "FHE", decimals: 18 },
              rpcUrls: ["https://api.helium.fhenix.zone"],
              blockExplorerUrls: ["https://explorer.helium.fhenix.zone"],
            }],
          });
        } catch {}
      }
    }
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const status: WalletStatus = connecting ? "connecting"
    : reconnecting ? "reconnecting"
    : address ? "connected"
    : "disconnected";

  const fheMode      = computeFheMode(chainId, address);
  const isConnected  = status === "connected";
  const isConnecting = status === "connecting" || status === "reconnecting";
  const networkName  = chainId ? chainName(chainId) : null;
  const hasWallet    = !!getEthereum();

  return (
    <WalletContext.Provider value={{
      address, chainId, networkName, status, fheMode,
      isConnected, isConnecting, isRestoringSession: reconnecting,
      hasWallet, lastConnectedAt: connectedAt, modalOpen,
      connect, disconnect, openModal, closeModal,
      requestConnection, switchToFhenix,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}
