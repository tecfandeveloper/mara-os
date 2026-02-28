"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface PlaygroundResult {
  modelId: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  elapsedMs: number;
  error?: string;
}

interface PlaygroundExperiment {
  id: string;
  prompt: string;
  results: PlaygroundResult[];
  createdAt: string;
}

export default function SharedPlaygroundPage() {
  const params = useParams();
  const token = params.token as string;
  const [experiment, setExperiment] = useState<PlaygroundExperiment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Missing token");
      return;
    }
    fetch(`/api/playground/shared/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found or expired");
        return r.json();
      })
      .then(setExperiment)
      .catch(() => setError("Experiment not found or expired"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <p style={{ color: "var(--text-secondary)" }}>Loading experiment...</p>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <p style={{ color: "var(--error)" }}>{error || "Not found"}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Model Playground – Shared experiment
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {new Date(experiment.createdAt).toLocaleString()}
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
          Prompt
        </h2>
        <div
          className="rounded-lg p-4 whitespace-pre-wrap"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {experiment.prompt}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          Results by model
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {experiment.results.map((r) => (
            <div
              key={r.modelId}
              className="rounded-xl p-4 flex flex-col"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">
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
                <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  In: {r.inputTokens.toLocaleString()} · Out: {r.outputTokens.toLocaleString()} tokens
                </div>
              )}
              <div
                className="flex-1 overflow-auto rounded-lg p-3 text-sm whitespace-pre-wrap min-h-[60px]"
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                }}
              >
                {r.error ? r.error : (r.text || "(empty)")}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs mt-6" style={{ color: "var(--text-muted)" }}>
        Read-only shared experiment. Mission Control Model Playground.
      </p>
    </div>
  );
}
