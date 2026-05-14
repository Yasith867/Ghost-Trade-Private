import { Router, type IRouter } from "express";
import { AnalyzeAssetBody } from "@workspace/api-zod";
import { getFallbackMarketDataForSymbol, getMarketDataForSymbol } from "../lib/coingecko";
import { runFhePipeline } from "../lib/fhe";

const router: IRouter = Router();

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { symbol, walletConnected } = parsed.data;

  req.log.info({ symbol, walletConnected }, "Starting FHE analysis");

  let marketData;
  try {
    marketData = await getMarketDataForSymbol(symbol);
  } catch (err) {
    req.log.warn({ symbol, err }, "Market data failed during analysis; using fallback data");
    marketData = getFallbackMarketDataForSymbol(symbol);
  }

  const fheResult = runFhePipeline(marketData, walletConnected ?? false);

  req.log.info(
    { symbol, signal: fheResult.signal, confidence: fheResult.confidence, fheMode: fheResult.fheMode },
    "FHE analysis complete",
  );

  res.json({
    ...fheResult,
    marketData,
  });
});

export default router;
