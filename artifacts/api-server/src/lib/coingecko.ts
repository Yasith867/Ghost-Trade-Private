import { logger } from "./logger";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const MAIN_SYMBOLS = ["BTC", "ETH", "SOL"] as const;

const SYMBOL_TO_ID: Record<string, string> = {
  BTC:  "bitcoin",
  ETH:  "ethereum",
  SOL:  "solana",
  RNDR: "render-token",
  FET:  "fetch-ai",
  TAO:  "bittensor",
};

// Sector token groups — averaged for real sector 24h change
const SECTOR_COIN_IDS: Record<string, string[]> = {
  AI:       ["render-token", "fetch-ai", "bittensor"],
  DeFi:     ["uniswap", "aave", "maker"],
  Layer1:   ["ethereum", "solana", "avalanche-2"],
  Meme:     ["dogecoin", "shiba-inu"],
  NFT:      ["apecoin", "illuvium", "immutable-x"],
  RWA:      ["ondo-finance", "maker"],
  GameFi:   ["axie-infinity", "the-sandbox", "gala"],
  SocialFi: ["decentralized-social"],
};

// All unique coin IDs we need to fetch
const ALL_IDS = [
  ...Object.values(SYMBOL_TO_ID),
  ...new Set(Object.values(SECTOR_COIN_IDS).flat()),
];

export interface IndexData {
  ssiMAG7: number;
  ssiDeFi: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  sentimentScore: number;
  indexData: IndexData;
  provider: string;
  fetchedAt: string;
}

export interface SectorData {
  sector: string;
  change24h: number;
  tokenCount: number;
  tokens: string[];
}

const CACHE_TTL_MS = 30_000;
const FALLBACK_PRICES: Record<string, CoinEntry> = {
  bitcoin: {
    usd: 104800,
    usd_24h_change: 0.82,
    usd_24h_vol: 42_000_000_000,
    usd_market_cap: 2_070_000_000_000,
  },
  ethereum: {
    usd: 2500,
    usd_24h_change: 1.18,
    usd_24h_vol: 18_000_000_000,
    usd_market_cap: 302_000_000_000,
  },
  solana: {
    usd: 170,
    usd_24h_change: 2.05,
    usd_24h_vol: 4_300_000_000,
    usd_market_cap: 80_000_000_000,
  },
  "render-token": {
    usd: 7.4,
    usd_24h_change: 1.65,
    usd_24h_vol: 96_000_000,
    usd_market_cap: 2_900_000_000,
  },
  "fetch-ai": {
    usd: 1.32,
    usd_24h_change: 1.1,
    usd_24h_vol: 122_000_000,
    usd_market_cap: 3_300_000_000,
  },
  bittensor: {
    usd: 432,
    usd_24h_change: 0.74,
    usd_24h_vol: 69_000_000,
    usd_market_cap: 3_700_000_000,
  },
  uniswap: {
    usd: 7.1,
    usd_24h_change: -0.24,
    usd_24h_vol: 105_000_000,
    usd_market_cap: 4_300_000_000,
  },
  aave: {
    usd: 235,
    usd_24h_change: 0.42,
    usd_24h_vol: 185_000_000,
    usd_market_cap: 3_500_000_000,
  },
  maker: {
    usd: 1850,
    usd_24h_change: -0.15,
    usd_24h_vol: 72_000_000,
    usd_market_cap: 1_600_000_000,
  },
};

type CoinEntry = {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
  usd_market_cap: number;
};

