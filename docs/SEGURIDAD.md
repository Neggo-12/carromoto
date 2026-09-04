# Seguridad — Tallergo

Este documento es el registro vivo de decisiones y hallazgos de seguridad
del proyecto. La idea es que cualquier persona del equipo pueda leerlo y
entender, sin tener que reconstruir la historia en Git, qué protecciones
existen hoy, por qué existen y qué incidentes las originaron.

**Regla general del proyecto:** las validaciones de seguridad que importan
(roles, campos obligatorios, permisos) se hacen en la base de datos —
triggers, funciones `security definer` y RLS — nunca solo en el frontend.
El frontend puede tener sus propios chequeos por experiencia de usuario,
pero cualquiera puede llamar directamente a la API de Supabase saltándose
la interfaz, así que la base de datos es la única línea de defensa real.

---

## Estado actual (2026-09-04)

- El registro público (`auth.signUp`) solo puede crear cuentas con rol
  `Taller` o `Cliente`. Cualquier otro valor enviado en los metadatos
  (incluido `Admin`) se degrada automáticamente a `Cliente`.
- El rol `Admin` únicamente se otorga manualmente, desde dentro de la base
  de datos, por alguien con acceso directo a Supabase. No existe ningún
  flujo público que lo asigne.
- El registro exige `nombre`, `celular` y `ciudad`; si falta alguno, la
  transacción completa se revierte (`raise exception` dentro del trigger)
  y la cuenta no se crea.
- Función responsable: `public.handle_new_user()`, trigger
  `trg_handle_new_user` en `AFTER INSERT ON auth.users`.
- Versión vigente aplicada en producción: migración **0020**
  (`reafirma_seguridad_registro`), verificada en vivo contra
  `pg_get_functiondef` el 2026-09-04.

---

## Incidente 2026-09-04 — Escalamiento de privilegios en el registro

**Qué se encontró.** Un usuario de prueba interno detectó que el registro
público aceptaba `"rol": "Admin"` en los metadatos de `auth.signUp()` y
`handle_new_user()` lo insertaba tal cual en `public.users`, dándole a esa
cuenta acceso de administrador — sin pasar por ninguna pantalla ni
aprobación.

**Cómo se corrigió (primera vez).** Migración `0018_fix_seguridad_registro`:
se restringió `handle_new_user()` a los roles `('Taller', 'Cliente')`
únicamente, y se agregó validación obligatoria de nombre/celular/ciudad
con `raise exception` para que el registro se rechace si faltan.

**La complicación.** En paralelo, otra rama de trabajo del equipo
(`feature/security-headers`, fusionada a `main` mediante el PR #2) también
tocó `handle_new_user()`, en el archivo
`0017_parches_seguridad_y_fix_duplicaciones.sql`, con la intención de
resolver el mismo problema. Pero la condición quedó así:

```sql
-- SEGURIDAD: Previene autoregistro como Admin
IF v_rol NOT IN ('Admin', 'Taller', 'Cliente') THEN
  v_rol := 'Cliente';
END IF;
```

`'Admin'` quedó dentro de la lista de roles *permitidos*. El comentario
dice una cosa y el código hace lo contrario: si esta versión llegara a
ejecutarse, un registro con `"rol": "Admin"` seguiría creando una cuenta
de administrador sin restricción. Esta versión tampoco incluye la
validación de nombre/celular/ciudad obligatorios de la migración 0018.

**Verificación.** Antes de tocar nada se confirmó, contra la base de datos
en vivo:

1. `pg_get_functiondef()` sobre `handle_new_user()` — la función que
   estaba corriendo en producción era la de la migración 0018 (la
   correcta), no la del archivo `0017_parches_seguridad_y_fix_duplicaciones.sql`.
2. `list_migrations` — ese archivo nunca aparece como aplicado; existe en
   el repositorio de Git (fusionado a `main`) pero jamás se ejecutó contra
   Supabase.

Es decir: la producción nunca estuvo expuesta a este segundo error. El
riesgo era que alguien, en el futuro, ejecutara ese archivo directamente
(por ejemplo con `supabase db push` desde una copia local, o pegándolo en
el editor SQL) sin saber que reabriría el hueco.

**Corrección definitiva.** Migración `0020_reafirma_seguridad_registro`:
vuelve a dejar `handle_new_user()` en su versión correcta (sin `'Admin'`
en la lista de roles permitidos, con las tres validaciones obligatorias) y
la documenta con `comment on function`. No se editó ni se borró el archivo
`0017_parches_seguridad_y_fix_duplicaciones.sql` — las migraciones ya
fusionadas a `main` no se reescriben, se corrigen hacia adelante con una
migración nueva. Así, si alguna vez se reconstruye la base desde cero
corriendo todas las migraciones en orden (0000 → la última), el resultado
final sigue siendo el seguro, porque 0020 se aplica después y es la que
queda vigente.

**Prueba de verificación.** Se insertó un usuario de prueba real en
`auth.users` con `"rol": "Admin"` en los metadatos; `public.users` quedó
con `rol = 'Cliente'`, confirmando que la protección funciona end-to-end.
El usuario de prueba se eliminó inmediatamente después.

**Pendiente / recomendación para el equipo.** Existen dos migraciones
numeradas `0017` en el repositorio (`0017_fix_guardar_documento_cliente_ambiguedad.sql`
y `0017_parches_seguridad_y_fix_duplicaciones.sql`). No se renombró ninguna
para no reescribir historia ya fusionada, pero es importante que, de aquí
en adelante, cada quien revise `supabase/migrations/` antes de numerar una
migración nueva para evitar que se repita el número. Como regla práctica:
antes de crear una migración, correr `ls supabase/migrations/` y usar el
siguiente número libre.

---

## Otras protecciones vigentes

- **RLS por rol de admin:** `is_platform_admin()` verifica
  `exists(select 1 from public.users where id = auth.uid()::text and rol = 'Admin')`.
  Todas las tablas de uso exclusivo del panel de administración (por
  ejemplo `taller_documentos`, `taller_notas`) usan una sola política
  `for all using (is_platform_admin()) with check (is_platform_admin())`.
  Como el rol `Admin` no se puede autoasignar desde el registro público
  (ver incidente arriba), esta política es una barrera real, no solo
  cosmética.
- **Documento del cliente obligatorio en el flujo de campañas:** la función
  `guardar_documento_cliente()` fue corregida en la migración 0017
  (`fix_guardar_documento_cliente_ambiguedad`) por un bug de columna
  ambigua en PL/pgSQL — no relacionado con el incidente de seguridad
  anterior, pero documentado aquí porque bloqueaba a todos los clientes en
  el punto de entrada obligatorio de documentos.
