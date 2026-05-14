import { Router, type IRouter } from "express";

const router: IRouter = Router();

const CF_MODEL = "@cf/meta/llama-3-8b-instruct";

type ResponseMode = "quick" | "analyst" | "deep";

const MODE_TOKENS: Record<ResponseMode, number> = {
  quick: 200,
  analyst: 440,
  deep: 820,
};

const SYSTEM_CORE = `You are GhostAI — the AI intelligence layer of Ghost Trade Private, a SoSoValue-powered sector analytics terminal. This is a buildathon prototype and research demonstration.

CORE IDENTITY: You are an SSI-native market intelligence assistant. Analytical, institutional, concise. You help users understand SSI sector indexes, capital rotation, and the SoSoValue ecosystem. You are NOT a deployed infrastructure protocol — you are a research-oriented, AI-enhanced analytics tool.

SSI SECTOR INDEXES (always name these explicitly — never call them "sectors" generically):
- ssiMAG7: BTC+ETH mega-cap composite (70% BTC, 30% ETH). The benchmark baseline.
- ssiAI: TAO, RNDR, FET, AKT, WLD — decentralized AI compute & infrastructure
- ssiDeFi: UNI, AAVE, MKR, COMP, CRV — protocol revenue, TVL, DeFi capital flows
- ssiLayer1: ETH, SOL, AVAX, APT, SUI — L1 network activity & validator economics
- ssiMeme: DOGE, SHIB, PEPE, WIF — speculative appetite & retail participation signal
- ssiRWA: ONDO, MKR, REAL — tokenized real-world assets (lowest BTC correlation at ~0.42)
- ssiNFT: BLUR, X2Y2, LOOKS — marketplace volume & collector activity
- ssiGameFi: AXS, SAND, MANA — gaming sector engagement
- ssiSocialFi: DESO, FRIEND — social token & creator economy

SOSOVALUE ECOSYSTEM (describe conceptually — this is a research prototype):
- SoSoValue: A crypto index and sector intelligence platform. SSI indexes are their core data product.
- SOSO token: Governance and utility token of the SoSoValue protocol. Conceptually tied to SSI adoption and SoDEX activity.
- SoDEX: A conceptual encrypted DEX for SSI sector basket trading, designed to minimize strategy leakage via FHE-style encrypted order flow. Simulated in this demo.
- TokenBar: Conceptual ERC-20 wrappers for SSI baskets (e.g., ssiMAG7 bar) — intended to give retail access to sector allocations.
- SSI Protocol: Dynamic sector index engine with periodic rebalancing. Ghost Trade surfaces this data for research and portfolio analysis.

RESPONSE RULES:
1. SSI-FIRST: Open responses by naming the relevant SSI index(es) explicitly.
2. ROTATION LANGUAGE: Frame insights as capital flows — "rotation into ssiRWA", "ssiDeFi outperforming ssiMAG7", "ssiMeme risk-off compression".
3. TOKEN SPECIFICITY: Name sector leaders (TAO for ssiAI, AAVE for ssiDeFi, ONDO for ssiRWA).
4. AVOID MACRO GENERICS: Don't say "global uncertainty", "macro headwinds", "Fed", "interest rates", "broader market". Frame macro as SSI rotation events instead.
5. TERMINAL STYLE: Short, clean, readable. No padding. No "it's important to note that". No filler sentences.
6. FORBIDDEN PHRASES: "As an AI", "I think", "I believe", "in my opinion", "please consult a financial advisor".
7. ACCURACY DISCIPLINE: Do NOT claim specific transaction counts, guaranteed MEV protection, live settlement volumes, or verified on-chain throughput. Describe SoDEX and FHE workflows as "designed for", "intended to", "simulated in this prototype", or "conceptually".
8. PROTOTYPE AWARENESS: When discussing FHE, encrypted execution, or SoDEX mechanics, clarify these are simulated/prototype implementations where appropriate. Keep it brief — one phrase is enough.
9. PORTFOLIO AWARENESS: When portfolio data is in context, reference SSI sector exposure and identify over/underweight positions vs the rotation signal.
10. NUMBERS: Use real numbers when available from market context. Avoid fabricating statistics.

GOOD RESPONSE EXAMPLE:
"ssiAI is the strongest sector this session — TAO and RNDR leading AI compute inflows. Capital rotating from ssiMeme (risk-off compression) into ssiAI (1.4x BTC beta). ssiMAG7 benchmark stable, supporting high-beta sector momentum."

BAD RESPONSE EXAMPLE (never do this):
"SoDEX is processing 24,000 encrypted transactions per day with guaranteed zero-MEV execution and fully decentralized on-chain settlement."`;

