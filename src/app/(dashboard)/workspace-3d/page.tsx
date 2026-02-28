"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, FolderOpen, FileText, ExternalLink, X } from "lucide-react";
import dynamic from "next/dynamic";
import type { TreeNode } from "@/components/Workspace3D/Workspace3DScene";

const Workspace3DScene = dynamic(
  () => import("@/components/Workspace3D/Workspace3DScene").then((m) => m.default),
  { ssr: false }
);

interface Workspace {
  id: string;
  name: string;
  emoji: string;
  path: string;
}

export default function Workspace3DPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("workspace");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/files/workspaces")
      .then((r) => r.json())
      .then((d) => {
        const list = d.workspaces || [];
        setWorkspaces(list);
        if (list.length > 0 && selectedWorkspace === "workspace") {
          setSelectedWorkspace(list[0].id);
        }
      })
      .catch(() => setWorkspaces([]));
  }, []);

  const fetchTree = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const w = encodeURIComponent(selectedWorkspace);
      const res = await fetch(`/api/files/tree?workspace=${w}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load tree");
      setTree(json.tree || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    if (!selectedNode || selectedNode.type !== "file") {
      setPreviewContent(null);
      setPreviewError(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    const w = encodeURIComponent(selectedWorkspace);
    const p = encodeURIComponent(selectedNode.path);
    fetch(`/api/files/contents?workspace=${w}&path=${p}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.binary || data.error) {
          setPreviewError(data.error || "Preview not available for this file type");
          setPreviewContent(null);
        } else {
          setPreviewContent(data.content ?? "");
          setPreviewError(null);
        }
      })
      .catch(() => {
        setPreviewError("Failed to load content");
        setPreviewContent(null);
      })
      .finally(() => setPreviewLoading(false));
  }, [selectedNode, selectedWorkspace]);

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode(node);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--background)", minHeight: "100%" }}
    >
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <Link
          href="/files"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
          Files
        </Link>
      </div>
      <div className="mb-4">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          <FolderOpen size={28} style={{ color: "var(--accent)" }} />
          Workspace 3D Explorer
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          File tree in 3D. Size by file size, color by type. Click a node to preview or open in File Browser.
        </p>
      </div>

      {workspaces.length > 1 && (
        <div
          className="rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Workspace
          </span>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.emoji} {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div
          className="rounded-xl flex items-center justify-center py-16"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--accent)" }}
          />
        </div>
      )}
      {error && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && tree.length > 0 && (
        <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: "500px" }}>
          <div className="flex-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <Workspace3DScene tree={tree} onNodeClick={handleNodeClick} />
          </div>

          {selectedNode && (
            <aside
              className="w-full md:w-[380px] flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  {selectedNode.type === "folder" ? (
                    <FolderOpen size={20} style={{ color: "var(--text-secondary)" }} />
                  ) : (
                    <FileText size={20} style={{ color: "var(--text-secondary)" }} />
                  )}
                  <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {selectedNode.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                <p className="mb-2">Path: <code className="break-all" style={{ fontSize: "12px" }}>{selectedNode.path}</code></p>
                {selectedNode.type === "file" && selectedNode.size != null && (
                  <p className="mb-2">Size: {(selectedNode.size / 1024).toFixed(2)} KB</p>
                )}
                <Link
                  href={`/files${selectedWorkspace !== "workspace" ? `?workspace=${selectedWorkspace}` : ""}`}
                  className="inline-flex items-center gap-1 mt-2"
                  style={{ color: "var(--accent)" }}
                >
                  <ExternalLink size={14} />
                  Open in File Browser
                </Link>
              </div>
              {selectedNode.type === "file" && (
                <div className="flex-1 min-h-0 flex flex-col p-4 pt-0">
                  <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                    Preview
                  </h3>
                  {previewLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div
                        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: "var(--accent)" }}
                      />
                    </div>
                  )}
                  {previewError && (
                    <p className="text-sm py-4" style={{ color: "var(--error)" }}>
                      {previewError}
                    </p>
                  )}
                  {previewContent !== null && !previewLoading && (
                    <pre
                      className="flex-1 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap"
                      style={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        maxHeight: "280px",
                      }}
                    >
                      {previewContent.slice(0, 8000)}
                      {previewContent.length > 8000 ? "\n\n… (truncated)" : ""}
                    </pre>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {!loading && !error && tree.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p style={{ color: "var(--text-secondary)" }}>No files in this workspace.</p>
        </div>
      )}
    </div>
  );
}
