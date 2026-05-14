export interface TradeObject {
  action: "BUY" | "SELL" | "HOLD";
  asset: string;
  amount: number;
  encrypted: true;
  encryptedPayload: string;
  confidence: number;
  timestamp: string;
  mode: "simulation" | "real";
  decryptForTxPayload: DecryptForTxPayload;
}

export interface DecryptForTxPayload {
  ciphertextRef: string;
  permitHash: string;
  signalType: number;
  confidence: number;
  requester: string;
  readyForChain: boolean;
}

const SIGNAL_TYPE_MAP: Record<"BUY" | "SELL" | "HOLD", number> = {
  BUY: 1,
  SELL: 2,
  HOLD: 0,
};

function generatePermitHash(requester: string, timestamp: string): string {
  const seed = `${requester}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

function generateCiphertextRef(payload: string, action: string): string {
  const chars = "0123456789abcdef";
  let n = payload.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let hex = "";
  for (let i = 0; i < 64; i++) {
    n = (n * 1664525 + 1013904223) & 0xffffffff;
    hex += chars[Math.abs(n) % 16];
  }
  return `0x${hex}`;
}

/**
 * prepareTradeExecution — creates a structured trade object with
 * an attached decryptForTx payload, ready for on-chain submission.
 *
 * This is Wave 2 / SoDEX preparation. No trade is executed yet.
 */
export function prepareTradeExecution(
  action: "BUY" | "SELL" | "HOLD",
  asset: string,
  confidence: number,
  encryptedInputsPreview: string,
  walletAddress: string | null,
  mode: "simulation" | "real",
): TradeObject {
  const timestamp = new Date().toISOString();
  const requester = walletAddress ?? "0x0000000000000000000000000000000000000000";
  const ciphertextRef = generateCiphertextRef(encryptedInputsPreview, action);
  const permitHash = generatePermitHash(requester, timestamp);

  const decryptForTxPayload: DecryptForTxPayload = {
    ciphertextRef,
    permitHash,
    signalType: SIGNAL_TYPE_MAP[action],
    confidence,
    requester,
    readyForChain: mode === "real" && walletAddress !== null,
  };

  return {
    action,
    asset: asset.toUpperCase(),
    amount: 0,
    encrypted: true,
    encryptedPayload: ciphertextRef,
    confidence,
    timestamp,
    mode,
    decryptForTxPayload,
  };
}

/**
 * formatTradeObjectForDisplay — returns a human-readable summary
 * of the trade object for the UI.
 */
export function formatTradeObjectForDisplay(trade: TradeObject): string {
  return [
    `ACTION: ${trade.action}`,
    `ASSET:  ${trade.asset}`,
    `CONF:   ${trade.confidence}%`,
    `MODE:   ${trade.mode.toUpperCase()}`,
    `ENC:    ${trade.encryptedPayload.substring(0, 20)}...`,
    `TX_RDY: ${trade.decryptForTxPayload.readyForChain ? "YES" : "SIMULATION"}`,
  ].join("\n");
}
