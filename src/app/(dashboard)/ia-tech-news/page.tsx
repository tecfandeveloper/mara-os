"use client";

import { useState, useMemo } from "react";
import {
  Filter,
  Newspaper,
  FileEdit,
  BookOpen,
  CheckCircle2,
  Clock,
  Linkedin,
  Twitter,
  Trash2,
  Layers,
} from "lucide-react";
import { format, subDays, startOfDay, isToday } from "date-fns";
import { es } from "date-fns/locale";

// --- Types (solo interfaz, sin backend) ---

type DatePreset = "hoy" | "ayer" | "rango";
type Canal = "X" | "LinkedIn" | "Ambos";
type EstadoBorrador = "pendiente_redacción" | "borrador_en_obsidian" | "revisado_por_kike";

const FUENTES = ["Web", "Newsletter", "X", "RSS", "Otro"] as const;
const TEMAS = ["LLMs", "Agentes", "DevTools", "Infra", "Negocio", "IA", "Otro"] as const;

interface NewsItem {
  id: string;
  titulo: string;
  fuente: string;
  fecha: string; // ISO
  resumen: string;
  temas: string[];
  marcadoPara?: Canal | "Ambos";
  descartada?: boolean;
}

interface DraftEntry {
  id: string;
  newsId: string;
  tituloNoticia: string;
  canal: Canal;
  estado: EstadoBorrador;
  obsidianRef: string; // ruta o nombre de nota (placeholder)
}

const ESTADO_LABELS: Record<EstadoBorrador, string> = {
  pendiente_redacción: "Pendiente redacción",
  borrador_en_obsidian: "Borrador en Obsidian",
  revisado_por_kike: "Revisado por Kike",
};

// --- Page component ---

