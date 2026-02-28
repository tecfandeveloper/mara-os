import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getReport } from "@/lib/reports-shared";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const report = getReport(token);
  if (!report) {
    return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
  }

  return NextResponse.json(report);
}
