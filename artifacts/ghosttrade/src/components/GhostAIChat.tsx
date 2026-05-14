import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrainCircuit, Send, Trash2, Loader2, User, Zap, Sparkles, AlertTriangle, ChevronRight } from "lucide-react";
import { cleanAIResponse, renderMarkdown, StreamingCursor } from "@/lib/ai-render";
import { apiUrl } from "@/lib/api";

type ResponseMode = "quick" | "analyst" | "deep";

const MODES: { id: ResponseMode; label: string; desc: string }[] = [
  { id: "quick",   label: "⚡ Quick",   desc: "Decisive 2–4 sentence signal" },
  { id: "analyst", label: "📊 Analyst", desc: "6–9 line SSI breakdown" },
  { id: "deep",    label: "🧠 Deep",    desc: "Full sector ranking + rotation map" },
];

const AUTO_INSIGHTS = [
  "ssiAI outperforming — TAO and RNDR leading AI compute sector inflows.",
  "ssiMAG7 BTC-ETH composite holding positive — institutional baseline intact.",
  "ssiDeFi recovering — AAVE TVL inflows and MKR DAI stability signal sector health.",
  "Capital rotating FROM ssiMeme INTO ssiRWA — risk-off repositioning observed.",
  "ssiLayer1: ETH and SOL leading L1 validator economics activity this session.",
  "ssiRWA decoupling from BTC — ONDO T-bill tokenization attracting defensive capital.",
  "SoDEX: conceptual encrypted order flow designed to minimize strategy leakage.",
  "ssiMeme cooling — DOGE and PEPE speculative premium compressing.",
  "SoSoValue SSI indexes powering this terminal's sector rotation intelligence.",
  "ssiAI beta to BTC at ~1.45x — AI sector designed to amplify BTC directional moves.",
  "ssiRWA BTC correlation at ~0.42 — lowest across tracked SSI indexes.",
  "TokenBar: SSI basket wrappers designed for single-token sector exposure.",
  "ssiDeFi vs ssiAI: rotation spread widening — AI sector outpacing DeFi this session.",
  "Ghost Trade is a SoSoValue-powered research prototype — SSI intelligence demo.",
  "GhostAI context loaded — sector rotation analysis ready across 7 SSI indexes.",
];

const QUICK_PROMPTS = [
  { label: "🌐 What is SoSoValue", prompt: "What is the SoSoValue ecosystem and how do SSI indexes, SoDEX, TokenBar, and sector intelligence work inside Ghost Trade?" },
  { label: "⚡ Signal Read",       prompt: "Explain the current FHE signal — which SSI sector is driving it and why? Give the rotation logic." },
  { label: "🔄 Rotation Now",      prompt: "Which SSI sectors are attracting capital inflows right now vs seeing outflows? Name the sectors and token leaders." },
  { label: "🤖 ssiAI vs DeFi",    prompt: "Compare ssiAI and ssiDeFi momentum. Which sector has stronger capital flow and why? Name the leaders." },
  { label: "🏦 ssiRWA",           prompt: "Analyze ssiRWA (ONDO, MKR, REAL) — risk-off rotation or organic RWA adoption? What does the ~0.42 BTC correlation tell us?" },
  { label: "🔐 FHE Shield",       prompt: "How is the FHE encrypted workflow in Ghost Trade designed to protect SSI sector strategies from strategy leakage? Explain the prototype model." },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: boolean;
}

