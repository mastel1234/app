# PRD - Mis Finanzas (Control de Gastos Mensuales)

## Problema original
"Aplicación en la cual pueda llevar un control de mis gastos mensuales, tomando en consideración el límite para cada apartado, y los ingresos mensuales."

## Extensión posterior del usuario (2026-02)
- Quiere que se use como app de celular
- Al registrar un gasto, que se descuente automáticamente del límite de la categoría

## Persona
Usuario individual que quiere administrar sus finanzas personales de forma privada en su propio dispositivo, sin cuenta ni servidor externo.

## Requisitos principales
- Sin autenticación (uso personal)
- Categorías 100% personalizadas por el usuario (nombre, color, límite mensual)
- Registro de ingresos (con fuente) y gastos (por categoría)
- Metas de ahorro mensuales
- Múltiples monedas (por defecto DOP - Peso Dominicano)
- Exportación CSV y PDF
- Dashboard con KPIs, gráficos y alertas al exceder límites
- Selector de mes (histórico)
- Persistencia local (localStorage, no servidor)
- Diseño mobile-first e instalable como PWA
- Botón flotante (FAB) para acceso rápido

## Implementado (2026-02-11)
- Frontend React 19 con Tailwind + shadcn/ui, tema "Organic & Earthy" (verdes tierra + acentos ámbar/terracota), fuentes Work Sans (display) + IBM Plex Sans (body)
- Dashboard: 4 KPI cards (Ingresos, Gastos, Balance, Tasa de ahorro), Barras Recharts (Gastos vs Límite), Donut (Distribución), Progreso por categoría, Alerta destacada al superar límites
- Categorías: CRUD completo con selector de color, cajita verde/roja prominente que muestra "DISPONIBLE / EXCEDIDO"
- Movimientos: Tabla completa con filtros (Todos / Ingresos / Gastos)
- Metas: CRUD con barra de progreso por mes
- Ajustes: cambio de moneda (8 monedas), exportar CSV (papaparse), PDF (jsPDF), backup/restore JSON, reset total
- Selector de mes en el header
- Persistencia en localStorage bajo `finance_tracker_data_v1`
- **PWA**: manifest.json, iconos 192/512 PNG, service worker (`/sw.js`) con cache network-first, meta tags para iOS/Android, instalable
- **FAB móvil**: botón flotante inferior-derecho en todas las pestañas con opciones "Ingreso" / "Gasto", diálogo con vista previa "Disponible antes / después" y toast con el saldo restante actualizado
- Sin autenticación · sin backend custom (backend base intacto)
- Idioma: Español

## Testing
- iteration_1: 100% frontend PASS (baseline)
- iteration_2: 100% frontend PASS (PWA + FAB)

## Backlog / P1-P2
- P1: Auto-categorización por palabra clave (Uber → Transporte)
- P1: Gastos frecuentes preconfigurados (1-tap)
- P2: Sincronización opcional con cuenta (backend)
- P2: Notificaciones push cuando se supera el límite
- P2: Reportes anuales y comparación mes a mes
- P2: Transacciones recurrentes (renta, sueldo)
