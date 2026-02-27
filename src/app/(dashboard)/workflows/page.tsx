"use client";

import { useEffect, useState, useCallback } from "react";
import { BRANDING } from "@/config/branding";
import { Plus, Pencil, Trash2, Play, X, Save } from "lucide-react";

interface Workflow {
  id: string;
  emoji: string;
  name: string;
  description: string;
  schedule: string;
  steps: string[];
  status: "active" | "inactive";
  trigger: "cron" | "demand";
}

interface WorkflowStepTemplate {
  id: string;
  label: string;
  agentId: string;
  execution: "sequential" | "parallel";
  dependencies: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStepTemplate[];
}

const WORKFLOWS: Workflow[] = [
  {
    id: "social-radar",
    emoji: "🔭",
    name: "Social Radar",
    description: "Monitoriza menciones, oportunidades de colaboración y conversaciones relevantes en redes sociales y foros.",
    schedule: "9:30h y 17:30h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      `Busca menciones de ${BRANDING.twitterHandle} en Twitter/X, LinkedIn e Instagram`,
      "Revisa hilos de Reddit en r/webdev, r/javascript, r/learnprogramming",
      `Detecta oportunidades de colaboración y collabs entrantes (${BRANDING.ownerCollabEmail})`,
      "Monitoriza aprendiendo.dev en conversaciones y menciones",
      "Envía resumen por Telegram si hay algo relevante",
    ],
  },
  {
    id: "noticias-ia",
    emoji: "📰",
    name: "Noticias IA y Web",
    description: "Resume las noticias más relevantes de IA y desarrollo web del timeline de Twitter para arrancar el día informado.",
    schedule: "7:45h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Lee el timeline de Twitter/X via bird CLI",
      "Filtra noticias de IA, web dev, arquitectura y herramientas dev",
      "Selecciona 5-7 noticias más relevantes para el nicho de Carlos",
      "Genera resumen estructurado con enlace y contexto",
      "Envía digest por Telegram",
    ],
  },
  {
    id: "trend-monitor",
    emoji: "🔥",
    name: "Trend Monitor",
    description: "Radar de tendencias urgentes en el nicho tech. Detecta temas virales antes de que exploten para aprovechar la ola de contenido.",
    schedule: "7h, 10h, 15h y 20h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Monitoriza trending topics en Twitter/X relacionados con tech y programación",
      "Busca en Hacker News, dev.to y GitHub Trending",
      "Evalúa si el trend es relevante para el canal de Carlos",
      "Si detecta algo urgente, notifica inmediatamente con contexto",
      "Sugiere ángulo de contenido si el trend tiene potencial",
    ],
  },
  {
    id: "daily-linkedin",
    emoji: "📊",
    name: "Daily LinkedIn Brief",
    description: "Genera el post de LinkedIn del día basado en las noticias más relevantes de Hacker News, dev.to y la web tech.",
    schedule: "9h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Recopila top posts de Hacker News (front page tech/dev)",
      "Revisa trending en dev.to y artículos destacados",
      "Selecciona tema con mayor potencial de engagement para la audiencia de Carlos",
      "Redacta post de LinkedIn en la voz de Carlos (profesional-cercano, sin emojis ni hashtags)",
      "Envía borrador por Telegram para revisión y publicación",
    ],
  },
  {
    id: "newsletter-digest",
    emoji: "📬",
    name: "Newsletter Digest",
    description: "Digest curado de las newsletters del día. Consolida lo mejor de las suscripciones de Carlos en un resumen accionable.",
    schedule: "20h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Accede a Gmail y busca newsletters recibidas en el día",
      "Filtra por remitentes relevantes (tech, IA, productividad, inversiones)",
      "Extrae los puntos clave de cada newsletter",
      "Genera digest estructurado por categorías",
      "Envía resumen por Telegram",
    ],
  },
  {
    id: "email-categorization",
    emoji: "📧",
    name: "Email Categorization",
    description: "Categoriza y resume los emails del día para que Carlos empiece la jornada sin inbox anxiety.",
    schedule: "7:45h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Accede a Gmail y lee emails no leídos del día",
      "Categoriza: urgente / colabs / facturas / universidad / newsletters / otros",
      "Resumen de cada categoría con acción recomendada",
      "Detecta emails de clientes con facturas pendientes (>90 días)",
      "Envía resumen estructurado por Telegram",
    ],
  },
  {
    id: "weekly-newsletter",
    emoji: "📅",
    name: "Weekly Newsletter",
    description: "Recapitulación semanal automática de los tweets y posts de LinkedIn para usar como base de la newsletter.",
    schedule: "Domingos 18h",
    trigger: "cron",
    status: "active",
    steps: [
      `Recopila tweets de la semana (${BRANDING.twitterHandle} via bird CLI)`,
      "Recopila posts publicados en LinkedIn",
      "Organiza por temas y relevancia",
      "Genera borrador de recapitulación semanal en tono newsletter",
      "Envía por Telegram para revisión antes de publicar",
    ],
  },
  {
    id: "advisory-board",
    emoji: "🏛️",
    name: "Advisory Board",
    description: "7 asesores IA con personalidades y memorias propias. Consulta a cualquier advisor o convoca al board completo.",
    schedule: "Bajo demanda",
    trigger: "demand",
    status: "active",
    steps: [
      "Carlos envía /cfo, /cmo, /cto, /legal, /growth, /coach o /producto",
      "Mara carga el skill advisory-board/SKILL.md",
      "Lee el archivo de memoria del advisor correspondiente (memory/advisors/)",
      "Responde en la voz y personalidad del advisor con contexto de Carlos",
      "Actualiza el archivo de memoria con lo aprendido en la consulta",
      "/board convoca los 7 advisors en secuencia y compila un board meeting completo",
    ],
  },
  {
    id: "git-backup",
    emoji: "🔄",
    name: "Git Backup",
    description: "Auto-commit y push del workspace cada 4 horas para garantizar que nada se pierde.",
    schedule: "Cada 4h",
    trigger: "cron",
    status: "active",
    steps: [
      "Comprueba si hay cambios en el workspace de Mara",
      "Si hay cambios: git add -A",
      "Genera mensaje de commit automático con timestamp y resumen de cambios",
      "git push al repositorio remoto",
      "Silencioso si no hay cambios — solo notifica si hay error",
    ],
  },
  {
    id: "nightly-evolution",
    emoji: "🌙",
    name: "Nightly Evolution",
    description: "Sesión autónoma nocturna que implementa mejoras en Mission Control según el ROADMAP o inventa features nuevas útiles.",
    schedule: "3h (cada noche)",
    trigger: "cron",
    status: "active",
    steps: [
      "Lee ROADMAP.md de Mission Control para seleccionar la siguiente feature",
      "Si no hay features claras, analiza el estado actual e inventa algo útil",
      "Implementa la feature completa (código, tests si aplica, UI)",
      "Verifica que el build de Next.js no falla",
      "Notifica a Carlos por Telegram con el resumen de lo implementado",
    ],
  },
];

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: status === "active" ? "var(--positive)" : "var(--text-muted)",
      }} />
      <span style={{
        fontFamily: "var(--font-body)",
        fontSize: "10px",
        fontWeight: 600,
        color: status === "active" ? "var(--positive)" : "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {status === "active" ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}

function TriggerBadge({ trigger }: { trigger: "cron" | "demand" }) {
  return (
    <div style={{
      padding: "2px 7px",
      backgroundColor: trigger === "cron"
        ? "rgba(59, 130, 246, 0.12)"
        : "rgba(168, 85, 247, 0.12)",
      border: `1px solid ${trigger === "cron" ? "rgba(59, 130, 246, 0.25)" : "rgba(168, 85, 247, 0.25)"}`,
      borderRadius: "5px",
      fontFamily: "var(--font-body)",
      fontSize: "10px",
      fontWeight: 600,
      color: trigger === "cron" ? "#60a5fa" : "var(--accent)",
      letterSpacing: "0.4px",
      textTransform: "uppercase" as const,
    }}>
      {trigger === "cron" ? "⏱ Cron" : "⚡ Demanda"}
    </div>
  );
}

function WorkflowTemplateEditor({
  template,
  onSave,
  onClose,
}: {
  template: Partial<WorkflowTemplate> | null;
  onSave: (w: { name: string; description: string; steps: WorkflowStepTemplate[] }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [steps, setSteps] = useState<WorkflowStepTemplate[]>(
    template?.steps?.length ? template.steps : [{ id: crypto.randomUUID(), label: "Step 1", agentId: "main", execution: "sequential", dependencies: [] }]
  );

  const addStep = () => {
    setSteps((s) => [...s, { id: crypto.randomUUID(), label: `Step ${s.length + 1}`, agentId: "main", execution: "sequential", dependencies: [] }]);
  };
  const removeStep = (id: string) => {
    setSteps((s) => s.filter((x) => x.id !== id));
  };
  const updateStep = (id: string, upd: Partial<WorkflowStepTemplate>) => {
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...upd } : x)));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "520px", width: "90%", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", color: "var(--text-primary)" }}>
            {template?.id ? "Edit workflow" : "Create workflow"}
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name"
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Steps</label>
            <button type="button" onClick={addStep} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "var(--card-elevated)", color: "var(--accent)", cursor: "pointer" }}>
              <Plus className="w-3 h-3" /> Add step
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {steps.map((step, i) => (
              <div key={step.id} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                  <input
                    value={step.label}
                    onChange={(e) => updateStep(step.id, { label: e.target.value })}
                    placeholder="Step label"
                    style={{ flex: 1, padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <select
                    value={step.execution}
                    onChange={(e) => updateStep(step.id, { execution: e.target.value as "sequential" | "parallel" })}
                    style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }}
                  >
                    <option value="sequential">Sequential</option>
                    <option value="parallel">Parallel</option>
                  </select>
                  <button type="button" onClick={() => removeStep(step.id)} style={{ padding: "4px", color: "var(--error)" }} aria-label="Remove step">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={step.agentId}
                  onChange={(e) => updateStep(step.id, { agentId: e.target.value })}
                  placeholder="Agent ID (main or subagent)"
                  style={{ width: "100%", padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => name.trim() && onSave({ name: name.trim(), description: description.trim(), steps })}
            disabled={!name.trim()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent)", color: "white", cursor: name.trim() ? "pointer" : "not-allowed" }}
          >
            <Save className="w-4 h-4" /> Save template
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      setTemplates(data.workflows || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSaveTemplate = async (w: { name: string; description: string; steps: WorkflowStepTemplate[] }) => {
    try {
      if (editingTemplate) {
        await fetch(`/api/workflows/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(w),
        });
      } else {
        await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(w),
        });
      }
      await loadTemplates();
      setEditorOpen(false);
      setEditingTemplate(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workflow template?")) return;
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      await loadTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRun = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}/run`, { method: "POST" });
      const data = await res.json();
      setRunMessage(data.message || "Execution not yet available.");
      setTimeout(() => setRunMessage(null), 5000);
    } catch (e) {
      setRunMessage("Failed to call run API.");
      setTimeout(() => setRunMessage(null), 5000);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "24px",
          fontWeight: 700,
          letterSpacing: "-1px",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}>
          Workflows
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
          {WORKFLOWS.filter(w => w.status === "active").length} flujos activos · {WORKFLOWS.filter(w => w.trigger === "cron").length} crons automáticos · {WORKFLOWS.filter(w => w.trigger === "demand").length} bajo demanda
        </p>
      </div>

      {/* Multi-Agent Orchestration Templates */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
          Multi-Agent Orchestration Templates
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
          Create and save workflow templates (tasks, dependencies, parallel/sequential). Execution will be available when OpenClaw supports it.
        </p>
        {runMessage && (
          <div style={{ padding: "10px 14px", marginBottom: "12px", borderRadius: "8px", backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "13px" }}>
            {runMessage}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => { setEditingTemplate(null); setEditorOpen(true); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--accent)", cursor: "pointer", fontSize: "13px" }}
          >
            <Plus className="w-4 h-4" /> Create workflow template
          </button>
        </div>
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading templates…</p>
        ) : templates.length === 0 ? (
          <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--text-muted)", fontSize: "13px" }}>
            No saved templates yet. Create one to define steps, agents, and dependencies.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {templates.map((t) => (
              <div key={t.id} style={{ padding: "16px 20px", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--card)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{t.name}</h3>
                  {t.description && <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>{t.description}</p>}
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.steps.length} steps · Updated {new Date(t.updatedAt).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button type="button" onClick={() => { setEditingTemplate(t); setEditorOpen(true); }} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", cursor: "pointer" }} title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleRun(t.id)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "none", color: "var(--accent)", cursor: "pointer" }} title="Run (not yet available)"><Play className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleDelete(t.id)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "none", color: "var(--error)", cursor: "pointer" }} title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { label: "Total workflows", value: WORKFLOWS.length, color: "var(--text-primary)" },
          { label: "Crons activos", value: WORKFLOWS.filter(w => w.trigger === "cron" && w.status === "active").length, color: "#60a5fa" },
          { label: "Bajo demanda", value: WORKFLOWS.filter(w => w.trigger === "demand").length, color: "var(--accent)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "16px 20px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            minWidth: "140px",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontSize: "28px",
              fontWeight: 700,
              color: stat.color,
              letterSpacing: "-1px",
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow cards (static examples) */}
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Flujos de ejemplo</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {WORKFLOWS.map((workflow) => (
          <div key={workflow.id} style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "var(--surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  border: "1px solid var(--border-strong)",
                  flexShrink: 0,
                }}>
                  {workflow.emoji}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.3px",
                    marginBottom: "2px",
                  }}>
                    {workflow.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TriggerBadge trigger={workflow.trigger} />
                    <StatusBadge status={workflow.status} />
                  </div>
                </div>
              </div>
              {/* Schedule */}
              <div style={{
                padding: "6px 12px",
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}>
                🕐 {workflow.schedule}
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              marginBottom: "16px",
            }}>
              {workflow.description}
            </p>

            {/* Steps */}
            <div style={{
              backgroundColor: "var(--surface-elevated)",
              borderRadius: "10px",
              padding: "12px 16px",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.7px",
                marginBottom: "8px",
              }}>
                Pasos
              </div>
              <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {workflow.steps.map((step, i) => (
                  <li key={i} style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                  }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      {editorOpen && (
        <WorkflowTemplateEditor
          key={editingTemplate?.id ?? "new"}
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => { setEditorOpen(false); setEditingTemplate(null); }}
        />
      )}
    </div>
  );
}
