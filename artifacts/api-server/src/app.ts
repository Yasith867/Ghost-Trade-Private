import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve built frontend static files (production)
// Try multiple candidate paths so the bundle works regardless of cwd or __dirname resolution.
function findFrontendDist(): string | null {
  const candidates: string[] = [];

  // 1. Relative to process.cwd() — works when launched from workspace root
  candidates.push(path.resolve(process.cwd(), "artifacts/ghosttrade/dist"));

  // 2. Relative to this file's location via import.meta.url (esbuild preserves this)
  try {
    const fileDir = path.dirname(fileURLToPath(import.meta.url));
    // dist/index.mjs → ../../ghosttrade/dist
    candidates.push(path.resolve(fileDir, "../../ghosttrade/dist"));
    // also try one level up in case run from api-server/
    candidates.push(path.resolve(fileDir, "../../../ghosttrade/dist"));
  } catch {
    // import.meta.url not available in this context — skip
  }

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      return candidate;
    }
  }
  return null;
}

const frontendDist = findFrontendDist();

if (frontendDist) {
  logger.info({ frontendDist }, "Serving frontend static files");
  app.use(express.static(frontendDist, { index: false }));
  // SPA fallback — all non-/api routes serve index.html so React Router works
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  logger.warn("Frontend dist not found — API-only mode");
}

export default app;
