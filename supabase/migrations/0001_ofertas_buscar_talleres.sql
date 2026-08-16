-- =============================================================================
-- Ofertas + Buscar Talleres — migración lista para cuando exista un proyecto
-- de Supabase PROPIO de Taller Aval.
--
-- IMPORTANTE — LEER ANTES DE EJECUTAR ESTE ARCHIVO:
--   1. Este SQL todavía NO se ha corrido contra ninguna base de datos. Se
--      guarda acá como referencia, adaptado del documento
--      "prompt-maestro-ofertas-buscar-talleres.md" (que a su vez fue
--      extraído del proyecto de Supabase de Neggo, `idbyahyffuhvircgzpvg`).
--   2. NUNCA correr esto contra el proyecto de Supabase de Neggo. Taller Aval
--      es un negocio y un proyecto completamente separados.
--   3. Antes de correrlo en el proyecto nuevo de Taller Aval, hay que:
--       a) Tener ya creadas las tablas base: organizations, users, memberships
--          (ver sección "Prerrequisitos" más abajo — no están incluidas acá).
--       b) Cambiar el marcador de sal en generar_codigo_verificacion() por un
--          valor secreto propio (ver el TODO justo ahí abajo). No usar el
--          valor de ejemplo tal cual en producción, y no reusar el de Neggo.
--       c) Revisar los nombres/columnas contra el esquema real que exista en
--          ese momento (puede haber cambiado desde que se escribió esto).
--
-- Los nombres internos de tabla/función se dejan igual que en Neggo
-- (comercio_contactos, buscar_comercios_verificados, etc.) a propósito: son
-- nombres que el cliente nunca ve, y mantenerlos permite copiar RLS/funciones
-- sin tocar una palabra. Lo único que cambia de cara al usuario es el texto
-- en pantalla (labels, títulos), que ya vive en el frontend, no acá.
-- =============================================================================

-- ── 0. Prerrequisitos (NO incluidos en este archivo) ──
-- Antes de correr lo de abajo debe existir:
--   * public.organizations (id text, name text, type text, status text,
--     has_trust_seal boolean, ciudad text, metadata jsonb, created_at timestamptz)
--   * public.users (id text, rol text, ...)
--   * public.memberships (user_id text, organization_id text, is_active boolean)
-- Esas tres tablas son la base de todo el modelo de datos del proyecto, no
-- solo de estas dos features — se crean en una migración aparte.

-- ── 1. Funciones base (verificar si ya existen antes de correr) ──

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

-- ── 2. Feature 1: Buscar Talleres ──