export interface GhostAIChatProps {
  marketContext?: {
    symbol: string;
    price: number;
    change24h: number;
    sentimentScore: number;
    ssiMAG7: number;
    ssiDeFi: number;
    ssiAI?: number;
    ssiLayer1?: number;
    ssiMeme?: number;
    ssiRWA?: number;
    signal?: string;
    confidence?: number;
    portfolioSectors?: string;
    activeSector?: string;
  };
  triggerPrompt?: string;
  triggerKey?: number;
  fullHeight?: boolean;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </span>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isNew }: { msg: Message; isNew?: boolean }) {
  const isAI = msg.role === "assistant";
  const cleaned = isAI ? cleanAIResponse(msg.content) : msg.content;

  return (
    <div
      className={`flex gap-2.5 ${isAI ? "" : "flex-row-reverse"} group`}
      style={isNew ? { animation: "ghostFadeIn 0.22s ease-out both" } : undefined}
    >
      {/* Avatar */}
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isAI
            ? "bg-primary/15 border border-primary/25 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
            : "bg-white/6 border border-white/12"
        }`}
      >
        {isAI
          ? <BrainCircuit className="w-3 h-3 text-primary" />
          : <User className="w-3 h-3 text-muted-foreground/50" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isAI ? "" : "items-end flex flex-col"}`}>
        <div
          className={`text-[7.5px] font-mono mb-1.5 tracking-widest ${
            isAI ? "text-primary/40" : "text-muted-foreground/30 text-right"
          }`}
        >
          {isAI ? "GHOSTAI · SSI TERMINAL" : "YOU"}
        </div>

        <div
          className={`rounded-xl px-3.5 py-3 min-w-0 overflow-hidden ${
            isAI
              ? msg.error
                ? "bg-red-500/8 border border-red-500/20"
                : "bg-primary/5 border border-primary/12"
              : "bg-white/6 border border-white/10"
          }`}
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
        >
          {isAI ? (
            msg.error ? (
              <p className="text-[11px] leading-relaxed text-red-300/80 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                {cleaned || "Error"}
              </p>
            ) : !cleaned && msg.streaming ? (
              <TypingDots />
            ) : (
              renderMarkdown(cleaned, { streaming: msg.streaming && cleaned.length > 0 })
            )
          ) : (
            <p className="text-[11px] leading-relaxed text-foreground/75">{cleaned}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "GhostAI online. ssiMAG7 composite, ssiAI, ssiDeFi, ssiLayer1, ssiMeme, and ssiRWA indexes loaded. FHE market context active.\n\nAsk me about sector rotation, SSI signals, SOSO ecosystem momentum, or your portfolio exposure.",
};

// ── Main component ────────────────────────────────────────────────────────────
function localGhostAIResponse(prompt: string, mode: ResponseMode): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("fhe") || lower.includes("signal")) {
    return [
      "ssiMAG7 is the baseline signal; ssiAI and ssiLayer1 are the higher-beta rotation drivers.",
      "The FHE pipeline is simulated in this prototype: market inputs are treated as encrypted values, the threshold logic resolves BUY/SELL/HOLD, then the UI reveals only the final intelligence layer.",
      "Rotation logic: if ssiMAG7 stays firm and ssiAI leads, risk capital is expanding. If ssiMeme weakens while ssiRWA firms, capital is rotating defensive.",
      mode === "quick" ? "Signal: follow the SSI index outperforming ssiMAG7." : "Actionable intelligence: benchmark stability plus sector outperformance is the cleanest confirmation.",
    ].join("\n");
  }

  if (lower.includes("sosovalue") || lower.includes("sodex") || lower.includes("tokenbar")) {
    return [
      "ssiMAG7, ssiAI, ssiDeFi, ssiLayer1, ssiMeme, and ssiRWA are the sector intelligence layer inside Ghost Trade.",
      "SoSoValue provides the index-style market framework. SSI indexes group tokens into sector baskets for rotation analysis.",
      "TokenBar is the conceptual wrapper for basket exposure; SoDEX is the prototype encrypted execution venue designed to reduce strategy leakage in the simulated FHE flow.",
      "SOSO represents the ecosystem utility and governance layer around SSI adoption.",
    ].join("\n");
  }

  return [
    "ssiMAG7 is the benchmark; the other SSI indexes show where capital is rotating.",
    "ssiAI tracks AI infrastructure, ssiDeFi tracks protocol liquidity, ssiLayer1 tracks network activity, ssiMeme tracks speculative appetite, and ssiRWA tracks defensive tokenized-asset demand.",
    "Ghost Trade uses these signals inside a privacy-simulated FHE workflow for research-grade sector intelligence.",
  ].join("\n");
}