interface CacheEntry {
  data: Record<string, CoinEntry>;
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

function computeSentimentScore(change24h: number, volume: number, marketCap: number): number {
  let score = 0.5;
  if (change24h > 5) score += 0.25;
  else if (change24h > 2) score += 0.15;
  else if (change24h > 0) score += 0.07;
  else if (change24h < -5) score -= 0.25;
  else if (change24h < -2) score -= 0.15;
  else if (change24h < 0) score -= 0.07;

  const volumeToMarketCap = marketCap > 0 ? volume / marketCap : 0;
  if (volumeToMarketCap > 0.1) score += 0.1;
  else if (volumeToMarketCap > 0.05) score += 0.05;

  return Math.max(0, Math.min(1, parseFloat(score.toFixed(4))));
}

async function fetchAllCoins(): Promise<CacheEntry> {
  const ids = ALL_IDS.join(",");
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
  logger.debug({ url }, "Fetching CoinGecko data");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as Record<string, CoinEntry>;

  // Validate we got something useful
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new Error("CoinGecko returned empty data");
  }

  const entry: CacheEntry = { data, fetchedAt: Date.now() };
  cache = entry;
  inflight = null;
  return entry;
}

async function getCachedData(): Promise<CacheEntry["data"]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    logger.debug("Returning cached market data");
    return cache.data;
  }

  if (!inflight) {
    logger.info("Cache miss — fetching fresh market data from CoinGecko");
    inflight = fetchAllCoins().catch((err) => {
      inflight = null;
      throw err;
    });
  } else {
    logger.debug("Deduplicated in-flight CoinGecko request");
  }

  try {
    const entry = await inflight;
    return entry.data;
  } catch (err) {
    if (cache) {
      logger.warn({ err }, "CoinGecko fetch failed; returning stale cached market data");
      return cache.data;
    }

    logger.warn({ err }, "CoinGecko fetch failed; returning bundled fallback market data");
    return FALLBACK_PRICES;
  }
}

function safeNum(val: unknown): number {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}

function buildMarketData(symbol: string, data: CacheEntry["data"]): MarketData {
  const upperSymbol = symbol.toUpperCase();
  const coinId = SYMBOL_TO_ID[upperSymbol];
  if (!coinId) {
    throw new Error(`Unsupported symbol: ${symbol}. Supported: ${Object.keys(SYMBOL_TO_ID).join(", ")}`);
  }

  const coin = data[coinId] ?? FALLBACK_PRICES[coinId];
  if (!coin) {
    throw new Error(`No data returned for ${coinId}`);
  }

  const price = safeNum(coin.usd);
  const change24h = safeNum(coin.usd_24h_change);
  const volume = safeNum(coin.usd_24h_vol);
  const marketCap = safeNum(coin.usd_market_cap);

  if (price <= 0) {
    throw new Error(`Invalid price for ${coinId}: ${coin.usd}`);
  }

  const btcCoin = data["bitcoin"] ?? FALLBACK_PRICES["bitcoin"];
  const ethCoin = data["ethereum"] ?? FALLBACK_PRICES["ethereum"];
  const btcPrice = safeNum(btcCoin?.usd);
  const ethPrice = safeNum(ethCoin?.usd);
  const btcMarketCap = safeNum(btcCoin?.usd_market_cap) || 1;
  const ethMarketCap = safeNum(ethCoin?.usd_market_cap) || 1;
  const totalMag7 = btcMarketCap + ethMarketCap;
  const ssiMAG7 = totalMag7 > 0
    ? parseFloat(((btcPrice * btcMarketCap + ethPrice * ethMarketCap) / totalMag7).toFixed(2))
    : 0;

  const defiIds = SECTOR_COIN_IDS["DeFi"] ?? [];
  const defiPrices = defiIds.map((id) => safeNum((data[id] ?? FALLBACK_PRICES[id])?.usd)).filter((p) => p > 0);
  const ssiDeFi = defiPrices.length > 0
    ? parseFloat((defiPrices.reduce((a, b) => a + b, 0) / defiPrices.length).toFixed(4))
    : 0;

  const sentimentScore = computeSentimentScore(change24h, volume, marketCap);

  logger.info({ symbol: upperSymbol, price, change24h, sentimentScore }, "Market data resolved");

  return {
    symbol: upperSymbol,
    price,
    change24h: parseFloat(change24h.toFixed(4)),
    volume,
    marketCap,
    sentimentScore,
    indexData: { ssiMAG7, ssiDeFi },
    provider: "CoinGecko",
    fetchedAt: new Date().toISOString(),
  };
}

