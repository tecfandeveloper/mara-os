"use client";

import { useEffect, useState } from "react";
import { Smile, Flame, Calendar } from "lucide-react";

type MoodState = "productivo" | "ocupado" | "idle" | "frustrado";

interface TrendDay {
  day: string;
  count: number;
  success: number;
  errors: number;
}

interface DailyCost {
  date: string;
  cost: number;
  input: number;
  output: number;
}

const MOOD_CONFIG: Record<
  MoodState,
  { label: string; emoji: string; color: string; bg: string }
> = {
  productivo: {
    label: "Productivo",
    emoji: "🚀",
    color: "var(--success)",
    bg: "rgba(34,197,94,0.12)",
  },
  ocupado: {
    label: "Ocupado",
    emoji: "💼",
    color: "var(--info, #60a5fa)",
    bg: "rgba(59,130,246,0.12)",
  },
  idle: {
    label: "Idle",
    emoji: "😴",
    color: "var(--text-muted)",
    bg: "rgba(148,163,184,0.12)",
  },
  frustrado: {
    label: "Frustrado",
    emoji: "😤",
    color: "var(--error)",
    bg: "rgba(239,68,68,0.12)",
  },
};

function computeMood(
  today: number,
  success: number,
  error: number,
  trend: TrendDay[]
): MoodState {
  const totalResolved = success + error;
  const errorRate = totalResolved > 0 ? error / totalResolved : 0;

  if (error >= 1 && errorRate >= 0.3) return "frustrado";
  if (today >= 3 && errorRate < 0.2) return "productivo";
  if (today >= 1) return "ocupado";
  return "idle";
}

function computeStreak(trend: TrendDay[]): number {
  const errorsByDay = new Map<string, number>();
  for (const row of trend) {
    errorsByDay.set(row.day, row.errors);
  }
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let d = new Date();
  for (let i = 0; i < 365; i++) {
    const dayStr = d.toISOString().slice(0, 10);
    const errors = errorsByDay.get(dayStr) ?? 0;
    if (errors > 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function MoodDashboard() {
  const [mood, setMood] = useState<MoodState | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/activities/stats").then((r) => r.json()),
      fetch("/api/costs?timeframe=7d").then((r) => r.json()),
    ])
      .then(([stats, costs]) => {
        const trend: TrendDay[] = stats.trend || [];
        const todayCount = stats.today ?? 0;
        const success = stats.byStatus?.success ?? 0;
        const error = stats.byStatus?.error ?? 0;

        setMood(computeMood(todayCount, success, error, trend));
        setStreak(computeStreak(trend));

        const daily: DailyCost[] = costs.daily || [];
        const now = new Date();
        const todayStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const todayEntry = daily.find((d) => d.date === todayStr);
        const tokensToday = todayEntry ? (todayEntry.input || 0) + (todayEntry.output || 0) : 0;
        const hoursElapsed = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        const tokensPerHour = hoursElapsed >= 0.25 ? Math.round(tokensToday / hoursElapsed) : tokensToday;
        setEnergy(tokensPerHour);
      })
      .catch(() => {
        setMood("idle");
        setStreak(0);
        setEnergy(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-xl p-5 animate-pulse"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="h-6 w-24 rounded bg-gray-700 mb-4" />
        <div className="h-12 w-12 rounded-full bg-gray-700 mb-3" />
        <div className="h-4 w-32 rounded bg-gray-700" />
      </div>
    );
  }

  const state = mood ?? "idle";
  const config = MOOD_CONFIG[state];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Smile className="w-5 h-5" style={{ color: "var(--accent)" }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          Mood
        </h3>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <span
            className="mood-emoji text-4xl select-none"
            title={config.label}
          >
            {config.emoji}
          </span>
          <div>
            <div
              className="text-lg font-semibold"
              style={{ color: config.color, fontFamily: "var(--font-heading)" }}
            >
              {config.label}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Estado del agente
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {streak !== null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Flame className="w-4 h-4" style={{ color: "var(--warning)" }} />
                Racha sin errores
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {streak} día{streak !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {energy !== null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Calendar className="w-4 h-4" style={{ color: "var(--accent)" }} />
                Energy (tokens/hora hoy)
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {energy.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
