/**
 * GET /api/workflows/[id] — get one workflow
 * PUT /api/workflows/[id] — update workflow
 * DELETE /api/workflows/[id] — delete workflow
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  type WorkflowStep,
} from "@/lib/workflows-store";
import { randomUUID } from "crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = await getWorkflowById(id);
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json(workflow);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = await getWorkflowById(id);
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const updates: Partial<{ name: string; description: string; steps: WorkflowStep[] }> = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (Array.isArray(body.steps)) {
      updates.steps = body.steps.map((s: any) => ({
        id: typeof s.id === "string" ? s.id : randomUUID(),
        label: typeof s.label === "string" ? s.label : "Step",
        agentId: typeof s.agentId === "string" ? s.agentId : "main",
        execution: s.execution === "parallel" ? "parallel" : "sequential",
        dependencies: Array.isArray(s.dependencies) ? s.dependencies : [],
      }));
    }
    const updated = await updateWorkflow(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[workflows] PUT error:", error);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteWorkflow(id);
  if (!ok) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
