"use client";

import { useState, useEffect } from "react";
import { Play, Save, Copy, Loader2, FlaskConical } from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  alias?: string;
}

interface PlaygroundResult {
  modelId: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  elapsedMs: number;
  error?: string;
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<PlaygroundResult[] | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/playground/models")
      .then((r) => r.json())
      .then((d) => {
        const list = d.models || [];
        setModelOptions(list);
        if (list.length > 0 && selectedIds.size === 0) {
          setSelectedIds(new Set([list[0].id]));
        }
      })
      .catch(() => setModelOptions([]));
  }, []);

  const toggleModel = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRun = async () => {
    if (!prompt.trim() || selectedIds.size === 0) return;
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          modelIds: Array.from(selectedIds),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Run failed");
        return;
      }
      setResults(data.results || []);
      setSavedId(null);
      setShareUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!results || results.length === 0) return;
    try {
      const res = await fetch("/api/playground/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          results,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setSavedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleCopyLink = async () => {
    let experimentId = savedId;
    if (!experimentId && results && results.length > 0) {
      const res = await fetch("/api/playground/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), results }),
      });
      const data = await res.json();
      if (!res.ok) return;
      experimentId = data.id;
      setSavedId(data.id);
    }
    if (!experimentId) return;
    const shareRes = await fetch("/api/playground/shared", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experimentId }),
    });
    const shareData = await shareRes.json();
    if (!shareRes.ok) return;
    const url = shareData.url || `${typeof window !== "undefined" ? window.location.origin : ""}/p/${shareData.token}`;
    setShareUrl(url);
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6" style={{ maxWidth: "1400px" }}>
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          <FlaskConical size={28} style={{ color: "var(--accent)" }} />
          Model Playground
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Compare models side by side: same prompt, tokens, cost and time per model. Save and share experiments.
        </p>
      </div>

      <div
        className="rounded-xl p-4 md:p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          rows={4}
          className="w-full rounded-lg p-3 resize-y"
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />

        <div className="mt-4">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Models (select one or more)
          </label>
          <div className="flex flex-wrap gap-2">
            {modelOptions.map((m) => (
              <label
                key={m.id}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                style={{
                  backgroundColor: selectedIds.has(m.id)
                    ? "var(--accent-soft)"
                    : "var(--surface)",
                  border: `1px solid ${selectedIds.has(m.id) ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(m.id)}
                  onChange={() => toggleModel(m.id)}
                  className="sr-only"
                />
                <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>
                  {m.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRun}
            disabled={running || !prompt.trim() || selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--button-text)",
            }}
          >
            {running ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} />
            )}
            Run
          </button>
          {results && results.length > 0 && (
            <>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <Save size={18} />
                Save experiment
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <Copy size={18} />
                Copy share link
              </button>
            </>
          )}
        </div>

        {savedId && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Saved as experiment <code className="px-1 rounded" style={{ backgroundColor: "var(--surface)" }}>{savedId}</code>
          </p>
        )}
        {shareUrl && (
          <p className="mt-2 text-sm" style={{ color: "var(--success)" }}>
            Link copied to clipboard.
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}
      </div>

      {results && results.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {results.map((r) => (
            <div
              key={r.modelId}
              className="rounded-xl p-4 flex flex-col"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {r.modelId.split("/").pop() || r.modelId}
                </span>
                {r.error ? (
                  <span className="text-sm" style={{ color: "var(--error)" }}>
                    {r.error}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {r.elapsedMs}ms · ${r.cost.toFixed(4)}
                  </span>
                )}
              </div>
              {!r.error && (
                <div className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                  In: {r.inputTokens.toLocaleString()} · Out: {r.outputTokens.toLocaleString()} tokens
                </div>
              )}
              <div
                className="flex-1 overflow-auto rounded-lg p-3 text-sm whitespace-pre-wrap min-h-[80px]"
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                {r.error ? r.error : (r.text || "(empty response)")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
