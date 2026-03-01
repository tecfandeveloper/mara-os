"use client";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  model: string;
  allowAgents: string[];
  status: "online" | "offline";
  activeSessions: number;
}

interface AgentOrganigramaProps {
  agents: Agent[];
}

const roleById: Record<string, string> = {
  main: "Orquestadora",
  mara: "Orquestadora",
  atlas: "Asistente personal",
  arvis: "Creatividad y contenido",
  scout: "Investigación",
};

const capabilitiesById: Record<string, string[]> = {
  main: ["Routing", "Priorización", "QA"],
  mara: ["Routing", "Priorización", "QA"],
  atlas: ["Calendario", "Notas", "Tareas"],
  arvis: ["Ideas", "Copies", "Optimización"],
  scout: ["Research", "Síntesis", "Comparativas"],
};

function getDisplayName(agent: Agent) {
  if (agent.id === "main") return "Mara";
  return agent.name || agent.id;
}

export function AgentOrganigrama({ agents }: AgentOrganigramaProps) {
  if (agents.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        No agents configured
      </div>
    );
  }

  const mara =
    agents.find((a) => a.id === "main") ||
    agents.find((a) => a.id.toLowerCase() === "mara") ||
    agents[0];

  const team = agents.filter((a) => a.id !== mara.id);

  return (
    <div style={{ padding: "1.2rem 1rem 1.4rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.35rem", letterSpacing: "-0.3px" }}>
          Meet the Team
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
          Mara dirige. Atlas, Arvis y Scout ejecutan por especialidad.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <AgentCard agent={mara} featured />
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "0.7rem 0 0.9rem" }}>
        <div style={{ width: 2, height: 28, background: "linear-gradient(180deg, var(--accent), transparent)" }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        {team.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, featured = false }: { agent: Agent; featured?: boolean }) {
  const name = getDisplayName(agent);
  const id = agent.id.toLowerCase();
  const role = roleById[id] || (featured ? "Orquestadora" : "Especialista");
  const caps = capabilitiesById[id] || ["Execution", "Coordination"];
  const isOnline = agent.status === "online";

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${featured ? `${agent.color}66` : "var(--border)"}`,
        borderRadius: 14,
        padding: featured ? "0.95rem" : "0.85rem",
        minHeight: featured ? 155 : 145,
        boxShadow: featured ? `0 0 0 1px ${agent.color}33, 0 10px 30px rgba(0,0,0,0.25)` : "0 8px 20px rgba(0,0,0,0.18)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: `${agent.color}22`,
              border: `1px solid ${agent.color}66`,
              fontSize: 18,
            }}
          >
            {agent.emoji || "🤖"}
          </div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
            <div style={{ color: agent.color, fontSize: "0.76rem", fontWeight: 600 }}>{role}</div>
          </div>
        </div>

        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: isOnline ? "#4ade80" : "#6b7280",
            boxShadow: isOnline ? "0 0 8px #4ade80" : "none",
          }}
          title={isOnline ? "online" : "offline"}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {caps.map((cap) => (
          <span
            key={cap}
            style={{
              fontSize: "0.72rem",
              color: "var(--text-secondary)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              padding: "3px 8px",
              borderRadius: 999,
            }}
          >
            {cap}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: "0.74rem", color: "var(--text-muted)" }}>
        Modelo: {agent.model.split("/").pop() || agent.model}
        {agent.activeSessions > 0 ? ` · ${agent.activeSessions} activas` : ""}
      </div>
    </div>
  );
}
