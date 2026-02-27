"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Edit3, RefreshCw, Brain, Search, FilePlus, X } from "lucide-react";
import { FileTree, FileNode } from "@/components/FileTree";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { MemoryMdViewer } from "@/components/MemoryMdViewer";
import { useDebounce } from "@/hooks/useDebounce";

type ViewMode = "edit" | "preview";

interface Workspace {
  id: string;
  name: string;
  emoji: string;
  path: string;
  agentName?: string;
}

interface SearchResultItem {
  file: string;
  title: string;
  snippet: string;
  matches: number;
  path: string;
}

export default function MemoryPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const hasUnsavedChanges = content !== originalContent;

  // Load workspaces
  useEffect(() => {
    fetch("/api/files/workspaces")
      .then((res) => res.json())
      .then((data) => {
        setWorkspaces(data.workspaces || []);
        if (data.workspaces.length > 0) {
          setSelectedWorkspace(data.workspaces[0].id);
        }
      })
      .catch(() => setWorkspaces([]));
  }, []);

  const loadFileTree = useCallback(async (workspace: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/files?workspace=${encodeURIComponent(workspace)}`);
      if (!res.ok) throw new Error("Failed to load files");
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      setError("Failed to load file tree");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFile = useCallback(async (workspace: string, path: string) => {
    try {
      setError(null);
      const res = await fetch(
        `/api/files?workspace=${encodeURIComponent(workspace)}&path=${encodeURIComponent(path)}`
      );
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setContent(data.content);
      setOriginalContent(data.content);
    } catch (err) {
      setError("Failed to load file");
      console.error(err);
    }
  }, []);

  const saveFile = useCallback(async () => {
    if (!selectedWorkspace || !selectedPath) return;
    const res = await fetch("/api/files", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace: selectedWorkspace, path: selectedPath, content }),
    });
    if (!res.ok) throw new Error("Failed to save file");
    setOriginalContent(content);
  }, [selectedWorkspace, selectedPath, content]);

  const handleSelectFile = useCallback(
    async (path: string) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm("You have unsaved changes. Discard them?");
        if (!confirmed) return;
      }
      setSelectedPath(path);
      if (selectedWorkspace) await loadFile(selectedWorkspace, path);
    },
    [hasUnsavedChanges, selectedWorkspace, loadFile]
  );

  const handleWorkspaceSelect = (workspaceId: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Discard them?");
      if (!confirmed) return;
    }
    setSelectedWorkspace(workspaceId);
    setSelectedPath(null);
    setContent("");
    setOriginalContent("");
  };

  useEffect(() => {
    if (selectedWorkspace) loadFileTree(selectedWorkspace);
  }, [selectedWorkspace, loadFileTree]);

  useEffect(() => {
    if (files.length > 0 && !selectedPath) {
      const memoryMd = files.find((f) => f.name === "MEMORY.md" && f.type === "file");
      const firstFile = memoryMd || files.find((f) => f.type === "file");
      if (firstFile) handleSelectFile(firstFile.path);
    }
  }, [files, selectedPath, handleSelectFile]);

  // Search in memory files
  useEffect(() => {
    if (debouncedSearch.length < 2 || !selectedWorkspace) {
      setSearchResults([]);
      return;
    }
    const q = encodeURIComponent(debouncedSearch);
    const w = encodeURIComponent(selectedWorkspace);
    fetch(`/api/memory/search?q=${q}&workspace=${w}`)
      .then((res) => res.json())
      .then((data) => setSearchResults(data.results || []))
      .catch(() => setSearchResults([]));
  }, [debouncedSearch, selectedWorkspace]);

  const handleNewFile = useCallback(async () => {
    if (!selectedWorkspace) return;
    const name = newFileName.trim();
    if (!name) return;
    const path = name.endsWith(".md") ? `memory/${name}` : `memory/${name}.md`;
    try {
      const res = await fetch("/api/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace: selectedWorkspace, path, content: "" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create file");
        return;
      }
      setNewFileName("");
      setShowNewFile(false);
      await loadFileTree(selectedWorkspace);
      setSelectedPath(path);
      await loadFile(selectedWorkspace, path);
    } catch (e) {
      console.error(e);
      alert("Failed to create file");
    }
  }, [selectedWorkspace, newFileName, loadFileTree, loadFile]);

  const handleRename = useCallback(
    async (node: FileNode) => {
      if (!selectedWorkspace || node.type === "folder") return;
      const newName = window.prompt("New name (e.g. 2025-02-27.md):", node.name);
      if (!newName || newName.trim() === node.name) return;
      const trimmed = newName.trim();
      const newPath = node.path.startsWith("memory/") ? `memory/${trimmed}` : trimmed;
      if (!newPath.endsWith(".md")) {
        alert("Only .md files are allowed.");
        return;
      }
      try {
        const res = await fetch("/api/files/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace: selectedWorkspace, path: node.path, newPath }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Rename failed");
          return;
        }
        await loadFileTree(selectedWorkspace);
        if (selectedPath === node.path) {
          setSelectedPath(newPath);
          await loadFile(selectedWorkspace, newPath);
        }
      } catch (e) {
        console.error(e);
        alert("Rename failed");
      }
    },
    [selectedWorkspace, selectedPath, loadFileTree, loadFile]
  );

  const handleDelete = useCallback(
    async (node: FileNode) => {
      if (!selectedWorkspace || node.type === "folder") return;
      if (!window.confirm(`Delete "${node.name}"? This cannot be undone.`)) return;
      try {
        const res = await fetch("/api/files/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace: selectedWorkspace, path: node.path }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Delete failed");
          return;
        }
        await loadFileTree(selectedWorkspace);
        if (selectedPath === node.path) {
          setSelectedPath(null);
          setContent("");
          setOriginalContent("");
        }
      } catch (e) {
        console.error(e);
        alert("Delete failed");
      }
    },
    [selectedWorkspace, selectedPath, loadFileTree]
  );

  const selectedWorkspaceData = workspaces.find((w) => w.id === selectedWorkspace);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page header */}
      <div style={{ padding: "24px 24px 16px 24px", flexShrink: 0 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-1px",
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Memory Browser
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
          Ver y editar archivos de memoria de los agentes
        </p>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* ── LEFT SIDEBAR: Workspace list ────────────────────────────────── */}
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            overflowY: "auto",
            padding: "16px 0",
            backgroundColor: "var(--surface, var(--card))",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              padding: "0 16px 8px",
              textTransform: "uppercase",
            }}
          >
            Workspaces
          </p>

          {workspaces.map((workspace) => {
            const isSelected = selectedWorkspace === workspace.id;
            return (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 16px",
                  background: isSelected ? "var(--accent-soft)" : "transparent",
                  border: "none",
                  borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 120ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "var(--surface-hover, rgba(255,255,255,0.05))";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>{workspace.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {workspace.name}
                  </div>
                  {workspace.agentName && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {workspace.agentName}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedWorkspace && selectedWorkspaceData ? (
            <>
              {/* Toolbar bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 16px",
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: "var(--surface, var(--card))",
                  flexShrink: 0,
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                  <Brain style={{ width: "16px", height: "16px", color: "var(--accent)", flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedWorkspaceData.name}
                  </span>
                  {selectedPath && (
                    <>
                      <span style={{ color: "var(--text-muted)", fontSize: "13px", flexShrink: 0 }}>/</span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "200px",
                        }}
                      >
                        {selectedPath}
                      </span>
                    </>
                  )}
                </div>

                {/* Search */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Search style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      placeholder="Search in files..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      style={{
                        width: "160px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--bg)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                  {searchOpen && searchResults.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "4px",
                        width: "320px",
                        maxHeight: "280px",
                        overflowY: "auto",
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                        zIndex: 100,
                      }}
                    >
                      {searchResults.map((r) => (
                        <button
                          key={`${r.path}-${r.file}`}
                          type="button"
                          onClick={() => {
                            handleSelectFile(r.path);
                            setSearchResults([]);
                            setSearchQuery("");
                            setSearchOpen(false);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 12px",
                            textAlign: "left",
                            border: "none",
                            borderBottom: "1px solid var(--border)",
                            backgroundColor: "transparent",
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "var(--accent)" }}>{r.path}</span>
                          <div style={{ marginTop: "2px", color: "var(--text-secondary)", fontSize: "11px" }}>
                            {r.snippet}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  {selectedPath !== "MEMORY.md" && (
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "var(--bg)",
                      borderRadius: "6px",
                      padding: "3px",
                      gap: "2px",
                    }}
                  >
                    <button
                      onClick={() => setViewMode("preview")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        backgroundColor: viewMode === "preview" ? "var(--accent)" : "transparent",
                        color: viewMode === "preview" ? "var(--bg, #111)" : "var(--text-muted)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 600,
                        transition: "all 120ms ease",
                      }}
                    >
                      <Eye size={13} />
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode("edit")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        backgroundColor: viewMode === "edit" ? "var(--accent)" : "transparent",
                        color: viewMode === "edit" ? "var(--bg, #111)" : "var(--text-muted)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 600,
                        transition: "all 120ms ease",
                      }}
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                  </div>
                  )}
                  <button
                    onClick={() => selectedWorkspace && loadFileTree(selectedWorkspace)}
                    title="Refresh"
                    style={{
                      padding: "5px 7px",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 120ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* File tree + editor */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* File tree */}
                <div
                  style={{
                    width: "230px",
                    flexShrink: 0,
                    borderRight: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                    {!showNewFile ? (
                      <button
                        type="button"
                        onClick={() => setShowNewFile(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--accent)",
                          backgroundColor: "transparent",
                          border: "1px dashed var(--border)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        <FilePlus size={14} />
                        New file
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="e.g. 2025-02-27.md"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleNewFile();
                            if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); }
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleNewFile}
                          style={{
                            padding: "6px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--bg)",
                            backgroundColor: "var(--accent)",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowNewFile(false); setNewFileName(""); }}
                          style={{
                            padding: "4px",
                            color: "var(--text-muted)",
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {isLoading ? (
                      <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
                        Loading...
                      </div>
                    ) : error && files.length === 0 ? (
                      <div style={{ padding: "24px", textAlign: "center", color: "var(--negative)" }}>
                        {error}
                      </div>
                    ) : (
                      <FileTree
                        files={files}
                        selectedPath={selectedPath}
                        onSelect={handleSelectFile}
                        onRename={handleRename}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                </div>

                {/* Editor / Preview */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    backgroundColor: "var(--bg)",
                    overflow: "hidden",
                  }}
                >
                  {selectedPath ? (
                    <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      {selectedPath === "MEMORY.md" ? (
                        <MemoryMdViewer
                          content={content}
                          workspace={selectedWorkspace!}
                          filePath="MEMORY.md"
                          onSave={async (newContent) => {
                            if (!selectedWorkspace) return;
                            const res = await fetch("/api/files", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                workspace: selectedWorkspace,
                                path: "MEMORY.md",
                                content: newContent,
                              }),
                            });
                            if (res.ok) {
                              setContent(newContent);
                              setOriginalContent(newContent);
                            } else {
                              throw new Error("Failed to save");
                            }
                          }}
                          hasUnsavedChanges={hasUnsavedChanges}
                        />
                      ) : viewMode === "edit" ? (
                        <MarkdownEditor
                          content={content}
                          onChange={setContent}
                          onSave={saveFile}
                          hasUnsavedChanges={hasUnsavedChanges}
                        />
                      ) : (
                        <MarkdownPreview content={content} />
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Brain style={{ width: "64px", height: "64px", margin: "0 auto 16px", opacity: 0.3 }} />
                        <p style={{ fontSize: "14px" }}>Selecciona un archivo para ver o editar</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: "14px",
              }}
            >
              Selecciona un workspace
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
