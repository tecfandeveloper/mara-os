/**
 * Rule-based Smart Suggestions engine.
 * Consumes aggregated context and returns actionable suggestions.
 */

export type ActionType = "open_config" | "open_cron_edit" | "open_cron_page" | "open_settings" | "open_costs" | "dismiss_only";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: "model" | "cron" | "heartbeat" | "schedule" | "general";
  actionType: ActionType;
  actionPayload?: Record<string, string>;
}

export interface SuggestionsContext {
  activityStats: {
    total: number;
    today: number;
    thisWeek: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  costsByModel: Array<{ model: string; cost: number; percentOfTotal: number }>;
  cronJobs: Array<{ id: string; name: string; enabled?: boolean; nextRun?: string | null }>;
  agents: Array<{ id: string; lastActivity?: string }>;
  analyticsByHour: Array<{ hour: number; day: number; count: number }>;
}

const MODEL_COST_THRESHOLD_PERCENT = 60;
const HEARTBEAT_STALE_MS = 60 * 60 * 1000; // 1 hour
const CRON_SAME_HOUR_WINDOW = 1; // suggest if 2+ crons in same hour
const PEAK_HOUR_MIN_ACTIVITY = 10;

export function runSuggestions(context: SuggestionsContext): Suggestion[] {
  const out: Suggestion[] = [];

  // Model: dominant cost from one model
  if (context.costsByModel.length > 0) {
    const top = context.costsByModel[0];
    if (top.percentOfTotal >= MODEL_COST_THRESHOLD_PERCENT) {
      const cheaper = context.costsByModel.find((m) => m.model.toLowerCase() !== top.model.toLowerCase());
      if (cheaper) {
        out.push({
          id: `model-${top.model.toLowerCase()}-dominant`,
          title: "Cost concentrated in one model",
          description: `${top.model} accounts for ${Math.round(top.percentOfTotal)}% of cost. Consider using ${cheaper.model} for lighter tasks to reduce spend.`,
          category: "model",
          actionType: "open_costs",
          actionPayload: {},
        });
      }
    }
  }

  // Cron: several jobs in same hour
  const nextRunsByHour = new Map<number, number>();
  for (const job of context.cronJobs) {
    if (job.enabled !== false && job.nextRun) {
      try {
        const h = new Date(job.nextRun).getHours();
        nextRunsByHour.set(h, (nextRunsByHour.get(h) || 0) + 1);
      } catch {}
    }
  }
  for (const [hour, count] of nextRunsByHour) {
    if (count >= 2) {
      out.push({
        id: `cron-peak-hour-${hour}`,
        title: "Cron jobs clustered in same hour",
        description: `${count} cron jobs are scheduled around ${hour}:00. Spreading them can avoid load spikes.`,
        category: "cron",
        actionType: "open_cron_page",
        actionPayload: {},
      });
      break; // one suggestion enough
    }
  }

  // Heartbeat: main agent last activity very old
  const mainAgent = context.agents.find((a) => a.id === "main") || context.agents[0];
  if (mainAgent?.lastActivity && context.cronJobs.some((j) => j.enabled !== false)) {
    try {
      const last = new Date(mainAgent.lastActivity).getTime();
      if (Date.now() - last > HEARTBEAT_STALE_MS) {
        out.push({
          id: "heartbeat-gap",
          title: "Agent heartbeat is stale",
          description: `Last activity was over an hour ago and you have active cron jobs. Check connectivity or increase heartbeat frequency.`,
          category: "heartbeat",
          actionType: "open_settings",
          actionPayload: {},
        });
      }
    } catch {}
  }

  // Schedule: clear peak hour from analytics
  if (context.analyticsByHour.length > 0) {
    const byHour = new Map<number, number>();
    for (const { hour, count } of context.analyticsByHour) {
      byHour.set(hour, (byHour.get(hour) || 0) + count);
    }
    let maxHour = 0;
    let maxCount = 0;
    byHour.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });
    if (maxCount >= PEAK_HOUR_MIN_ACTIVITY) {
      out.push({
        id: `schedule-peak-${maxHour}`,
        title: "Activity peak at a specific hour",
        description: `Most activity occurs around ${maxHour}:00. Consider aligning cron jobs to off-peak hours to balance load.`,
        category: "schedule",
        actionType: "open_cron_page",
        actionPayload: {},
      });
    }
  }

  return out;
}
