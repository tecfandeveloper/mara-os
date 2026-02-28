/**
 * OpenRouter API client for Model Playground.
 * Uses OPENROUTER_API_KEY from env. Fallback: OPENROUTER_API_KEY or no-op if missing.
 */

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface PlaygroundRunResult {
  modelId: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  elapsedMs: number;
  error?: string;
}

export async function runOpenRouterCompletion(
  modelId: string,
  prompt: string,
  calculateCost: (modelId: string, input: number, output: number) => number
): Promise<PlaygroundRunResult> {
  const apiKey =
    process.env.OPENROUTER_API_KEY || process.env.PLAYGROUND_OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      modelId,
      text: "",
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      elapsedMs: 0,
      error: "OPENROUTER_API_KEY (or PLAYGROUND_OPENROUTER_API_KEY) not set",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_ORIGIN || "https://mission-control.local",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      error?: { message?: string };
    };

    const elapsedMs = Date.now() - start;

    if (!res.ok || data.error) {
      return {
        modelId,
        text: "",
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        elapsedMs,
        error: data.error?.message || `HTTP ${res.status}`,
      };
    }

    const content =
      data.choices?.[0]?.message?.content ?? "";
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const cost = calculateCost(modelId, inputTokens, outputTokens);

    return {
      modelId,
      text: content,
      inputTokens,
      outputTokens,
      cost,
      elapsedMs,
    };
  } catch (err) {
    const elapsedMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return {
      modelId,
      text: "",
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      elapsedMs,
      error: message,
    };
  }
}