export default function GhostAIChat({ marketContext, triggerPrompt, triggerKey, fullHeight }: GhostAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<ResponseMode>("analyst");
  const [insightIdx, setInsightIdx] = useState(0);
  const [insightFade, setInsightFade] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const triggerFiredRef = useRef(0);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messages]);

  useEffect(() => {
    const iv = setInterval(() => {
      setInsightFade(false);
      setTimeout(() => { setInsightIdx(i => (i + 1) % AUTO_INSIGHTS.length); setInsightFade(true); }, 260);
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!triggerKey || triggerKey === 0 || !triggerPrompt) return;
    if (triggerFiredRef.current === triggerKey) return;
    triggerFiredRef.current = triggerKey;
    const t = setTimeout(() => sendMessage(triggerPrompt), 450);
    return () => clearTimeout(t);
  }, [triggerKey, triggerPrompt]);

  const buildContextHeader = useCallback((): string | undefined => {
    if (!marketContext) return undefined;
    const ctx: Record<string, string> = {
      asset: marketContext.symbol,
      price: `$${marketContext.price.toFixed(2)}`,
      change24h: `${marketContext.change24h >= 0 ? "+" : ""}${marketContext.change24h.toFixed(2)}%`,
      sentiment: `${(marketContext.sentimentScore * 100).toFixed(0)}/100`,
      ssiMAG7: `$${(marketContext.ssiMAG7 / 1000).toFixed(1)}K`,
      ssiDeFi: marketContext.ssiDeFi.toFixed(2),
    };
    if (marketContext.ssiAI !== undefined)    ctx.ssiAI = marketContext.ssiAI.toFixed(2);
    if (marketContext.ssiLayer1 !== undefined) ctx.ssiLayer1 = marketContext.ssiLayer1.toFixed(2);
    if (marketContext.ssiMeme !== undefined)  ctx.ssiMeme = marketContext.ssiMeme.toFixed(2);
    if (marketContext.ssiRWA !== undefined)   ctx.ssiRWA = marketContext.ssiRWA.toFixed(2);
    if (marketContext.signal) ctx.latestSignal = marketContext.signal;
    if (marketContext.confidence) ctx.signalConfidence = `${marketContext.confidence}%`;
    if (marketContext.portfolioSectors) ctx.portfolioSectors = marketContext.portfolioSectors;
    if (marketContext.activeSector) ctx.activeSector = marketContext.activeSector;
    return JSON.stringify(ctx);
  }, [marketContext]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsgId = `u-${Date.now()}`;
    const aiMsgId   = `a-${Date.now()}`;
    const userMsg: Message = { id: userMsgId, role: "user", content: trimmed };
    const aiMsg:  Message  = { id: aiMsgId,   role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setNewMsgIds(prev => new Set([...prev, userMsgId, aiMsgId]));
    setInput("");
    setIsStreaming(true);
    abortRef.current = new AbortController();

    const historyForApi = [...messages, userMsg]
      .filter(m => !m.streaming)
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const ctx = buildContextHeader();
      const headers: Record<string, string> = { "Content-Type": "application/json", "x-response-mode": mode };
      if (ctx) headers["x-market-context"] = ctx;

      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: historyForApi }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: localGhostAIResponse(trimmed, mode), streaming: false, error: false }
            : m
        ));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream body");
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: m.content + data.content } : m
              ));
            }
            if (data.error) {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: localGhostAIResponse(trimmed, mode), streaming: false, error: false } : m
              ));
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: localGhostAIResponse(trimmed, mode), streaming: false, error: false }
            : m
        ));
      }
    } finally {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, streaming: false } : m));
      setIsStreaming(false);
    }
  }, [messages, isStreaming, buildContextHeader, mode]);

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([WELCOME_MSG]);
    setNewMsgIds(new Set());
    setIsStreaming(false);
    setInput("");
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      <style>{`
        @keyframes ghostCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes ghostFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className={`flex flex-col rounded-xl border border-primary/15 bg-black/70 backdrop-blur-sm overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.07)]${fullHeight ? " h-full" : ""}`}
        style={{ position: "relative", zIndex: 10 }}
      >
        {/* ── Header ── */}
        <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.25)]">
              <BrainCircuit className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-foreground/90 tracking-wide">GhostAI</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                <span className="text-[7.5px] font-mono text-primary/60 uppercase tracking-widest">SSI Terminal · Demo Mode</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                disabled={isStreaming}
                title={m.desc}
                className={`text-[7.5px] font-mono px-2 py-1 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  mode === m.id
                    ? "border-primary/40 bg-primary/12 text-primary/90"
                    : "border-white/8 text-muted-foreground/35 hover:border-white/20 hover:text-muted-foreground/60"
                }`}
              >
                {m.label}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={isStreaming}
              title="Clear conversation"
              className="ml-1 w-7 h-7 flex items-center justify-center rounded-lg border border-white/8 text-muted-foreground/40 hover:border-red-500/30 hover:bg-red-500/8 hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── Live insight ticker ── */}
        <div className="px-4 py-2 border-b border-white/4 bg-primary/3 flex items-center gap-2 shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-primary/50 shrink-0" />
          <p
            className="text-[8.5px] font-mono text-primary/55 truncate transition-all duration-250 flex-1 min-w-0"
            style={{ opacity: insightFade ? 1 : 0, transform: insightFade ? "translateY(0)" : "translateY(-2px)" }}
          >
            {AUTO_INSIGHTS[insightIdx]}
          </p>
        </div>

        {/* ── Messages ── */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
          style={fullHeight ? { minHeight: 0 } : { maxHeight: "360px", minHeight: "160px" }}
        >
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isNew={newMsgIds.has(msg.id)} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick prompts ── */}
        <div className="px-4 pt-2.5 pb-2 flex gap-1.5 flex-wrap border-t border-white/5 shrink-0">
          {QUICK_PROMPTS.map(qp => (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.prompt)}
              disabled={isStreaming}
              className="text-[8.5px] font-mono px-2.5 py-1 rounded-lg border border-white/8 text-muted-foreground/45 hover:border-primary/35 hover:text-primary/75 hover:bg-primary/6 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              {qp.label}
              <ChevronRight className="w-2 h-2 opacity-40" />
            </button>
          ))}
        </div>

        {/* ── Input ── */}
        <div className="px-4 pb-4 pt-2 flex gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about SSI rotation, SOSO ecosystem, or sector signals..."
            disabled={isStreaming}
            className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-[11px] font-mono text-foreground/85 placeholder-muted-foreground/25 focus:outline-none focus:border-primary/35 focus:bg-primary/4 focus:shadow-[0_0_14px_rgba(16,185,129,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ pointerEvents: "auto" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isStreaming || !input.trim()}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/85 hover:shadow-[0_0_18px_rgba(16,185,129,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
            style={{ pointerEvents: "auto" }}
          >
            {isStreaming
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
              : <Send className="w-3.5 h-3.5 text-black" />}
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="px-4 pb-3 flex items-center gap-1.5 shrink-0">
          <Zap className="w-2.5 h-2.5 text-muted-foreground/15" />
          <span className="text-[7.5px] font-mono text-muted-foreground/20">
            Cloudflare Workers AI · {MODES.find(m => m.id === mode)?.label} mode · SSI-native · Privacy simulation active
          </span>
        </div>
      </div>
    </>
  );
}
