# 🦞 Mission Control - Roadmap

Estado actual: **Fases 1–4** completas (incl. Analytics, Cost Tracking, Performance Metrics, alertas de gasto); **5.1** (Terminal), **6.1** (Skills viewer), **7** (SSE + Live Logs), **8.1–8.2** (Office 3D MVP + interacciones), **9.4** (Quick Actions) implementados. Ver resumen al final del documento.

---

## Fase 1: Fundamentos (Semana 1)
> Mejorar lo que ya existe y añadir datos reales

### 1.1 Activity Logger Real
- [x] Crear endpoint POST `/api/activities` para que Tenacitas registre acciones
- [x] Hook en OpenClaw para loguear automáticamente cada tool call (documentado en `docs/api/activities.md` y `docs/openclaw/log-activity.md`; implementación del hook en código OpenClaw)
- [x] Campos: timestamp, type, description, status, duration, tokens_used
- [x] Retención: últimos 30 días

### 1.2 Integración con Cron Real
- [x] Leer cron jobs reales de OpenClaw (`cron list`) — `GET /api/cron` con `openclaw cron list --json --all`
- [x] Mostrar en calendario con próximas ejecuciones — Cron page (CronWeeklyTimeline) + Calendar page (WeeklyCalendar usa `/api/cron`)
- [x] Historial de ejecuciones pasadas — `GET /api/cron/runs?id=<id>`, botón History en CronJobCard

### 1.3 Stats Dashboard
- [x] Contador de actividades por día/semana — Dashboard: Total, Today, This Week; API: `thisWeek` en `GET /api/activities/stats`; Analytics: por día (7 días)
- [x] Tipos de acciones más frecuentes — Dashboard: bloque «Tipos de acciones más frecuentes» (top 5); Analytics: gráfica por tipo
- [x] Tasa de éxito/error — Dashboard: Successful/Errors + bloque «Tasa de éxito / error» (%; éxito/error); Analytics: Success Rate gauge

---

## Fase 2: Memory & Files (Semana 2)
> Gestión visual del workspace

### 2.1 Memory Browser
- [x] Vista árbol de `memory/*.md` y archivos principales
- [x] Editor markdown con preview
- [x] Crear/renombrar/eliminar archivos
- [x] Búsqueda dentro de archivos

### 2.2 File Browser
- [x] Explorador del workspace completo
- [x] Preview de archivos (código, markdown, JSON)
- [x] Descargar archivos
- [x] Upload de archivos

### 2.3 MEMORY.md Viewer
- [x] Vista especial para MEMORY.md con secciones colapsables
- [x] Edición inline
- [x] Historial de cambios (git log)

---

## Fase 3: Cron Manager (Semana 3)
> Control total de tareas programadas

### 3.1 CRUD de Cron Jobs
- [x] Listar todos los jobs con estado (ya existía)
- [x] Crear nuevo job con form visual — CronJobModal wired a `POST /api/cron`; botón "Create job" en cron page
- [x] Editar job existente — botón Edit en CronJobCard; modal + `PUT /api/cron` con name, schedule, timezone, description
- [x] Eliminar job (con confirmación)
- [x] Activar/desactivar job

### 3.2 Cron Builder Visual
- [x] Selector de frecuencia: diario, semanal, mensual, custom (en CronJobModal)
- [x] Preview de próximas 5 ejecuciones (en CronJobModal)
- [x] Selector de timezone (en CronJobModal)
- [x] Templates predefinidos (en CronJobModal)

### 3.3 Historial de Ejecuciones
- [x] ~~Re-ejecutar manualmente~~ → **"Run Now" button** en CronJobCard (llama a `POST /api/cron/run`)
- [x] **Run History inline** → botón History en CronJobCard, llama a `GET /api/cron/runs?id=<id>`
- [x] Filtrar historial por fecha (7d / 30d / All) y estado (All / Success / Error) en CronJobCard
- [x] Log con output completo — fila expandible con error + output en panel History; API runs devuelve `output` si existe

