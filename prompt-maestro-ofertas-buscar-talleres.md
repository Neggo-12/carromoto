# Prompt maestro — "Ofertas" y "Buscar Talleres" (Portal de Clientes)

**Instrucciones de uso:** pegá este documento completo como mensaje al agente que está construyendo el proyecto nuevo de talleres/repuestos. Está escrito para ejecutarse **tal cual** — los nombres de tabla, columnas, políticas RLS y funciones ya están extraídos en vivo de la base de datos real de Neggo (proyecto Supabase `idbyahyffuhvircgzpvg`), no son un resumen de memoria. Si algo no aplica al proyecto nuevo por falta de una pieza previa (ver sección 0), el agente debe frenar y preguntar antes de improvisar — no asumir.

---

## 0. Prerrequisitos — verificar ANTES de empezar

Estas dos features viven dentro del **Portal de Clientes** (B2C). Si el proyecto nuevo todavía no tiene:

1. Tabla `organizations` (para los talleres/almacenes) con al menos: `id text`, `name text`, `type text`, `status text`, `has_trust_seal boolean`, `ciudad text`, `metadata jsonb`.
2. Tabla `users` con `rol` (para que exista un `is_platform_admin()` o equivalente).
3. Tabla `memberships` (user_id ↔ organization_id, `is_active boolean`) — para que exista `user_belongs_to_organization()`.
4. Una función `is_platform_admin()` y una `user_belongs_to_organization(org_id text)` ya creadas (ver sección 3, son copiables tal cual).
5. Un shell mínimo de portal de cliente autenticado (una página con navegación entre secciones, aunque sea solo un sidebar con 2 opciones). Si no existe, construirlo primero como parte de esta tarea — referencia de estructura en `neggo-12`: `web/src/pages/ClientPortal.tsx` + `web/src/features/portal/components/PortalNavigation.tsx`.

Si falta 1-4, hay que crearlos primero (son la base de todo el modelo de datos, no solo de estas 2 features). Si falta 5, construir la versión mínima como parte de este mismo trabajo.

**No existe todavía sistema de planes/tarifas/facturación para talleres.** Esto afecta el flujo de "Contactar" (sección 4) — ver la nota crítica ahí. No inventar un cobro; seguir la recomendación de esa sección.

## 1. Qué son estas dos features (contexto, tal como funcionan en Neggo)

**Ofertas**: el cliente ve un catálogo de campañas promocionales activas publicadas por talleres/almacenes verificados, filtradas automáticamente según su perfil (ciudad, y en Neggo también score/ingresos — para talleres esto se adapta, ver sección 5). Cada campaña tiene un botón "Me interesa" que registra una solicitud, y un botón secundario "No me interesa" que la descarta silenciosamente de la vista.

**Buscar Talleres** (en Neggo: "Buscar Comercios"): un buscador por nombre que solo devuelve organizaciones con Sello de Confianza activo (`has_trust_seal = true` y `status = 'approved'`). Al encontrar uno, el cliente lo contacta con una descripción + teléfono; el sistema genera un **código de verificación de 6 dígitos** que el cliente debe recibir del taller por WhatsApp — si el taller no lo dice, o pide plata/datos antes de decirlo, es señal de phishing. Esto es el mecanismo anti-suplantación central del Sello de Confianza, se reutiliza intacto.

## 2. Decisión de naming — no traducir los identificadores internos

Los nombres de tabla/función/columna quedan **igual que en Neggo** (`comercio_contactos`, `buscar_comercios_verificados`, `registrar_contacto_comercio`, `campanas`, `organizations.type = 'comercio'`), aunque el negocio sea 100% talleres. Motivo: son nombres internos que el cliente nunca ve, y mantenerlos idénticos permite copiar RLS/funciones sin tocar una sola palabra (menos superficie de error). Lo único que cambia es **lo que el usuario ve en pantalla**: textos, labels, iconos, empty states. Es decir: la tabla se llama `comercio_contactos`, pero el botón dice "Contactar taller".

