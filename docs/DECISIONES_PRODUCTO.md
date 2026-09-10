# Decisiones de producto — Tallergo

Registro vivo de decisiones de negocio que cambian cómo se comporta el
sistema, para que quede constancia de *por qué* está así y no solo *qué*
cambió. Ver también `docs/SEGURIDAD.md` para el registro específico de
seguridad.

---

## 2026-09-10 — Dejar de pedir cédula por ahora; llave inmediata; WhatsApp en vez de Celular

**Decisión.** La gente es reacia a dar su número de cédula apenas se
registra, así que por ahora no se le pide a nadie — ni a Cliente ni a
Taller. Se seguirá pidiendo más adelante, cuando el negocio lo decida.

**Qué cambió:**

1. **Gate de documento desactivado.** `src/components/RequireDocumento.tsx`
   tiene un flag `PEDIR_DOCUMENTO = false` al principio del archivo. Con eso
   en `false`, nadie ve el formulario "Necesitamos un dato más" al entrar al
   portal — ni Cliente ni Taller. El componente completo sigue ahí intacto;
   para reactivarlo cuando el negocio lo pida, basta con volver ese flag a
   `true`, no hace falta reescribir nada.

2. **Llave de identificación inmediata, para Cliente y Taller.** Antes, la
   "llave" (`codigo_referido`) de un cliente se calculaba con su nombre +
   los 2 últimos dígitos de su cédula, y solo se generaba cuando guardaba su
   documento (que ahora no se pide). Desde la migración
   `0021_llave_registro_sin_cedula.sql`, la llave se arma con el primer
   nombre + 3 dígitos aleatorios (ej. `jheison482`) y se asigna en el mismo
   instante del registro, para Cliente y para Taller (antes solo existía
   para Cliente). Se muestra en el portal con un `@` adelante (ej.
   `@jheison482`) — el valor guardado en la base sigue siendo sin el `@`
   (así siguen funcionando los códigos de invitación tal como estaban).

   Cuando el negocio decida volver a pedir la cédula, la función
   `guardar_documento_cliente()` ya está lista para guardarla junto a la
   llave que la persona ya tenía desde su registro — no le va a cambiar la
   llave, solo la va a relacionar con su cédula. Así, la cédula pasa a ser
   el identificador "de verdad" cuando llegue el momento, sin perder el
   historial de la llave que ya venía usando la persona (invitaciones,
   referidos, etc.).

3. **"Celular" pasó a llamarse "WhatsApp" en las pantallas.** El campo de la
   base de datos sigue llamándose `celular` (cambiar el nombre de una
   columna que ya usan muchas partes del sistema no aportaba nada y sí
   agregaba riesgo) — lo que cambió es cómo se le llama a la persona: en el
   registro de Cliente y de Taller, y en el perfil del Taller, la etiqueta
   ahora dice simplemente "WhatsApp" en vez de "Celular (WhatsApp)". En las
   pantallas de administración, donde no hay dato, ahora dice "Sin
   WhatsApp" en vez de "Sin celular".

   Excepción a propósito: el formulario de "Me interesa" de una oferta
   (`ClienteOfertas.tsx`) ya tenía dos campos separados — "Teléfono"
   (precargado desde el perfil) y "WhatsApp (opcional, si es distinto)" —
   para el caso en que la persona prefiere que le escriban a un número
   distinto al de su cuenta. Ese formulario no se tocó, porque renombrar
   "Teléfono" a "WhatsApp" ahí hubiera dejado dos campos con el mismo
   nombre.

**Verificado en vivo (2026-09-10):**
- Se registró un Taller de prueba sin cédula y recibió su llave
  (`jheison823`) de una, sin que se le pidiera ningún documento.
- Se llamó `guardar_documento_cliente()` sobre esa misma cuenta y la llave
  no cambió — solo se guardó el documento.
- Los 12 clientes y 5 talleres que ya existían recibieron su llave por el
  backfill de la migración.
- `tsc --noEmit` y `npm run build` corrieron limpios.

**Pendiente / para cuando se retome el tema de la cédula:** decidir si
`RequireDocumento.tsx` se reactiva igual para los dos roles o si conviene
pedírsela primero solo a uno (por ejemplo, a los talleres para la
afiliación formal, antes que a los clientes).
