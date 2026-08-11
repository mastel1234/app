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
- **Alertas Push (2026-02-11)**: Web Notifications API + Service Worker; toggle en Ajustes con manejo de permisos (granted/denied/default). Umbrales 80% y 100% por categoría-mes, con `notifiedThresholds` para evitar spam
- **Gastos Frecuentes (2026-02-11)**: Plantillas de gastos recurrentes con nombre, monto, categoría y nota. Se aplican con 1 toque desde la pestaña Movimientos o el FAB (opción "Frecuente" con ícono Zap). Cascade delete al eliminar categoría. Validación de monto > 0. Edit funciona correctamente tras recarga.
- **Transacciones Recurrentes (2026-02-11)**: Modelo con `dayOfMonth`, `kind`, `active`, `lastAppliedMonth`. Auto-aplica pendientes al abrir la app en el día correspondiente (idempotente). Toast de confirmación. Toggle activar/pausar, edición y borrado en cascada. Ubicado en la pestaña Movimientos.
- **Comparación Mensual (2026-02-11)**: Card en el Dashboard con 3 mini-KPIs (Ingresos, Gastos, Balance) mostrando delta % vs mes anterior, más gráfico de barras comparativo. Colores invertidos para gastos (subir es malo).
- **FAB inteligente (2026-02-11)**: Se oculta automáticamente al hacer scroll hacia abajo (`pointer-events:none`) para no bloquear botones de acción en el flujo scrollable; reaparece al hacer scroll arriba o al detenerse.

## Testing
- iteration_1: 100% frontend PASS (baseline)
- iteration_2: 100% frontend PASS (PWA + FAB)
- iteration_3: 88% (4 bugs in Frequent Expenses + Notifications)
- iteration_4: 100% PASS (bugs fixed)
- iteration_5: 91% (3 bugs in Recurring + Comparison)
- iteration_6: 85% (2 bugs remaining: toast + FAB overlap)
- iteration_7 (manual): PASS — recurring toast fires (Toaster moved before Router + setTimeout defer); FAB hides on scroll-down with pointer-events:none, restores on scroll-up/idle

## Backlog / P1-P2
- P1: Auto-categorización por palabra clave (Uber → Transporte)
- P2: Reportes anuales y comparación mes a mes
- P2: Transacciones recurrentes automáticas (renta, sueldo)
- P2: Sincronización opcional con cuenta (backend)
- P2: Compartir/enviar reporte PDF por WhatsApp/Email
