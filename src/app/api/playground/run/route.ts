import { NextRequest, NextResponse } from "next/server";
import { runOpenRouterCompletion } from "@/lib/playground-openrouter";
import { calculateCost, normalizeModelId } from "@/lib/pricing";
import { MODEL_PRICING } from "@/lib/pricing";

const MAX_PROMPT_LENGTH = 32_000;
const MAX_MODELS_PER_RUN = 5;
const RATE_LIMIT_RUNS_PER_MINUTE = 10;

const recentRunTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  while (recentRunTimestamps.length && recentRunTimestamps[0]! < windowStart) {
    recentRunTimestamps.shift();
  }
  if (recentRunTimestamps.length >= RATE_LIMIT_RUNS_PER_MINUTE) {
    return false;
  }
  recentRunTimestamps.push(now);
  return true;
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit()) {
    return NextResponse.json(
      { error: "Too many runs. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: { prompt?: string; modelIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const prompt =
    typeof body.prompt === "string" ? body.prompt.trim() : "";
  const modelIds = Array.isArray(body.modelIds)
    ? body.modelIds.filter((m): m is string => typeof m === "string").slice(0, MAX_MODELS_PER_RUN)
    : [];

  if (!prompt) {
    return NextResponse.json(
      { error: "Missing or empty prompt" },
      { status: 400 }
    );
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt too long (max ${MAX_PROMPT_LENGTH} chars)` },
      { status: 400 }
    );
  }
  if (modelIds.length === 0) {
    return NextResponse.json(
      { error: "At least one model is required" },
      { status: 400 }
    );
  }

  const allowedIds = new Set(MODEL_PRICING.map((p) => p.id));
  const normalized = modelIds.map((id) => normalizeModelId(id)).filter((id) => allowedIds.has(id));
  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "No valid model IDs; use models from MODEL_PRICING" },
      { status: 400 }
    );
  }

  const results = await Promise.all(
    normalized.map((modelId) =>
      runOpenRouterCompletion(modelId, prompt, (mid, i, o) =>
        calculateCost(mid, i, o)
      )
    )
  );

  return NextResponse.json({ results });
}
