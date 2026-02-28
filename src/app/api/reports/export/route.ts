import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getReport } from "@/lib/reports-shared";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { ReportPdfDocument } from "@/components/ReportPdfDocument";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: "Missing token" },
      { status: 400 }
    );
  }

  const report = getReport(token);
  if (!report) {
    return NextResponse.json(
      { error: "Report not found or expired" },
      { status: 404 }
    );
  }

  try {
    const element = React.createElement(ReportPdfDocument, { report });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);
    const filename = `mission-control-report-${report.startDate}-${report.endDate}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[reports/export] PDF render error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
