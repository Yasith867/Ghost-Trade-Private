import React, { useState } from "react";
import { Link } from "wouter";
import {
  Lock, Cpu, Eye, Zap, ShieldCheck, BookOpen, ExternalLink,
  ChevronDown, ChevronUp, ArrowLeft, Code2, GitBranch, Database, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";

const FHE_PIPELINE = [
  {
    icon: Lock,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "encryptInputs",
    subtitle: "TFHE · fhenix.js",
    desc: "Market price, 24h change, volume, and sentiment score are passed through an FHE-inspired encryption simulation. In this prototype, the encryption is conceptual — demonstrating the intended flow of a real Fhenix deployment.",
    code: `encryptInputs({ price, change24h, volume, sentiment })\n// → { enc_price, enc_change, enc_vol, enc_sent }`,
  },
  {
    icon: Cpu,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "runEncryptedLogic",
    subtitle: "FHE-inspired logic · simulated ciphertext",
    desc: "The decision logic (price vs MA, volume vs threshold, sentiment vs baseline) runs on simulated encrypted inputs. This models what a real TFHE deployment on Fhenix would compute on-chain.",
    code: `if enc_change > 0 AND enc_sent > 0.6 → enc_BUY\nif enc_change < 0 AND enc_sent < 0.4 → enc_SELL\nelse → enc_HOLD`,
  },
  {
    icon: Eye,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "decryptForView",
    subtitle: "permit · EIP-712 · viewing key",
    desc: "In a full Fhenix deployment, the result ciphertext is decrypted using a viewing permit held by your wallet. In this prototype, the signal (BUY/SELL/HOLD) and confidence score are returned to the UI after server-side simulation.",
    code: `decryptForView(enc_signal, permit)\n// → { signal: "BUY", confidence: 78 }`,
  },
  {
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    title: "prepareDecryptForTx",
    subtitle: "SoDEX Wave 2 · Arbitrum Sepolia",
    desc: "The encrypted decision is packaged into a tx payload for GhostTradePrivate.sol. In a live Fhenix deployment, the trade would execute on ciphertext — minimizing signal leakage to validators. This is the Wave 2 prototype integration point.",
    code: `prepareDecryptForTx(enc_signal, walletAddress)\n// → { ciphertextRef, permitHash, readyForChain: true }`,
  },
];

const ZK_VS_FHE = [
  { aspect: "Primary Goal",         zk: "Prove computation correctness",   fhe: "Perform computation on hidden data" },
  { aspect: "Data Exposure",        zk: "Input may be revealed post-proof", fhe: "Input stays encrypted throughout" },
  { aspect: "On-Chain Execution",   zk: "Verifies a known result",         fhe: "Executes on encrypted state" },
  { aspect: "MEV Protection",       zk: "Partial (proof public)",          fhe: "Conceptual (signal hidden)" },
  { aspect: "GhostTrade Usage",     zk: "Not used",                        fhe: "Core privacy layer" },
];

const FAQS = [
  {
    q: "Why can't validators see the signal?",
    a: "In a Fhenix deployment, the signal stays encrypted in contract storage. Only the permit-holder can decrypt it via decryptForView. In this prototype, the concept is simulated server-side to demonstrate the intended privacy architecture.",
  },
  {
    q: "What is TFHE?",
    a: "Torus Fully Homomorphic Encryption — a scheme that allows arbitrary computation (additions, comparisons, logic gates) on ciphertexts without decrypting them. Fhenix brings TFHE to the EVM, enabling smart contracts to operate on encrypted state.",
  },
  {
    q: "How is this different from ZK proofs?",
    a: "ZK proves that a computation happened correctly (verifiability) — the output may still be public. FHE performs computation on hidden data (confidentiality) — the signal stays encrypted during execution. Ghost Trade is inspired by FHE for this reason, and this prototype simulates that privacy model.",
  },
  {
    q: "What is the FHE mode badge?",
    a: "When no wallet is connected, the app runs in Demo Mode — FHE-inspired logic runs in TypeScript on the server. When MetaMask is connected to Fhenix or Arbitrum Sepolia, the badge switches to Privacy Sim mode, indicating the prototype pipeline is active and ready for a real on-chain Fhenix integration.",
  },
  {
    q: "What is the SoDEX Wave 2 payload?",
    a: "prepareDecryptForTx generates an encrypted transaction payload with a ciphertextRef and permitHash. This is the Wave 2 prototype integration point — in a production build, the payload would be submitted to GhostTradePrivate.sol on Arbitrum Sepolia for on-chain encrypted execution via Fhenix.",
  },
];

const CONTRACT_FUNCTIONS = [
  { name: "submitEncryptedSignal", desc: "Submit FHE-computed signal on-chain (encrypted)", color: "#10b981" },
  { name: "requestPermit",         desc: "Issue a viewing permit (Fhenix ACL-ready)", color: "#3b82f6" },
  { name: "decryptForView",        desc: "Reveal signal to permit-holder for UI display", color: "#a855f7" },
  { name: "decryptForTx",          desc: "Prepare encrypted payload for SoDEX execution", color: "#f59e0b" },
  { name: "publishDecryptResult",  desc: "Broadcast final result for audit / settlement", color: "#ef4444" },
];

function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-xs font-mono text-foreground/70">{q}</span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2.5 text-[11.5px] leading-relaxed text-muted-foreground/60 border-t border-white/5">
          {a}
        </div>
      )}
    </div>
  );
}

