/**
 * Persist workflow definitions to data/workflows.json
 */
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DATA_PATH = path.join(process.cwd(), "data", "workflows.json");

export interface WorkflowStep {
  id: string;
  label: string;
  agentId: string;
  execution: "sequential" | "parallel";
  dependencies: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStep[];
}

interface WorkflowsFile {
  workflows: Workflow[];
}

async function ensureDir(): Promise<void> {
  const dir = path.dirname(DATA_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function loadWorkflows(): Promise<Workflow[]> {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    const parsed: WorkflowsFile = JSON.parse(data);
    return Array.isArray(parsed.workflows) ? parsed.workflows : [];
  } catch {
    return [];
  }
}

export async function saveWorkflows(workflows: Workflow[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(
    DATA_PATH,
    JSON.stringify({ workflows }, null, 2)
  );
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const workflows = await loadWorkflows();
  return workflows.find((w) => w.id === id) ?? null;
}

export async function createWorkflow(workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">): Promise<Workflow> {
  const workflows = await loadWorkflows();
  const now = new Date().toISOString();
  const newWorkflow: Workflow = {
    ...workflow,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  workflows.push(newWorkflow);
  await saveWorkflows(workflows);
  return newWorkflow;
}

export async function updateWorkflow(id: string, updates: Partial<Omit<Workflow, "id" | "createdAt">>): Promise<Workflow | null> {
  const workflows = await loadWorkflows();
  const idx = workflows.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  workflows[idx] = {
    ...workflows[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveWorkflows(workflows);
  return workflows[idx];
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const workflows = await loadWorkflows();
  const filtered = workflows.filter((w) => w.id !== id);
  if (filtered.length === workflows.length) return false;
  await saveWorkflows(filtered);
  return true;
}
