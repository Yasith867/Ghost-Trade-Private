import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Cpu, Eye, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { FheStep } from "@workspace/api-client-react";

interface FhePanelProps {
  steps: FheStep[];
  encryptedInputs: string;
  decryptedOutput: string;
}

const STEP_META = [
  { icon: Lock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]", label: "Encrypt Inputs", emoji: "🔒" },
  { icon: Lock, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]", label: "Encrypt Thresholds", emoji: "🔐" },
  { icon: Cpu, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", glow: "shadow-[0_0_12px_rgba(249,115,22,0.3)]", label: "Encrypted Logic", emoji: "⚙️" },
  { icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]", label: "Decrypt For View", emoji: "🔓" },
  { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", glow: "shadow-[0_0_12px_rgba(234,179,8,0.3)]", label: "Prepare TX", emoji: "⚡" },
];

function CiphertextPreview({ text, active }: { text: string; active: boolean }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!active) { setShown(text.length); return; }
    setShown(0);
    let i = 0;
    const iv = setInterval(() => {
      i += 3;
      setShown(Math.min(i, text.length));
      if (i >= text.length) clearInterval(iv);
    }, 12);
    return () => clearInterval(iv);
  }, [text, active]);

  return (
    <div className="bg-black/60 border border-white/6 rounded-lg p-3 font-mono text-[10px] leading-relaxed overflow-hidden">
      <span className="text-green-400/50">{text.substring(0, shown)}</span>
      {active && shown < text.length && (
        <span className="inline-block w-1.5 h-3 bg-green-400/70 ml-px animate-pulse align-middle" />
      )}
    </div>
  );
}

export default function FhePanel({ steps, encryptedInputs, decryptedOutput }: FhePanelProps) {
  const [activeStep, setActiveStep] = useState(-1);
  const [showReveal, setShowReveal] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);

  useEffect(() => {
    setActiveStep(-1);
    setShowReveal(false);
    setRevealedChars(0);

    let current = 0;
    const iv = setInterval(() => {
      if (current < steps.length) {
        setActiveStep(current);
        current++;
      } else {
        clearInterval(iv);
        setTimeout(() => {
          setShowReveal(true);
          let i = 0;
          const rv = setInterval(() => {
            i += 2;
            setRevealedChars(Math.min(i, decryptedOutput.length));
            if (i >= decryptedOutput.length) clearInterval(rv);
          }, 40);
        }, 600);
      }
    }, 1400);

    return () => clearInterval(iv);
  }, [steps, decryptedOutput]);

  return (
    <Card className="border-primary/15 bg-black/60 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <CardHeader className="pb-3 border-b border-white/5 bg-black/20">
        <CardTitle className="text-xs font-mono text-primary/80 flex items-center gap-2 tracking-widest uppercase">
          <div className="w-5 h-5 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-primary" />
          </div>
          Privacy Analysis Trace
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Encrypted inputs */}
        <div className="p-4 bg-black/40 border-b border-white/5">
          <div className="text-[10px] font-mono text-muted-foreground/50 mb-2 tracking-wider">CIPHERTEXT INPUT</div>
          <div className="font-mono text-[10px] text-green-400/40 break-all leading-relaxed bg-black/40 rounded-lg p-3 border border-white/5">
            {encryptedInputs}
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="p-5">
          <div className="flex items-start gap-0 relative">
            {/* Connecting line behind icons */}
            <div className="absolute top-5 left-[18px] w-px h-[calc(100%-56px)] bg-gradient-to-b from-primary/30 to-transparent" />

            <div className="flex flex-col gap-0 w-full">
              {steps.map((step, index) => {
                const meta = STEP_META[index] ?? STEP_META[STEP_META.length - 1];
                const Icon = meta.icon;
                const isActive = index === activeStep;
                const isPast = index < activeStep || showReveal;
                const isFuture = !isActive && !isPast;

                return (
                  <div
                    key={index}
                    className={`flex gap-4 transition-all duration-500 pb-5 ${isFuture ? "opacity-25" : "opacity-100"}`}
                  >
                    {/* Step icon + connector */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-500 ${
                          isActive
                            ? `${meta.bg} ${meta.glow} border-current ${meta.color}`
                            : isPast
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "bg-white/3 border-white/8 text-muted-foreground/30"
                        }`}
                      >
                        {isActive ? (
                          <Loader2 className={`w-4 h-4 animate-spin ${meta.color}`} />
                        ) : isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pt-1.5 pb-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-mono font-bold ${isActive ? meta.color : isPast ? "text-emerald-400" : "text-muted-foreground/40"}`}>
                          {meta.emoji} {step.step}
                        </span>
                        {isActive && (
                          <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 border-current ${meta.color} ${meta.bg}`}>
                            PROCESSING
                          </Badge>
                        )}
                        {isPast && !isActive && (
                          <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-emerald-500/30 bg-emerald-500/8 text-emerald-400">
                            DONE
                          </Badge>
                        )}
                      </div>

                      <p className={`text-xs leading-relaxed mb-2 ${isActive || isPast ? "text-foreground/70" : "text-muted-foreground/30"}`}>
                        {step.description}
                      </p>

                      {step.ciphertextPreview && (isActive || isPast) && (
                        <CiphertextPreview text={step.ciphertextPreview} active={isActive} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decrypted output reveal */}
          {showReveal && (
            <div
              className="mt-2 p-4 rounded-xl bg-primary/8 border border-primary/25 shadow-[0_0_24px_rgba(16,185,129,0.1)]"
              style={{ animation: "fadeScaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}
            >
              <style>{`
                @keyframes fadeScaleIn {
                  from { opacity: 0; transform: scale(0.97) translateY(6px); }
                  to { opacity: 1; transform: scale(1) translateY(0); }
                }
              `}</style>
              <div className="text-[10px] font-mono text-primary/60 mb-2 flex items-center gap-2 tracking-wider">
                <Unlock className="w-3 h-3" /> DECRYPTED OUTPUT
              </div>
              <div className="font-mono text-sm font-bold tracking-widest text-white">
                {decryptedOutput.substring(0, revealedChars)}
                {revealedChars < decryptedOutput.length && (
                  <span className="inline-block w-1.5 h-4 bg-primary ml-px animate-pulse align-middle" />
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
