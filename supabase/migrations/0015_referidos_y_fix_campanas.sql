-- =============================================================================
-- Sistema de referidos + arreglo de una filtración de RLS en campanas.
--
-- BUG ENCONTRADO (15 ago 2026, reportado por el dueño del negocio con
-- capturas): la policy campanas_select original dejaba ver a CUALQUIER
-- cliente las campañas 'activa' de CUALQUIER organización, sin importar su
-- organizations.status. Un taller en 'pendiente' (todavía sin aprobar) pudo
-- publicar una oferta ("20% descuento") que un cliente ya vio en su Portal
-- con el badge "TALLER VERIFICADO", mientras en otras pantallas el sitio le
-- decía "no contamos con talleres afiliados" — de ahí la aparente
-- contradicción. Se corrige acá: solo campañas de organizations con
-- status='aprobado' son visibles públicamente; el propio taller sigue viendo
-- sus campañas mientras está pendiente (para armar su oferta antes de que lo
-- aprueben), y el admin las ve todas.
--
-- Sistema de referidos — pedido del negocio: puntos por cada cliente nuevo
-- que se registra usando el código de otro cliente. Mismo patrón que
-- 0013_campana_bienvenida.sql (campaña togglable, otorgamiento idempotente,
-- outbox en cliente_puntos_movimientos, nunca retroactivo) pero acá quien
-- recibe los puntos es el REFERENTE (quien invitó), no quien se registra.
--
-- Decisión de diseño clave: en vez de pedir la cédula de quien refirió (dato
-- sensible e incómodo de compartir), cada usuario tiene un codigo_referido
-- propio, corto y no adivinable, que puede compartir libremente. Se genera
-- para TODOS los usuarios (Cliente y Taller), aunque hoy el flujo de
-- registro solo lo pide en RegistroCliente.tsx — así queda listo si más
-- adelante se abre a Talleres sin otra migración.
-- =============================================================================

-- ── 1. Arreglo del RLS de campanas ──

drop policy if exists campanas_select on public.campanas;

create policy campanas_select
  on public.campanas for select
  using (
    (estado = 'activa' and exists (
      select 1 from public.organizations o
      where o.id = campanas.organization_id and o.status = 'aprobado'
    ))
    or user_belongs_to_organization(organization_id)
    or is_platform_admin()
  );

-- ── 2. Código de referido por usuario ──

alter table public.users add column if not exists codigo_referido text unique;

create or replace function public.generar_codigo_referido()
returns text
language plpgsql
set search_path to 'public'
as $$
declare
  -- Sin O, 0, I, 1, L — se prestan a confusión al leerlos/dictarlos en voz alta.
  v_alfabeto text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_existe boolean;
  i int;
begin
  loop
    v_codigo := '';
    for i in 1..6 loop
      v_codigo := v_codigo || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    select exists(select 1 from public.users where codigo_referido = v_codigo) into v_existe;
    exit when not v_existe;
  end loop;
  return v_codigo;
end;
$$;

create or replace function public.set_codigo_referido()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.codigo_referido is null then
    new.codigo_referido := generar_codigo_referido();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_codigo_referido on public.users;
create trigger trg_set_codigo_referido
  before insert on public.users
  for each row execute function public.set_codigo_referido();

-- Backfill: usuarios que ya existían antes de esta migración también pueden
-- referir desde ahora (esto NO les da puntos retroactivos por nada, solo les
-- habilita un código para compartir de ahora en adelante).
update public.users set codigo_referido = generar_codigo_referido() where codigo_referido is null;

-- Cualquier persona (incluso sin sesión, en el formulario de registro) puede
-- validar si un código existe, sin exponer a quién pertenece.
create or replace function public.validar_codigo_referido(p_codigo text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from public.users
    where codigo_referido = upper(trim(p_codigo)) and trim(coalesce(p_codigo, '')) <> ''
  );
$$;

revoke all on function public.validar_codigo_referido(text) from public;
grant execute on function public.validar_codigo_referido(text) to anon, authenticated;

-- ── 3. Campaña de puntos por referido (togglable, igual que bienvenida) ──