export default function IATechNewsPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("hoy");
  const [startDate, setStartDate] = useState(format(startOfDay(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterFuente, setFilterFuente] = useState<string>("");
  const [filterTema, setFilterTema] = useState<string>("");

  const [news, setNews] = useState<NewsItem[]>([]);
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [showDescartadas, setShowDescartadas] = useState(false);

  // Filtrado por fecha (lógica local para la UI)
  const filteredNews = useMemo(() => {
    let list = news.filter((n) => !n.descartada);
    if (showDescartadas) {
      list = news.filter((n) => n.descartada);
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((n) => {
        const d = new Date(n.fecha);
        return d >= start && d <= end;
      });
    }
    if (filterFuente) list = list.filter((n) => n.fuente === filterFuente);
    if (filterTema) list = list.filter((n) => n.temas.includes(filterTema));
    return list;
  }, [news, showDescartadas, startDate, endDate, filterFuente, filterTema]);

  const noticiasHoy = useMemo(() => {
    const hoy = startOfDay(new Date());
    return news.filter((n) => !n.descartada && isToday(new Date(n.fecha))).length;
  }, [news]);
  const marcadasParaContenido = useMemo(
    () => news.filter((n) => !n.descartada && (n.marcadoPara === "X" || n.marcadoPara === "LinkedIn" || n.marcadoPara === "Ambos")).length,
    [news]
  );
  const pendientesDecision = useMemo(
    () => news.filter((n) => !n.descartada && !n.marcadoPara && isToday(new Date(n.fecha))).length,
    [news]
  );

  const handleMarcarX = (item: NewsItem) => {
    setNews((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, marcadoPara: "X" as Canal } : n))
    );
    setDrafts((prev) => {
      const existing = prev.find((d) => d.newsId === item.id && d.canal === "X");
      if (existing) return prev;
      return [
        ...prev,
        {
          id: `d-${item.id}-x-${Date.now()}`,
          newsId: item.id,
          tituloNoticia: item.titulo,
          canal: "X",
          estado: "pendiente_redacción" as EstadoBorrador,
          obsidianRef: `Content/IA/${item.titulo.slice(0, 30).replace(/\s+/g, "-")}.md`,
        },
      ];
    });
  };

  const handleMarcarLinkedIn = (item: NewsItem) => {
    setNews((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, marcadoPara: "LinkedIn" as Canal } : n))
    );
    setDrafts((prev) => {
      const existing = prev.find((d) => d.newsId === item.id && d.canal === "LinkedIn");
      if (existing) return prev;
      return [
        ...prev,
        {
          id: `d-${item.id}-li-${Date.now()}`,
          newsId: item.id,
          tituloNoticia: item.titulo,
          canal: "LinkedIn",
          estado: "pendiente_redacción" as EstadoBorrador,
          obsidianRef: `Content/IA/${item.titulo.slice(0, 30).replace(/\s+/g, "-")}.md`,
        },
      ];
    });
  };

  const handleMarcarAmbos = (item: NewsItem) => {
    setNews((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, marcadoPara: "Ambos" as Canal } : n))
    );
    setDrafts((prev) => {
      const existing = prev.find((d) => d.newsId === item.id && d.canal === "Ambos");
      if (existing) return prev;
      return [
        ...prev,
        {
          id: `d-${item.id}-ambos-${Date.now()}`,
          newsId: item.id,
          tituloNoticia: item.titulo,
          canal: "Ambos",
          estado: "pendiente_redacción" as EstadoBorrador,
          obsidianRef: `Content/IA/${item.titulo.slice(0, 30).replace(/\s+/g, "-")}.md`,
        },
      ];
    });
  };

  const handleDescartar = (item: NewsItem) => {
    setNews((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, descartada: true } : n))
    );
  };

  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === "hoy") {
      setStartDate(format(startOfDay(today), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "ayer") {
      const yesterday = subDays(today, 1);
      setStartDate(format(startOfDay(yesterday), "yyyy-MM-dd"));
      setEndDate(format(yesterday, "yyyy-MM-dd"));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <header className="mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          IA / Tech News
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Filtra noticias, márcalas para contenido y revisa el estado de borradores en Obsidian. Mara y Obsidian se encargan de los borradores.
        </p>
      </header>

      {/* Panel A: Filtros y resumen */}
      <section
        className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Filtros y resumen
          </span>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <span className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>
              Fecha
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(["hoy", "ayer", "rango"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setDatePreset(preset);
                    if (preset !== "rango") applyDatePreset(preset);
                  }}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    backgroundColor: datePreset === preset ? "var(--accent-soft)" : "var(--surface-elevated)",
                    color: datePreset === preset ? "var(--accent)" : "var(--text-secondary)",
                    border: datePreset === preset ? "1px solid var(--accent)" : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  {preset === "hoy" ? "Hoy" : preset === "ayer" ? "Ayer" : "Rango"}
                </button>
              ))}
              {datePreset === "rango" && (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: "0.375rem 0.5rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface-elevated)",
                      color: "var(--text-primary)",
                      fontSize: "0.875rem",
                    }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>–</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: "0.375rem 0.5rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface-elevated)",
                      color: "var(--text-primary)",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>
              Fuente
            </span>
            <select
              value={filterFuente}
              onChange={(e) => setFilterFuente(e.target.value)}
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                minWidth: "120px",
              }}
            >
              <option value="">Todas</option>
              {FUENTES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>
              Tema
            </span>
            <select
              value={filterTema}
              onChange={(e) => setFilterTema(e.target.value)}
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                minWidth: "120px",
              }}
            >
              <option value="">Todos</option>
              {TEMAS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Noticias hoy: <strong style={{ color: "var(--text-primary)" }}>{noticiasHoy}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileEdit className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Marcadas para contenido: <strong style={{ color: "var(--text-primary)" }}>{marcadasParaContenido}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Pendientes de decisión: <strong style={{ color: "var(--text-primary)" }}>{pendientesDecision}</strong>
            </span>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowDescartadas(!showDescartadas)}
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {showDescartadas ? "Ver noticias activas" : "Ver descartadas"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Panel B: Lista de noticias */}
        <section
          className="xl:col-span-2 rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Newspaper className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Lista de noticias
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filteredNews.length === 0 ? (
              <div
                className="py-12 text-center"
                style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
              >
                {showDescartadas ? "No hay noticias descartadas." : "No hay noticias en este rango/filtro."}
              </div>
            ) : (
              filteredNews.map((item) => (
                <article
                  key={item.id}
                  className="p-4"
                  style={{
                    backgroundColor: item.marcadoPara ? "var(--accent-soft)" : undefined,
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <h3
                      className="text-base font-semibold flex-1 min-w-0"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.titulo}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {format(new Date(item.fecha), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                    Fuente: {item.fuente}
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    {item.resumen}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.temas.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: "var(--surface-elevated)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {!showDescartadas && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarcarX(item)}
                        title="Marcar para contenido X"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: item.marcadoPara === "X" || item.marcadoPara === "Ambos" ? "var(--accent-soft)" : "var(--surface-elevated)",
                          color: item.marcadoPara === "X" || item.marcadoPara === "Ambos" ? "var(--accent)" : "var(--text-secondary)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <Twitter className="w-3.5 h-3.5" />
                        Marcar para X
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarcarLinkedIn(item)}
                        title="Marcar para contenido LinkedIn"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: item.marcadoPara === "LinkedIn" || item.marcadoPara === "Ambos" ? "var(--accent-soft)" : "var(--surface-elevated)",
                          color: item.marcadoPara === "LinkedIn" || item.marcadoPara === "Ambos" ? "var(--accent)" : "var(--text-secondary)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        Marcar para LinkedIn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarcarAmbos(item)}
                        title="Ambos canales"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: item.marcadoPara === "Ambos" ? "var(--accent-soft)" : "var(--surface-elevated)",
                          color: item.marcadoPara === "Ambos" ? "var(--accent)" : "var(--text-secondary)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Ambos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDescartar(item)}
                        title="Descartar"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: "var(--surface-elevated)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Descartar
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {/* Panel C: Estado de borradores (Obsidian) */}
        <section
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <BookOpen className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Estado de borradores (Obsidian)
            </span>
          </div>
          <p className="px-4 py-2 text-xs" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
            Mara y Obsidian crean y editan los borradores. Aquí solo se muestra el estado y la referencia a la nota.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-elevated)" }}>
                  <th className="px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    Noticia
                  </th>
                  <th className="px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    Canal
                  </th>
                  <th className="px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    Estado
                  </th>
                  <th className="px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    Nota Obsidian
                  </th>
                </tr>
              </thead>
              <tbody>
                {drafts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      Aún no hay borradores. Marca noticias para X o LinkedIn.
                    </td>
                  </tr>
                ) : (
                  drafts.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-3 py-2 text-sm max-w-[140px]" style={{ color: "var(--text-primary)" }}>
                        {d.tituloNoticia.slice(0, 50)}
                        {d.tituloNoticia.length > 50 ? "…" : ""}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {d.canal}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor:
                              d.estado === "revisado_por_kike"
                                ? "var(--positive-soft)"
                                : d.estado === "borrador_en_obsidian"
                                  ? "var(--info-soft)"
                                  : "var(--warning-soft)",
                            color:
                              d.estado === "revisado_por_kike"
                                ? "var(--positive)"
                                : d.estado === "borrador_en_obsidian"
                                  ? "var(--info)"
                                  : "var(--warning)",
                          }}
                        >
                          {d.estado === "pendiente_redacción" && <Clock className="w-3 h-3" />}
                          {d.estado === "borrador_en_obsidian" && <FileEdit className="w-3 h-3" />}
                          {d.estado === "revisado_por_kike" && <CheckCircle2 className="w-3 h-3" />}
                          {ESTADO_LABELS[d.estado]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {d.obsidianRef}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
