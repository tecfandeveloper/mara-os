import { NextRequest, NextResponse } from "next/server";
import {
  saveSharedToken,
  getSharedExperiment,
  generateToken,
  getExperiment,
} from "@/lib/playground-db";

const SHARED_EXPIRY_DAYS = 30;

/**
 * POST: Create a shareable link for an experiment.
 * Body: { experimentId: string }
 * Returns: { token, url, expiresAt }
 */
export async function POST(request: NextRequest) {
  let body: { experimentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const experimentId =
    typeof body.experimentId === "string" ? body.experimentId.trim() : "";
  if (!experimentId) {
    return NextResponse.json(
      { error: "Missing experimentId" },
      { status: 400 }
    );
  }

  const experiment = getExperiment(experimentId);
  if (!experiment) {
    return NextResponse.json(
      { error: "Experiment not found" },
      { status: 404 }
    );
  }

  const token = generateToken();
  const { expiresAt } = saveSharedToken(token, experimentId, SHARED_EXPIRY_DAYS);
  const origin = request.nextUrl.origin;
  const url = `${origin}/p/${token}`;

  return NextResponse.json({ token, url, expiresAt });
}
