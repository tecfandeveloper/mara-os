# Estructura del proyecto MaraOS

**MaraOS** es un panel de control (mission control) para agentes OpenClaw: permite monitorizar agentes, trabajos cron, sesiones, costes y memoria, con una vista 3D de “oficina” y actividad en tiempo real. Esta documentación resume cómo está organizado el proyecto y lista todas las apps de la barra lateral.

---

## 1. Estructura general del repositorio

```
mara-os/
├── .cursor/              # Configuración y skills de Cursor
├── .next/                # Build y cache de Next.js (generado)
├── data/                 # Datos locales (SQLite, etc.)
├── docs/                 # Documentación (API, planes, screenshots)
├── public/               # Assets estáticos (modelos 3D, etc.)
├── scripts/              # Scripts de utilidad
├── src/                  # Código fuente principal
│   ├── app/              # Next.js App Router (rutas y layouts)
│   ├── components/       # Componentes React reutilizables
│   ├── config/           # Configuración (branding, etc.)
│   ├── hooks/            # Hooks de React
│   └── lib/              # Utilidades, clientes DB, lógica compartida
├── package.json
├── README.md
├── ROADMAP.md
└── roadmap-office.md
```

---

## 2. Navegación: barra lateral (Dock)

La barra lateral visible en la aplicación es el **Dock** del shell **TenacitOS**, no el componente `Sidebar.tsx`. El layout del dashboard usa:

- **Archivo del Dock:** `src/components/TenacitOS/Dock.tsx`
- **Layout que lo usa:** `src/app/(dashboard)/layout.tsx` (importa `Dock`, `TopBar`, `StatusBar`)

### Apps en la barra lateral (Dock)

Todas las apps que aparecen en el Dock, en orden:

| # | Ruta       | Etiqueta en la barra   | Icono (Lucide)   |
|---|------------|------------------------|------------------|
| 1 | `/`        | Dashboard              | Home             |
| 2 | `/system`  | System Monitor         | Monitor          |
| 3 | `/files`   | Files                  | FolderOpen       |
| 4 | `/memory`  | Memory                 | Brain            |
| 5 | `/agents`  | Agents                 | Bot              |
| 6 | `/office`  | Office                 | Building2        |
| 7 | `/activity`| Activity               | Activity         |
| 8 | `/cron`    | Cron Jobs              | Clock            |
| 9 | `/sessions`| Sessions               | History          |
|10 | `/subagents`| Sub-Agents            | Bot              |
|11 | `/notifications-log` | Notifications Log | MessageSquare |
|12 | `/skills`  | Skills                 | Puzzle           |
|13 | `/costs`   | Costs & Analytics      | DollarSign       |
|14 | `/playground` | Model Playground   | FlaskConical     |
|15 | `/workspace-3d` | Workspace 3D     | Boxes            |
|16 | `/settings`| Settings               | Settings         |

**Total: 16 apps** en el Dock (barra lateral izquierda).

---

## 3. Sidebar (lista alternativa)

Existe además un componente **Sidebar** en `src/components/Sidebar.tsx` con una lista de navegación más larga (`navItems`). En el layout actual del dashboard **no se usa** el Sidebar; solo se usa el Dock. Por referencia, las entradas del Sidebar son:

| # | Ruta       | Etiqueta           |
|---|------------|--------------------|
| 1 | `/`        | Dashboard          |
| 2 | `/agents`  | Agents             |
| 3 | `/office`  | 🎮 Office          |
| 4 | `/actions` | Quick Actions      |
| 5 | `/system`  | System             |
| 6 | `/logs`    | Live Logs          |
| 7 | `/terminal`| Terminal           |
| 8 | `/git`     | Git                |
| 9 | `/workflows`| Workflows         |
|10 | `/activity`| Activity           |
|11 | `/memory`  | Memory             |
|12 | `/files`   | Files              |
|13 | `/cron`    | Cron Jobs          |
|14 | `/sessions`| Sessions           |
|15 | `/subagents`| Sub-Agents        |
|16 | `/agent-graph`| Agent Graph     |
|17 | `/notifications-log`| Notifications Log |
|18 | `/search`  | Search             |
|19 | `/analytics`| Analytics         |
|20 | `/reports` | Reports            |
|21 | `/skills`  | Skills             |
|22 | `/about`   | (nombre del agente)|


---

## 4. Estructura de `src/`

### 4.1 `src/app/` (Next.js App Router)

- **`(dashboard)/`** — Rutas bajo el shell TenacitOS (Dock + TopBar + StatusBar). Incluye:
  - `page.tsx` → Dashboard (`/`)
  - `about/`, `actions/`, `activity/`, `agent-graph/`, `agents/`, `analytics/`, `calendar/`, `costs/`, `cron/`, `files/`, `git/`, `knowledge/`, `logs/`, `memory/`, `notifications-log/`, `playground/`, `reports/`, `sankey/`, `search/`, `sessions/`, `settings/`, `skills/`, `subagents/`, `system/`, `terminal/`, `workflows/`, `workspace-3d/`
- **`office/`** — Ruta `/office` (puede tener layout propio).
- **`login/`** — Página de login.
- **`api/`** — Rutas API (REST): activities, analytics, cron, files, git, memory, notifications, playground, reports, skills, subagents, system, terminal, workflows, etc.
- **`p/`**, **`r/`** — Rutas dinámicas (ej. tokens para reportes/compartir).

### 4.2 `src/components/`

- **TenacitOS/** — Shell de la app: `Dock`, `TopBar`, `StatusBar` (y `index.ts` que los exporta).
- **Sidebar.tsx** — Navegación lateral alternativa (no usada en el layout actual).
- **Office3D/** — Componentes 3D del workspace (React Three Fiber).
- **office/** — Componentes de la vista “Office” (canvas, personajes, habitaciones).
- **charts/** — Gráficos (Recharts, Sankey, heatmaps, etc.).
- **Workspace3D/** — Componentes del workspace 3D.
- Resto: componentes de UI y dominio (FileBrowser, MemoryMdViewer, NotificationDropdown, CronJobModal, etc.).

### 4.3 `src/config/`, `src/hooks/`, `src/lib/`

- **config/** — Branding y configuración (ej. `branding.ts`).
- **hooks/** — Hooks (ej. `useDebounce`).
- **lib/** — Base de datos (SQLite), precios, paths, notificaciones, uso, etc.

---

## 5. Resumen rápido

- **Barra lateral actual:** Dock de TenacitOS en `src/components/TenacitOS/Dock.tsx`.
- **Apps en la barra lateral:** 16 (Dashboard, System Monitor, Files, Memory, Agents, Office, Activity, Cron Jobs, Sessions, Sub-Agents, Notifications Log, Skills, Costs & Analytics, Model Playground, Workspace 3D, Settings).
- **Layout del dashboard:** `src/app/(dashboard)/layout.tsx` usa `Dock` + `TopBar` + `StatusBar`; el contenido va en `<main>` con margen izquierdo para el Dock.

Para añadir o quitar una app de la barra lateral, hay que editar el array `dockItems` en `src/components/TenacitOS/Dock.tsx`.