Si en algún momento se prefiere renombrar todo a `taller_contactos` / `buscar_talleres_verificados`, hacerlo, pero como decisión explícita y de una sola vez al copiar el patrón — no a mitad de camino.

## 3. Funciones base que deben existir antes (verificar, no recrear si ya están)

```sql
create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()::text and rol = 'Admin'
  );
$$;

create or replace function public.user_belongs_to_organization(org_id text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()::text
      and m.is_active = true
  );
$$;
```

## 4. Feature 1 — Buscar Talleres

### 4.1 Tabla `comercio_contactos`

```sql
create table public.comercio_contactos (
  id text primary key default (gen_random_uuid())::text,
  cliente_id text not null,
  comercio_id text not null,
  descripcion text not null,
  nombre text not null,
  telefono text not null,
  whatsapp text,
  status text not null default 'pendiente',
  codigo_verificacion text not null,
  created_at timestamptz not null default now()
);

alter table public.comercio_contactos enable row level security;

create policy comercio_contactos_insert_own
  on public.comercio_contactos for insert
  with check (cliente_id = (auth.uid())::text);

create policy comercio_contactos_select
  on public.comercio_contactos for select
  using (
    cliente_id = (auth.uid())::text
    or user_belongs_to_organization(comercio_id)
    or is_platform_admin()
  );

create policy comercio_contactos_update_comercio
  on public.comercio_contactos for update
  using (user_belongs_to_organization(comercio_id))
  with check (user_belongs_to_organization(comercio_id));
```

Nota: no hay policy de `delete` — a propósito, mismo patrón que el resto del proyecto (nada se borra desde el cliente).

### 4.2 Código de verificación (generación determinística + trigger)

```sql
create or replace function public.generar_codigo_verificacion(p_id text)
returns text
language plpgsql immutable
set search_path to 'public'
as $$
declare
  v_hash bigint;
  v_code text;
begin
  v_hash := abs(('x' || substring(md5(p_id || '<SAL_UNICA_DEL_PROYECTO_NUEVO>'), 1, 15))::bit(60)::bigint);
  v_code := lpad((v_hash % 1000000)::text, 6, '0');
  return substring(v_code, 1, 3) || ' ' || substring(v_code, 4, 3);
end;
$$;

create or replace function public.set_codigo_verificacion()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.codigo_verificacion := generar_codigo_verificacion(new.id);
  return new;
end;
$$;

create trigger trg_set_codigo_verificacion
  before insert on public.comercio_contactos
  for each row execute function public.set_codigo_verificacion();
```

**Importante:** cambiar `<SAL_UNICA_DEL_PROYECTO_NUEVO>` por un string propio del proyecto nuevo (no reusar el literal `'neggo-salt-2026'` de Neggo) — es lo que hace que los códigos de un proyecto no sean adivinables sabiendo el algoritmo del otro.

### 4.3 RPC `buscar_comercios_verificados`

```sql
create or replace function public.buscar_comercios_verificados(p_termino text)
returns table(id text, name text, ciudad text, categoria text, afiliado_desde timestamptz, codigo_neggo text)
language sql stable security definer
set search_path to 'public'
as $$
  select
    o.id,
    o.name,
    o.ciudad,
    o.metadata->>'categoria' as categoria,
    o.created_at,
    'TL-' || upper(left(o.id, 6)) as codigo_neggo
  from organizations o
  where o.type = 'comercio' and o.has_trust_seal = true and o.status = 'approved'
    and lower(regexp_replace(o.name, '\s+', '', 'g'))
        ilike '%' || lower(regexp_replace(p_termino, '\s+', '', 'g')) || '%'
  order by
    case
      when lower(o.name) = lower(p_termino) then 0
      when lower(o.name) ilike lower(p_termino) || '%' then 1
      else 2
    end,
    o.name
  limit 20;
$$;
```

