"use client";

import { useState, useCallback, useMemo } from "react";
import type { DependencyGraph } from "@/lib/dependency-graph";

interface CallGraphEntry {
  imports: string[];
  exports: string[];
  functions: Record<string, { calls: string[] }>;
}

// ── Color helpers ──────────────────────────────────────────────────────
const COLORS = {
  dir: { dot: "bg-blue-500", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400" },
  file: { dot: "bg-cyan-400", text: "text-cyan-300", badge: "bg-cyan-500/15 text-cyan-400" },
  fn: { dot: "bg-purple-400", text: "text-purple-300", badge: "bg-purple-500/15 text-purple-300" },
  call: { dot: "bg-amber-400", text: "text-amber-300", badge: "bg-amber-500/15 text-amber-300" },
  import: { dot: "bg-zinc-500", text: "text-zinc-400", badge: "bg-zinc-500/15 text-zinc-400" },
  export: { dot: "bg-emerald-400", text: "text-emerald-300", badge: "bg-emerald-500/15 text-emerald-300" },
} as const;

// ── Chevron icon ───────────────────────────────────────────────────────
function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className={`transition-transform duration-150 ${open ? "rotate-90" : ""} ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4,2 8,6 4,10" />
    </svg>
  );
}

// ── Connection line ────────────────────────────────────────────────────
function TreeLine({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <span className="inline-flex" style={{ width: depth * 16 }}>
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-4 border-l border-zinc-800"
          style={{ height: "100%" }}
        />
      ))}
    </span>
  );
}

// ── Expandable tree row ────────────────────────────────────────────────
function TreeRow({
  depth,
  label,
  badge,
  badgeCount,
  colors,
  hasChildren,
  isOpen,
  onToggle,
  onClick,
  monospace,
}: {
  depth: number;
  label: string;
  badge?: string;
  badgeCount?: number;
  colors: (typeof COLORS)[keyof typeof COLORS];
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClick?: () => void;
  monospace?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 py-[3px] px-2 hover:bg-zinc-800/40 transition-colors group cursor-pointer select-none`}
      onClick={(e) => {
        e.stopPropagation();
        if (hasChildren) onToggle();
        else if (onClick) onClick();
      }}
    >
      <TreeLine depth={depth} />
      {hasChildren ? (
        <Chevron open={isOpen} className="text-zinc-500 shrink-0" />
      ) : (
        <span className="w-3 shrink-0" />
      )}
      <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
      <span
        className={`text-xs truncate ${monospace ? "font-mono" : ""} ${colors.text}`}
      >
        {label}
      </span>
      {badge && (
        <span
          className={`text-[9px] px-1.5 py-[1px] rounded-full ml-auto shrink-0 ${colors.badge}`}
        >
          {badge}
        </span>
      )}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="text-[9px] text-zinc-600 ml-auto shrink-0">
          {badgeCount}
        </span>
      )}
    </div>
  );
}

// ── Build directory tree structure ─────────────────────────────────────
interface DirNode {
  name: string;
  path: string;
  files: string[];
  subdirs: Map<string, DirNode>;
}

function buildDirTree(filePaths: string[]): DirNode {
  const root: DirNode = { name: "root", path: "", files: [], subdirs: new Map() };

  for (const fp of filePaths) {
    const parts = fp.split("/");
    const fileName = parts.pop()!;
    let current = root;

    for (const part of parts) {
      if (!current.subdirs.has(part)) {
        current.subdirs.set(part, {
          name: part,
          path: current.path ? `${current.path}/${part}` : part,
          files: [],
          subdirs: new Map(),
        });
      }
      current = current.subdirs.get(part)!;
    }
    current.files.push(fp);
  }

  return root;
}