create table public.comercio_contactos (
  id text primary key default (gen_random_uuid())::text,
  cliente_id text not null,
  comercio_id text not null,
  descripcion text not null,
  nombre text not null,
  telefono text not null,
  whatsapp text,
  -- CRM del taller: mismo pipeline que oferta_solicitudes (ver más abajo),
  -- para que el taller gestione todo desde una sola pantalla sin importar
  -- si el cliente llegó por Buscar Talleres o por una oferta.
  -- Valores esperados: 'nuevo' | 'contactado' | 'cotizado' | 'ganado' | 'perdido'.
  status text not null default 'nuevo',
  notas text,
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

-- Nota: no hay policy de delete a propósito — nada se borra desde el
-- cliente, todo lo que se necesite "quitar" se maneja con un campo de estado.

-- Código de verificación de 6 dígitos, determinístico por id de contacto.
create or replace function public.generar_codigo_verificacion(p_id text)
returns text
language plpgsql immutable
set search_path to 'public'
as $$
declare
  v_hash bigint;
  v_code text;
begin
  -- TODO(antes de producción): reemplazar el string de sal de acá abajo por
  -- un valor secreto propio de Taller Aval, distinto al de Neggo. Es lo que
  -- hace que los códigos generados no sean adivinables sabiendo el algoritmo.
  v_hash := abs(('x' || substring(md5(p_id || 'TALLERAVAL_CAMBIAR_ESTA_SAL_ANTES_DE_USAR'), 1, 15))::bit(60)::bigint);
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

-- Búsqueda de talleres/almacenes verificados (Sello de Confianza activo).
-- Prefijo del código público 'TA-' (Taller Aval) en vez de 'NG-' (Neggo) —
-- ajustar si se vuelve a cambiar la sigla de marca.
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
    'TA-' || upper(left(o.id, 6)) as codigo_neggo
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

-- Registra el contacto del cliente con el taller y genera el código.
-- MVP: sin cobro todavía (no hay sistema de planes/tarifas de talleres). El
-- punto de enganche para cobrar un CPL queda comentado para cuando ese
-- sistema exista — no inventar el monto/tabla ahora.
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

  -- TODO(fase tarifas-talleres): cuando exista el sistema de planes, agregar
  -- acá el cobro de CPL (igual que resolver_cpl_comercio + facturas_ledger
  -- en Neggo). No inventar el monto/tabla ahora.

  return v_contacto_id;
end;
$$;

-- ── 3. Feature 2: Ofertas ──

create table public.campanas (
  id text primary key default (gen_random_uuid())::text,
  organization_id text not null,
  tipo text not null default 'comercio', -- un solo vertical acá (talleres); se mantiene la columna para reusar fetchCampanasActivas(tipo) tal cual
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

-- Shape de segmentacion (jsonb) para el vertical de talleres/repuestos, ej:
-- { "ciudades": ["Bogotá", "Medellín"],
--   "tipoVehiculo": ["carro", "moto", "electrico"],
--   "categoria": ["taller_carro", "taller_moto", "repuestos_carro", "repuestos_moto"] }

-- Registro de "Me interesa" — MVP sin el aparato multi-vertical de Neggo
-- (me_interesa_solicitudes / me_interesa_destinatarios / CPL), que depende
-- de facturación no construida todavía. A diferencia de Neggo (donde el
-- comercio ve el contacto completo del cliente en su propio perfil, así que
-- el clic de "Me interesa" no necesita duplicar esos datos), acá el taller
-- necesita nombre y teléfono directamente en cada solicitud para poder
-- escribirle desde su CRM — por eso quedan guardados en la fila, no solo el
-- id del cliente.
create table public.oferta_solicitudes (
  id text primary key default (gen_random_uuid())::text,
  cliente_id text not null default (auth.uid())::text,
  campana_id text not null references public.campanas(id),
  nombre text not null,
  telefono text not null,
  whatsapp text,
  -- Mismo pipeline que comercio_contactos.status — así el CRM del taller
  -- gestiona los dos orígenes (Buscar Talleres y Ofertas) de forma uniforme.
  -- Valores esperados: 'nuevo' | 'contactado' | 'cotizado' | 'ganado' | 'perdido'.
  estado text not null default 'nuevo',
  notas text,
  created_at timestamptz not null default now()
);

alter table public.oferta_solicitudes enable row level security;

create policy oferta_solicitudes_insert_own
  on public.oferta_solicitudes for insert
  with check (cliente_id = (auth.uid())::text);

create policy oferta_solicitudes_select
  on public.oferta_solicitudes for select
  using (
    cliente_id = (auth.uid())::text
    or user_belongs_to_organization((select organization_id from public.campanas where id = campana_id))
    or is_platform_admin()
  );

create policy oferta_solicitudes_update_taller
  on public.oferta_solicitudes for update
  using (user_belongs_to_organization((select organization_id from public.campanas where id = campana_id)))
  with check (user_belongs_to_organization((select organization_id from public.campanas where id = campana_id)));

-- ── 4. Tablas de soporte (analítica — no bloqueantes) ──

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

-- =============================================================================
-- Checklist antes de dar esto por conectado en el proyecto real:
--   1. tsc --noEmit limpio.
--   2. Con un cliente autenticado: buscar un taller sembrado de prueba
--      (has_trust_seal = true, status = 'approved') devuelve resultado;
--      uno sin sello no aparece.
--   3. Contactar un taller genera un código visible y lo persiste (recargar
--      "Mis Solicitudes" y verlo).
--   4. Un cliente sin membresía no puede leer/actualizar comercio_contactos
--      de otro cliente (RLS) — verificar con una query, no asumir.
--   5. Ofertas muestra el estado vacío correcto sin campañas activas, y
--      tarjetas al sembrar una campaña de prueba con estado = 'activa'.
--   6. Dar "Me interesa" en una oferta guarda nombre/teléfono en
--      oferta_solicitudes y aparece en el CRM del taller correspondiente.
--   7. Un taller puede cambiar el estado (nuevo/contactado/cotizado/
--      ganado/perdido) y las notas de sus propios leads, pero no los de
--      otro taller (RLS) — verificar con una query, no asumir.
-- =============================================================================
