# 🦞 Mission Control - Roadmap v2 (Solo lo que falta)

Este documento lista **únicamente el trabajo pendiente**. Todo lo ya implementado está en [ROADMAP.md](./ROADMAP.md).

---

## Fase 6: Configuración — Pendiente

### 6.1 Skills Manager (resto)
- [ ] Activar/desactivar skills
- [ ] Instalar desde ClawHub
- [ ] Actualizar skills

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

## Fase 7: Real-time — Pendiente

### 7.1 Live Activity Stream (resto)
- [ ] Integración en Dashboard/Activity feed en tiempo real
- [ ] Indicador "Tenacitas está trabajando..."
- [ ] Toast notifications

### 7.2 System Status (resto)
- [ ] Heartbeat del agente (vista dedicada)
- [ ] CPU/memoria del VPS (vista dedicada)
- [ ] Cola de tareas pendientes

---

## Fase 8: The Office 3D — Pendiente

### 8.2 Interactions & Ambient (resto)
- [ ] Sub-agents como "visitantes" en la oficina
- [ ] Trail visual parent ↔ sub-agent
- [ ] Efectos visuales (partículas success, humo error, beam heartbeat)
- [ ] Sonido ambiental toggleable (teclas, notificaciones, lofi)

### 8.3 Multi-Floor Building
- [ ] 4 plantas navegables con ascensor:
  - Planta 1: Main Office (agentes principales)
  - Planta 2: Server Room (DBs, VPS, integrations)
  - Planta 3: Archive (logs, memories históricas)
  - Azotea: Control Tower (dashboard gigante)
- [ ] Customization: temas (modern, retro, cyberpunk, matrix)
- [ ] Modos especiales (Focus, God Mode, Cinematic)

---

## Fase 9: Agent Intelligence — Pendiente

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

### 9.5 Model Playground
- [ ] Input un prompt
- [ ] Seleccionar múltiples modelos para comparar
- [ ] Ver respuestas lado a lado
- [ ] Mostrar tokens/coste/tiempo de cada uno
- [ ] Guardar experimentos
- [ ] Share results (copy link)

### 9.6 Smart Suggestions Engine
- [ ] Analiza patrones de uso
- [ ] Sugiere optimizaciones (modelo, cron, heartbeats, horarios)
- [ ] Tarjetas de sugerencia con botón "Apply" o "Dismiss"
- [ ] Learn from dismissals

---

## Fase 10: Sub-Agent Orchestra — Pendiente

### 10.1 Sub-Agent Dashboard
- [ ] Lista de sub-agentes activos en tiempo real
- [ ] Estado: running, waiting, completed, failed
- [ ] Task description y progreso
- [ ] Modelo usado
- [ ] Tokens consumidos por cada uno
- [ ] Timeline de spawns/completions

### 10.2 Agent Communication Graph
- [ ] Visualización de mensajes entre main agent y sub-agents
- [ ] Flow diagram tipo Sankey o network graph
- [ ] Ver contenido de mensajes al hacer click
- [ ] Filtrar por sesión, fecha, tipo

### 10.3 Multi-Agent Orchestration
- [ ] Crear workflows visuales de múltiples agentes
- [ ] Drag & drop tasks → auto-spawn agents
- [ ] Dependencies entre tasks
- [ ] Parallel vs sequential execution
- [ ] Template workflows guardables

---

## Fase 11: Advanced Visualizations — Pendiente

### 11.1 3D Workspace Explorer
- [ ] Vista 3D del árbol de archivos
- [ ] Tamaño de nodos = tamaño de archivo
- [ ] Color = tipo de archivo
- [ ] Navigate con mouse
- [ ] Click → preview/edit

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

## Fase 12: Collaboration — Pendiente

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

## Prioridad sugerida (solo pendientes)

| Prioridad | Bloque | Notas |
|-----------|--------|--------|
| **Alta** | 10.1 Sub-Agent Dashboard | Visibilidad de workflows multi-agent |
| **Alta** | 6.2 Integration Status + 6.3 Config Editor | Cuando haga falta operar integraciones/config |
| **Media** | 4.3 Performance Metrics | Métricas de tiempo y uptime |
| **Media** | 9.2 Token Economics | Optimización de costes |
| **Media** | 9.6 Smart Suggestions | IA que se auto-mejora |
| **Media** | 8.3 Multi-Floor (Office 3D) | Opcional; wow factor |
| **Baja** | 9.3 Knowledge Graph, 11.x Visualizations | Wow factor |
| **Baja** | 12 Collaboration | Equipo/público futuro |

---

*Generado desde ROADMAP.md — 2026-02-27*
