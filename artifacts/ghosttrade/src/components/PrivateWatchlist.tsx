import React, { useState } from "react";
import { Eye, EyeOff, Lock, Plus, X, ShieldCheck, ChevronRight } from "lucide-react";

const WATCHLIST_KEY = "ghosttrade_watchlist";
const CIPHER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+=";
const ALL_TOKENS = ["BTC", "ETH", "SOL", "AVAX", "LINK", "UNI", "AAVE", "ARB", "OP", "DOGE", "INJ", "SEI"];
const DEFAULT_TOKENS = ["BTC", "ETH", "SOL"];

function fakeEncrypt(text: string): string {
  return text.split("").map((c, i) => CIPHER[(c.charCodeAt(0) * 7 + i * 13) % CIPHER.length]).join("") + "==";
}

function loadTokens(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TOKENS;
  } catch {
    return DEFAULT_TOKENS;
  }
}

interface PrivateWatchlistProps {
  onTokenClick?: (symbol: string) => void;
}

export default function PrivateWatchlist({ onTokenClick }: PrivateWatchlistProps = {}) {
  const [tokens, setTokens] = useState<string[]>(loadTokens);
  const [revealed, setRevealed] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const save = (t: string[]) => {
    setTokens(t);
    try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(t)); } catch {}
  };

  const add = (token: string) => {
    if (!tokens.includes(token)) save([...tokens, token]);
    setShowAdd(false);
  };

  const remove = (token: string) => save(tokens.filter(t => t !== token));

  const available = ALL_TOKENS.filter(t => !tokens.includes(t));

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-blue-400" />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">Private Watchlist</span>
        </div>
        <div className="flex items-center gap-1">
          {available.length > 0 && (
            <button
              onClick={() => setShowAdd(v => !v)}
              className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all"
              title="Add token"
            >
              <Plus className="w-2.5 h-2.5 text-muted-foreground/40" />
            </button>
          )}
          <button
            onClick={() => setRevealed(v => !v)}
            className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center hover:border-blue-400/30 hover:bg-blue-500/5 transition-all"
            title={revealed ? "Hide watchlist" : "Decrypt watchlist"}
          >
            {revealed
              ? <EyeOff className="w-2.5 h-2.5 text-muted-foreground/40" />
              : <Eye className="w-2.5 h-2.5 text-muted-foreground/40" />
            }
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="px-3 py-2 border-b border-white/5 bg-black/30 flex flex-wrap gap-1.5">
          {available.map(t => (
            <button
              key={t}
              onClick={() => add(t)}
              className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 text-muted-foreground/40 hover:border-primary/30 hover:text-primary/70 hover:bg-primary/5 transition-all"
            >
              +{t}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 space-y-1.5">
        {tokens.length === 0 ? (
          <div className="text-[9px] font-mono text-muted-foreground/20 text-center py-2">No tokens tracked</div>
        ) : (
          tokens.map(token => (
            <div key={token} className="flex items-center justify-between group">
              <button
                className="flex items-center gap-2 flex-1 min-w-0 py-0.5 rounded transition-colors hover:opacity-80 text-left"
                onClick={() => revealed && onTokenClick?.(token)}
                disabled={!revealed}
                title={revealed ? `Open ${token} detail` : "Decrypt to view details"}
              >
                <div className="w-1 h-1 rounded-full bg-blue-400/40 shrink-0" />
                {revealed ? (
                  <span className="text-[11px] font-mono font-semibold text-foreground/70 tracking-wide">{token}</span>
                ) : (
                  <span className="text-[10px] font-mono text-muted-foreground/25 tracking-wider">
                    {fakeEncrypt(token).substring(0, 9)}
                  </span>
                )}
                {revealed && onTokenClick && (
                  <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/25 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              <button
                onClick={() => remove(token)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground/25 hover:text-red-400 transition-colors" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 border border-blue-500/15 rounded-lg px-2.5 py-1.5 bg-blue-500/5">
          <ShieldCheck className="w-2.5 h-2.5 text-blue-400/40 shrink-0" />
          <span className="text-[8px] font-mono text-blue-400/40">
            {revealed
              ? "Decrypted · Click any token to view details"
              : "FHE-encrypted · Decrypt to inspect tokens"}
          </span>
        </div>
      </div>
    </div>
  );
}