const MODE_INSTRUCTION: Record<ResponseMode, string> = {
  quick: "2–4 sentences max. Open with the strongest SSI signal. One rotation call. One token leader. Zero filler. If discussing FHE or SoDEX, one brief prototype/simulation note is enough.",
  analyst: "6–9 lines. Name 2–3 SSI indexes by name. Capital rotation direction with magnitude if available. Specific token leaders per sector. One SoSoValue ecosystem reference. Close with one clean, actionable intelligence line.",
  deep: `Institutional-style breakdown. Use this structure:
**SSI SECTOR RANKING** (strongest → weakest, name all relevant indexes)
**CAPITAL ROTATION** (which sectors gaining/losing, why, token leaders per move)
**ssiMAG7 CONTEXT** (benchmark direction and its effect on sector betas)
**SOSOVALUE ECOSYSTEM** (SoDEX concept, TokenBar allocation logic, SOSO demand — describe as prototype/research where relevant)
**ACTIONABLE INTELLIGENCE** (1–2 clean, decisive conclusions)
Keep each section tight. No padding. No fictional infrastructure claims.`,
};

function buildSystemPrompt(mode: ResponseMode, contextJson?: string): string {
  const ctx = contextJson ? `\n\nLive terminal data: ${contextJson}` : "";
  return `${SYSTEM_CORE}\n\nRESPONSE FORMAT: ${MODE_INSTRUCTION[mode]}${ctx}`;
}

function buildCompactContext(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    const parts: string[] = [];
    if (parsed.asset) parts.push(`Asset:${parsed.asset}`);
    if (parsed.price) parts.push(`Price:${parsed.price}`);
    if (parsed.change24h) parts.push(`24h:${parsed.change24h}`);
    if (parsed.sentiment) parts.push(`Sentiment:${parsed.sentiment}`);
    if (parsed.ssiMAG7) parts.push(`ssiMAG7:${parsed.ssiMAG7}`);
    if (parsed.ssiDeFi) parts.push(`ssiDeFi:${parsed.ssiDeFi}`);
    if (parsed.ssiAI) parts.push(`ssiAI:${parsed.ssiAI}`);
    if (parsed.ssiLayer1) parts.push(`ssiLayer1:${parsed.ssiLayer1}`);
    if (parsed.ssiMeme) parts.push(`ssiMeme:${parsed.ssiMeme}`);
    if (parsed.ssiRWA) parts.push(`ssiRWA:${parsed.ssiRWA}`);
    if (parsed.latestSignal && parsed.latestSignal !== "none") parts.push(`FHE_Signal:${parsed.latestSignal}`);
    if (parsed.signalConfidence) parts.push(`Confidence:${parsed.signalConfidence}`);
    if (parsed.portfolioSectors) parts.push(`PortfolioSSIExposure:${parsed.portfolioSectors}`);
    if (parsed.activeSector) parts.push(`ActiveSector:${parsed.activeSector}`);
    return parts.join(" | ");
  } catch {
    return raw.slice(0, 300);
  }
}

