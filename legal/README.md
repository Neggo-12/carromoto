# Carpeta legal — Tallergo

Esta carpeta es la fuente de verdad de los documentos legales de la plataforma. El contenido que se muestra en `/legal/terminos` y `/legal/privacidad` dentro de la aplicación (`src/pages/legal/`) debe mantenerse igual a lo que hay acá — si se edita un documento, hay que editar los dos lados y subir la versión (ver "Versionado" más abajo).

Este alcance es una implementación acotada al proyecto Tallergo del documento `MASTER_LEGAL_PRIVACY_GOVERNANCE_SYSTEM_ECOSISTEMA`, que el negocio compartió como especificación de gobernanza para todo el ecosistema (Nego, Taller Motos y futuras plataformas). Ese documento describe un sistema mucho más grande — un Core legal reutilizable con motor de consentimiento, registro de proveedores, evaluación de IA, Privacy Center con solicitudes de titulares, compliance gates, etc. Lo que se construyó acá es la parte que corresponde a **este proyecto puntual y ahora mismo**:

- Términos y Condiciones (`TERMINOS_Y_CONDICIONES.md`).
- Política de Tratamiento de Datos / Aviso de Privacidad (`POLITICA_TRATAMIENTO_DATOS.md`), conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015.
- Condiciones de Puntos (`CONDICIONES_PUNTOS.md`) — todavía en borrador, ver más abajo.
- Consentimiento granular en el registro: dos casillas separadas (nunca premarcadas) — una para aceptar Términos, otra para autorizar el tratamiento de datos. Nunca se mezclan (ver sección 7 y 25 del documento maestro).
- Evidencia real de cada aceptación: tabla `consentimientos` en la base de datos (usuario, documento, versión, fecha) — ver `supabase/migrations/0014_consentimientos_legales.sql`. Es un registro de solo lectura, nunca se edita ni se borra.

## Lo que falta — requiere una decisión del negocio, no algo que se pueda inventar

El documento maestro es explícito: "No inventes hechos legales, proveedores, países, contratos o tratamientos" y "si no puedes verificar un dato, márcalo como UNKNOWN y crea una tarea". Estos datos no existen en ningún lado del proyecto, así que quedan marcados como **[PENDIENTE]** dentro de los dos documentos hasta que se completen:

1. **Responsable del Tratamiento** — razón social exacta, NIT y domicilio de la sociedad que opera Tallergo (nunca puede ser solo la marca comercial — ver sección 3 del documento maestro).
2. **Canal de contacto para ejercer derechos de Hábeas Data** (correo o formulario real donde un titular pueda pedir consulta, actualización o supresión de sus datos).
3. **Costos/comisiones de la plataforma** — hoy Tallergo no cobra nada (ver la landing de talleres), pero si eso cambia, la Política y los Términos deben actualizarse antes de publicar el cambio.
4. **Fecha de activación de la integración con Puntos** (el sistema unificado de puntos, repo `puntos-neggo`) — es lo único que sigue `[PENDIENTE]` en `CONDICIONES_PUNTOS.md` / `/legal/condiciones-puntos`. El valor de canje ($800 compra = 1 punto, 1 punto = $10), el mínimo de redención (200 puntos), el mecanismo de redención y la vigencia (12 meses por lote, no por saldo total) ya NO son inventados: se tomaron directo del modelo económico real que Jhey ya definió el 17 de agosto de 2026 en `puntos-neggo/docs/modelo-economico-v1.md`, confirmado con él el 25 de agosto de 2026.

Hasta que el negocio complete el punto 1 y 2, los documentos publicados están jurídicamente incompletos — sirven como borrador funcional y para tener el consentimiento granular funcionando, pero deberían pasar por revisión de un abogado antes de considerarse definitivos (el propio documento maestro lo pide explícitamente en su sección 30: "no constituye por sí misma asesoría jurídica ni garantiza cumplimiento").

## Lo que NO se construyó en esta pasada (alcance más grande del documento maestro)

Para ser transparentes sobre el tamaño real de lo que el documento maestro describe versus lo que se implementó: no se construyó un Privacy Center con flujo de solicitudes de titulares (consulta/rectificación/supresión con ticket y término legal), ni un registro de proveedores (`CORE_VENDOR`), ni evaluación de usos de IA (`CORE_AI`) — Tallergo hoy no usa IA para decisiones sobre personas —, ni compliance gates automáticos, ni política de cookies (la plataforma no usa cookies de terceros ni tracking todavía). Si el negocio los necesita, son iniciativas aparte que vale la pena dimensionar cada una por separado en vez de intentar construir todo el Core de una vez.

## Versionado

Cada documento lleva `Versión` y `Vigente desde` en su encabezado. Al editar el contenido de fondo (no correcciones de redacción), hay que subir la versión y la fecha, y esa nueva versión es la que se guarda en `consentimientos.version` para los registros que ocurran después del cambio — los registros anteriores conservan la versión que aceptaron en su momento, nunca se reescribe el pasado.
