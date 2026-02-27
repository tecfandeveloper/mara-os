"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Pencil, Save, X, History, Loader2 } from "lucide-react";
import { MarkdownPreview } from "@/components/MarkdownPreview";

export interface MemorySection {
  id: string;
  title: string;
  body: string;
}

function parseSections(content: string): MemorySection[] {
  const sections: MemorySection[] = [];
  const parts = content.split(/\n(?=##\s+)/);
  let index = 0;
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("## ")) {
      const firstLineEnd = trimmed.indexOf("\n");
      const title = firstLineEnd === -1 ? trimmed.slice(3).trim() : trimmed.slice(3, firstLineEnd).trim();
      const body = firstLineEnd === -1 ? "" : trimmed.slice(firstLineEnd + 1).trim();
      sections.push({ id: `s${index}`, title, body });
    } else {
      sections.push({ id: `s${index}`, title: "Intro", body: trimmed });
    }
    index++;
  }
  if (sections.length === 0) {
    sections.push({ id: "s0", title: "Content", body: content });
  }
  return sections;
}

function sectionsToContent(sections: MemorySection[]): string {
  return sections
    .map((s, i) => {
      const isIntro = s.title === "Intro";
      const omitTitle = isIntro && i === 0;
      const title = omitTitle ? "" : `## ${s.title}`;
      return title ? `${title}\n\n${s.body}`.trim() : s.body.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface MemoryMdViewerProps {
  content: string;
  workspace: string;
  filePath: string;
  onSave: (newContent: string) => Promise<void>;
  hasUnsavedChanges?: boolean;
}

export function MemoryMdViewer({
  content,
  workspace,
  filePath,
  onSave,
  hasUnsavedChanges = false,
}: MemoryMdViewerProps) {
  const [sections, setSections] = useState<MemorySection[]>(() => parseSections(content));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<GitLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setSections(parseSections(content));
  }, [content]);

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (section: MemorySection) => {
    setEditingId(section.id);
    setEditBody(section.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody("");
  };

  const saveSection = useCallback(async () => {
    if (editingId == null) return;
    const idx = sections.findIndex((s) => s.id === editingId);
    if (idx === -1) return;
    const next = [...sections];
    next[idx] = { ...next[idx], body: editBody };
    setSections(next);
    setSaving(true);
    try {
      await onSave(sectionsToContent(next));
      setEditingId(null);
      setEditBody("");
    } finally {
      setSaving(false);
    }
  }, [editingId, editBody, sections, onSave]);

  useEffect(() => {
    if (!showHistory || history.length > 0) return;
    setHistoryLoading(true);
    fetch(
      `/api/git/log?workspace=${encodeURIComponent(workspace)}&path=${encodeURIComponent(filePath)}`
    )
      .then((r) => r.json())
      .then((data) => setHistory(data.entries || []))
      .finally(() => setHistoryLoading(false));
  }, [showHistory, workspace, filePath, history.length]);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: "0" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", minWidth: 0 }}>
        {sections.map((section) => {
          const isCollapsed = collapsed.has(section.id);
          const isEditing = editingId === section.id;

          return (
            <div
              key={section.id}
              style={{
                marginBottom: "16px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "var(--card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  backgroundColor: "var(--surface, var(--background))",
                  borderBottom: isCollapsed ? "none" : "1px solid var(--border)",
                  cursor: "pointer",
                }}
                onClick={() => toggleCollapsed(section.id)}
              >
                {isCollapsed ? (
                  <ChevronRight style={{ width: "18px", height: "18px", color: "var(--text-muted)", flexShrink: 0 }} />
                ) : (
                  <ChevronDown style={{ width: "18px", height: "18px", color: "var(--text-muted)", flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    flex: 1,
                  }}
                >
                  {section.title}
                </span>
                {!isEditing && !isCollapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(section);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
              </div>

              {!isCollapsed && (
                <div style={{ padding: "14px 18px" }}>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "120px",
                          padding: "12px",
                          fontSize: "13px",
                          fontFamily: "var(--font-mono), monospace",
                          lineHeight: 1.6,
                          backgroundColor: "var(--bg)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          outline: "none",
                          resize: "vertical",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={saveSection}
                          disabled={saving}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--bg)",
                            backgroundColor: "var(--accent)",
                            border: "none",
                            borderRadius: "6px",
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.8 : 1,
                          }}
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7 }}
                      className="memory-md-section-body"
                    >
                      <MarkdownPreview content={section.body || "*No content*"} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History sidebar */}
      <div
        style={{
          width: "260px",
          flexShrink: 0,
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--surface, var(--card))",
        }}
      >
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            border: "none",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            width: "100%",
            textAlign: "left",
          }}
        >
          <History size={16} />
          History
        </button>
        {showHistory && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {historyLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <Loader2 size={20} style={{ color: "var(--accent)" }} className="animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "12px" }}>
                No git history for this file.
              </p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.hash}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "6px",
                    borderRadius: "6px",
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", marginBottom: "4px" }}>
                    {entry.hash}
                  </div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: "2px" }}>
                    {entry.message}
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    {entry.author} · {entry.date}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
