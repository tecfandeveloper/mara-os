"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Puzzle,
  Package,
  FolderOpen,
  ExternalLink,
  FileText,
  X,
  Download,
  Upload,
} from "lucide-react";
import { SectionHeader, MetricCard } from "@/components/TenacitOS";

interface Skill {
  id: string;
  name: string;
  description: string;
  location: string;
  source: "workspace" | "system";
  homepage?: string;
  emoji?: string;
  fileCount: number;
  fullContent: string;
  files: string[];
  agents: string[];
  enabled?: boolean;
}

interface SkillsData {
  skills: Skill[];
}

export default function SkillsPage() {
  const [data, setData] = useState<SkillsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<"all" | "workspace" | "system">("all");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [clawhubSkills, setClawhubSkills] = useState<Array<{ id: string; name: string; description: string; source: string; url?: string }>>([]);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installMessage, setInstallMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateAlling, setUpdateAlling] = useState(false);
  const [updateResults, setUpdateResults] = useState<Record<string, { ok: boolean; message?: string }>>({});

  const fetchSkills = () => {
    return fetch("/api/skills")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ skills: [] }));
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    fetch("/api/skills/clawhub")
      .then((res) => res.json())
      .then((d) => setClawhubSkills(d.skills || []))
      .catch(() => setClawhubSkills([]));
  }, []);

  const handleUpdate = async (skillId?: string) => {
    if (skillId) setUpdatingId(skillId);
    else setUpdateAlling(true);
    setUpdateResults({});
    try {
      const res = await fetch("/api/skills/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skillId ? { id: skillId } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      const next: Record<string, { ok: boolean; message?: string }> = {};
      for (const r of data.results || []) {
        next[r.id] = { ok: r.ok, message: r.message };
      }
      setUpdateResults(next);
      await fetchSkills();
    } catch (e) {
      setUpdateResults({ _error: { ok: false, message: e instanceof Error ? e.message : "Update failed" } });
    } finally {
      setUpdatingId(null);
      setUpdateAlling(false);
    }
  };

  const handleInstall = async (item: { id: string; name: string; url?: string }) => {
    if (!item.url) return;
    setInstallingId(item.id);
    setInstallMessage(null);
    try {
      const res = await fetch("/api/skills/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idOrName: item.id, source: "git", url: item.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Install failed");
      setInstallMessage({ type: "success", text: data.message || "Skill installed." });
      await fetchSkills();
    } catch (e) {
      setInstallMessage({ type: "error", text: e instanceof Error ? e.message : "Install failed" });
    } finally {
      setInstallingId(null);
    }
  };

  const handleToggle = async (skill: Skill) => {
    const nextEnabled = !(skill.enabled !== false);
    setTogglingId(skill.id);
    try {
      const res = await fetch("/api/skills/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skill.id, enabled: nextEnabled }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Toggle failed");
      await fetchSkills();
      setSelectedSkill((prev) => (prev?.id === skill.id ? { ...prev, enabled: nextEnabled } : prev));
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  if (!data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      </div>
    );
  }

  const { skills } = data;

  // Filter skills
  let filteredSkills = skills;

  if (filterSource !== "all") {
    filteredSkills = filteredSkills.filter((s) => s.source === filterSource);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredSkills = filteredSkills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.id.toLowerCase().includes(query)
    );
  }

  // Group by source
  const workspaceSkills = filteredSkills.filter((s) => s.source === "workspace");
  const systemSkills = filteredSkills.filter((s) => s.source === "system");

  const workspaceCount = skills.filter((s) => s.source === "workspace").length;
  const systemCount = skills.filter((s) => s.source === "system").length;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-1px",
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Skills Manager
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Skills disponibles en el sistema OpenClaw
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <MetricCard icon={Puzzle} value={skills.length} label="Total Skills" />
        <MetricCard
          icon={FolderOpen}
          value={workspaceCount}
          label="Workspace Skills"
          changeColor="positive"
        />
        <MetricCard
          icon={Package}
          value={systemCount}
          label="System Skills"
          changeColor="secondary"
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Buscar skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: "40px",
              paddingRight: "16px",
              paddingTop: "12px",
              paddingBottom: "12px",
              borderRadius: "6px",
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
            }}
          />
        </div>

        {/* Source Filter */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setFilterSource("all")}
            style={{
              padding: "12px 20px",
              borderRadius: "6px",
              backgroundColor: filterSource === "all" ? "var(--accent-soft)" : "var(--surface)",
              color: filterSource === "all" ? "var(--accent)" : "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            Todas ({skills.length})
          </button>
          <button
            onClick={() => setFilterSource("workspace")}
            style={{
              padding: "12px 20px",
              borderRadius: "6px",
              backgroundColor: filterSource === "workspace" ? "var(--accent-soft)" : "var(--surface)",
              color: filterSource === "workspace" ? "var(--accent)" : "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            Workspace ({workspaceCount})
          </button>
          <button
            onClick={() => setFilterSource("system")}
            style={{
              padding: "12px 20px",
              borderRadius: "6px",
              backgroundColor: filterSource === "system" ? "var(--accent-soft)" : "var(--surface)",
              color: filterSource === "system" ? "var(--accent)" : "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            System ({systemCount})
          </button>
          <button
            onClick={() => handleUpdate()}
            disabled={updateAlling}
            style={{
              padding: "12px 20px",
              borderRadius: "6px",
              backgroundColor: "var(--surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: updateAlling ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Upload style={{ width: "16px", height: "16px" }} />
            {updateAlling ? "Actualizando…" : "Actualizar todos"}
          </button>
        </div>
      </div>

      {updateResults._error && (
        <p
          style={{
            marginBottom: "16px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-muted)",
            fontSize: "13px",
          }}
        >
          Error: {updateResults._error.message}
        </p>
      )}

      {/* Install from ClawHub */}
      {clawhubSkills.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader label="INSTALAR DESDE CLAWHUB" />
          {installMessage && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: installMessage.type === "success" ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {installMessage.text}
            </p>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            {clawhubSkills.map((item) => {
              const alreadyInstalled = skills.some((s) => s.id === item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: "8px",
                    padding: "16px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.name}
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        marginTop: "4px",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={installingId === item.id || alreadyInstalled}
                    onClick={() => handleInstall(item)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid var(--border)",
                      backgroundColor: alreadyInstalled ? "var(--surface-elevated)" : "var(--accent-soft)",
                      color: alreadyInstalled ? "var(--text-muted)" : "var(--accent)",
                      cursor: alreadyInstalled ? "default" : "pointer",
                    }}
                  >
                    {installingId === item.id ? (
                      <RefreshCw style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Download style={{ width: "14px", height: "14px" }} />
                    )}
                    {alreadyInstalled ? "Instalado" : "Instalar"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills List */}
      {filteredSkills.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <Puzzle
            style={{
              width: "48px",
              height: "48px",
              color: "var(--text-muted)",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--text-secondary)" }}>No se encontraron skills</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Workspace Skills */}
          {workspaceSkills.length > 0 && (filterSource === "all" || filterSource === "workspace") && (
            <div>
              <SectionHeader label="WORKSPACE SKILLS" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                {workspaceSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onClick={() => setSelectedSkill(skill)}
                    onToggle={() => handleToggle(skill)}
                    toggling={togglingId === skill.id}
                    onUpdate={() => handleUpdate(skill.id)}
                    updating={updatingId === skill.id}
                    updateResult={updateResults[skill.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* System Skills */}
          {systemSkills.length > 0 && (filterSource === "all" || filterSource === "system") && (
            <div>
              <SectionHeader label="SYSTEM SKILLS" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                {systemSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onClick={() => setSelectedSkill(skill)}
                    onToggle={() => handleToggle(skill)}
                    toggling={togglingId === skill.id}
                    onUpdate={() => handleUpdate(skill.id)}
                    updating={updatingId === skill.id}
                    updateResult={updateResults[skill.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onToggle={() => handleToggle(selectedSkill)}
          toggling={togglingId === selectedSkill.id}
          onUpdate={() => handleUpdate(selectedSkill.id)}
          updating={updatingId === selectedSkill.id}
          updateResult={updateResults[selectedSkill.id]}
        />
      )}
    </div>
  );
}

// Skill Card Component
function SkillCard({
  skill,
  onClick,
  onToggle,
  toggling,
  onUpdate,
  updating,
  updateResult,
}: {
  skill: Skill;
  onClick: () => void;
  onToggle: () => void;
  toggling: boolean;
  onUpdate: () => void;
  updating: boolean;
  updateResult?: { ok: boolean; message?: string };
}) {
  const enabled = skill.enabled !== false;
  return (
    <div
      style={{
        backgroundColor: enabled ? "var(--surface)" : "var(--surface-elevated)",
        borderRadius: "8px",
        padding: "16px",
        border: `1px solid ${enabled ? "var(--border)" : "var(--border-strong)"}`,
        cursor: "pointer",
        transition: "all 150ms ease",
        opacity: enabled ? 1 : 0.85,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--surface-hover)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = enabled ? "var(--surface)" : "var(--surface-elevated)";
        e.currentTarget.style.borderColor = enabled ? "var(--border)" : "var(--border-strong)";
      }}
      onClick={onClick}
    >
      {/* Skill Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {skill.emoji && (
          <span style={{ fontSize: "24px", flexShrink: 0 }}>{skill.emoji}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            {skill.name}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {skill.description}
          </p>
        </div>
      </div>

      {/* Skill Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <div
            style={{
              backgroundColor:
                skill.source === "workspace" ? "var(--accent-soft)" : "var(--surface-elevated)",
              color: skill.source === "workspace" ? "var(--accent)" : "var(--text-muted)",
              padding: "3px 8px",
              borderRadius: "4px",
              fontFamily: "var(--font-body)",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {skill.source}
          </div>
          {skill.agents && skill.agents.length > 0 && skill.agents.map((agent) => (
            <div
              key={agent}
              style={{
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-secondary)",
                padding: "3px 7px",
                borderRadius: "4px",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                border: "1px solid var(--border)",
              }}
            >
              {agent}
            </div>
          ))}
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              color: "var(--text-muted)",
            }}
          >
            {skill.fileCount} files
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {skill.homepage && (
            <ExternalLink style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            disabled={toggling}
            title={enabled ? "Desactivar" : "Activar"}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              border: "1px solid var(--border)",
              backgroundColor: enabled ? "var(--accent-soft)" : "var(--surface-elevated)",
              color: enabled ? "var(--accent)" : "var(--text-muted)",
              cursor: toggling ? "wait" : "pointer",
            }}
          >
            {toggling ? "…" : enabled ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate();
            }}
            disabled={updating}
            title="Actualizar (git pull)"
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 600,
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              cursor: updating ? "wait" : "pointer",
            }}
          >
            {updating ? "…" : "Actualizar"}
          </button>
        </div>
      </div>
      {updateResult && (
        <div
          style={{
            fontSize: "10px",
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid var(--border)",
            color: updateResult.ok ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {updateResult.ok ? "OK" : updateResult.message}
        </div>
      )}
    </div>
  );
}

// Skill Detail Modal Component
function SkillDetailModal({
  skill,
  onClose,
  onToggle,
  toggling,
  onUpdate,
  updating,
  updateResult,
}: {
  skill: Skill;
  onClose: () => void;
  onToggle: () => void;
  toggling: boolean;
  onUpdate: () => void;
  updating: boolean;
  updateResult?: { ok: boolean; message?: string };
}) {
  const enabled = skill.enabled !== false;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "12px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid var(--border)",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              padding: "8px",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", paddingRight: "40px" }}>
            {skill.emoji && <span style={{ fontSize: "48px" }}>{skill.emoji}</span>}
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {skill.name}
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                {skill.description}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <div className="badge-positive">{skill.source}</div>
                <div className="badge-info">{skill.fileCount} archivos</div>
                <button
                  type="button"
                  onClick={onToggle}
                  disabled={toggling}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                    backgroundColor: enabled ? "var(--accent-soft)" : "var(--surface-elevated)",
                    color: enabled ? "var(--accent)" : "var(--text-muted)",
                    cursor: toggling ? "wait" : "pointer",
                  }}
                >
                  {toggling ? "…" : enabled ? "Activo" : "Desactivado"} — clic para cambiar
                </button>
                <button
                  type="button"
                  onClick={onUpdate}
                  disabled={updating}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface-elevated)",
                    color: "var(--text-secondary)",
                    cursor: updating ? "wait" : "pointer",
                  }}
                >
                  {updating ? "…" : "Actualizar (git pull)"}
                </button>
                {updateResult && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: updateResult.ok ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {updateResult.ok ? "OK" : updateResult.message}
                  </span>
                )}
                {skill.agents && skill.agents.length > 0 && skill.agents.map((agent) => (
                  <div
                    key={agent}
                    style={{
                      backgroundColor: "var(--surface-elevated)",
                      color: "var(--text-secondary)",
                      padding: "3px 10px",
                      borderRadius: "4px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "1px solid var(--border)",
                    }}
                  >
                    @{agent}
                  </div>
                ))}
                {skill.homepage && (
                  <a
                    href={skill.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--accent)",
                      fontSize: "12px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Homepage <ExternalLink style={{ width: "12px", height: "12px" }} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px" }}>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "12px",
            }}
          >
            Archivos ({skill.files.length})
          </h3>
          <div
            style={{
              backgroundColor: "var(--bg)",
              borderRadius: "8px",
              padding: "16px",
              maxHeight: "400px",
              overflow: "auto",
            }}
          >
            {skill.files.map((file) => (
              <div
                key={file}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  padding: "4px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
