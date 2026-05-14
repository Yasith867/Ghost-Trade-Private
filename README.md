# Ghost Trade Private

Ghost Trade Private is a crypto intelligence terminal for simulated private trading workflows. It combines live market data, SSI sector indexes, an FHE-style signal pipeline, wallet-aware views, and GhostAI market analysis.

## Features

- Live crypto market dashboard for BTC, ETH, SOL, RNDR, FET, TAO, and SOSO prototype data.
- Chart history with resilient fallback data when upstream market APIs are unavailable.
- GhostAI chat with market context, SSI sector rotation prompts, and streaming responses.
- SSI index views for ssiMAG7, ssiAI, ssiDeFi, ssiLayer1, ssiMeme, and ssiRWA.
- Private portfolio and watchlist screens with encrypted-trading simulation states.
- Express API for health checks, market data, chart history, FHE analysis, and chat.
- Solidity contract target for private signal submission and permit-based viewing.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, shadcn/ui, Recharts
- API: Express 5, TypeScript, Node.js
- Data: CoinGecko market data with cache and fallback handling
- AI: OpenRouter/Cloudflare-compatible chat integration
- Database: PostgreSQL schema with Drizzle ORM
- Package manager: pnpm workspaces
- Deployment: Vercel

## Project Structure

```text
artifacts/
  ghosttrade/          React + Vite application
  api-server/          Express API server
  mockup-sandbox/      Design/mockup sandbox
api/
  index.ts             Vercel serverless API entrypoint
contracts/
  GhostTradePrivate.sol
lib/
  api-client-react/    Generated React API client
  api-spec/            OpenAPI spec
  api-zod/             Zod API schemas
  db/                  Drizzle schema
scripts/
  src/hello.ts
```

## API Routes

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/healthz` | API health check |
| GET | `/api/market-data` | BTC, ETH, and SOL market data |
| GET | `/api/market-data/:symbol` | Single asset market data |
| GET | `/api/market-data/sectors` | Sector aggregate data |
| GET | `/api/charts/history` | Chart history by CoinGecko coin id |
| POST | `/api/analyze` | FHE-style signal analysis |
| POST | `/api/chat` | GhostAI chat stream |

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the API:

```bash
$env:PORT = "3001"
pnpm --filter @workspace/api-server run dev
```

Run the frontend in another terminal:

```bash
$env:VITE_API_BASE_URL = "http://localhost:3001"
pnpm --filter @workspace/ghosttrade run dev
```

Open the frontend at `http://localhost:5000`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Local frontend only | API origin used by the Vite app |
| `DATABASE_URL` | Optional | PostgreSQL connection string for chat history |
| `OPENROUTER_API_KEY` | Optional | Enables OpenRouter chat completions |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Cloudflare AI account id, if used |
| `CLOUDFLARE_API_TOKEN` | Optional | Cloudflare AI token, if used |

The market and chart screens include fallback data so the UI still loads when CoinGecko is unavailable or rate limited.

## Vercel Deployment

The root `vercel.json` builds `artifacts/ghosttrade` and routes `/api/*` to `api/index.ts`, which exports the Express app for Vercel serverless functions.

Default settings:

- Build command: `pnpm --filter @workspace/ghosttrade run build`
- Output directory: `artifacts/ghosttrade/dist`
- API entrypoint: `api/index.ts`
- SPA fallback: all non-API routes serve `index.html`

## Useful Commands

```bash
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/ghosttrade run build
pnpm --filter @workspace/api-server run build
```

## Smart Contract

`contracts/GhostTradePrivate.sol` contains the prototype private-signal contract. It targets Solidity `0.8.19` and is intended for testnet deployment workflows.
