import { NextResponse } from "next/server";
import { getSharedExperiment } from "@/lib/playground-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const experiment = getSharedExperiment(token);
  if (!experiment) {
    return NextResponse.json(
      { error: "Shared experiment not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json(experiment);
}
