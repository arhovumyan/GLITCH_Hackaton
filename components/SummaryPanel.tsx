"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryPanelProps {
  summary: string;
  streaming: boolean;
}

const COLORWAYS = [
  "bg-[#fff6a9]",
  "bg-[#d8f2ff]",
  "bg-[#ffd7ec]",
  "bg-[#d8ffd8]",
];

export default function SummaryPanel({ summary, streaming }: SummaryPanelProps) {
  const sections = useMemo(() => {
    if (!summary) return [];

    const parts = summary.split(/\n?###\s+/);
    return parts
      .filter((part) => part.trim().length > 0)
      .map((part) => {
        const lines = part.trim().split("\n");
        return {
          title: lines[0].trim(),
          content: lines.slice(1).join("\n").trim(),
        };
      });
  }, [summary]);

  if (!summary && !streaming) return null;

  return (
    <div className="space-y-3">
      {streaming && (
        <div className="retro-panel-inset p-2 text-xs font-bold uppercase tracking-wide">
          Receiving summary stream <span className="blink">_</span>
        </div>
      )}

      {sections.length === 0 && summary && (
        <div className="retro-panel-inset p-3">
          <div className="prose-glitch text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((section, idx) => (
            <article
              key={`${section.title}-${idx}`}
              className={`retro-poster ${COLORWAYS[idx % COLORWAYS.length]} min-h-[180px]`}
            >
              <h3 className="font-bold text-xs uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="prose-glitch text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content || "(No content yet)"}
                </ReactMarkdown>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
