"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SharedReportPayload {
  startDate: string;
  endDate: string;
  generatedAt: string;
  activity: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    successRate: number;
  };
  cost: {
    total: number;
    byModel: Array<{ model: string; cost: number; percentOfTotal: number }>;
    daily: Array<{ date: string; cost: number; input: number; output: number }>;
  };
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;
  const [report, setReport] = useState<SharedReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Missing report token");
      return;
    }
    fetch(`/api/reports/shared/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Report not found or expired");
        return r.json();
      })
      .then(setReport)
      .catch(() => setError("Report not found or expired"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}>
        <p style={{ color: "var(--error)" }}>{error || "Report not found"}</p>
      </div>
    );
  }

  const byTypeEntries = Object.entries(report.activity.byType).sort(([, a], [, b]) => b - a).slice(0, 10);
  const byStatusEntries = Object.entries(report.activity.byStatus);

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Mission Control – Report
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {report.startDate} – {report.endDate} · Generated {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Activity summary
        </h2>
        <div className="rounded-lg p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-2">
            <strong>Total activities:</strong> {report.activity.total.toLocaleString()}
          </p>
          <p className="text-sm mb-3">
            <strong>Success rate:</strong> {report.activity.successRate}%
          </p>
          {byStatusEntries.length > 0 && (
            <div className="text-sm mb-3">
              <strong>By status:</strong>
              <ul className="list-disc list-inside mt-1">
                {byStatusEntries.map(([status, count]) => (
                  <li key={status}>{status}: {count.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}
          {byTypeEntries.length > 0 && (
            <div className="text-sm">
              <strong>Top types:</strong>
              <ul className="list-disc list-inside mt-1">
                {byTypeEntries.map(([type, count]) => (
                  <li key={type}>{type}: {count.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Cost summary
        </h2>
        <div className="rounded-lg p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-3">
            <strong>Total cost:</strong> ${report.cost.total.toFixed(2)}
          </p>
          {report.cost.byModel.length > 0 && (
            <div className="text-sm mb-3">
              <strong>By model:</strong>
              <ul className="list-disc list-inside mt-1">
                {report.cost.byModel.map((m) => (
                  <li key={m.model}>
                    {m.model}: ${m.cost.toFixed(2)} ({m.percentOfTotal}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.cost.daily.length > 0 && (
            <div className="text-sm">
              <strong>Daily:</strong>
              <ul className="list-disc list-inside mt-1">
                {report.cost.daily.slice(-7).map((d) => (
                  <li key={d.date}>
                    {d.date}: ${d.cost.toFixed(2)} (in: {d.input.toLocaleString()}, out: {d.output.toLocaleString()} tokens)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Read-only shared report. Generated by Mission Control.
      </p>
    </div>
  );
}
