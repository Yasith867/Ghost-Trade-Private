/**
 * Shared GhostAI markdown renderer
 * Used by: GhostAIChat, TokenDetailDrawer, and any future AI surface.
 */
import React from "react";

// ── SSI index name auto-highlighter ────────────────────────────────────────────
const SSI_PATTERNS: Array<{ pattern: RegExp; color: string; bg: string; border: string }> = [
  { pattern: /\bssiMAG7\b/g,    color: "#3b82f6", bg: "rgba(59,130,246,0.12)",   border: "rgba(59,130,246,0.25)"  },
  { pattern: /\bssiAI\b/g,      color: "#a855f7", bg: "rgba(168,85,247,0.12)",   border: "rgba(168,85,247,0.25)"  },
  { pattern: /\bssiDeFi\b/g,    color: "#10b981", bg: "rgba(16,185,129,0.12)",   border: "rgba(16,185,129,0.25)"  },
  { pattern: /\bssiLayer1\b/g,  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   border: "rgba(245,158,11,0.25)"  },
  { pattern: /\bssiL1\b/g,      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   border: "rgba(245,158,11,0.25)"  },
  { pattern: /\bssiMeme\b/g,    color: "#ef4444", bg: "rgba(239,68,68,0.12)",    border: "rgba(239,68,68,0.25)"   },
  { pattern: /\bssiRWA\b/g,     color: "#06b6d4", bg: "rgba(6,182,212,0.12)",    border: "rgba(6,182,212,0.25)"   },
  { pattern: /\bssiNFT\b/g,     color: "#ec4899", bg: "rgba(236,72,153,0.12)",   border: "rgba(236,72,153,0.25)"  },
  { pattern: /\bssiGameFi\b/g,  color: "#84cc16", bg: "rgba(132,204,22,0.12)",   border: "rgba(132,204,22,0.25)"  },
  { pattern: /\bssiSocialFi\b/g,color: "#fb923c", bg: "rgba(251,146,60,0.12)",   border: "rgba(251,146,60,0.25)"  },
  { pattern: /\bSoDEX\b/g,      color: "#10b981", bg: "rgba(16,185,129,0.08)",   border: "rgba(16,185,129,0.18)"  },
  { pattern: /\bTokenBar\b/g,   color: "#3b82f6", bg: "rgba(59,130,246,0.08)",   border: "rgba(59,130,246,0.18)"  },
  { pattern: /\bSOSO\b/g,       color: "#3b82f6", bg: "rgba(59,130,246,0.10)",   border: "rgba(59,130,246,0.22)"  },
];

function highlightSSI(text: string): React.ReactNode {
  // Build a single combined regex from all SSI patterns to find all matches
  const combined = SSI_PATTERNS.map(p => p.pattern.source).join("|");
  const globalRe = new RegExp(`(${combined})`, "g");

  const parts = text.split(globalRe);
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) => {
        const match = SSI_PATTERNS.find(p => {
          const re = new RegExp(`^${p.pattern.source}$`);
          return re.test(part);
        });
        if (match) {
          return (
            <span
              key={i}
              className="inline-block font-mono font-bold text-[9.5px] px-1 py-0.5 rounded mx-0.5 align-baseline"
              style={{ color: match.color, background: match.bg, border: `1px solid ${match.border}` }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}

// ── Output cleaner ─────────────────────────────────────────────────────────────
export function cleanAIResponse(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^[ \t]+/gm, "")
    .replace(/^[-=_]{3,}$/gm, "")
    .replace(/^#{1,6}\s*$/gm, "")
    .replace(/\*{3,}/g, "**")
    .replace(/^(\s*[-*])\s{2,}/gm, "$1 ")
    .trim();
}

// ── Streaming cursor ───────────────────────────────────────────────────────────
export function StreamingCursor() {
  return (
    <span
      className="inline-block w-[2px] h-[11px] bg-primary/80 ml-0.5 align-middle rounded-sm"
      style={{ animation: "ghostCursorBlink 0.65s step-start infinite" }}
    />
  );
}

// ── Inline markdown: **bold**, *italic*, `code` — with SSI highlighting ───────
export function renderInline(text: string, key?: number): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
  if (parts.length === 1) {
    // No markdown tokens — still apply SSI highlighting
    return <React.Fragment key={key}>{highlightSSI(text)}</React.Fragment>;
  }
  return (
    <span key={key}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i} className="font-bold text-white/95">{highlightSSI(part.slice(2, -2))}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
          return <em key={i} className="italic text-foreground/80">{highlightSSI(part.slice(1, -1))}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={i} className="font-mono text-[9.5px] bg-white/8 border border-white/10 px-1 py-0.5 rounded text-primary/80 mx-0.5 break-all">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={i}>{highlightSSI(part)}</React.Fragment>;
      })}
    </span>
  );
}

