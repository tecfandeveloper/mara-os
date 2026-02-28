import { NextRequest, NextResponse } from "next/server";
import {
  saveExperiment,
  listExperiments,
  generateId,
  type PlaygroundResult,
} from "@/lib/playground-db";

export async function GET() {
  const list = listExperiments(50);
  return NextResponse.json({ experiments: list });
}

export async function POST(request: NextRequest) {
  let body: { prompt?: string; results?: PlaygroundResult[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof body.prompt === "string" ? body.prompt.trim() : "";
  const results = Array.isArray(body.results) ? body.results : [];

  if (!prompt) {
    return NextResponse.json(
      { error: "Missing or empty prompt" },
      { status: 400 }
    );
  }

  const id = generateId();
  const experiment = saveExperiment(id, prompt, results);
  return NextResponse.json(experiment);
}