### 3.4 Weekly Timeline View ✅ (nuevo — 2026-02-19)
- [x] Vista tipo calendario de 7 días
- [x] Eventos de cron posicionados por día con hora exacta
- [x] Jobs de intervalo mostrados como "recurring" con dashed border
- [x] Leyenda de colores por job
- [x] Toggle Cards / Timeline en header
- [x] Componente: `CronWeeklyTimeline.tsx`
- [x] Nuevas rutas API: `POST /api/cron/run`, `GET /api/cron/runs`

**Phase 3 completion (2026-02-27):**
- **API:** `POST /api/cron` (create job via `openclaw cron add`), `PUT /api/cron` extendido (edit name/schedule/tz/description con `openclaw cron edit` + enable/disable)
- **Cron page:** Modal create/edit con `CronJobModal`, botón "Create job", `onEdit` abre modal con job; `handleSaveJob` llama POST o PUT y refresca lista
- **CronJobCard:** Botón Edit; History con filtros por fecha (7d/30d/All) y estado (All/Success/Error); filas expandibles con log completo (error + output)
- **Archivos:** MODIFIED: `src/app/api/cron/route.ts`, `src/app/api/cron/runs/route.ts`, `src/app/(dashboard)/cron/page.tsx`, `src/components/CronJobModal.tsx`, `src/components/CronJobCard.tsx`

---

## Fase 4: Analytics (Semana 4)
> Visualización de datos

### 4.1 Gráficas de Uso ✅
- [x] Actividad por hora del día (heatmap) — `HourlyHeatmap` en Analytics
- [x] Actividad por día (line chart) — `ActivityLineChart`, tendencia 7 días
- [x] Tipos de tareas (pie chart) — `ActivityPieChart`
- [x] Tendencia semanal — stats + byDay en `/api/analytics`
- [x] Tasa de éxito (gauge) — `SuccessRateGauge`

### 4.2 Cost Tracking ✅
- [x] Estimación de coste por modelo — `/api/costs`, `src/lib/pricing.ts`
- [x] Coste acumulado diario/mensual — Costs page: today, yesterday, thisMonth, lastMonth, projected
- [x] Por agente y por modelo — byAgent, byModel, daily, hourly (Recharts)
- [x] Budget y alertas visuales — barra de presupuesto con colores (success/warning/error)
- [x] Alertas de gasto automáticas — notificaciones al 80% y 100% del presupuesto (`src/lib/notifications-server.ts`, integrado en `/api/costs`)

### 4.3 Performance Metrics ✅
- [x] Tiempo promedio de respuesta — `/api/analytics` (`averageResponseTimeMs`), card en Analytics
- [x] Tasa de éxito por tipo de tarea — `successRateByType` en API, tabla en Analytics
- [x] Uptime del agente — `uptimeSeconds` (process.uptime) en API, card "Server uptime" en Analytics

---

## Fase 5: Comunicación (Semana 5)
> Interacción bidireccional

### 5.1 Command Terminal ✅
- [x] Input para enviar mensajes/comandos — Terminal page + `POST /api/terminal`
- [x] Output de respuesta (stdout/stderr, duration)
- [x] Historial de comandos — cmdHistory + navegación con flechas
- [x] Shortcuts para comandos frecuentes — QUICK_COMMANDS (df, free, uptime, git status, etc.)

### 5.2 Notifications Log ✅
- [x] Lista de mensajes enviados por canal (Telegram, etc.) — `GET /api/notifications-log`, actividades `message_sent`
- [x] Filtrar por fecha, canal, tipo — presets (Hoy, 7d, 30d, Todo), dropdown canal y estado
- [x] Preview del mensaje — columna preview (truncada) + panel expandible con mensaje completo
- [x] Estado de entrega — badge Entregado / Error / Pendiente / Enviando según `status`
- **Página:** `src/app/(dashboard)/notifications-log/page.tsx`; **API:** `src/app/api/notifications-log/route.ts`; **Nav:** Sidebar + Dock

