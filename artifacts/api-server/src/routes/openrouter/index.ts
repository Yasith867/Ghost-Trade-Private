import { Router, type IRouter } from "express";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { SendOpenrouterMessageBody, CreateOpenrouterConversationBody } from "@workspace/api-zod";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const CF_MODEL = "@cf/meta/llama-3-8b-instruct";

type ResponseMode = "quick" | "analyst" | "deep";

const MODE_TOKENS: Record<ResponseMode, number> = {
  quick: 220,
  analyst: 480,
  deep: 860,
};

const SYSTEM_CORE = `You are GhostAI — SoSoValue institutional intelligence terminal. FHE-powered. SSI-native sector engine.

PRIMARY INTELLIGENCE: SSI Sector Indexes (always reference these first)
ssiMAG7: BTC+ETH mega-cap composite — the benchmark. 70% BTC, 30% ETH weighting.
ssiAI: TAO, RNDR, FET, AKT, WLD — decentralized AI infrastructure & compute sector
ssiDeFi: UNI, AAVE, MKR, COMP, CRV — protocol revenue, TVL, DeFi capital flows
ssiLayer1: ETH, SOL, AVAX, APT, SUI — L1 network activity & validator economics
ssiMeme: DOGE, SHIB, PEPE, WIF — speculative appetite & retail participation signal
ssiRWA: ONDO, MKR, REAL — tokenized real-world asset adoption (low BTC correlation)
ssiSocialFi: DESO, FRIEND — social token participation & creator economy
ssiNFT: BLUR, X2Y2, LOOKS — NFT marketplace volume & collector activity
ssiGameFi: AXS, SAND, MANA — gaming sector engagement & metaverse capital

SOSOVALUE ECOSYSTEM KNOWLEDGE:
SOSO token: governance + utility token. Demand correlates to SSI adoption & SoDEX trading volume.
SoDEX: encrypted index DEX — FHE-powered order execution, zero MEV exposure, sector basket trading.
TokenBar: tokenized index bar — retail gateway to buy/hold SSI sector baskets as single tokens.
SSI Protocol: on-chain smart sector index engine — dynamic weighting, rebalancing, sector scoring.
ValueChain: settlement & custody rails — the on-chain infrastructure layer for index finality.

RESPONSE RULES (strictly follow):
1. SSI FIRST: lead every response by naming the relevant SSI index(es).
2. ROTATION LANGUAGE: frame everything as capital rotating between sectors. "Inflows into ssiRWA as ssiMeme weakens."
3. TOKEN SPECIFICITY: name sector leaders when relevant — TAO leading ssiAI, AAVE leading ssiDeFi.
4. NO GENERIC MACRO: skip central bank commentary, inflation talk, global uncertainty — unless directly driving a named sector rotation.
5. TERMINAL STYLE: short, decisive, institutional. No filler. No hedging.
6. NEVER "As an AI" or "I think". Every sentence = live sector intelligence.
7. SOSO ECOSYSTEM: reference SOSO token, SoDEX volume, or ecosystem momentum when relevant.
8. PORTFOLIO CONTEXT: if portfolio data is provided, analyze SSI sector exposure and rotation risk.`;

const MODE_INSTRUCTION: Record<ResponseMode, string> = {
  quick: "2–4 sentences max. Lead with strongest SSI signal. One rotation insight. Decisive.",
  analyst: "5–8 focused lines. Name 2+ SSI indexes. Capital rotation direction. Specific token leaders. One ecosystem signal.",
  deep: "Full breakdown: SSI sector ranking (strongest→weakest), capital rotation map, token-level leaders per sector, BTC correlation context, SOSO ecosystem momentum. Conclude with actionable intelligence.",
};

function buildSystemPrompt(mode: ResponseMode, compactCtx?: string): string {
  const ctx = compactCtx ? `\nLive market context: ${compactCtx}` : "";
  return `${SYSTEM_CORE}\n\n${MODE_INSTRUCTION[mode]}${ctx}`;
}