function buildFallbackResponse(prompt: string, mode: ResponseMode, compactContext?: string): string {
  const lower = prompt.toLowerCase();
  const contextLine = compactContext ? `\n\nLive context: ${compactContext}` : "";

  if (lower.includes("fhe") || lower.includes("signal")) {
    return [
      "ssiMAG7 is the baseline signal, with ssiAI and ssiLayer1 acting as the higher-beta rotation layer.",
      "The FHE workflow in this prototype treats price, 24h change, volume, and sentiment as encrypted inputs, then resolves BUY/SELL/HOLD from threshold logic without exposing the raw decision path.",
      "Current rotation logic: positive ssiMAG7 keeps risk appetite open; ssiAI confirms growth-sector demand when TAO/RNDR style assets lead; ssiRWA becomes the defensive bid if ssiMeme weakens.",
      "Actionable read: follow the SSI index with the strongest spread versus ssiMAG7, not the single-token move.",
    ].join("\n") + contextLine;
  }

  if (lower.includes("sosovalue") || lower.includes("sodex") || lower.includes("tokenbar")) {
    return [
      "ssiMAG7, ssiAI, ssiDeFi, ssiLayer1, ssiMeme, and ssiRWA are the sector intelligence layer inside Ghost Trade.",
      "SoSoValue is the index and market-intelligence reference; SSI indexes organize tokens into investable sector baskets.",
      "TokenBar is the conceptual wrapper for holding those SSI baskets as simpler sector exposure.",
      "SoDEX is the prototype encrypted execution layer, designed to route SSI basket trades with less strategy leakage in the simulated FHE workflow.",
      "SOSO sits conceptually around governance, fees, and ecosystem demand as SSI adoption grows.",
    ].join("\n") + contextLine;
  }

  if (lower.includes("rotation") || lower.includes("inflow") || lower.includes("outflow")) {
    return [
      "ssiAI and ssiLayer1 are the risk-on rotation indexes; ssiRWA is the defensive rotation index; ssiMeme is the speculative appetite gauge.",
      "When ssiMAG7 holds positive, capital can rotate outward into higher-beta SSI indexes. If ssiMAG7 softens, flows usually compress toward ssiRWA and away from ssiMeme.",
      "Token leaders to watch: TAO/RNDR for ssiAI, AAVE/MKR for ssiDeFi, ETH/SOL for ssiLayer1, and ONDO/MKR for ssiRWA.",
      mode === "quick" ? "Signal: compare each SSI index against ssiMAG7 to identify leadership." : "Actionable intelligence: SSI leadership is confirmed when sector momentum and benchmark stability move together.",
    ].join("\n") + contextLine;
  }

  return [
    "ssiMAG7 is the benchmark layer for Ghost Trade; the other SSI indexes show where sector capital is rotating.",
    "ssiAI tracks AI infrastructure momentum, ssiDeFi tracks protocol revenue and liquidity, ssiLayer1 tracks network activity, ssiMeme tracks speculative appetite, and ssiRWA tracks defensive tokenized-asset demand.",
    "Ghost Trade uses these indexes with an FHE-style prototype pipeline so market signals can be analyzed without presenting the workflow as live private settlement infrastructure.",
  ].join("\n") + contextLine;
}

function writeFallbackStream(res: import("express").Response, content: string): void {
  res.write(`data: ${JSON.stringify({ content })}\n\n`);
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

router.post("/chat", async (req, res): Promise<void> => {
  const { messages } = req.body as {
    messages: Array<{ role: string; content: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  const rawMode = (req.headers["x-response-mode"] as string) ?? "quick";
  const mode: ResponseMode = (["quick", "analyst", "deep"].includes(rawMode) ? rawMode : "quick") as ResponseMode;
  const maxTokens = MODE_TOKENS[mode];

  const rawContext = req.headers["x-market-context"] as string | undefined;
  const compactContext = buildCompactContext(rawContext);
  const systemContent = buildSystemPrompt(mode, compactContext);

  const recentMessages = messages.slice(-6);
  const chatMessages = [{ role: "system", content: systemContent }, ...recentMessages];

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const lastUserPrompt = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

  if (!accountId || !apiToken) {
    req.log.warn("Cloudflare AI credentials missing; using GhostAI local fallback");
    writeFallbackStream(res, buildFallbackResponse(lastUserPrompt, mode, compactContext));
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatMessages,
        stream: true,
        max_tokens: maxTokens,
        temperature: mode === "deep" ? 0.55 : 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log.warn({ status: response.status, errText: errText.slice(0, 200) }, "Cloudflare AI request failed; using GhostAI local fallback");
      writeFallbackStream(res, buildFallbackResponse(lastUserPrompt, mode, compactContext));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      writeFallbackStream(res, buildFallbackResponse(lastUserPrompt, mode, compactContext));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed?.response ?? parsed?.choices?.[0]?.delta?.content ?? "";
          if (token) {
            res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
          }
        } catch {
          // skip malformed SSE chunks
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log.warn({ err }, "GhostAI stream failed; using local fallback");
    writeFallbackStream(res, buildFallbackResponse(lastUserPrompt, mode, compactContext));
  }
});

export default router;