### 5.3 Session History ✅ (nuevo — 2026-02-21)
- [x] **Lista de sesiones** → todas las sesiones de OpenClaw (main, cron, subagent, chats)
- [x] **Tipos visuales** → badges con emoji 🦞 Main / 🕐 Cron / 🤖 Sub-agent / 💬 Direct
- [x] **Token counter** → total tokens + barra de contexto (% usado) con color-coding
- [x] **Model badge** → modelo mostrado (Sonnet 4.5, Opus 4.6, etc.)
- [x] **Age display** → "2 hours ago", "3 days ago" con date-fns
- [x] **Transcript viewer** → slide-in panel con mensajes del JSONL real
- [x] **Bubbles UI** → user/assistant/tool_use/tool_result con diferentes estilos
- [x] **Filter tabs** → All / Main / Cron / Sub-agents / Chats con contador
- [x] **Búsqueda** → filtro por key/model
- [x] **Stats cards** → Total sessions, Total tokens, Cron runs, Models used
- [x] **Sidebar + Dock** → añadido a navegación (icono History)
- **Archivos:**
  - NEW: `src/app/api/sessions/route.ts`
  - NEW: `src/app/(dashboard)/sessions/page.tsx`
  - MODIFIED: `src/components/Sidebar.tsx` (añadida entrada Sessions)
  - MODIFIED: `src/components/TenacitOS/Dock.tsx` (añadida entrada Sessions)

### 5.4 Notifications System ✅ (nuevo — 2026-02-20)
- [x] **API de notificaciones** → `GET/POST/PATCH/DELETE /api/notifications`
- [x] **NotificationDropdown component** → Bell icon en TopBar con dropdown funcional
- [x] **Unread count badge** → Contador de notificaciones no leídas
- [x] **Notificación types** → info, success, warning, error con iconos y colores
- [x] **Mark as read/unread** → Individual o todas
- [x] **Delete notifications** → Individual o clear all read
- [x] **Links** → Notificaciones pueden tener links a páginas internas
- [x] **Auto-refresh** → Poll cada 30 segundos
- [x] **Integración con cron** → Cron Run Now genera notificación
- [x] **Storage** → JSON file en `data/notifications.json` (hasta 100 notificaciones)
- **Archivos:**
  - NEW: `src/app/api/notifications/route.ts`
  - NEW: `src/components/NotificationDropdown.tsx`
  - MODIFIED: `src/components/TenacitOS/TopBar.tsx`
  - MODIFIED: `src/app/api/cron/run/route.ts` (integración)

---

## Fase 6: Configuración (Semana 6)
> Admin del sistema

### 6.1 Skills Manager ✅ (parcial)
- [x] Lista de skills instalados — Skills page + `GET /api/skills`
- [x] Ver SKILL.md de cada uno — fullContent, panel lateral con Markdown
- [x] Filtro por fuente (workspace / system) y búsqueda
- [ ] Activar/desactivar (futuro)
- [ ] Instalar desde ClawHub (futuro)
- [ ] Actualizar skills (futuro)

### 6.2 Integration Status
- [ ] Estado de conexiones (Twitter, Gmail, etc.)
- [ ] Última actividad por integración
- [ ] Test de conectividad
- [ ] Reautenticar si necesario

### 6.3 Config Editor
- [ ] Ver configuración actual de OpenClaw
- [ ] Editar valores seguros
- [ ] Validación antes de guardar
- [ ] Reiniciar gateway si necesario

---

## Fase 7: Real-time (Semana 7)
> SSE y notificaciones live

### 7.1 Live Activity Stream ✅ (SSE)
- [x] SSE connection — `GET /api/activities/stream`
- [ ] Integración en Dashboard/Activity feed en tiempo real (opcional)
- [ ] Indicador "Tenacitas está trabajando..." (futuro)
- [ ] Toast notifications (futuro)

### 7.2 Live Logs ✅
- [x] Stream de logs en tiempo real — Logs page + `GET /api/logs/stream?service=&backend=`
- [x] Servicios: mission-control, classvault, content-vault, brain, postiz, openclaw-gateway (systemd/pm2)
- [x] Start/Stop stream, filtro de texto, auto-scroll, descarga
- [ ] Heartbeat del agente (parcial vía System)
- [ ] CPU/memoria del VPS (parcial en System/Quick Actions)
- [ ] Cola de tareas pendientes (futuro)

---

