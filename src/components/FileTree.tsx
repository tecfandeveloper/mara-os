"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Brain,
  User,
  Ghost,
  BookOpen,
  Pencil,
  Trash2,
} from "lucide-react";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onRename?: (node: FileNode) => void;
  onDelete?: (node: FileNode) => void;
}

const getFileIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower === "memory.md") return Brain;
  if (lower === "soul.md") return Ghost;
  if (lower === "user.md") return User;
  if (lower === "agents.md") return BookOpen;
  return FileText;
};

function TreeNode({
  node,
  selectedPath,
  onSelect,
  onRename,
  onDelete,
  depth = 0,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onRename?: (node: FileNode) => void;
  onDelete?: (node: FileNode) => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedPath === node.path;
  const isFolder = node.type === "folder";
  const hasActions = !isFolder && (onRename || onDelete);

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!hasActions) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).closest("[data-context-menu-trigger]")?.dispatchEvent(
      new CustomEvent("filetree-contextmenu", { bubbles: true, detail: { node, x: e.clientX, y: e.clientY } })
    );
  };

  const Icon = isFolder
    ? isExpanded
      ? FolderOpen
      : Folder
    : getFileIcon(node.name);

  return (
    <div>
      <button
        data-context-menu-trigger={hasActions ? "1" : undefined}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="w-full flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg transition-colors"
        style={{
          paddingLeft: `${8 + depth * 12}px`,
          backgroundColor: isSelected ? "var(--accent)" : "transparent",
          color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
      >
        {isFolder && (
          <span className="w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5" />
            ) : (
              <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
            )}
          </span>
        )}
        {!isFolder && <span className="w-3.5 md:w-4" />}
        <Icon
          className="w-3.5 h-3.5 md:w-4 md:h-4"
          style={{
            color: isFolder
              ? "#F59E0B"
              : isSelected
              ? "var(--text-primary)"
              : "#60A5FA",
          }}
        />
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, selectedPath, onSelect, onRename, onDelete }: FileTreeProps) {
  const [contextMenu, setContextMenu] = useState<{ node: FileNode; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ node: FileNode; x: number; y: number }>;
      setContextMenu(ev.detail ? { node: ev.detail.node, x: ev.detail.x, y: ev.detail.y } : null);
    };
    const el = document.getElementById("memory-file-tree");
    el?.addEventListener("filetree-contextmenu", handler);
    return () => el?.removeEventListener("filetree-contextmenu", handler);
  }, []);

  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", close);
      window.addEventListener("scroll", close, true);
    }
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  return (
    <div id="memory-file-tree" className="py-1 md:py-2" ref={menuRef}>
      {files.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
      {contextMenu && (onRename || onDelete) && (
        <div
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            padding: "4px 0",
            minWidth: "120px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onRename && (
            <button
              type="button"
              onClick={() => {
                onRename(contextMenu.node);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm"
              style={{ color: "var(--text-primary)", background: "none", border: "none", cursor: "pointer" }}
            >
              <Pencil className="w-3.5 h-3.5" /> Rename
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(contextMenu.node);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm"
              style={{ color: "var(--negative, #ef4444)", background: "none", border: "none", cursor: "pointer" }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
