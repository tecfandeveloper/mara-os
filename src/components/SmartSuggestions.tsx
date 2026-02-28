"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Check, X } from "lucide-react";

export interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  actionType: string;
  actionPayload?: Record<string, string>;
}

function dismissSuggestion(suggestionId: string, applied: boolean): Promise<void> {
  return fetch("/api/suggestions/dismiss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestionId, applied }),
  }).then((r) => {
    if (!r.ok) throw new Error("Failed to dismiss");
  });
}

export function SmartSuggestions() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/suggestions")
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = (s: SuggestionItem) => {
    setDismissingId(s.id);
    const payload = s.actionPayload || {};

    switch (s.actionType) {
      case "open_config":
        router.push("/settings");
        break;
      case "open_cron_edit":
      case "open_cron_page":
        router.push("/cron");
        break;
      case "open_settings":
        router.push("/settings");
        break;
      case "open_costs":
        router.push("/costs");
        break;
      default:
        break;
    }

    dismissSuggestion(s.id, true)
      .then(() => setSuggestions((prev) => prev.filter((x) => x.id !== s.id)))
      .finally(() => setDismissingId(null));
  };

  const handleDismiss = (s: SuggestionItem) => {
    setDismissingId(s.id);
    dismissSuggestion(s.id, false)
      .then(() => setSuggestions((prev) => prev.filter((x) => x.id !== s.id)))
      .finally(() => setDismissingId(null));
  };

  if (loading) {
    return (
      <div
        className="rounded-xl p-5 animate-pulse"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="h-5 w-32 rounded bg-gray-700 mb-3" />
        <div className="h-16 rounded bg-gray-700" />
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Lightbulb className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Suggestions
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="rounded-lg p-3"
            style={{
              backgroundColor: "var(--card-elevated, var(--background))",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              {s.title}
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              {s.description}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleApply(s)}
                disabled={dismissingId === s.id}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--text-primary)",
                }}
              >
                <Check className="w-3 h-3" />
                Apply
              </button>
              <button
                type="button"
                onClick={() => handleDismiss(s)}
                disabled={dismissingId === s.id}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: "var(--background)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <X className="w-3 h-3" />
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