## Fase 8: The Office 3D 🏢 (Semanas 8-10)
> Entorno 3D navegable que simula una oficina virtual donde trabajan los agentes

### 8.1 MVP - Oficina Básica (Semana 8) ✅
- [x] Sala 3D con React Three Fiber + escritorios — `Office3D`, `AgentDesk`, `Floor`, `Walls`, `Lights`
- [x] Navegación orbit + FPS — `OrbitControls`, `FirstPersonControls` (WASD + mouse)
- [x] Monitors mostrando estado: Working/Idle — `AgentDesk` + datos de `/api/office`
- [x] Click en escritorio → panel lateral con activity feed — `AgentPanel`
- [x] Iluminación (Sky, Environment, Lights)
- [x] Avatares con emoji — `MovingAvatar`, `AGENTS` config

### 8.2 Interactions & Ambient (Semana 9) ✅ (parcial)
- [x] Avatares animados — `MovingAvatar`
- [x] Click en objetos: archivador→Memory, pizarra→Roadmap, café→Mood — `FileCabinet`, `Whiteboard`, `CoffeeMachine`, `PlantPot`, `WallClock`
- [ ] Sub-agents como "visitantes"
- [ ] Trail visual parent ↔ sub-agent
- [ ] Efectos visuales (partículas, humo, beam)
- [ ] Sonido ambiental toggleable

### 8.3 Multi-Floor Building (Semana 10)
- [ ] 4 plantas navegables con ascensor:
  - Planta 1: Main Office (agentes principales)
  - Planta 2: Server Room (DBs, VPS, integrations)
  - Planta 3: Archive (logs, memories históricas)
  - Azotea: Control Tower (dashboard gigante)
- [ ] Customization: temas (modern, retro, cyberpunk, matrix)
- [ ] Modos especiales (Focus, God Mode, Cinematic)

**Datos en tiempo real:**
- `/api/agents/status` - estado de cada agente
- `/api/activities` - activity feed
- `/api/subagents` - sub-agentes activos
- Polling cada 2-5 segundos

---

## Fase 9: Agent Intelligence (Semana 11)
> Features experimentales y visualizaciones avanzadas (complementan "The Office")

### 9.1 Agent Mood Dashboard
- [ ] Widget de "estado de ánimo" basado en métricas recientes
- [ ] Indicadores visuales: productivo, ocupado, idle, frustrado (muchos errores)
- [ ] Streak counter: días consecutivos sin errores críticos
- [ ] "Energy level" basado en tokens/hora
- [ ] Emoji animado que cambia según el estado

### 9.2 Token Economics
- [ ] Vista detallada de consumo por modelo (Opus, Sonnet, Haiku, etc.)
- [ ] Breakdown: input tokens vs output tokens vs cache
- [ ] Comparativa: "Hoy vs ayer", "Esta semana vs la pasada"
- [ ] Proyección de gasto mensual
- [ ] Top 5 tareas que más tokens consumen
- [ ] Efficiency score: output útil / tokens totales

### 9.3 Knowledge Graph Viewer
- [ ] Visualización de conceptos/entidades en MEMORY.md y brain
- [ ] Grafo interactivo con nodes y links
- [ ] Click en un nodo → muestra snippets relacionados
- [ ] Clustering por temas
- [ ] Búsqueda visual
- [ ] Export a imagen

### 9.4 Quick Actions Hub ✅
- [x] Panel de botones para acciones frecuentes — Actions page + `POST /api/actions`:
  - Check Heartbeat, Git Status (all repos), Collect Usage Stats
  - Restart Gateway, Clear Temp Files, NPM Security Audit
- [x] Resultado por acción (output, duration, status success/error)
- [x] One-click execution con confirmación para acciones peligrosas (restart gateway, clear temp)

### 9.5 Model Playground
- [ ] Input un prompt
- [ ] Seleccionar múltiples modelos para comparar
- [ ] Ver respuestas lado a lado
- [ ] Mostrar tokens/coste/tiempo de cada uno
- [ ] Guardar experimentos
- [ ] Share results (copy link)

