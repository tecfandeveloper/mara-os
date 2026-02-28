# The Office 3D — Roadmap (siguiente nivel)

Este documento define todo lo necesario para llevar **The Office 3D** al siguiente nivel. Origen: [ROADMAP.md](./ROADMAP.md) Fase 8 (ítems 8.2 pendientes y 8.3).

---

## Estado actual

Lo que ya está implementado:

- **Sala 3D** con React Three Fiber: `Office3D`, `AgentDesk`, `Floor`, `Walls`, `Lights`
- **Navegación**: Orbit + FPS (WASD + mouse) con `OrbitControls` y `FirstPersonControls`
- **Escritorios** con estado Working/Idle desde `/api/office`; click en escritorio abre panel lateral con activity feed (`AgentPanel`)
- **Avatares** con emoji y animación (`MovingAvatar`, `AGENTS` en `agentsConfig`)
- **Objetos clickeables**: archivador → Memory, pizarra → Roadmap, café → Mood (`FileCabinet`, `Whiteboard`, `CoffeeMachine`), más `PlantPot`, `WallClock`
- **Iluminación**: Sky, Environment, luces
- **API**: `GET /api/office` — agentes desde `openclaw.json`, estado derivado de `memory/{today}.md` (ACTIVE / IDLE / SLEEPING), polling ~5 s

**Componentes clave:** `src/components/Office3D/Office3D.tsx`, `AgentDesk`, `MovingAvatar`, `AgentPanel`, `FileCabinet`, `Whiteboard`, `CoffeeMachine`, `Floor`, `Walls`, `Lights`, `agentsConfig.ts`. Página: `/office` (`src/app/office/page.tsx`).

---

## Fase A — Completar 8.2 (Interactions & Ambient)

| Ítem | Descripción | Criterio de aceptación |
|------|-------------|------------------------|
| Sub-agents como visitantes | Mostrar sub-agentes activos en la oficina como "visitantes" (posición, indicador o modelo) | Sub-agentes visibles cuando están activos; datos desde `/api/subagents` o `/api/office` extendido |
| Trail visual parent ↔ sub-agent | Línea o efecto visual que une escritorio del agente principal con el de/los sub-agentes | Trail visible entre main y sub-agent(s) cuando hay relación activa |
| Efectos visuales | Partículas, humo, beam (ej. en estado "working" o transiciones) | Al menos un efecto (partículas/humo/beam) activo en contexto definido (working, spawn, etc.) |
| Sonido ambiental | Música o ambiente de oficina, toggle on/off en UI | Control en UI para activar/desactivar sonido ambiental |

---

## Fase B — Multi-Floor (8.3)

| Ítem | Descripción | Criterio de aceptación |
|------|-------------|------------------------|
| 4 plantas navegables | Planta 1: Main Office (agentes). Planta 2: Server Room (DBs, VPS, integraciones). Planta 3: Archive (logs, memories). Azotea: Control Tower (dashboard) | Navegación entre plantas; cada planta con contenido coherente |
| Ascensor / escaleras | Mecanismo para cambiar de planta | Usuario puede subir/bajar de planta de forma clara |
| Datos por planta | Conectar cada planta a APIs existentes (System, Logs, Memory, Dashboard) | Server Room enlazada a System/integraciones; Archive a logs/memories; Control Tower a dashboard |

---

## Fase C — Customization & Modos

| Ítem | Descripción | Criterio de aceptación |
|------|-------------|------------------------|
| Temas visuales | modern, retro, cyberpunk, matrix (paleta, materiales, skybox) | Selector de tema que cambie apariencia de la oficina |
| Modos especiales | Focus (menos distracciones), God Mode (vista amplia), Cinematic (cámara automática o recorrido) | Al menos dos modos implementados y accesibles desde UI |

---

## Fase D — Calidad y datos

| Ítem | Descripción | Criterio de aceptación |
|------|-------------|------------------------|
| Rendimiento | LOD, menos draw calls, optimización de re-renders; evaluar SSE para office si aporta valor | Menos jank en escena cargada; FPS estable en dispositivos objetivo |
| Datos en tiempo real | Mejorar/ampliar `/api/office`; integrar con `/api/agents/status`, `/api/activities`, `/api/subagents` para avatares y trails | Datos de agentes y actividad coherentes con el resto de Mission Control |
| Accesibilidad | Atajos de teclado; opcional: modo "lista" o resumen para lectores de pantalla | Navegación y acciones principales accesibles por teclado |

---

## Backlog / ideas futuras

- Más objetos clickeables: servidor → System, calendario → Cron
- Notificaciones in-world (toast o indicador en 3D)
- Decidir si unificar o enlazar con la vista 2D (`OfficeCanvas` / `StardewRoom`)

---

## Checklist ejecutable

Orden sugerido: Fase A → B → C → D; dentro de cada fase, ítems en el orden que tenga más sentido (dependencias o impacto).

### Fase A — Interactions & Ambient

- [ ] Sub-agents como visitantes en la oficina
- [ ] Trail visual parent ↔ sub-agent
- [ ] Efectos visuales (partículas, humo o beam)
- [ ] Sonido ambiental toggleable

### Fase B — Multi-Floor

- [ ] Planta 1: Main Office (agentes principales)
- [ ] Planta 2: Server Room (DBs, VPS, integrations)
- [ ] Planta 3: Archive (logs, memories históricas)
- [ ] Azotea: Control Tower (dashboard gigante)
- [ ] Ascensor o escaleras para cambiar de planta
- [ ] Mapeo de cada planta a APIs/datos existentes

### Fase C — Customization & Modos

- [ ] Temas: modern, retro, cyberpunk, matrix
- [ ] Modo Focus
- [ ] Modo God Mode
- [ ] Modo Cinematic

### Fase D — Calidad y datos

- [ ] Optimización de rendimiento (LOD / draw calls / re-renders)
- [ ] Integración datos en tiempo real con `/api/office` y otras APIs
- [ ] Atajos de teclado (y opcional modo lista/resumen a11y)

---

*Roadmap Office — siguiente nivel. Referencia: [ROADMAP.md](./ROADMAP.md) Fase 8.*
