import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Cpu,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Lock,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Encrypt Inputs",
    desc: "Market price, volume, and sentiment are passed through an FHE-inspired encryption simulation. This prototype models the intended flow of a real Fhenix/TFHE deployment.",
    tech: "TFHE · fhenix.js",
  },
  {
    icon: Cpu,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "Compute on Ciphertext",
    desc: "Decision logic — price vs MA, volume vs threshold, sentiment vs baseline — runs on simulated encrypted inputs, modeling what TFHE homomorphic gates would compute in a live on-chain deployment.",
    tech: "FHE-inspired logic · simulated ciphertext",
  },
  {
    icon: Eye,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Decrypt For View",
    desc: "The result ciphertext is decrypted using a permit you hold. The signal (BUY/SELL/HOLD) and confidence score are revealed only to your wallet's viewing key.",
    tech: "permit · EIP-712 · decryptForView",
  },
  {
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    title: "Execute On-Chain",
    desc: "In a live Fhenix deployment, the encrypted decision is submitted to GhostTradePrivate.sol on Arbitrum Sepolia. The trade executes on ciphertext, conceptually minimizing MEV and front-running. This is the Wave 2 integration target.",
    tech: "Arbitrum Sepolia · SoDEX Wave 2",
  },
];

const FAQS = [
  {
    q: "Why can't miners see the signal?",
    a: "In a Fhenix deployment, the signal stays encrypted in contract storage — only the permit-holder can decrypt it via decryptForView. This prototype simulates that architecture to demonstrate the intended privacy model.",
  },
  {
    q: "What is TFHE?",
    a: "Torus Fully Homomorphic Encryption — a scheme that allows arbitrary computation on ciphertexts. Fhenix brings TFHE to the EVM, enabling smart contracts to operate on encrypted data.",
  },
  {
    q: "How is this different from ZK?",
    a: "ZK proofs verify computation happened correctly (verifiability). FHE performs computation on hidden data (confidentiality). Ghost Trade is inspired by FHE so the signal stays conceptually private — this prototype simulates that privacy model.",
  },
];

export default function FheExplainer() {
  const [open, setOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <Card className="border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden">
      <button
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/2 transition-colors group"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest group-hover:text-muted-foreground/80 transition-colors">
            How FHE Works
          </span>
          <Badge variant="outline" className="text-[9px] font-mono border-primary/20 bg-primary/5 text-primary/70">
            For Judges
          </Badge>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        )}
      </button>

      {open && (
        <div style={{ animation: "slideDown 0.3s cubic-bezier(0.16,1,0.3,1) both" }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
            {/* Intro */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-foreground/70">
                  <strong className="text-foreground">GhostTrade Private</strong> uses{" "}
                  <strong className="text-primary">FHE-inspired privacy workflows</strong> to generate
                  and simulate encrypted trading signals — modeling what a real Fhenix deployment
                  would look like for private on-chain execution, without fake infrastructure claims.
                </p>
              </div>
            </div>

            {/* Pipeline steps */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-muted-foreground/40 tracking-wider mb-3">FHE PIPELINE</div>
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${step.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="w-px flex-1 bg-gradient-to-b from-white/10 to-transparent mt-1 mb-1 min-h-[16px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono font-bold ${step.color}`}>
                          {String(i + 1).padStart(2, "0")} {step.title}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground/35 border border-white/8 rounded px-1.5 py-0.5">
                          {step.tech}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground/55">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FAQ */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-mono text-muted-foreground/40 tracking-wider mb-3">FAQ</div>
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-xs font-mono text-foreground/70">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-3 text-[11px] leading-relaxed text-muted-foreground/55 border-t border-white/5 pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Links */}
            <div className="flex gap-2 pt-1">
              {[
                { label: "Fhenix Docs", href: "https://docs.fhenix.zone" },
                { label: "TFHE Overview", href: "https://fhe.org/resources/tfhe" },
                { label: "Arbitrum Sepolia", href: "https://sepolia.arbiscan.io" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors border border-white/8 hover:border-primary/20 rounded-lg px-2.5 py-1.5"
                >
                  {label} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
