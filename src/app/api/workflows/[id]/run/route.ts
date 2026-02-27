/**
 * POST /api/workflows/[id]/run
 * Execute workflow. OpenClaw does not yet expose run-workflow; returns "not implemented".
 */
import { NextRequest, NextResponse } from "next/server";
import { getWorkflowById } from "@/lib/workflows-store";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = await getWorkflowById(id);
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json(
    {
      success: false,
      message: "Workflow execution is not yet integrated with OpenClaw. Define and save templates for now.",
      workflowId: id,
    },
    { status: 501 }
  );
}