// ── Repo-level tree view ───────────────────────────────────────────────
function RepoTree({
  dependencyGraph,
  callGraph,
  onFileNavigate,
}: {
  dependencyGraph: DependencyGraph;
  callGraph: Record<string, CallGraphEntry>;
  onFileNavigate?: (filePath: string) => void;
}) {
  const [openDirs, setOpenDirs] = useState<Set<string>>(() => {
    // Open top-level dirs by default
    const initial = new Set<string>();
    const allFiles = Object.keys(callGraph);
    for (const fp of allFiles) {
      const slash = fp.indexOf("/");
      if (slash !== -1) initial.add(fp.slice(0, slash));
    }
    return initial;
  });
  const [openFiles, setOpenFiles] = useState<Set<string>>(new Set());

  const dirTree = useMemo(
    () => buildDirTree(Object.keys(callGraph)),
    [callGraph]
  );

  const toggleDir = useCallback((path: string) => {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const toggleFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const renderDir = (node: DirNode, depth: number): React.ReactNode[] => {
    const rows: React.ReactNode[] = [];

    // Sort subdirs and files
    const sortedDirs = [...node.subdirs.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedFiles = [...node.files].sort((a, b) =>
      a.localeCompare(b)
    );

    for (const subdir of sortedDirs) {
      const isOpen = openDirs.has(subdir.path);
      const fileCount = countFiles(subdir);

      rows.push(
        <TreeRow
          key={`dir-${subdir.path}`}
          depth={depth}
          label={subdir.name}
          badgeCount={fileCount}
          colors={COLORS.dir}
          hasChildren={true}
          isOpen={isOpen}
          onToggle={() => toggleDir(subdir.path)}
        />
      );

      if (isOpen) {
        rows.push(...renderDir(subdir, depth + 1));
      }
    }

    for (const filePath of sortedFiles) {
      const fileName = filePath.split("/").pop() ?? filePath;
      const entry = callGraph[filePath];
      const info = dependencyGraph.fileInfo[filePath];
      const isOpen = openFiles.has(filePath);

      const fnCount = entry ? Object.keys(entry.functions).length : 0;
      const depCount = info
        ? info.dependsOn.length + info.dependedOnBy.length
        : 0;
      const hasContent = fnCount > 0 || (entry && entry.imports.length > 0);

      rows.push(
        <TreeRow
          key={`file-${filePath}`}
          depth={depth}
          label={fileName}
          badge={depCount > 0 ? `${depCount} deps` : undefined}
          colors={COLORS.file}
          hasChildren={!!hasContent}
          isOpen={isOpen}
          onToggle={() => toggleFile(filePath)}
          onClick={() => onFileNavigate?.(filePath)}
          monospace
        />
      );

      if (isOpen && entry) {
        // Show imports
        if (entry.imports.length > 0) {
          rows.push(
            <TreeRow
              key={`imports-header-${filePath}`}
              depth={depth + 1}
              label={`imports (${entry.imports.length})`}
              colors={COLORS.import}
              hasChildren={false}
              isOpen={false}
              onToggle={() => {}}
            />
          );
        }

        // Show exports
        if (entry.exports.length > 0) {
          rows.push(
            <TreeRow
              key={`exports-header-${filePath}`}
              depth={depth + 1}
              label={`exports: ${entry.exports.join(", ")}`}
              colors={COLORS.export}
              hasChildren={false}
              isOpen={false}
              onToggle={() => {}}
            />
          );
        }

        // Show functions
        for (const [fnName, { calls }] of Object.entries(entry.functions)) {
          rows.push(
            <FunctionRow
              key={`fn-${filePath}-${fnName}`}
              depth={depth + 1}
              fnName={fnName}
              calls={calls}
            />
          );
        }

        // Show dependedOnBy
        if (info && info.dependedOnBy.length > 0) {
          rows.push(
            <TreeRow
              key={`usedby-${filePath}`}
              depth={depth + 1}
              label={`used by: ${info.dependedOnBy.map((f) => f.split("/").pop()).join(", ")}`}
              colors={COLORS.import}
              hasChildren={false}
              isOpen={false}
              onToggle={() => {}}
            />
          );
        }
      }
    }

    return rows;
  };

  return (
    <div className="overflow-y-auto overflow-x-hidden h-full custom-scrollbar">
      {renderDir(dirTree, 0)}
    </div>
  );
}

function countFiles(node: DirNode): number {
  let count = node.files.length;
  for (const sub of node.subdirs.values()) {
    count += countFiles(sub);
  }
  return count;
}

// ── Function row with collapsible calls ────────────────────────────────
function FunctionRow({
  depth,
  fnName,
  calls,
}: {
  depth: number;
  fnName: string;
  calls: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TreeRow
        depth={depth}
        label={`${fnName}()`}
        badgeCount={calls.length}
        colors={COLORS.fn}
        hasChildren={calls.length > 0}
        isOpen={open}
        onToggle={() => setOpen((o) => !o)}
        monospace
      />
      {open &&
        calls.map((call, i) => (
          <TreeRow
            key={`call-${fnName}-${call}-${i}`}
            depth={depth + 1}
            label={`${call}()`}
            colors={COLORS.call}
            hasChildren={false}
            isOpen={false}
            onToggle={() => {}}
            monospace
          />
        ))}
    </>
  );
}

// ── File-level tree view ───────────────────────────────────────────────
function FileTree({
  entry,
  filePath,
  dependencyGraph,
}: {
  entry: CallGraphEntry;
  filePath: string;
  dependencyGraph?: DependencyGraph;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    // Open functions by default
    return new Set(["functions"]);
  });
  const [openFns, setOpenFns] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const toggleFn = useCallback((fn: string) => {
    setOpenFns((prev) => {
      const next = new Set(prev);
      if (next.has(fn)) next.delete(fn);
      else next.add(fn);
      return next;
    });
  }, []);

  const fileName = filePath.split("/").pop() ?? filePath;
  const info = dependencyGraph?.fileInfo[filePath];
  const fnEntries = Object.entries(entry.functions);

  return (
    <div className="overflow-y-auto overflow-x-hidden h-full custom-scrollbar">
      {/* File root */}
      <div className="flex items-center gap-1.5 py-1.5 px-2 border-b border-zinc-800/50">
        <span className={`w-2.5 h-2.5 rounded-full ${COLORS.file.dot}`} />
        <span className="text-xs font-mono font-semibold text-cyan-300 truncate">
          {fileName}
        </span>
        <span className="text-[9px] text-zinc-600 ml-auto">{filePath}</span>
      </div>

      {/* Imports section */}
      {entry.imports.length > 0 && (
        <>
          <TreeRow
            depth={0}
            label={`Imports (${entry.imports.length})`}
            colors={COLORS.import}
            hasChildren={true}
            isOpen={openSections.has("imports")}
            onToggle={() => toggleSection("imports")}
          />
          {openSections.has("imports") &&
            entry.imports.map((imp, i) => (
              <TreeRow
                key={`imp-${i}`}
                depth={1}
                label={imp}
                colors={COLORS.import}
                hasChildren={false}
                isOpen={false}
                onToggle={() => {}}
                monospace
              />
            ))}
        </>
      )}

      {/* Exports section */}
      {entry.exports.length > 0 && (
        <>
          <TreeRow
            depth={0}
            label={`Exports (${entry.exports.length})`}
            colors={COLORS.export}
            hasChildren={true}
            isOpen={openSections.has("exports")}
            onToggle={() => toggleSection("exports")}
          />
          {openSections.has("exports") &&
            entry.exports.map((exp, i) => (
              <TreeRow
                key={`exp-${i}`}
                depth={1}
                label={exp}
                colors={COLORS.export}
                hasChildren={false}
                isOpen={false}
                onToggle={() => {}}
                monospace
              />
            ))}
        </>
      )}

      {/* Functions section */}
      {fnEntries.length > 0 && (
        <>
          <TreeRow
            depth={0}
            label={`Functions (${fnEntries.length})`}
            colors={COLORS.fn}
            hasChildren={true}
            isOpen={openSections.has("functions")}
            onToggle={() => toggleSection("functions")}
          />
          {openSections.has("functions") &&
            fnEntries.map(([fnName, { calls }]) => {
              const isOpen = openFns.has(fnName);
              return (
                <div key={`fn-${fnName}`}>
                  <TreeRow
                    depth={1}
                    label={`${fnName}()`}
                    badgeCount={calls.length}
                    colors={COLORS.fn}
                    hasChildren={calls.length > 0}
                    isOpen={isOpen}
                    onToggle={() => toggleFn(fnName)}
                    monospace
                  />
                  {isOpen &&
                    calls.map((call, i) => (
                      <TreeRow
                        key={`call-${fnName}-${i}`}
                        depth={2}
                        label={`${call}()`}
                        colors={COLORS.call}
                        hasChildren={false}
                        isOpen={false}
                        onToggle={() => {}}
                        monospace
                      />
                    ))}
                </div>
              );
            })}
        </>
      )}

      {/* Dependencies section */}
      {info && info.dependsOn.length > 0 && (
        <>
          <TreeRow
            depth={0}
            label={`Depends On (${info.dependsOn.length})`}
            colors={COLORS.dir}
            hasChildren={true}
            isOpen={openSections.has("dependsOn")}
            onToggle={() => toggleSection("dependsOn")}
          />
          {openSections.has("dependsOn") &&
            info.edges
              .filter((e) => e.from === filePath && e.type === "internal")
              .map((edge, i) => (
                <TreeRow
                  key={`dep-${i}`}
                  depth={1}
                  label={edge.to.split("/").pop() ?? edge.to}
                  badge={
                    edge.symbols.length > 0
                      ? edge.symbols.slice(0, 3).join(", ")
                      : undefined
                  }
                  colors={COLORS.dir}
                  hasChildren={false}
                  isOpen={false}
                  onToggle={() => {}}
                  monospace
                />
              ))}
        </>
      )}

      {/* Used By section */}
      {info && info.dependedOnBy.length > 0 && (
        <>
          <TreeRow
            depth={0}
            label={`Used By (${info.dependedOnBy.length})`}
            colors={COLORS.export}
            hasChildren={true}
            isOpen={openSections.has("usedBy")}
            onToggle={() => toggleSection("usedBy")}
          />
          {openSections.has("usedBy") &&
            info.edges
              .filter((e) => e.to === filePath && e.type === "internal")
              .map((edge, i) => (
                <TreeRow
                  key={`usedby-${i}`}
                  depth={1}
                  label={edge.from.split("/").pop() ?? edge.from}
                  badge={
                    edge.symbols.length > 0
                      ? edge.symbols.slice(0, 3).join(", ")
                      : undefined
                  }
                  colors={COLORS.export}
                  hasChildren={false}
                  isOpen={false}
                  onToggle={() => {}}
                  monospace
                />
              ))}
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function CallGraph({
  entry,
  filePath,
  dependencyGraph,
  callGraph,
  onFileNavigate,
}: {
  entry: CallGraphEntry | null;
  filePath: string | null;
  dependencyGraph?: DependencyGraph;
  callGraph?: Record<string, CallGraphEntry>;
  onFileNavigate?: (filePath: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"repo" | "file">("repo");

  // Auto-switch to file view when file selected
  const effectiveView =
    filePath && entry ? "file" : viewMode === "file" && !filePath ? "repo" : viewMode;

  const hasCallGraphData = callGraph && Object.keys(callGraph).length > 0;
  const hasFileData =
    entry &&
    (entry.imports.length > 0 ||
      entry.exports.length > 0 ||
      Object.keys(entry.functions).length > 0);

  // No data states
  if (!hasCallGraphData && effectiveView === "repo") {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
        Analyze a repo to view its dependency tree
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {effectiveView === "file" && (
            <button
              onClick={() => setViewMode("repo")}
              className="text-blue-400 hover:text-blue-300 transition-colors text-[10px]"
            >
              Repo
            </button>
          )}
          {effectiveView === "file" && (
            <span className="text-zinc-700">/</span>
          )}
          <span>
            {effectiveView === "repo" ? "Dependency Tree" : "File Structure"}
          </span>
        </div>
        {effectiveView === "repo" && hasCallGraphData && (
          <span className="text-[10px] text-zinc-600">
            {Object.keys(callGraph!).length} files
          </span>
        )}
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-hidden">
        {effectiveView === "repo" && dependencyGraph && callGraph && (
          <RepoTree
            dependencyGraph={dependencyGraph}
            callGraph={callGraph}
            onFileNavigate={(fp) => {
              setViewMode("file");
              onFileNavigate?.(fp);
            }}
          />
        )}

        {effectiveView === "file" && entry && filePath && hasFileData && (
          <FileTree
            entry={entry}
            filePath={filePath}
            dependencyGraph={dependencyGraph}
          />
        )}

        {effectiveView === "file" && filePath && !hasFileData && (
          <div className="h-full flex items-center justify-center text-zinc-600 text-sm px-4 text-center">
            {/\.(ts|tsx|js|jsx)$/.test(filePath)
              ? "No structural data for this file"
              : "Structural analysis available for JS/TS files"}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="text-center text-[10px] text-zinc-600 py-1 border-t border-zinc-800/50 shrink-0">
        {effectiveView === "repo"
          ? "Click to expand · Click file to view details"
          : "Click sections to expand · Click Repo to go back"}
      </div>
    </div>
  );
}