Cambié el prefijo del código público de `'NG-'` a `'TL-'` (Talleres) — es cosmético, solo lo ve el cliente. Ajustar a lo que se defina como iniciales de marca.

### 4.4 RPC `registrar_contacto_comercio` — NOTA CRÍTICA sobre cobro

En Neggo, esta función además de insertar el contacto **cobra un CPL** (`resolver_cpl_comercio(p_comercio_id)`) e inserta un registro en `facturas_ledger`. Esas dos piezas dependen de un sistema de planes/tarifas por comercio que **este proyecto todavía no tiene** (no hay dashboard de comercio, no hay tarifas).

**Recomendación (MVP, hacer esto):** la función registra el contacto y genera el código, sin cobrar nada todavía. Dejar el punto de enganche comentado para cuando exista el sistema de tarifas de talleres.

```sql
create or replace function public.registrar_contacto_comercio(
  p_comercio_id text,
  p_descripcion text,
  p_nombre text,
  p_telefono text,
  p_whatsapp text default null
)
returns text
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_uid text;
  v_contacto_id text;
begin
  v_uid := auth.uid()::text;
  if v_uid is null then
    raise exception 'Sesión no establecida.';
  end if;

  if not exists (
    select 1 from organizations
    where id = p_comercio_id and type = 'comercio' and has_trust_seal = true and status = 'approved'
  ) then
    raise exception 'Taller no válido o sin Sello de Confianza activo.';
  end if;

  v_contacto_id := gen_random_uuid()::text;
  insert into comercio_contactos (id, cliente_id, comercio_id, descripcion, nombre, telefono, whatsapp)
  values (v_contacto_id, v_uid, p_comercio_id, p_descripcion, p_nombre, p_telefono, p_whatsapp);

  -- TODO(fase tarifas-talleres): cuando exista el sistema de planes, agregar acá
  -- el cobro de CPL igual que en Neggo (resolver_cpl_comercio + insert en
  -- facturas_ledger o su equivalente). No inventar el monto/tabla ahora.

  return v_contacto_id;
end;
$$;
```

No confundir "sin cobro todavía" con "sin control": la validación de `has_trust_seal = true and status = 'approved'` se mantiene intacta — solo se remueve la parte de facturación.

### 4.5 Frontend — adaptar de `BuscarComerciosView.tsx`

Archivo de referencia completo en `neggo-12`: `web/src/features/portal/components/BuscarComerciosView.tsx`. Clonar la estructura entera (dialog de contacto, tarjeta de resultado, sección "Mis Solicitudes" plegable) y solo cambiar:

- Título: "Buscar Comercios" → "Buscar Talleres" (o "Buscar Talleres y Repuestos" si se quiere cubrir ambos tipos en el mismo buscador).
- Subtítulo: "Encuentra comercios aliados verificados..." → algo como "Encuentra talleres y almacenes de repuestos verificados con Sello de Confianza y contáctalos directamente."
- Placeholder del input: "Busca por nombre del comercio..." → "Busca por nombre del taller o almacén...".
- Texto del dialog de contacto y el warning anti-phishing: mismo mecanismo, ajustar "el comercio" → "el taller".
- Función wrapper en `repositories.ts`: copiar `buscarComerciosVerificados`, `registrarContactoComercio`, `fetchClienteComercioContactos`, `fetchOrganizationsByIds` tal cual (mismos nombres, mismo shape) — no hace falta tocarlas más allá de la ruta del import.
- `registrarEventoUsoCliente` con `tipoEvento: 'seleccion_comercio'`: mantenerlo, alimenta el ranking de "talleres más buscados" que verá el admin más adelante (requiere las tablas de la sección 6, no bloqueante para lanzar esta feature).

No cambiar la lógica de negocio (orden de resultados, límite de 20, el manejo de estados `idle/loading/done`, el registro fire-and-forget de búsquedas sin match) — solo el copy.

## 5. Feature 2 — Ofertas

### 5.1 Tabla `campanas`