export default function JudgesPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-background text-foreground">

        {/* Ambient */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/4 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-blue-500/3 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="border-b border-white/6 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <Link href="/"
            className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40 hover:text-primary/70 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <div className="border-l border-white/8 pl-4 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white/85">Technical Documentation</div>
              <div className="text-[8px] font-mono text-muted-foreground/40">For Judges · Developers · Reviewers</div>
            </div>
          </div>
          <Badge variant="outline" className="ml-auto font-mono text-[9px] border-purple-500/25 bg-purple-500/8 text-purple-400">
            Judges & Developers
          </Badge>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 relative">

          {/* Intro */}
          <div>
            <div className="text-[9px] font-mono text-primary/50 uppercase tracking-widest mb-3">Overview</div>
            <h1 className="text-3xl font-mono font-black text-white/90 mb-4">GhostTrade Private — FHE Architecture</h1>
            <div className="rounded-2xl border border-primary/15 bg-primary/4 p-6 flex gap-4">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-mono leading-relaxed text-foreground/70">
                <span className="text-white font-bold">GhostTrade Private</span> uses{" "}
                <span className="text-primary font-bold">Fully Homomorphic Encryption (FHE)</span> to generate
                and execute trading signals without ever exposing the underlying market analysis or decision to any
                on-chain observer — including validators and sequencers. The FHE pipeline runs server-side in
                simulation mode and is designed for on-chain Fhenix deployment in Wave 2.
              </p>
            </div>
          </div>

          {/* FHE Pipeline */}
          <div>
            <div className="text-[9px] font-mono text-primary/50 uppercase tracking-widest mb-2">FHE Pipeline</div>
            <h2 className="text-xl font-mono font-black text-white/80 mb-6">4-Step Encrypted Computation</h2>
            <div className="space-y-3">
              {FHE_PIPELINE.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Card key={i} className="border-white/8 bg-white/2 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-0">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${step.bg}`}>
                            <Icon className={`w-4.5 h-4.5 ${step.color}`} />
                          </div>
                          {i < FHE_PIPELINE.length - 1 && (
                            <div className="w-px flex-1 bg-gradient-to-b from-white/15 to-transparent mt-2 min-h-[24px]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <span className={`text-sm font-mono font-black ${step.color}`}>{step.title}</span>
                            <span className="text-[9px] font-mono text-muted-foreground/35 border border-white/8 rounded px-2 py-0.5">{step.subtitle}</span>
                          </div>
                          <p className="text-[12px] leading-relaxed text-muted-foreground/60 mb-3">{step.desc}</p>
                          <div className="bg-black/60 border border-white/6 rounded-lg p-3">
                            <pre className="font-mono text-[10px] text-green-400/55 leading-relaxed whitespace-pre-wrap">{step.code}</pre>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* ZK vs FHE */}
          <div>
            <div className="text-[9px] font-mono text-blue-400/60 uppercase tracking-widest mb-2">Comparison</div>
            <h2 className="text-xl font-mono font-black text-white/80 mb-6">ZK Proofs vs Fully Homomorphic Encryption</h2>
            <Card className="border-white/8 bg-white/2 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-4 py-3 text-[9px] text-muted-foreground/40 tracking-widest uppercase">Aspect</th>
                      <th className="text-left px-4 py-3 text-[9px] text-blue-400/60 tracking-widest uppercase">ZK Proofs</th>
                      <th className="text-left px-4 py-3 text-[9px] text-primary/60 tracking-widest uppercase">FHE (GhostTrade)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ZK_VS_FHE.map((row, i) => (
                      <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/1" : ""}`}>
                        <td className="px-4 py-3 text-muted-foreground/50 font-bold text-[10px]">{row.aspect}</td>
                        <td className="px-4 py-3 text-blue-300/50 text-[11px]">{row.zk}</td>
                        <td className="px-4 py-3 text-primary/70 text-[11px] font-semibold">{row.fhe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Smart Contract */}
          <div>
            <div className="text-[9px] font-mono text-yellow-400/60 uppercase tracking-widest mb-2">Smart Contract</div>
            <h2 className="text-xl font-mono font-black text-white/80 mb-2">GhostTradePrivate.sol</h2>
            <p className="text-[12px] font-mono text-muted-foreground/45 mb-6 leading-relaxed">
              Solidity 0.8.19 · Deployment target: Arbitrum Sepolia · Fhenix ACL-compatible
            </p>
            <Card className="border-yellow-500/12 bg-yellow-500/3">
              <CardContent className="p-5 space-y-3">
                {CONTRACT_FUNCTIONS.map(fn => (
                  <div key={fn.name} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: fn.color }} />
                    <div>
                      <span className="text-xs font-mono font-bold text-white/75">{fn.name}</span>
                      <span className="ml-2 text-[10px] font-mono text-muted-foreground/40">{fn.desc}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-white/6 font-mono text-[9px] text-muted-foreground/30">
                  Deploy: <span className="text-green-400/50">forge create --rpc-url https://sepolia-rollup.arbitrum.io/rpc --private-key $PRIVATE_KEY contracts/GhostTradePrivate.sol:GhostTradePrivate</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Architecture summary */}
          <div>
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-2">Architecture</div>
            <h2 className="text-xl font-mono font-black text-white/80 mb-6">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Code2, color: "#10b981", title: "Frontend",
                  items: ["React 19 + Vite", "TanStack Query", "MetaMask wallet", "SSE streaming AI"],
                },
                {
                  icon: Database, color: "#3b82f6", title: "API Server",
                  items: ["Express 5 + Node 24", "CoinGecko (30s cache)", "FHE simulation (fhe.ts)", "Cloudflare Workers AI"],
                },
                {
                  icon: GitBranch, color: "#a855f7", title: "On-Chain (Wave 2)",
                  items: ["GhostTradePrivate.sol", "Arbitrum Sepolia", "Fhenix ACL permits", "SoDEX execution"],
                },
              ].map(col => {
                const Icon = col.icon;
                return (
                  <Card key={col.title} className="border-white/8 bg-white/2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: `${col.color}12`, border: `1px solid ${col.color}25` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: col.color }} />
                        </div>
                        <span className="text-xs font-mono font-bold text-white/75">{col.title}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {col.items.map(item => (
                          <li key={item} className="text-[10px] font-mono text-muted-foreground/45 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-white/15 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-2">FAQ</div>
            <h2 className="text-xl font-mono font-black text-white/80 mb-6">Technical Questions</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <Accordion key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>

          {/* External links */}
          <div>
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-4">Resources</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Fhenix Docs",        href: "https://docs.fhenix.zone" },
                { label: "TFHE Overview",      href: "https://fhe.org/resources/tfhe" },
                { label: "Arbitrum Sepolia",   href: "https://sepolia.arbiscan.io" },
                { label: "SoSoValue",          href: "https://sosovalue.com" },
                { label: "Cloudflare AI",      href: "https://developers.cloudflare.com/workers-ai" },
                { label: "CoinGecko API",      href: "https://docs.coingecko.com" },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/45 hover:text-primary transition-colors border border-white/8 hover:border-primary/20 rounded-lg px-3 py-2">
                  {label} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Back to app */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <Link href="/terminal"
              className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/35 hover:text-primary/60 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Terminal
            </Link>
            <div className="text-[8px] font-mono text-muted-foreground/20">
              Ghost Trade Private · FHE Technical Reference
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
