import { Router, type IRouter } from "express";
import { GetMarketDataParams } from "@workspace/api-zod";
import {
  getMarketDataForSymbol,
  getAllMarketData,
  getAllSectorData,
  getChartHistory,
  getFallbackAllMarketData,
  getFallbackChartHistory,
  getFallbackMarketDataForSymbol,
  getFallbackSectorData,
} from "../lib/coingecko";

const router: IRouter = Router();

router.get("/charts/history", async (req, res): Promise<void> => {
  const { coin, days = "7" } = req.query as { coin?: string; days?: string };

  if (!coin || typeof coin !== "string" || !/^[a-z0-9-]+$/.test(coin)) {
    res.status(400).json({ error: "Valid coin id required (e.g. bitcoin, ethereum)" });
    return;
  }

  const daysNum = Math.min(Math.max(parseInt(String(days), 10) || 7, 1), 365);

  try {
    req.log.info({ coin, days: daysNum }, "Fetching chart history");
    const prices = await getChartHistory(coin, daysNum);
    res.json({ prices, coin, days: daysNum, fetchedAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ coin, days: daysNum, err }, "Chart history fetch failed");
    res.json({ prices: getFallbackChartHistory(coin, daysNum), coin, days: daysNum, fallback: true, fetchedAt: new Date().toISOString() });
  }
});

router.get("/market-data", async (req, res): Promise<void> => {
  req.log.info("Fetching all market data");
  try {
    const data = await getAllMarketData();
    res.json(data);
  } catch (err) {
    req.log.warn({ err }, "All market data failed; returning fallback data");
    res.json(getFallbackAllMarketData());
  }
});

router.get("/market-data/sectors", async (req, res): Promise<void> => {
  req.log.info("Fetching sector data");
  try {
    const sectors = await getAllSectorData();
    res.json(sectors);
  } catch (err) {
    req.log.warn({ err }, "Sector data failed; returning fallback data");
    res.json(getFallbackSectorData());
  }
});

router.get("/market-data/:symbol", async (req, res): Promise<void> => {
  const params = GetMarketDataParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  req.log.info({ symbol: params.data.symbol }, "Fetching market data for symbol");
  try {
    const data = await getMarketDataForSymbol(params.data.symbol);
    res.json(data);
  } catch (err) {
    req.log.warn({ symbol: params.data.symbol, err }, "Market data failed; returning fallback data");
    res.json(getFallbackMarketDataForSymbol(params.data.symbol));
  }
});

export default router;
