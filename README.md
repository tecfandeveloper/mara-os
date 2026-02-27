# MaraOS (Mission Control)

> A mission-control dashboard for OpenClaw agents: monitor agents, cron jobs, sessions, costs, and memory—with a 3D office view and real-time activity.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Authors](#-authors)

## ✨ Features

- **Dashboard** — Overview of agents, system status, and key metrics
- **Agents** — View and manage OpenClaw agents and their status
- **3D Office** — Navigable office view (React Three Fiber) with agent desks and ambient interactions
- **Cron Jobs** — List, create, edit, delete, and run cron jobs; weekly timeline view and run history
- **Sessions** — Session history with transcript viewer (Main, Cron, Sub-agent, Chats), token counters, and filters
- **Notifications** — Bell dropdown with unread count, mark read/unread, delete, and optional links
- **Activity** — Activity feed and stats
- **Memory** — Memory browser and MEMORY.md-style views
- **Files** — File browser with preview, upload, and download
- **Cost tracking** — Usage and cost data from OpenClaw sessions (SQLite, model pricing, `/api/costs`)
- **Analytics** — Charts and metrics (activity, success rate, etc.)
- **Reports** — Generated reports and export
- **Terminal** — In-app terminal for commands
- **Git** — Git status and operations
- **Workflows** — Workflow management
- **Skills** — Skills manager and SKILL viewer
- **Search** — Global search across the workspace
- **System** — System info, services, and monitoring
- **Live Logs** — Real-time log streaming
- **Authentication** — Login and session handling

## 🛠️ Tech Stack


| Layer      | Technology                                                          |
| ---------- | ------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19                                   |
| Language   | TypeScript 5                                                        |
| Styling    | Tailwind CSS v4                                                     |
| 3D         | React Three Fiber, Three.js, @react-three/drei, @react-three/rapier |
| Charts     | Recharts                                                            |
| Editor     | Monaco Editor (@monaco-editor/react)                                |
| Markdown   | react-markdown, @tailwindcss/typography                             |
| Data       | better-sqlite3 (usage/cost tracking, activities)                    |
| Icons & UI | lucide-react, date-fns                                              |


## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full plan. Summary:

- **Phase 1–2:** Real activity logger, cron integration, stats dashboard, Memory & File browser
- **Phase 3–4:** Cron manager (CRUD, visual builder, run history), Analytics and cost tracking
- **Phase 5–6:** Command terminal, session history, notifications, Skills manager, config editor
- **Phase 7–8:** Real-time (WebSockets, live activity), **The Office 3D** (multi-floor, avatars, interactions)
- **Phase 9–12:** Agent intelligence, token economics, knowledge graph, sub-agent orchestration, advanced visualizations, collaboration

Cost tracking details: [docs/COST-TRACKING.md](./docs/COST-TRACKING.md).

## 📄 License

MIT. See [LICENSE](./LICENSE).

## 👥 Authors

**Enrique Rodriguez Vela** - *Full-stack Development*

- GitHub: [@enriquetecfan11](https://github.com/enriquetecfan11)

---

Made with ❤️ by [Enrique Rodriguez Vela](https://github.com/enriquetecfan11)