create table public.campana_referidos (
  id text primary key default 'global',
  activa boolean not null default false,
  puntos integer not null default 50 check (puntos > 0),
  actualizado_por text null,
  updated_at timestamptz not null default now(),
  constraint campana_referidos_singleton check (id = 'global')
);

insert into public.campana_referidos (id, activa, puntos) values ('global', false, 50);

alter table public.campana_referidos enable row level security;

create policy campana_referidos_select_admin on public.campana_referidos
  for select using (is_platform_admin());

create policy campana_referidos_update_admin on public.campana_referidos
  for update using (is_platform_admin()) with check (is_platform_admin());

comment on table public.campana_referidos is 'Configuración global (fila única) de puntos por referido exitoso. Solo el admin la lee/edita — el cliente se entera del resultado a través de registrar_puntos_referido_si_aplica().';

-- ── 4. Tabla de referidos ──

create table public.referidos (
  id text primary key default (gen_random_uuid())::text,
  referente_id text not null references public.users(id),
  referido_id text not null unique references public.users(id),
  codigo_usado text not null,
  puntos_otorgados integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_referidos_referente on public.referidos(referente_id);

alter table public.referidos enable row level security;

create policy referidos_select_referente
  on public.referidos for select
  using (referente_id = (auth.uid())::text or is_platform_admin());

comment on table public.referidos is 'Un registro por cliente referido (referido_id es único: nadie puede "pertenecer" a dos referentes). Se inserta desde handle_new_user() al registrarse con un código válido; puntos_otorgados queda en 0 hasta que registrar_puntos_referido_si_aplica() los otorgue (o se quede en 0 para siempre si la campaña nunca estuvo activa).';

-- ── 5. handle_new_user(): generar código propio + enlazar referido ──
-- (el trigger de la sección 2 ya genera codigo_referido solo; acá solo se
-- agrega el enlace con el referente, si vino un código válido en el
-- registro. Recrea la función completa de 0014 + este agregado.)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_rol text := coalesce(new.raw_user_meta_data->>'rol', 'Cliente');
  v_org_id text;
  v_codigo_usado text;
  v_referente_id text;
begin
  if v_rol not in ('Admin', 'Taller', 'Cliente') then
    v_rol := 'Cliente';
  end if;

  insert into public.users (
    id, rol, nombre, correo, celular, documento_tipo, documento_numero,
    ciudad, vehiculo, carro_motorizacion, moto_motorizacion
  )
  values (
    new.id::text,
    v_rol,
    new.raw_user_meta_data->>'nombre',
    new.email,
    new.raw_user_meta_data->>'celular',
    new.raw_user_meta_data->>'documento_tipo',
    new.raw_user_meta_data->>'documento_numero',
    new.raw_user_meta_data->>'ciudad',
    new.raw_user_meta_data->>'vehiculo',
    new.raw_user_meta_data->>'carro_motorizacion',
    new.raw_user_meta_data->>'moto_motorizacion'
  )
  on conflict (id) do nothing;

  if v_rol = 'Taller' and (new.raw_user_meta_data ? 'nombre_negocio') then
    insert into public.organizations (name, type, ciudad, metadata)
    values (
      new.raw_user_meta_data->>'nombre_negocio',
      coalesce(new.raw_user_meta_data->>'tipo_negocio', 'taller'),
      new.raw_user_meta_data->>'ciudad',
      coalesce(new.raw_user_meta_data->'metadata', '{}'::jsonb)
    )
    returning id into v_org_id;

    insert into public.memberships (user_id, organization_id, rol, is_active)
    values (new.id::text, v_org_id, 'Propietario', true);
  end if;

  if new.raw_user_meta_data ? 'acepto_terminos_version' then
    insert into public.consentimientos (user_id, documento, version)
    values (new.id::text, 'terminos', new.raw_user_meta_data->>'acepto_terminos_version');
  end if;

  if new.raw_user_meta_data ? 'acepto_tratamiento_version' then
    insert into public.consentimientos (user_id, documento, version)
    values (new.id::text, 'tratamiento_datos', new.raw_user_meta_data->>'acepto_tratamiento_version');
  end if;

  -- Referidos: si vino un código en el registro, se valida server-side (el
  -- frontend ya lo valida antes de dejar avanzar, pero nunca se confía solo
  -- en eso) y se enlaza. Un código inválido o vacío no bloquea el registro,
  -- simplemente no crea el enlace.
  v_codigo_usado := nullif(trim(new.raw_user_meta_data->>'codigo_referido_usado'), '');
  if v_codigo_usado is not null then
    select id into v_referente_id from public.users
    where codigo_referido = upper(v_codigo_usado) and id <> new.id::text;

    if v_referente_id is not null then
      insert into public.referidos (referente_id, referido_id, codigo_usado)
      values (v_referente_id, new.id::text, upper(v_codigo_usado))
      on conflict (referido_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- ── 6. Otorgar puntos al referente (una sola vez, solo si la campaña está activa) ──
-- Lo llama el CLIENTE REFERIDO (recién registrado) desde el mismo lugar
-- donde ya llama a registrar_bienvenida_si_aplica() — pero quien recibe los
-- puntos es el referente, no quien ejecuta la función. Es seguro porque es
-- security definer y el vínculo referente/referido ya quedó fijado en
-- handle_new_user(), no lo elige quien llama esta función.
create or replace function public.registrar_puntos_referido_si_aplica()
returns table(otorgado boolean, puntos integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid text;
  v_ref record;
  v_activa boolean;
  v_puntos integer;
begin
  v_uid := auth.uid()::text;
  if v_uid is null then
    raise exception 'Sesión no establecida.';
  end if;

  select * into v_ref from referidos where referido_id = v_uid;
  if not found or v_ref.puntos_otorgados > 0 then
    return query select false, 0;
    return;
  end if;

  select c.activa, c.puntos into v_activa, v_puntos from campana_referidos c where c.id = 'global';

  if not coalesce(v_activa, false) then
    return query select false, 0;
    return;
  end if;

  insert into cliente_puntos_movimientos (cliente_id, tipo, puntos, motivo, organization_id)
  values (v_ref.referente_id, 'referido', v_puntos, 'Bono por referir a un nuevo cliente en Tallergo', null);

  update referidos set puntos_otorgados = v_puntos where id = v_ref.id;

  return query select true, v_puntos;
end;
$$;

revoke all on function public.registrar_puntos_referido_si_aplica() from public;
grant execute on function public.registrar_puntos_referido_si_aplica() to authenticated;

-- ── 7. "Mis referidos" — lo que ve el referente sobre a quién ha referido ──
-- users tiene RLS que solo deja ver la fila propia, así que un join directo
-- desde el cliente no funcionaría para ver el nombre de a quién refirió —
-- de ahí esta función security definer, que expone SOLO nombre/fecha/puntos,
-- nunca el resto del perfil de la persona referida.
create or replace function public.mis_referidos()
returns table(referido_nombre text, fecha timestamptz, puntos_otorgados integer)
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce(u.nombre, 'Cliente'), r.created_at, r.puntos_otorgados
  from referidos r
  join users u on u.id = r.referido_id
  where r.referente_id = (auth.uid())::text
  order by r.created_at desc;
$$;

revoke all on function public.mis_referidos() from public;
grant execute on function public.mis_referidos() to authenticated;

-- =============================================================================
-- Checklist:
--   1. Con campana_referidos.activa=false, un cliente nuevo se registra con
--      un código válido: se crea la fila en `referidos` (puntos_otorgados=0)
--      pero registrar_puntos_referido_si_aplica() devuelve otorgado=false.
--   2. Admin activa la campaña; el MISMO cliente (todavía no se le había
--      otorgado) vuelve a llamar la función (ej. en su primer login real) y
--      esta vez sí se le abonan los puntos al referente.
--   3. Volver a llamar la función una tercera vez no duplica el abono
--      (puntos_otorgados ya quedó > 0).
--   4. Un código de referido inexistente o vacío no rompe el registro, solo
--      no crea ningún enlace en `referidos`.
--   5. Un cliente no puede ver la tabla `referidos` de otro cliente (RLS) —
--      solo sus propias filas como referente, vía mis_referidos().
--   6. Con la policy nueva de campanas: un taller 'pendiente' con una
--      campaña 'activa' YA NO aparece en Ofertas para clientes que no
--      pertenecen a esa organización; sigue apareciendo para el propio
--      taller (para que arme/edite su oferta antes de la aprobación) y para
--      el admin.
-- =============================================================================