### 9.6 Smart Suggestions Engine
- [ ] Analiza patrones de uso
- [ ] Sugiere optimizaciones:
  - "Usas mucho Opus para tareas simples, prueba Sonnet"
  - "Muchos errores en cron X, revisar configuración"
  - "Heartbeats muy frecuentes, considera reducir intervalo"
  - "Token usage alto en horario Y, programar tareas pesadas en horario valle"
- [ ] Tarjetas de sugerencia con botón "Apply" o "Dismiss"
- [ ] Learn from dismissals

---

## Fase 10: Sub-Agent Orchestra (Semana 12) ✅
> Gestión y visualización de multi-agent workflows

### 10.1 Sub-Agent Dashboard ✅
- [x] Lista de sub-agentes activos en tiempo real — `GET /api/subagents`, página `/subagents`
- [x] Estado: running, completed, failed (derivado de ageMs/aborted)
- [x] Task description y progreso — nombre/emoji desde config; context used % como progreso
- [x] Modelo usado — por sesión
- [x] Tokens consumidos por cada uno — input/output/total
- [x] Timeline de spawns/completions — bloque ordenado por updatedAt; enlace Ver transcript
- **Archivos:** `src/app/api/subagents/route.ts`, `src/app/(dashboard)/subagents/page.tsx`; Sidebar + Dock

### 10.2 Agent Communication Graph ✅
- [x] Visualización entre main agent y sub-agents — nodos Main + subagents, aristas con tokens
- [x] Flow diagram (grafo) — `AgentGraph.tsx` (SVG); `GET /api/subagents/graph`
- [x] Ver contenido al hacer click — panel lateral con enlace a Session History
- [x] Filtrar por fecha — startDate/endDate en API y página
- **Página:** `/agent-graph`; **API:** `src/app/api/subagents/graph/route.ts`

### 10.3 Multi-Agent Orchestration ✅
- [x] Crear workflows visuales — editor en Workflows page (nombre, descripción, steps)
- [x] Dependencies entre tasks — steps con dependencies (array de step ids)
- [x] Parallel vs sequential execution — campo execution por step
- [x] Template workflows guardables — CRUD `GET/POST/PUT/DELETE /api/workflows`, `data/workflows.json`
- [x] Run endpoint — `POST /api/workflows/[id]/run` (501 hasta integración OpenClaw)
- **Archivos:** `src/lib/workflows-store.ts`, `src/app/api/workflows/route.ts`, `src/app/api/workflows/[id]/route.ts`, `src/app/(dashboard)/workflows/page.tsx`

---

## Fase 11: Advanced Visualizations (Semana 13)
> Porque los dashboards cool tienen gráficas cool

### 11.1 3D Workspace Explorer
- [ ] Vista 3D del árbol de archivos
- [ ] Tamaño de nodos = tamaño de archivo
- [ ] Color = tipo de archivo
- [ ] Navigate con mouse
- [ ] Click → preview/edit
- [ ] Wow factor 📈

### 11.2 Heatmaps Interactivos
- [ ] Actividad por hora del día (24x7 grid)
- [ ] Hover → detalles de ese slot
- [ ] Click → filtrar activity feed a ese rango
- [ ] Export a imagen

### 11.3 Sankey Diagrams
- [ ] Flow de tokens: input → cache → output
- [ ] Flow de tareas: type → status
- [ ] Flow de tiempo: hora → actividad → resultado

### 11.4 Word Cloud de Memories
- [ ] Palabras más frecuentes en MEMORY.md
- [ ] Tamaño = frecuencia
- [ ] Click en palabra → buscar en memories
- [ ] Animated on hover

---

## Fase 12: Collaboration (Semana 14)
> Share y trabajo en equipo

### 12.1 Shareable Reports
- [ ] Generar report de actividad semanal/mensual
- [ ] Export a PDF
- [ ] Share link público (read-only)
- [ ] Custom date ranges

### 12.2 Team Dashboard (futuro)
- [ ] Multi-user support
- [ ] Ver actividad de otros agentes
- [ ] Compare performance
- [ ] Shared memory bank

---

## Funcionalidades adicionales implementadas

> Páginas y APIs añadidas fuera de las fases originales

