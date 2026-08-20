-- =============================================================================
-- Esquema base — organizations, users, memberships + is_platform_admin() /
-- user_belongs_to_organization(). TODAS las demás migraciones (0001-0005)
-- asumen que esto ya existe; sin este archivo, 0001 falla en la primera
-- línea. Se escribe recién ahora porque hasta este momento el proyecto no
-- tenía su propio Supabase — ver "0. Prerrequisitos" al inicio de
-- 0001_ofertas_buscar_talleres.sql (ese comentario queda desactualizado en
-- cuanto a QUE esto no existía, pero la advertencia de fondo sigue vigente).
--
-- El login real (Supabase Auth) y el registro atómico de organization +
-- membership viven en 0005_registro_auth.sql — este archivo es solo el
-- esquema y las policies base.
--
-- ⚠️ Confirmar antes de correr esto en el proyecto real de Taller Aval:
--   Que el proyecto de Supabase es propio de Taller Aval — NUNCA el de
--   Neggo ni el de Puntos Neggo (repos y bases completamente separados).
-- =============================================================================

-- Utilidad compartida por varias tablas de este proyecto (organizations acá,
-- campanas_puntos en 0002, y cualquier otra que necesite updated_at
-- automático). Se define una sola vez, acá, porque este es el primer
-- archivo en aplicarse.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.organizations (
  id text primary key default (gen_random_uuid())::text,
  name text not null,
  type text not null check (type in ('taller', 'almacen')),
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  has_trust_seal boolean not null default false,
  ciudad text,
  metadata jsonb not null default '{}'::jsonb, -- barrio, tipo_vehiculo, motorizaciones, servicios, horario, plan_id, descripcion_negocio, etc. (ver TallerPerfil en el frontend)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table public.users (
  id text primary key, -- mismo id que auth.users(id) de Supabase Auth
  rol text not null default 'Cliente' check (rol in ('Admin', 'Taller', 'Cliente')),
  nombre text,
  correo text,
  celular text,
  documento_tipo text, -- "CC" | "CE" | "NIT" | "PA" — mismo tipo que usa Puntos Neggo como llave de cruce
  documento_numero text,
  created_at timestamptz not null default now()
);

-- Llave de cruce con Puntos Neggo (ver comprobantesData.ts / 0004): sin
-- esto poblado, un cliente no puede ver su saldo real de puntos.
create unique index idx_users_documento on public.users(documento_tipo, documento_numero) where documento_numero is not null;

create table public.memberships (
  id text primary key default (gen_random_uuid())::text,
  user_id text not null references public.users(id),
  organization_id text not null references public.organizations(id),
  rol text not null default 'Propietario', -- rol dentro del negocio, ej. "Propietario", "Administrador" (ver Encargado en adminData.ts)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

-- ── Funciones base de autorización ──
-- Usadas acá abajo y en TODAS las migraciones siguientes (0001-0004) —
-- viven acá, no en 0001, porque dependen de users/memberships y este es el
-- primer archivo en aplicarse.
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

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.memberships enable row level security;

-- organizations: cualquiera puede ver talleres aprobados (así funciona hoy
-- "Buscar Talleres" sin login), un miembro ve también SU propia
-- organización aunque esté pendiente/rechazada (para que un taller recién
-- registrado vea su propio perfil en TallerPerfil.tsx mientras espera
-- aprobación), y el admin las ve todas.
create policy organizations_select
  on public.organizations for select
  using (status = 'aprobado' or user_belongs_to_organization(id) or is_platform_admin());

create policy organizations_update_owner
  on public.organizations for update
  using (user_belongs_to_organization(id) or is_platform_admin())
  with check (user_belongs_to_organization(id) or is_platform_admin());
-- Nota: el insert de una organization nueva NO tiene policy acá a propósito
-- — pasa por la función registrar_taller() (SECURITY DEFINER, ver
-- 0005_registro_auth.sql) para que el alta de organization + membership sea
-- atómica, no dos inserts sueltos que un cliente pueda hacer a medias.

create policy users_select_propio
  on public.users for select
  using (id = (auth.uid())::text or is_platform_admin());

create policy users_update_propio
  on public.users for update
  using (id = (auth.uid())::text)
  with check (id = (auth.uid())::text);

create policy memberships_select_propio
  on public.memberships for select
  using (user_id = (auth.uid())::text or is_platform_admin());

-- =============================================================================
-- Checklist antes de dar esto por conectado en el proyecto real — este es el
-- más importante de los cinco migrations porque nada más funciona sin esto:
--   1. Login real integrado en el frontend — HOY ningún portal (taller,
--      cliente, admin) pide login, así que conectar esto sin resolver esa
--      parte deja los tres paneles abiertos igual que ahora, pero con datos
--      reales de gente real detrás. Esto es lo primero que hay que cerrar
--      antes de anunciar que el sitio está "en producción".
--   2. Un taller nuevo que se registra (RegistroTaller.tsx) crea su fila en
--      auth.users, su fila en public.users, su organization en 'pendiente',
--      y su membership — probar el flujo completo, no solo el insert suelto.
--   3. is_platform_admin() y user_belongs_to_organization() funcionan contra
--      datos reales — probar con un usuario Admin real y con un usuario que
--      NO pertenece a la organización que intenta ver (tiene que fallar).
--   4. Un taller pendiente/rechazado puede ver su propia organization (para
--      TallerPerfil.tsx) pero NO la de otro taller en el mismo estado.
-- =============================================================================
