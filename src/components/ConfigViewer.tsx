"use client";

import { useEffect, useState } from "react";
import { FileJson, RefreshCw, AlertCircle, Save, RotateCcw } from "lucide-react";

interface ConfigViewerProps {
  onRefresh?: () => void;
}

type AllowlistItem = {
  path: string;
  type: "string" | "number" | "boolean";
  min?: number;
  max?: number;
  enum?: string[];
};

function getAtPath(obj: unknown, keyPath: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  return keyPath.split(".").reduce((o: unknown, k: string) => (o as Record<string, unknown>)?.[k], obj);
}

function coerceValue(
  raw: string,
  type: "string" | "number" | "boolean"
): string | number | boolean {
  if (type === "number") return Number(raw);
  if (type === "boolean") return raw === "true" || raw === "1";
  return raw;
}

export function ConfigViewer({ onRefresh }: ConfigViewerProps) {
  const [config, setConfig] = useState<unknown | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [allowlist, setAllowlist] = useState<AllowlistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [restartRecommended, setRestartRecommended] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load config");
        setConfig(null);
        setPath(null);
        setAllowlist([]);
        return;
      }
      setConfig(data.config);
      setPath(data.path || null);
      setAllowlist(data.allowlist || []);
    } catch (e) {
      setError("Failed to fetch config");
      setConfig(null);
      setPath(null);
      setAllowlist([]);
    } finally {
      setLoading(false);
      onRefresh?.();
    }
  };

  const handleSave = async (keyPath: string, value: unknown) => {
    setSavingPath(keyPath);
    setSaveError(null);
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: keyPath, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Save failed");
        return;
      }
      if (data.restartRecommended) setRestartRecommended(true);
      await fetchConfig();
    } catch (e) {
      setSaveError("Request failed");
    } finally {
      setSavingPath(null);
    }
  };

  const handleRestartGateway = async () => {
    setRestarting(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart-gateway" }),
      });
      if (res.ok) setRestartRecommended(false);
    } finally {
      setRestarting(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-xl p-6 flex items-center justify-center gap-2"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} />
        <span style={{ color: "var(--text-secondary)" }}>Loading config...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="text-xl font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          <FileJson className="w-5 h-5" style={{ color: "var(--accent)" }} />
          OpenClaw Config
        </h2>
        <div
          className="flex items-center gap-2 p-4 rounded-lg"
          style={{
            backgroundColor: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          <span>{error}</span>
          {path && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ({path})
            </span>
          )}
        </div>
        <button
          onClick={fetchConfig}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h2
          className="text-xl font-semibold flex items-center gap-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          <FileJson className="w-5 h-5" style={{ color: "var(--accent)" }} />
          OpenClaw Config
        </h2>
        <button
          onClick={fetchConfig}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      {path && (
        <div
          className="px-6 py-1.5 text-xs"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {path}
        </div>
      )}

      {/* Edit safe values */}
      {allowlist.length > 0 && config != null && typeof config === "object" ? (
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Edit safe values
          </h3>
          {saveError && (
            <p className="text-sm text-amber-400 mb-2">{saveError}</p>
          )}
          <div className="space-y-3">
            {allowlist.map((item) => {
              const current = getAtPath(config, item.path);
              const currentStr =
                current === undefined || current === null
                  ? ""
                  : String(current);
              return (
                <EditableRow
                  key={item.path}
                  item={item}
                  currentStr={currentStr}
                  saving={savingPath === item.path}
                  onSave={(value) => handleSave(item.path, value)}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {restartRecommended && (
        <div
          className="px-6 py-3 flex items-center justify-between gap-4"
          style={{
            backgroundColor: "var(--accent-soft)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Config saved. Restart gateway to apply?
          </span>
          <button
            type="button"
            onClick={handleRestartGateway}
            disabled={restarting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
              border: "none",
            }}
          >
            {restarting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Reiniciar gateway
          </button>
        </div>
      )}

      <div
        className="px-6 pt-4 pb-1 text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        Config (solo lectura, valores sensibles enmascarados)
      </div>
      <pre
        className="p-6 overflow-auto text-sm"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--text-secondary)",
          maxHeight: "400px",
          margin: 0,
        }}
      >
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}

function EditableRow({
  item,
  currentStr,
  saving,
  onSave,
}: {
  item: AllowlistItem;
  currentStr: string;
  saving: boolean;
  onSave: (value: string | number | boolean) => void;
}) {
  const [value, setValue] = useState(currentStr);
  useEffect(() => {
    setValue(currentStr);
  }, [currentStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coerced = coerceValue(value, item.type);
    onSave(coerced);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2"
    >
      <label
        className="text-xs font-medium min-w-[140px]"
        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
      >
        {item.path}
      </label>
      {item.type === "boolean" ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded px-2 py-1 text-sm bg-gray-800 text-white border border-gray-600"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : item.enum ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded px-2 py-1 text-sm bg-gray-800 text-white border border-gray-600"
        >
          {item.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={item.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded px-2 py-1 text-sm w-40 bg-gray-800 text-white border border-gray-600"
          min={item.min}
          max={item.max}
        />
      )}
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        <Save className="w-3 h-3" /> Save
      </button>
    </form>
  );
}
