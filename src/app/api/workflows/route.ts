/**
 * GET /api/workflows — list all workflows
 * POST /api/workflows — create workflow
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { loadWorkflows, createWorkflow } from "@/lib/workflows-store";

export async function GET() {
  try {
    const workflows = await loadWorkflows();
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("[workflows] GET error:", error);
    return NextResponse.json({ error: "Failed to load workflows" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, steps } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing or invalid name" }, { status: 400 });
    }
    const workflow = await createWorkflow({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      steps: Array.isArray(steps)
        ? steps.map((s: any) => ({
            id: typeof s.id === "string" ? s.id : randomUUID(),
            label: typeof s.label === "string" ? s.label : "Step",
            agentId: typeof s.agentId === "string" ? s.agentId : "main",
            execution: s.execution === "parallel" ? "parallel" : "sequential",
            dependencies: Array.isArray(s.dependencies) ? s.dependencies : [],
          }))
        : [],
    });
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("[workflows] POST error:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