```sql
create table public.campanas (
  id text primary key default (gen_random_uuid())::text,
  organization_id text not null,
  tipo text not null,
  titulo text not null,
  descripcion text,
  estado text not null default 'activa',
  modo_lanzamiento text not null default 'segmentado',
  segmentacion jsonb not null default '{}'::jsonb,
  creado_por text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campanas enable row level security;

create policy campanas_insert_owner
  on public.campanas for insert
  with check (user_belongs_to_organization(organization_id) and creado_por = (auth.uid())::text);

create policy campanas_select
  on public.campanas for select
  using (estado = 'activa' or user_belongs_to_organization(organization_id) or is_platform_admin());

create policy campanas_update_owner
  on public.campanas for update
  using (user_belongs_to_organization(organization_id) or is_platform_admin())
  with check (user_belongs_to_organization(organization_id) or is_platform_admin());
```

`tipo` en Neggo distingue `'banco' | 'comercio'` porque hay varios verticales. Acá, con un solo vertical, `tipo` puede fijarse siempre en `'comercio'` (no eliminar la columna — mantenerla simplifica reusar el código de `fetchCampanasActivas(tipo)` tal cual).

### 5.2 Shape de `segmentacion` — adaptado al vertical

En Neggo, `segmentacion` incluye `ciudades`, `producto`, `rangoIngresos`, `scoreMin/Max` (pensado para crédito bancario). Para talleres, reemplazar por algo así (definir el shape exacto antes de escribir el frontend, no improvisar campo por campo):

```json
{
  "ciudades": ["Bogotá", "Medellín"],
  "tipoVehiculo": ["carro", "moto", "electrico"],
  "categoria": ["taller_carro", "taller_moto", "repuestos_carro", "repuestos_moto"]
}
```

El matching (`matchesCampana` en `OfertasView.tsx`) se reescribe para filtrar por `ciudades` (igual que hoy) y por `tipoVehiculo`/`categoria` según el perfil del cliente (si el cliente tiene un vehículo registrado tipo carro/moto — si el proyecto todavía no captura eso en el perfil del cliente, tratar como "sin preferencia" y no filtrar por ese campo, igual que Neggo hace cuando `perfilCompleto` es falso).

### 5.3 Frontend — adaptar de `OfertasView.tsx`, con recortes explícitos

Archivo de referencia completo en `neggo-12`: `web/src/features/portal/components/OfertasView.tsx`. Clonar la tarjeta de oferta (`CampanaOfferCard`, con el botón "Me interesa" / "No me interesa" y el tracking de rechazo) tal cual. Cambios obligatorios:

- **Quitar los sub-tabs de sector** (`bancarios` / `inmobiliarios` / `comercio`) — no aplican, este proyecto tiene un solo vertical. La vista muestra directamente el grid de campañas activas de talleres/repuestos, sin selector de sector.
- **Quitar el botón/banner "Crear Nueva Meta de Ahorro"** y el `CrearMetaDialog` completo — es una feature específica de la IFC bancaria de Neggo (metas de ahorro con activación de score), no tiene equivalente en talleres. Si más adelante se quiere algo análogo (ej. "Avísame cuando tenga descuento en frenos"), es una feature nueva a diseñar aparte, no forzar el molde de Neggo acá.
- Título: "Ofertas para ti" se mantiene igual.
- El resumen "Tu ciudad / Tu score" — reemplazar "Tu score" por algo relevante al vertical si se define un dato equivalente (ej. tipo de vehículo registrado), o quitar ese bloque si el perfil del cliente todavía no tiene ese dato.
- Mantener intacto: el badge "X ofertas disponibles", el estado vacío ("Sin ofertas disponibles"), el manejo de loading/error, el botón "No me interesa" con `useRejectionTracking` (si el proyecto nuevo aún no tiene esa tabla/hook, se puede omitir el botón de rechazo en la v1 y agregarlo después — no es bloqueante para lanzar la feature).

### 5.4 Backend — funciones a clonar tal cual

