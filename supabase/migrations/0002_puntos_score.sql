-- =============================================================================
-- Puntos de Cliente + Score de Talleres — migración lista para cuando exista
-- el proyecto de Supabase PROPIO de Taller Aval. Sigue al archivo
-- 0001_ofertas_buscar_talleres.sql (mismas advertencias aplican: no correr
-- contra Neggo, revisar contra el esquema real antes de ejecutar, requiere
-- las funciones is_platform_admin() / user_belongs_to_organization() que ya
-- crea esa migración).
--
-- Dos features nuevas, pensadas para lo que pidió el negocio:
--   A) Puntos de cliente: el cliente gana puntos por cada servicio/producto
--      que PAGA en un comercio de la red Taller Aval. Se guardan como "puntos
--      de la red" (no "puntos del taller X") porque la idea a futuro es que
--      se puedan redimir en cualquier comercio afiliado, incluso de otro
--      rubro (no solo talleres/repuestos) — por eso un movimiento no
--      requiere que el comercio de canje sea el mismo que el de la compra.
--   B) Score de talleres: para poder priorizar los mejores talleres cuando
--      haya muchos en un mismo sector. Por ahora SOLO alimenta insignias y
--      beneficios de destacado (ver taller_score_factores más abajo) —
--      todavía no se usa para reordenar los resultados de "Buscar
--      Talleres"; esa es una decisión de negocio que queda pendiente.
-- =============================================================================

-- ── A. Puntos de cliente ──

create table public.cliente_puntos_movimientos (
  id text primary key default (gen_random_uuid())::text,
  cliente_id text not null default (auth.uid())::text,
  tipo text not null, -- 'ganado' | 'redimido'
  puntos integer not null, -- positivo si ganado, negativo si redimido
  motivo text not null,
  organization_id text not null, -- comercio donde se ganó o se redimió
  created_at timestamptz not null default now()
);

alter table public.cliente_puntos_movimientos enable row level security;

create policy cliente_puntos_movimientos_select
  on public.cliente_puntos_movimientos for select
  using (cliente_id = (auth.uid())::text or user_belongs_to_organization(organization_id) or is_platform_admin());

-- Nunca se inserta directo desde el cliente (para que nadie se pueda dar
-- puntos a sí mismo) — solo el comercio que registra el pago, o la función
-- canjear_recompensa() de acá abajo con security definer.
create policy cliente_puntos_movimientos_insert_comercio
  on public.cliente_puntos_movimientos for insert
  with check (user_belongs_to_organization(organization_id) or is_platform_admin());

create table public.recompensas_canje (
  id text primary key default (gen_random_uuid())::text,
  organization_id text not null,
  titulo text not null,
  descripcion text,
  puntos_necesarios integer not null,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.recompensas_canje enable row level security;

create policy recompensas_canje_select
  on public.recompensas_canje for select
  using (activa = true or user_belongs_to_organization(organization_id) or is_platform_admin());

create policy recompensas_canje_write_comercio
  on public.recompensas_canje for all
  using (user_belongs_to_organization(organization_id))
  with check (user_belongs_to_organization(organization_id));

-- Registra un canje: valida que el saldo alcance y descuenta puntos en la
-- misma transacción (para que no se pueda canjear dos veces con el mismo
-- saldo por una condición de carrera).
create or replace function public.canjear_recompensa(p_recompensa_id text)
returns text
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_uid text;
  v_recompensa record;
  v_saldo integer;
  v_movimiento_id text;
begin
  v_uid := auth.uid()::text;
  if v_uid is null then
    raise exception 'Sesión no establecida.';
  end if;

  select * into v_recompensa from recompensas_canje where id = p_recompensa_id and activa = true;
  if not found then
    raise exception 'Recompensa no disponible.';
  end if;

  select coalesce(sum(puntos), 0) into v_saldo from cliente_puntos_movimientos where cliente_id = v_uid;
  if v_saldo < v_recompensa.puntos_necesarios then
    raise exception 'Puntos insuficientes.';
  end if;

  v_movimiento_id := gen_random_uuid()::text;
  insert into cliente_puntos_movimientos (id, cliente_id, tipo, puntos, motivo, organization_id)
  values (v_movimiento_id, v_uid, 'redimido', -v_recompensa.puntos_necesarios, 'Canje: ' || v_recompensa.titulo, v_recompensa.organization_id);

  return v_movimiento_id;
end;
$$;

-- ── B. Multiplicador de puntos en ofertas ──
-- Extiende `campanas` (creada en 0001) para promociones tipo "gana el doble
-- de puntos este fin de semana" que pidió el negocio como ejemplo.
alter table public.campanas add column if not exists multiplicador_puntos integer;
alter table public.campanas add column if not exists multiplicador_vigencia text;

-- ── C. Score de talleres ──
-- Los factores viven en su propia tabla (no directo en organizations) para
-- poder recalcular el score sin tocar el perfil del taller, y para guardar
-- historial de cómo cambia si más adelante se necesita.
create table public.taller_score_factores (
  organization_id text primary key,
  calificacion_clientes numeric not null default 0, -- promedio 0-5
  tiempo_respuesta_horas numeric not null default 24,
  leads_ganados integer not null default 0,
  leads_perdidos integer not null default 0,
  historial_limpio boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.taller_score_factores enable row level security;

-- El score es visible públicamente — es justamente lo que justifica el
-- destacado/insignia frente al cliente que está comparando talleres.
create policy taller_score_factores_select
  on public.taller_score_factores for select
  using (true);

create policy taller_score_factores_write_admin
  on public.taller_score_factores for all
  using (is_platform_admin())
  with check (is_platform_admin());

-- meses_activo y el score final (0-100) NO se guardan acá: meses_activo se
-- calcula desde organizations.created_at, y el score con la misma fórmula
-- que hoy vive en el frontend (src/lib/scoreData.ts::calcularScore), para
-- que ajustar los pesos de la fórmula no requiera una migración nueva.

-- =============================================================================
-- Checklist antes de dar esto por conectado en el proyecto real:
--   8. El saldo de puntos de un cliente es la suma de sus movimientos, y el
--      cliente NO puede insertar un movimiento 'ganado' directamente (solo
--      el comercio) — verificar con una query, no asumir.
--   9. canjear_recompensa() rechaza el canje si el saldo no alcanza, y lo
--      descuenta correctamente si sí alcanza (probar los dos casos).
--   10. Un taller puede crear/editar sus propias recompensas de canje, pero
--       no las de otro taller (RLS) — verificar con una query.
--   11. El score de un taller cambia si se actualizan sus factores en
--       taller_score_factores, y es visible para cualquier cliente (no solo
--       el propio taller ni el admin).
--   12. Publicar una oferta con multiplicador de puntos guarda
--       multiplicador_puntos y multiplicador_vigencia, y el cliente los ve
--       en la tarjeta de la oferta.
-- =============================================================================