// ── Block markdown renderer ────────────────────────────────────────────────────
export function renderMarkdown(
  text: string,
  opts: { streaming?: boolean; compact?: boolean } = {}
): React.ReactNode {
  const { streaming = false, compact = false } = opts;
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletItems: string[] = [];
  let numberedItems: string[] = [];
  let k = 0;

  const flushBullets = () => {
    if (!bulletItems.length) return;
    blocks.push(
      <ul key={k++} className={`${compact ? "my-1.5 space-y-1" : "my-2.5 space-y-1.5"}`}>
        {bulletItems.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 ${compact ? "text-[10.5px]" : "text-[11px]"} leading-[1.6]`}>
            <span className="w-1 h-1 rounded-full bg-primary/55 shrink-0 mt-[6px]" />
            <span className="text-foreground/80 min-w-0 break-words">{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  const flushNumbered = () => {
    if (!numberedItems.length) return;
    blocks.push(
      <ol key={k++} className={`${compact ? "my-1.5 space-y-1.5" : "my-2.5 space-y-2"}`}>
        {numberedItems.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 ${compact ? "text-[10.5px]" : "text-[11px]"} leading-[1.6]`}>
            <span className="text-primary/60 font-mono font-bold text-[9px] shrink-0 mt-0.5 w-3.5 text-right">{i + 1}.</span>
            <span className="text-foreground/80 min-w-0 break-words">{renderInline(item)}</span>
          </li>
        ))}
      </ol>
    );
    numberedItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // H1/H2 — render as section divider label
    if (/^#{1,2}\s+/.test(line)) {
      flushBullets(); flushNumbered();
      const label = line.replace(/^#{1,2}\s+/, "");
      blocks.push(
        <div key={k++} className={`flex items-center gap-2 ${compact ? "mt-2 mb-0.5" : "mt-3.5 mb-1.5"} first:mt-0`}>
          <div className="h-px flex-1 bg-white/6" />
          <span className="text-[8px] font-mono font-black text-primary/55 uppercase tracking-widest px-1">
            {highlightSSI(label)}
          </span>
          <div className="h-px flex-1 bg-white/6" />
        </div>
      );
      continue;
    }

    // H3 — compact sub-label
    if (/^###\s+/.test(line)) {
      flushBullets(); flushNumbered();
      blocks.push(
        <div key={k++} className={`text-[8.5px] font-mono font-bold text-foreground/45 uppercase tracking-wider ${compact ? "mt-1.5 mb-0.5" : "mt-2.5 mb-0.5"}`}>
          {highlightSSI(line.replace(/^###\s+/, ""))}
        </div>
      );
      continue;
    }

    // Bullet
    if (/^[-*•]\s+/.test(line)) {
      flushNumbered();
      bulletItems.push(line.replace(/^[-*•]\s+/, ""));
      continue;
    }

    // Numbered
    if (/^\d+[.)]\s+/.test(line)) {
      flushBullets();
      numberedItems.push(line.replace(/^\d+[.)]\s+/, ""));
      continue;
    }

    flushBullets(); flushNumbered();

    // Empty line — add spacing but don't over-pad
    if (!line) {
      if (blocks.length > 0) {
        blocks.push(<div key={k++} className={compact ? "h-1.5" : "h-2"} />);
      }
      continue;
    }

    // Normal paragraph
    blocks.push(
      <p key={k++} className={`${compact ? "text-[10.5px]" : "text-[11px]"} leading-[1.68] text-foreground/82 break-words`}>
        {renderInline(line)}
      </p>
    );
  }

  flushBullets();
  flushNumbered();

  // Append streaming cursor to last block
  if (streaming && blocks.length > 0) {
    const last = blocks[blocks.length - 1] as React.ReactElement<any>;
    if (React.isValidElement(last)) {
      blocks[blocks.length - 1] = React.cloneElement(
        last,
        {},
        ...React.Children.toArray((last.props as { children?: React.ReactNode }).children),
        <StreamingCursor key="cur" />
      );
    } else {
      blocks.push(<StreamingCursor key="cur" />);
    }
  } else if (streaming) {
    blocks.push(<StreamingCursor key="cur" />);
  }

  return <>{blocks}</>;
}
