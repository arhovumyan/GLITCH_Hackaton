"use client";

import { useState, useMemo } from "react";

interface FileTreeEntry {
  path: string;
  type: string;
  language: string;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  files: FileTreeEntry[];
}

function buildTree(entries: FileTreeEntry[]): FolderNode {
  const root: FolderNode = { name: "", path: "", children: [], files: [] };

  const dirs = entries.filter((e) => e.type === "dir");
  const files = entries.filter((e) => e.type === "file");

  const folderMap = new Map<string, FolderNode>();
  folderMap.set("", root);

  dirs
    .sort((a, b) => a.path.split("/").length - b.path.split("/").length)
    .forEach((dir) => {
      const parts = dir.path.split("/");
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join("/");
      const node: FolderNode = {
        name,
        path: dir.path,
        children: [],
        files: [],
      };
      folderMap.set(dir.path, node);
      const parent = folderMap.get(parentPath) ?? root;
      parent.children.push(node);
    });

  files.forEach((file) => {
    const parts = file.path.split("/");
    const parentPath = parts.slice(0, -1).join("/");
    const parent = folderMap.get(parentPath) ?? root;
    parent.files.push(file);
  });

  return root;
}

function FolderItem({
  node,
  selectedFile,
  onFileClick,
  depth,
}: {
  node: FolderNode;
  selectedFile: string | null;
  onFileClick: (path: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  const sortedChildren = [...node.children].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedFiles = [...node.files].sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  return (
    <div>
      {node.name && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-black hover:bg-[#94d8ff] rounded-none transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="text-xs w-4 shrink-0">{expanded ? "▾" : "▸"}</span>
          <span className="text-xs">📁</span>
          <span className="truncate font-bold">{node.name}</span>
        </button>
      )}
      {(expanded || !node.name) && (
        <div>
          {sortedChildren.map((child) => (
            <FolderItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileClick={onFileClick}
              depth={node.name ? depth + 1 : depth}
            />
          ))}
          {sortedFiles.map((file) => {
            const fileName = file.path.split("/").pop() ?? file.path;
            const isSelected = selectedFile === file.path;
            return (
              <button
                type="button"
                key={file.path}
                onClick={() => onFileClick(file.path)}
                className={`flex w-full items-center gap-1.5 px-2 py-1 text-xs transition-colors rounded-none ${
                  isSelected
                    ? "bg-[#000080] text-white"
                    : "text-black hover:bg-[#ffef96]"
                }`}
                style={{
                  paddingLeft: `${(node.name ? depth + 1 : depth) * 12 + 8}px`,
                }}
              >
                <span className="text-xs w-4 shrink-0">┄</span>
                <span className="truncate font-mono">{fileName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({
  fileTree,
  selectedFile,
  onFileSelect,
}: {
  fileTree: FileTreeEntry[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}) {
  const tree = useMemo(() => buildTree(fileTree), [fileTree]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#ececec]">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-[#000080] border-b border-black">
        Explorer
      </div>
      <div className="py-1">
        <FolderItem
          node={tree}
          selectedFile={selectedFile}
          onFileClick={onFileSelect}
          depth={0}
        />
      </div>
    </div>
  );
}