function buildCompactContext(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    const parts: string[] = [];
    if (parsed.asset) parts.push(`Asset:${parsed.asset}`);
    if (parsed.price) parts.push(`Price:${parsed.price}`);
    if (parsed.change24h) parts.push(`24h:${parsed.change24h}`);
    if (parsed.sentiment) parts.push(`Sent:${parsed.sentiment}`);
    if (parsed.ssiMAG7) parts.push(`ssiMAG7:${parsed.ssiMAG7}`);
    if (parsed.ssiDeFi) parts.push(`ssiDeFi:${parsed.ssiDeFi}`);
    if (parsed.ssiAI) parts.push(`ssiAI:${parsed.ssiAI}`);
    if (parsed.ssiLayer1) parts.push(`ssiL1:${parsed.ssiLayer1}`);
    if (parsed.ssiMeme) parts.push(`ssiMeme:${parsed.ssiMeme}`);
    if (parsed.latestSignal && parsed.latestSignal !== "none") parts.push(`Signal:${parsed.latestSignal}`);
    if (parsed.signalConfidence) parts.push(`Confidence:${parsed.signalConfidence}`);
    if (parsed.portfolioSectors) parts.push(`PortfolioExposure:${parsed.portfolioSectors}`);
    return parts.join(" | ");
  } catch {
    return raw.slice(0, 300);
  }
}

function getCFEndpoint(): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID not set");
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`;
}

async function streamCloudflareAI(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!apiToken) throw new Error("CLOUDFLARE_API_TOKEN not set");

  const endpoint = getCFEndpoint();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, stream: true, max_tokens: maxTokens, temperature: 0.6 }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare AI error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from Cloudflare AI");

  const decoder = new TextDecoder();
  let fullText = "";
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
          fullText += token;
          onToken(token);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

// ── CRUD routes ────────────────────────────────────────────────────────────

router.get("/openrouter/conversations", async (req, res): Promise<void> => {
  const convos = await db.select().from(conversationsTable).orderBy(asc(conversationsTable.createdAt));
  res.json(convos);
});

router.post("/openrouter/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenrouterConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [convo] = await db.insert(conversationsTable).values({ title: parsed.data.title }).returning();
  res.status(201).json(convo);
});

router.get("/openrouter/conversations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(asc(messagesTable.createdAt));
  res.json({ ...convo, messages: msgs });
});

router.delete("/openrouter/conversations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await db.delete(conversationsTable).where(eq(conversationsTable.id, id)).returning();
  if (!deleted.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

router.get("/openrouter/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(asc(messagesTable.createdAt));
  res.json(msgs);
});

// ── Streaming message endpoint ─────────────────────────────────────────────

router.post("/openrouter/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = SendOpenrouterMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }

  await db.insert(messagesTable).values({ conversationId: id, role: "user", content: parsed.data.content });

  const history = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  const rawMode = (req.headers["x-response-mode"] as string) ?? "quick";
  const mode: ResponseMode = (["quick", "analyst", "deep"].includes(rawMode) ? rawMode : "quick") as ResponseMode;
  const maxTokens = MODE_TOKENS[mode];

  const rawContext = req.headers["x-market-context"] as string | undefined;
  const compactCtx = buildCompactContext(rawContext);

  const recentHistory = history.slice(-6);

  const chatMessages = [
    { role: "system", content: buildSystemPrompt(mode, compactCtx) },
    ...recentHistory.map(m => ({ role: m.role, content: m.content })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let fullResponse = "";

  try {
    fullResponse = await streamCloudflareAI(
      chatMessages,
      maxTokens,
      (token) => {
        res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
      }
    );

    if (fullResponse) {
      await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fullResponse });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log.error({ err }, "GhostAI Cloudflare stream error");
    res.write(`data: ${JSON.stringify({ error: "GhostAI encountered an error. Please try again." })}\n\n`);
    res.end();
  }
});

export default router;
