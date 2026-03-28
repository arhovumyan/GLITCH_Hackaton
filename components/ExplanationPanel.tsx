"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ExplanationPanelProps {
  text: string;
  isStreaming: boolean;
  experienceLevel: "junior" | "mid" | "senior";
  filePath: string | null;
}

export default function ExplanationPanel({
  text,
  isStreaming,
  experienceLevel,
  filePath,
}: ExplanationPanelProps) {
  if (!filePath && !text) {
    return (
      <div className="h-full flex items-center justify-center text-black/60 text-sm bg-[#f4f4f4]">
        Select a file to view its explanation
      </div>
    );
  }

  if (!text && isStreaming) {
    return (
      <div className="p-4 space-y-3 bg-[#f4f4f4]">
        <div className="h-4 w-48 bg-[#c8c8c8] rounded skeleton-pulse" />
        <div className="h-3 w-full bg-[#c8c8c8] rounded skeleton-pulse" />
        <div className="h-3 w-5/6 bg-[#c8c8c8] rounded skeleton-pulse" />
        <div className="h-3 w-4/6 bg-[#c8c8c8] rounded skeleton-pulse" />
        <div className="h-3 w-full bg-[#c8c8c8] rounded skeleton-pulse" />
        <div className="h-3 w-3/6 bg-[#c8c8c8] rounded skeleton-pulse" />
      </div>
    );
  }

  const levelConfig = {
    junior: {
      badge: "JUNIOR",
      badgeClass: "bg-[#ffe100] text-black",
      stripeClass: "bg-[#ffe100]",
    },
    mid: {
      badge: "MID",
      badgeClass: "bg-[#5de5ff] text-black",
      stripeClass: "bg-[#5de5ff]",
    },
    senior: {
      badge: "SENIOR",
      badgeClass: "bg-[#ff5ea9] text-white",
      stripeClass: "bg-[#ff5ea9]",
    },
  };

  const config = levelConfig[experienceLevel];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#f4f4f4]">
      <div className="px-3 py-2 border-b border-black flex items-center gap-2 shrink-0 bg-[#000080] text-white">
        <span className="text-[11px] font-bold uppercase tracking-widest">Explanation</span>
        <span className={`text-[10px] px-1.5 py-0.5 font-bold ${config.badgeClass}`}>
          {config.badge}
        </span>
        {filePath && (
          <span className="text-[11px] text-white/85 font-mono ml-auto truncate max-w-[220px]">
            {filePath}
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="retro-panel-inset p-3 bg-white relative overflow-hidden">
          <div className={`absolute left-0 top-0 bottom-0 w-2 ${config.stripeClass}`} />
          <div className="pl-3 prose-glitch text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            {isStreaming && <span className="cursor-blink" />}
          </div>
        </div>
      </div>
    </div>
  );
}
