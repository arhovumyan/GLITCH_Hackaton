"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface CallGraphEntry {
  imports: string[];
  exports: string[];
  functions: Record<string, { calls: string[] }>;
}

function sanitizeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, "_");
}

function sanitizeLabel(s: string): string {
  return s.replace(/["\[\](){}<>#]/g, "");
}

function buildMermaidDiagram(
  entry: CallGraphEntry,
  filePath: string
): string {
  const lines: string[] = ["flowchart LR"];
  const fileName = filePath.split("/").pop() ?? filePath;
  const fileId = sanitizeId(fileName);

  lines.push(`  ${fileId}["${sanitizeLabel(fileName)}"]`);
  lines.push(`  style ${fileId} fill:#3b82f6,color:#fff,stroke:#1d4ed8`);

  entry.imports.forEach((imp) => {
    const impId = sanitizeId(imp);
    const label = sanitizeLabel(imp.split("/").pop() ?? imp);
    lines.push(`  ${impId}["${label}"] --> ${fileId}`);
    lines.push(`  style ${impId} fill:#27272a,color:#a1a1aa,stroke:#3f3f46`);
  });

  Object.entries(entry.functions).forEach(([fnName, { calls }]) => {
    const fnId = sanitizeId(fnName);
    lines.push(`  ${fileId} --> ${fnId}("${sanitizeLabel(fnName)}()")`);
    lines.push(`  style ${fnId} fill:#1e1e2e,color:#c084fc,stroke:#7c3aed`);

    calls.forEach((call) => {
      const callId = sanitizeId(call) + "_call";
      lines.push(`  ${fnId} --> ${callId}["${sanitizeLabel(call)}()"]`);
      lines.push(
        `  style ${callId} fill:#1e1e2e,color:#fbbf24,stroke:#a16207`
      );
    });
  });

  return lines.join("\n");
}

export default function CallGraph({
  entry,
  filePath,
}: {
  entry: CallGraphEntry | null;
  filePath: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [fullscreen, setFullscreen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // Render diagram
  useEffect(() => {
    if (!entry || !filePath || !containerRef.current) return;

    const isEmpty =
      entry.imports.length === 0 &&
      entry.exports.length === 0 &&
      Object.keys(entry.functions).length === 0;

    if (isEmpty) {
      setError("No call graph available for this file");
      setSvgContent("");
      return;
    }

    setError(null);
    const diagram = buildMermaidDiagram(entry, filePath);

    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            darkMode: true,
            background: "#09090b",
            primaryColor: "#3b82f6",
            primaryTextColor: "#fafafa",
            lineColor: "#3f3f46",
          },
        });

        if (cancelled) return;

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, diagram);
        if (!cancelled) {
          setSvgContent(svg);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        }
      } catch (err) {
        console.error("[CallGraph] Mermaid render error:", err);
        if (!cancelled) {
          setError("Failed to render call graph");
          setSvgContent("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entry, filePath]);

  // Sync fullscreen container
  useEffect(() => {
    if (fullscreen && fullscreenRef.current && svgContent) {
      fullscreenRef.current.innerHTML = svgContent;
    }
  }, [fullscreen, svgContent]);

  const openFullscreen = useCallback(() => {
    if (svgContent) setFullscreen(true);
  }, [svgContent]);

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
        Select a file to view its call graph
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-sm px-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-auto">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 flex items-center justify-between">
          <span>Call Graph</span>
          {svgContent && (
            <button
              onClick={openFullscreen}
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
              title="View fullscreen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          )}
        </div>
        <div
          ref={containerRef}
          className="p-4 cursor-pointer"
          onClick={openFullscreen}
          title="Click to expand"
        />
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-zinc-950/95 flex flex-col"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 shrink-0">
            <span className="text-sm font-semibold text-zinc-300">
              Call Graph — {filePath}
            </span>
            <button
              onClick={() => setFullscreen(false)}
              className="text-zinc-400 hover:text-white text-xl leading-none transition-colors px-2"
            >
              &times;
            </button>
          </div>
          <div
            className="flex-1 overflow-auto p-8 flex items-start justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={fullscreenRef} className="min-w-0" />
          </div>
          <div className="text-center text-xs text-zinc-600 py-2">
            Press Escape or click outside to close
          </div>
        </div>
      )}
    </>
  );
}
