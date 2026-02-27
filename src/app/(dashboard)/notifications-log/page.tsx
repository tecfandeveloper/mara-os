"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  MessageSquare,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Send,
} from "lucide-react";

interface LogMessage {
  id: string;
  timestamp: string;
  channel: string;
  type: string;
  preview: string;
  deliveryStatus: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsLogResponse {
  messages: LogMessage[];
  channels: string[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const datePresets = [
  { label: "Hoy", days: 0 },
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "Todo", days: -1 },
];

const deliveryStatusConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }>; colorVar: string }
> = {
  success: { label: "Entregado", icon: CheckCircle, colorVar: "var(--success)" },
  error: { label: "Error", icon: XCircle, colorVar: "var(--error)" },
  pending: { label: "Pendiente", icon: Clock, colorVar: "var(--warning)" },
  running: { label: "Enviando", icon: Loader2, colorVar: "var(--info)" },
};

const PREVIEW_MAX = 80;

export default function NotificationsLogPage() {
  const [data, setData] = useState<NotificationsLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const today = new Date();
  const [startDate, setStartDate] = useState<string>(() => format(startOfDay(subDays(today, 7)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(() => format(endOfDay(today), "yyyy-MM-dd"));
  const [activePreset, setActivePreset] = useState<number>(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channel && channel !== "all") params.set("channel", channel);
      if (status && status !== "all") params.set("status", status);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", "50");
      const res = await fetch(`/api/notifications-log?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [channel, status, startDate, endDate]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const applyPreset = (presetIndex: number) => {
    setActivePreset(presetIndex);
    const preset = datePresets[presetIndex];
    if (preset.days === -1) {
      setStartDate("");
      setEndDate("");
      return;
    }
    const today = new Date();
    const end = format(endOfDay(today), "yyyy-MM-dd");
    const start = preset.days === 0
      ? format(startOfDay(today), "yyyy-MM-dd")
      : format(startOfDay(subDays(today, preset.days)), "yyyy-MM-dd");
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="p-4 md:p-8" style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <div className="mb-4 md:mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          Notifications Log
        </h1>
        <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
          Mensajes enviados por canal (Telegram, etc.). Registrados cuando OpenClaw envía con tipo <code>message_sent</code>.
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 mb-4 md:mb-6 flex flex-wrap items-center gap-3 md:gap-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Filtros</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {datePresets.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(i)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activePreset === i ? "var(--accent)" : "var(--card-elevated)",
                color: activePreset === i ? "white" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm" style={{ color: "var(--text-secondary)" }}>Canal</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{ backgroundColor: "var(--card-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <option value="all">Todos</option>
            {(data?.channels ?? []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="text-sm ml-2" style={{ color: "var(--text-secondary)" }}>Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{ backgroundColor: "var(--card-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <option value="all">Todos</option>
            <option value="success">Entregado</option>
            <option value="error">Error</option>
            <option value="pending">Pendiente</option>
            <option value="running">Enviando</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : !data ? (
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <MessageSquare className="w-12 h-12 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-secondary)" }}>No se pudo cargar el log de notificaciones.</p>
        </div>
      ) : data.messages.length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <Send className="w-12 h-12 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-secondary)" }}>No hay mensajes enviados en el rango seleccionado.</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Cuando OpenClaw envíe mensajes (p. ej. por Telegram) y los registre con <code>type: message_sent</code>, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card-elevated)" }}>
                  <th className="text-left py-3 px-4 w-8" />
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-secondary)" }}>Fecha / Hora</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-secondary)" }}>Canal</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-secondary)" }}>Tipo</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-secondary)" }}>Preview del mensaje</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-secondary)" }}>Estado de entrega</th>
                </tr>
              </thead>
              <tbody>
                {data.messages.map((msg) => {
                  const statusCfg = deliveryStatusConfig[msg.deliveryStatus] ?? {
                    label: msg.deliveryStatus,
                    icon: Clock,
                    colorVar: "var(--text-muted)",
                  };
                  const Icon = statusCfg.icon;
                  const isExpanded = expandedId === msg.id;
                  return (
                    <tr
                      key={msg.id}
                      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                      className="hover:opacity-90"
                    >
                        <td className="py-2 px-4">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                          ) : (
                            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                          )}
                        </td>
                        <td className="py-2 px-4" style={{ color: "var(--text-primary)" }}>
                          <div>{format(new Date(msg.timestamp), "dd MMM yyyy")}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{format(new Date(msg.timestamp), "HH:mm:ss")}</div>
                        </td>
                        <td className="py-2 px-4">
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{msg.channel}</span>
                        </td>
                        <td className="py-2 px-4" style={{ color: "var(--text-secondary)" }}>{msg.type}</td>
                        <td className="py-2 px-4 max-w-md" style={{ color: "var(--text-primary)" }}>
                          {msg.preview.length > PREVIEW_MAX ? `${msg.preview.slice(0, PREVIEW_MAX)}…` : msg.preview}
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${statusCfg.colorVar}20`, color: statusCfg.colorVar }}
                          >
                            <Icon size={12} />
                            {statusCfg.label}
                          </span>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.messages.some((m) => expandedId === m.id) && (() => {
            const msg = data.messages.find((m) => m.id === expandedId);
            if (!msg) return null;
            return (
              <div className="p-4 border-t" style={{ borderColor: "var(--border)", backgroundColor: "var(--card-elevated)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Mensaje completo — {msg.channel} · {format(new Date(msg.timestamp), "dd MMM yyyy HH:mm:ss")}</p>
                <pre className="text-sm p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words mb-3" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                  {msg.preview}
                </pre>
                {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                  <>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Metadata</p>
                    <pre className="text-xs p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: "var(--background)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      {JSON.stringify(msg.metadata, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            );
          })()}
          <div className="py-2 px-4 text-xs" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
            {data.total} mensaje{data.total !== 1 ? "s" : ""} en total
          </div>
        </div>
      )}
    </div>
  );
}