export async function getMarketDataForSymbol(symbol: string): Promise<MarketData> {
  const upperSymbol = symbol.toUpperCase();
  if (!SYMBOL_TO_ID[upperSymbol]) {
    throw new Error(`Unsupported symbol: ${symbol}. Supported: ${Object.keys(SYMBOL_TO_ID).join(", ")}`);
  }
  const data = await getCachedData();
  return buildMarketData(upperSymbol, data);
}

export function getFallbackMarketDataForSymbol(symbol: string): MarketData {
  const upperSymbol = symbol.toUpperCase();
  return buildMarketData(upperSymbol, FALLBACK_PRICES);
}

export async function getAllMarketData(): Promise<MarketData[]> {
  const data = { ...FALLBACK_PRICES, ...(await getCachedData()) };
  return MAIN_SYMBOLS.map((s) => buildMarketData(s, data));
}

export function getFallbackAllMarketData(): MarketData[] {
  return MAIN_SYMBOLS.map((s) => buildMarketData(s, FALLBACK_PRICES));
}

// ── Chart history ─────────────────────────────────────────────────────────────

interface HistoryCacheEntry {
  prices: [number, number][];
  fetchedAt: number;
}

const historyCache = new Map<string, HistoryCacheEntry>();
const HISTORY_CACHE_TTL_MS = 5 * 60_000;

export async function getChartHistory(coinId: string, days: number): Promise<[number, number][]> {
  const key = `${coinId}_${days}`;
  const cached = historyCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return cached.prices;
  }

  const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko chart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { prices: [number, number][] };
    if (!Array.isArray(data.prices) || data.prices.length === 0) {
      throw new Error("Invalid chart data format");
    }

    historyCache.set(key, { prices: data.prices, fetchedAt: Date.now() });
    return data.prices;
  } catch (err) {
    logger.warn({ coinId, days, err }, "CoinGecko chart history failed; returning synthetic fallback history");
    const fallback = generateFallbackHistory(coinId, days);
    historyCache.set(key, { prices: fallback, fetchedAt: Date.now() });
    return fallback;
  }
}

function generateFallbackHistory(coinId: string, days: number): [number, number][] {
  const seed = FALLBACK_PRICES[coinId]?.usd ?? 1;
  const points = days <= 1 ? 96 : days <= 7 ? 168 : 240;
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / points;
  let price = seed * 0.985;

  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index / 7) * 0.004;
    const drift = 0.00012;
    price = Math.max(seed * 0.25, price * (1 + wave + drift));
    return [Math.round(now - (points - index - 1) * interval), Number(price.toFixed(6))];
  });
}

export function getFallbackChartHistory(coinId: string, days: number): [number, number][] {
  return generateFallbackHistory(coinId, days);
}

export async function getAllSectorData(): Promise<SectorData[]> {
  const data = { ...FALLBACK_PRICES, ...(await getCachedData()) };
  return buildSectorData(data);
}

export function getFallbackSectorData(): SectorData[] {
  return buildSectorData(FALLBACK_PRICES);
}

function buildSectorData(data: CacheEntry["data"]): SectorData[] {
  const results: SectorData[] = [];

  for (const [sector, ids] of Object.entries(SECTOR_COIN_IDS)) {
    const changes: number[] = [];
    for (const id of ids) {
      const entry = data[id] ?? FALLBACK_PRICES[id];
      if (entry) {
        const change = safeNum(entry.usd_24h_change);
        if (isFinite(change)) changes.push(change);
      }
    }
    const avg = changes.length > 0
      ? parseFloat((changes.reduce((a, b) => a + b, 0) / changes.length).toFixed(4))
      : 0;

    results.push({
      sector,
      change24h: avg,
      tokenCount: changes.length,
      tokens: ids,
    });
  }

  return results;
}
