"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Issue {
  id: number;
  number: number;
  title: string;
  url: string;
  difficulty: "easy" | "medium" | "hard";
  labels: string[];
  explanation: string;
}

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  easy: { bg: "bg-[#d4ffbf]", text: "text-[#0a4900]", label: "Easy" },
  medium: { bg: "bg-[#fff2ab]", text: "text-[#5b3b00]", label: "Medium" },
  hard: { bg: "bg-[#ffc9c9]", text: "text-[#650000]", label: "Hard" },
};

export default function IssuesPanel({
  repoUrl,
  experienceLevel,
}: {
  repoUrl: string;
  experienceLevel: "junior" | "mid" | "senior";
}) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!repoUrl) return;

    let cancelled = false;
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ repoUrl, experienceLevel });
        const res = await fetch(`/api/issues?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setIssues(data.issues ?? []);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadIssues();

    return () => {
      cancelled = true;
    };
  }, [repoUrl, experienceLevel]);

  return (
    <div>
      <div className="px-4 py-2 flex items-center gap-2 border-b border-black bg-[#000080] text-white">
        <span className="text-[11px] font-bold uppercase tracking-widest">Open Issues</span>
        {!loading && issues.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 border border-white/50 bg-black/20">
            {issues.length}
          </span>
        )}
      </div>

      {loading && (
        <div className="p-4 space-y-3 bg-[#ececec]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#cacaca] rounded skeleton-pulse" />
          ))}
        </div>
      )}

      {error && <div className="p-4 text-sm text-[#8a0000] bg-[#ffe0e0]">Failed to load issues: {error}</div>}

      {!loading && !error && issues.length === 0 && (
        <div className="p-4 text-sm text-black/60 bg-[#ececec]">No open issues found.</div>
      )}

      {!loading && !error && issues.length > 0 && (
        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar bg-[#ececec]">
          {issues.map((issue) => {
            const style = DIFFICULTY_STYLES[issue.difficulty];
            const isExpanded = expandedId === issue.id;

            return (
              <div
                key={issue.id}
                className="border-2 border-t-white border-l-white border-r-[#4a4a4a] border-b-[#4a4a4a] bg-[#f8f8f8] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                  className="w-full px-3 py-2 flex items-start gap-3 text-left hover:bg-[#fff6b3] transition-colors"
                >
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 font-bold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-black leading-tight font-bold">
                      #{issue.number} {issue.title}
                    </div>
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {issue.labels.map((label) => (
                          <span
                            key={label}
                            className="text-[10px] px-1.5 py-0.5 border border-[#7a7a7a] bg-[#e7e7e7] text-black"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-xs text-[#0000ee] underline"
                  >
                    View
                  </a>
                </button>

                {isExpanded && issue.explanation && (
                  <div className="px-3 pb-3 border-t border-black/20 bg-white">
                    <div className="mt-2 prose-glitch text-[13px] leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {issue.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
