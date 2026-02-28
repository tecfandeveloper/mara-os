import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { recordDismissal } from "@/lib/suggestions-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const suggestionId = typeof body.suggestionId === "string" ? body.suggestionId.trim() : null;
    if (!suggestionId) {
      return NextResponse.json({ error: "suggestionId is required" }, { status: 400 });
    }
    const applied = Boolean(body.applied);

    recordDismissal(suggestionId, applied);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[suggestions/dismiss] Error:", error);
    return NextResponse.json({ error: "Failed to record dismissal" }, { status: 500 });
  }
}
