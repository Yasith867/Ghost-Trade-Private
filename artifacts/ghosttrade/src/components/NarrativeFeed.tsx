import React, { useEffect, useMemo, useState } from "react";
import { Radio } from "lucide-react";

interface NarrativeFeedProps {
  btcChange?: number;
  ethChange?: number;
  solChange?: number;
}

function buildNarratives(btc: number, eth: number, sol: number): string[] {
  const avg = (btc + eth + sol) / 3;
  const items: string[] = [];

  // Dynamic SSI-native signals based on real price changes
  if (btc > 2) {
    items.push("ssiMAG7 surging — BTC composite at +2%+ session high, ssiAI and ssiDeFi betas amplifying.");
  } else if (btc > 0.5) {
    items.push("ssiMAG7 positive — BTC momentum intact. ssiAI and ssiLayer1 tracking with elevated beta.");
  } else if (btc < -2) {
    items.push("ssiMAG7 declining sharply — capital rotating to ssiRWA (BTC corr. 0.42) for defensive positioning.");
  } else if (btc < -0.5) {
    items.push("ssiMAG7 drifting lower — ssiMeme compressing. ssiRWA and ssiDeFi showing relative strength.");
  } else {
    items.push("ssiMAG7 consolidating — sector rotation paused, watching BTC/ETH composite for directional signal.");
  }

  if (eth > btc + 0.8) {
    items.push("ETH outperforming BTC — ssiLayer1 and ssiDeFi benefiting from ETH-led rotation. L1 beta elevated.");
  } else if (eth < btc - 0.8) {
    items.push("ETH lagging BTC — capital concentrating in ssiMAG7 BTC-heavy weighting. DeFi TVL watch.");
  } else {
    items.push("ETH tracking BTC — ssiMAG7 correlation elevated. Sector differentiation minimal this session.");
  }

  if (sol > avg + 1) {
    items.push("SOL relative strength driving ssiLayer1 rotation — L1 sector outperforming ssiMAG7 composite.");
  } else if (sol < avg - 1) {
    items.push("SOL underperforming — ssiLayer1 sector lagging. ETH validator economics capturing L1 capital.");
  }

  if (avg > 1.5) {
    items.push("Risk-on regime active — ssiAI (1.48x beta) and ssiMeme (2.28x beta) amplifying BTC momentum.");
  } else if (avg < -1.5) {
    items.push("Risk-off rotation — capital exiting ssiMeme. ssiRWA ONDO T-bill tokenization attracting flows.");
  } else {
    items.push("Neutral regime — capital rotating between ssiDeFi and ssiAI. ssiMAG7 benchmark holding.");
  }

  // Static SSI/SoSoValue-native intelligence items
  items.push(
    "ssiAI: TAO and RNDR leading compute inflows — AI sector beta to BTC at 1.48x.",
    "ssiDeFi vs ssiAI capital rotation: AI outperforming DeFi by 1.8% this session. AAVE and MKR stable.",
    "ssiRWA diverging from ssiMAG7 — ONDO T-bill tokenization attracting institutional defensive capital.",
    "ssiMeme beta at 2.28x BTC — speculative premium compressing as risk appetite moderates.",
    "ssiLayer1: ETH and SOL competing for validator economic dominance. APT and SUI early accumulation.",
    "SSI Protocol rebalancing — ssiAI sector weight increased 3.2% this epoch as TAO market cap expanded.",
    "SoDEX encrypted order flow increasing — 127 private sector rotation strategies executing.",
    "TokenBar ssiMAG7 mint demand rising — BTC+ETH basket allocation growing among institutional buyers.",
    "SOSO ecosystem score expanding — SoDEX volume and SSI adoption both accelerating this session.",
    "ssiRWA BTC correlation: 0.42 — lowest across all SSI indexes. Acting as portfolio hedge.",
    "Capital rotating FROM ssiMeme INTO ssiRWA — risk-off repositioning confirmed by sector flow data.",
    "SoDEX FHE execution protecting $48.2M in active SSI sector strategies. Zero on-chain leakage.",
    "ssiDeFi recovering — AAVE TVL inflows and MKR DAI stability signaling sector health.",
    "ssiMAG7 vs ssiAI divergence widening — AI sector capturing disproportionate capital rotation.",
    "ValueChain settlement volume: 24.3K TX/day — SSI index rotation and permit resolution active.",
  );

  return items;
}

export default function NarrativeFeed({ btcChange = 0, ethChange = 0, solChange = 0 }: NarrativeFeedProps) {
  const narratives = useMemo(
    () => buildNarratives(btcChange, ethChange, solChange),
    [btcChange, ethChange, solChange]
  );

  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % narratives.length);
        setFade(true);
      }, 250);
    }, 4200);
    return () => clearInterval(interval);
  }, [narratives.length]);

  return (
    <div className="rounded-xl border border-white/6 bg-black/30 px-4 py-2.5 flex items-center gap-3 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <Radio className="w-3 h-3 text-primary/50 animate-pulse" />
        <span className="text-[8px] font-mono text-primary/50 uppercase tracking-widest">SSI INTEL</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <p
          className="text-[10px] font-mono text-foreground/55 whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            opacity: fade ? 1 : 0,
            transform: fade ? "translateY(0)" : "translateY(-3px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}
        >
          {narratives[idx]}
        </p>
      </div>
    </div>
  );
}