- **Autenticación** — Login page (`/login`), `POST /api/auth/login`, `POST /api/auth/logout`
- **Git** — Git page con status por repo, `GET /api/git`, `GET /api/git/log`
- **Search** — Búsqueda global en workspace, `/search` + `GET /api/search`
- **System** — System page: info, stats, services, monitor — `/api/system`, `/api/system/stats`, `/api/system/services`, `/api/system/monitor`
- **Workflows** — Workflows page (`/workflows`) para gestión de flujos
- **Reports** — Reports page: listar y previsualizar reportes (markdown) desde disco, `GET /api/reports`
- **Calendar** — Calendar page con vista semanal y eventos de cron (`/api/cron`)
- **Settings** — Settings page (`/settings`)
- **About** — About page con branding del agente (`/about`)

---

## Stack Técnico

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 16 + App Router + React 19 |
| Styling | Tailwind v4 (latest) |
| Charts | Recharts (básicos) + D3.js (avanzados) |
| Editor | Monaco Editor (code) + TipTap (markdown) |
| Real-time | Server-Sent Events (SSE) o Socket.io |
| 3D Graphics | Three.js o React Three Fiber |
| Graphs/Networks | Cytoscape.js o Vis.js |
| Animations | Framer Motion |
| Storage | JSON files + **better-sqlite3** (activities.db, usage-tracking.db) → PostgreSQL (futuro multi-user) |
| AI Integration | OpenClaw API + direct model calls para suggestions |
| PDF Generation | jsPDF o Puppeteer |

---

## Prioridad Recomendada

### Tier 0: The Flagship 🚀 (Requested by Carlos) ✅ MVP listo
**Fase 8: The Office 3D** - Entorno 3D inmersivo donde visualizar agentes trabajando
- ~~MVP (8.1)~~ ✅ Hecho
- ~~Interactions (8.2) parcial~~ ✅ Objetos clickeables (archivador, pizarra, café)
- Multi-Floor (8.3) es opcional/futuro

### Tier 1: Core Functionality (Must Have) ✅
1. **Fase 1** - Activity Logger Real ✅
2. **Fase 3** - Cron Manager completo ✅
3. **Fase 2** - Memory Browser ✅

### Tier 2: High Value (Should Have) — mayoría hecha
4. **Fase 5** - Command Terminal ✅ + Session History ✅ + Notifications Log ✅
5. **Fase 9.4** - Quick Actions Hub ✅
6. **Fase 10** - Sub-Agent Orchestra (Dashboard, Agent Graph, Multi-Agent Orchestration) ✅

### Tier 3: Intelligence & Insights (Nice to Have)
7. **Fase 4** - Analytics básicos → métricas ✅
8. **Fase 9.2** - Token Economics → optimización de costes
9. **Fase 9.6** - Smart Suggestions → IA que se auto-mejora

### Tier 4: Advanced Features (Wow Factor)
10. **Fase 9.3** - Knowledge Graph → visualización avanzada
11. **Fase 11.2** - Heatmaps Interactivos → análisis visual
12. **Fase 10.2** - Agent Communication Graph ✅

### Tier 5: Polish & Experimental (Future)
13. **Fase 7** - Real-time updates → UX premium
14. **Fase 11.1** - 3D Workspace Explorer (no-office) → alternativa visual
15. **Fase 12** - Collaboration → equipo/público

### Tier 6: Admin & Config (When Needed)
16. **Fase 6** - Skills Manager + Config Editor → cuando sea necesario

**Nota:** The Office 3D (Fase 8) es la feature flagship. Priorizar su MVP antes que otras fases avanzadas.

---

*Creado: 2026-02-07*
*Última actualización: 2026-02-27*

**Resumen de estado:** Fases 1–5 y 10 completas. Fase 10: Sub-Agent Dashboard, Agent Communication Graph, Multi-Agent Orchestration (templates + CRUD; ejecución pendiente de OpenClaw). Fase 6.1 Skills (lista + viewer). Fase 7 (SSE + Live Logs). Fase 8 (Office 3D MVP + interacciones parciales). Fase 9.4 Quick Actions. Session History, Notifications, Auth, Git, Search, System, Workflows, Reports, Calendar, Settings y About implementados.
