"use client";

import { useState, useEffect, useCallback } from "react";
import { FileBarChart, FileText, RefreshCw, Clock, HardDrive, Share2, Copy, Download } from "lucide-react";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface Report {
  name: string;
  path: string;
  title: string;
  type: string;
  size: number;
  modified: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Preset = "7d" | "30d" | "month" | "custom";

function getRange(preset: Preset): { startDate: string; endDate: string } {
  const today = new Date();
  if (preset === "7d") {
    const start = subDays(today, 6);
    return { startDate: format(start, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
  }
  if (preset === "30d") {
    const start = subDays(today, 29);
    return { startDate: format(start, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
  }
  if (preset === "month") {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") };
  }
  return { startDate: format(today, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const [shareablePreset, setShareablePreset] = useState<Preset>("7d");
  const [shareableCustomStart, setShareableCustomStart] = useState("");
  const [shareableCustomEnd, setShareableCustomEnd] = useState("");
  const [shareableGenerating, setShareableGenerating] = useState(false);
  const [shareableResult, setShareableResult] = useState<{ token: string; expiresAt: string } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadContent = useCallback(async (path: string) => {
    try {
      setIsLoadingContent(true);
      const res = await fetch(`/api/reports?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();
      setContent(data.content);
    } catch (err) {
      console.error(err);
      setContent("# Error\n\nFailed to load report content.");
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  const handleSelect = useCallback(
    (report: Report) => {
      setSelectedPath(report.path);
      loadContent(report.path);
    },
    [loadContent]
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerateShareable = useCallback(async () => {
    const { startDate, endDate } =
      shareablePreset === "custom"
        ? { startDate: shareableCustomStart, endDate: shareableCustomEnd }
        : getRange(shareablePreset);
    if (!startDate || !endDate) return;
    setShareableGenerating(true);
    setShareableResult(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setShareableResult({ token: data.token, expiresAt: data.expiresAt });
    } catch (err) {
      console.error(err);
    } finally {
      setShareableGenerating(false);
    }
  }, [shareablePreset, shareableCustomStart, shareableCustomEnd]);

  const shareableLink = shareableResult
    ? typeof window !== "undefined"
      ? `${window.location.origin}/r/${shareableResult.token}`
      : ""
    : "";

  const copyLink = useCallback(() => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }, [shareableLink]);

  const exportPdf = useCallback(() => {
    if (!shareableResult) return;
    window.open(`/api/reports/export?token=${encodeURIComponent(shareableResult.token)}`, "_blank");
  }, [shareableResult]);

  // Auto-select first report
  useEffect(() => {
    if (reports.length > 0 && !selectedPath) {
      handleSelect(reports[0]);
    }
  }, [reports, selectedPath, handleSelect]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 md:p-4"
        style={{
          backgroundColor: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <FileBarChart className="w-5 h-5 md:w-6 md:h-6" style={{ color: "var(--accent)" }} />
          <div>
            <h1
              className="text-lg md:text-xl font-bold"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Reports
            </h1>
            <p className="text-xs md:text-sm hidden sm:block" style={{ color: "var(--text-secondary)" }}>
              Analysis reports and insights
            </p>
          </div>
        </div>
        <button
          onClick={loadReports}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
          title="Refresh reports"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main content - split layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Report list */}
        <div
          className="w-full md:w-80 lg:w-96 overflow-y-auto flex-shrink-0"
          style={{
            backgroundColor: "var(--card)",
            borderRight: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Shareable report */}
          <div
            className="p-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Share2 className="w-4 h-4" />
              Shareable report
            </h2>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {(["7d", "30d", "month"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setShareablePreset(p)}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: shareablePreset === p ? "var(--accent)" : "var(--background)",
                      color: shareablePreset === p ? "var(--text-primary)" : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {p === "7d" ? "Last 7d" : p === "30d" ? "Last 30d" : "This month"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShareablePreset("custom")}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: shareablePreset === "custom" ? "var(--accent)" : "var(--background)",
                    color: shareablePreset === "custom" ? "var(--text-primary)" : "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Custom
                </button>
              </div>
              {shareablePreset === "custom" && (
                <div className="flex gap-2 items-center text-xs">
                  <input
                    type="date"
                    value={shareableCustomStart}
                    onChange={(e) => setShareableCustomStart(e.target.value)}
                    className="flex-1 rounded px-2 py-1"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>–</span>
                  <input
                    type="date"
                    value={shareableCustomEnd}
                    onChange={(e) => setShareableCustomEnd(e.target.value)}
                    className="flex-1 rounded px-2 py-1"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleGenerateShareable}
                disabled={shareableGenerating || (shareablePreset === "custom" && (!shareableCustomStart || !shareableCustomEnd))}
                className="w-full text-xs font-medium py-2 rounded flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--text-primary)",
                  opacity: shareableGenerating ? 0.7 : 1,
                }}
              >
                {shareableGenerating ? "Generating…" : "Generate report"}
              </button>
              {shareableResult && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareableLink}
                      className="flex-1 text-xs rounded px-2 py-1 truncate"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }}
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="p-1.5 rounded"
                      style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copyFeedback && <span className="text-xs" style={{ color: "var(--success)" }}>Copied!</span>}
                  <button
                    type="button"
                    onClick={exportPdf}
                    className="w-full text-xs font-medium py-2 rounded flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            className="p-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              {isLoading ? "Loading..." : `${reports.length} Reports`}
            </h2>
          </div>

          {!isLoading && reports.length === 0 && (
            <div className="p-6 text-center" style={{ color: "var(--text-muted)" }}>
              <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reports found</p>
              <p className="text-xs mt-1">
                Reports matching *-analysis-* or *-report-* patterns in memory/ will appear here
              </p>
            </div>
          )}

          <div className="p-2 space-y-2">
            {reports.map((report) => (
              <button
                key={report.path}
                onClick={() => handleSelect(report)}
                className="w-full text-left rounded-lg p-3 transition-all"
                style={{
                  backgroundColor:
                    selectedPath === report.path
                      ? "var(--accent)"
                      : "var(--card-elevated, var(--background))",
                  border: `1px solid ${
                    selectedPath === report.path
                      ? "var(--accent)"
                      : "var(--border)"
                  }`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (selectedPath !== report.path) {
                    e.currentTarget.style.borderColor = "var(--accent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPath !== report.path) {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{
                      color:
                        selectedPath === report.path
                          ? "var(--text-primary)"
                          : "var(--accent)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-medium text-sm truncate"
                      style={{
                        color:
                          selectedPath === report.path
                            ? "var(--text-primary)"
                            : "var(--text-primary)",
                      }}
                    >
                      {report.title}
                    </p>
                    <div
                      className="flex items-center gap-3 mt-1 text-xs"
                      style={{
                        color:
                          selectedPath === report.path
                            ? "var(--text-primary)"
                            : "var(--text-muted)",
                        opacity: selectedPath === report.path ? 0.8 : 1,
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(report.modified)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatSize(report.size)}
                      </span>
                    </div>
                    <span
                      className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          selectedPath === report.path
                            ? "rgba(255,255,255,0.15)"
                            : "var(--background)",
                        color:
                          selectedPath === report.path
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {report.type}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview panel */}
        <div
          className="flex-1 min-w-0 min-h-0"
          style={{ backgroundColor: "var(--background)" }}
        >
          {selectedPath ? (
            isLoadingContent ? (
              <div
                className="flex items-center justify-center h-full"
                style={{ color: "var(--text-secondary)" }}
              >
                Loading report...
              </div>
            ) : (
              <MarkdownPreview content={content} />
            )
          ) : (
            <div
              className="flex items-center justify-center h-full"
              style={{ color: "var(--text-muted)" }}
            >
              <div className="text-center">
                <FileBarChart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select a report to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