De `repositories.ts` de `neggo-12`: `fetchCampanasActivas(tipo)`, `fetchCampanaIdsConSolicitud(userId)`, el tipo `CampanaDisplay`. Mismo shape, mismos nombres de columna. La única función que **no** se clona igual es `handleSolicitarBanco`/`handleSolicitarComercio` — en Neggo insertan en `me_interesa_solicitudes`, que es un sistema más grande (multi-vertical) que probablemente no existe todavía acá. Para el MVP: al hacer clic en "Me interesa", registrar directamente en una tabla simple `oferta_solicitudes` (cliente_id, campana_id, created_at) — sin el aparato de `me_interesa_destinatarios`/CPL de Neggo, que de nuevo depende de facturación no construida todavía.

## 6. Tablas de soporte (analítica — no bloqueantes, pero recomendable crearlas junto con lo anterior)

```sql
create table public.busquedas_sin_match (
  id text primary key default (gen_random_uuid())::text,
  termino text not null,
  ciudad text,
  cliente_id text,
  created_at timestamptz not null default now()
);
alter table public.busquedas_sin_match enable row level security;
create policy busquedas_sin_match_insert on public.busquedas_sin_match for insert with check (true);
create policy busquedas_sin_match_select_admin on public.busquedas_sin_match for select using (is_platform_admin());

create table public.eventos_uso_cliente (
  id text primary key default (gen_random_uuid())::text,
  tipo_evento text not null,
  organization_id text,
  seccion text,
  cliente_id text default (auth.uid())::text,
  created_at timestamptz not null default now()
);
alter table public.eventos_uso_cliente enable row level security;
create policy eventos_uso_cliente_insert on public.eventos_uso_cliente for insert with check (true);
create policy eventos_uso_cliente_select_admin on public.eventos_uso_cliente for select using (is_platform_admin());
```

Estas alimentan futuros rankings de "talleres más buscados" / "secciones más usadas" en el admin (igual que `EstadisticasPanel.tsx` en Neggo) — no son necesarias para que Ofertas/Buscar Talleres funcionen, pero conviene crearlas ahora porque el frontend ya las llama de forma fire-and-forget (no bloquean la UI si fallan).

## 7. Reglas de seguridad no negociables (aplican igual que en Neggo)

- Todo cambio de estado sensible pasa por una función `SECURITY DEFINER`, nunca un `UPDATE`/`INSERT` directo desde el cliente cuando hay lógica de validación de por medio (ver `registrar_contacto_comercio`).
- Toda función `SECURITY DEFINER` lleva `set search_path = public`.
- IDs de este dominio son siempre `text`, nunca `uuid` (salvo `auth.uid()` nativo, que requiere `::text` al compararlo).
- Ninguna tabla nueva tiene policy de `delete` — todo lo que se necesite "borrar" se maneja con un campo de estado.
- Verificar el esquema real con una consulta antes de escribir SQL que dependa de una tabla/función existente — no asumir de memoria.
- Sincronizar el `types.ts` de Supabase en el mismo paso que cualquier migración.

## 8. Checklist de validación antes de dar por hecha esta tarea

1. Las 2 vistas cargan sin errores de TypeScript (`tsc --noEmit`).
2. Con un usuario cliente autenticado: buscar un taller sembrado de prueba (`has_trust_seal = true`, `status = 'approved'`) devuelve resultado; buscar uno sin sello no aparece.
3. Contactar un taller genera un código de verificación visible y lo persiste (recargar "Mis Solicitudes" y verlo).
4. Con un usuario que no pertenece a ninguna organización: intentar `select`/`update` directo sobre `comercio_contactos` de otro cliente falla por RLS (verificar con una query, no asumir).
5. Ofertas muestra el estado vacío correcto cuando no hay campañas activas, y muestra tarjetas cuando se siembra una campaña de prueba con `estado = 'activa'`.
6. `npx tsc --noEmit -p tsconfig.app.json` limpio (ajustar al nombre real del tsconfig del proyecto nuevo si es distinto).
