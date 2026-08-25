-- =============================================================================
-- Campaña de puntos de bienvenida — pedido del negocio: "los primeros
-- usuarios en registrarse ganarán 100 puntos de bienvenida". El admin debe
-- poder prender/apagar esta campaña en cualquier momento; mientras está
-- activa, todo cliente que complete su registro ve un mensaje de bienvenida
-- indicando cuántos puntos ganó. Aplica solo a registros nuevos hacia
-- adelante — nunca retroactivo a clientes que ya existían (por eso el
-- otorgamiento pasa una sola vez, en el momento del registro, nunca en login).
--
-- Igual que con las campañas de ofertas (reservar_oferta), esto NO otorga
-- puntos reales — Puntos Neggo (el sistema real de saldo) es un proyecto
-- separado no integrado acá. Lo que se guarda es un registro correcto en el
-- outbox (cliente_puntos_movimientos, ya existía sin usar) para cuando esa
-- integración exista.
--
-- Aplicado directo al proyecto real vía Supabase MCP; este archivo
-- consolida el estado final para que el repo quede sincronizado con la
-- base real.
-- =============================================================================

-- Singleton: una sola fila de configuración global (no es por taller).
create table public.campana_bienvenida (
  id text primary key default 'global',
  activa boolean not null default false,
  puntos integer not null default 100 check (puntos > 0),
  actualizado_por text null,
  updated_at timestamptz not null default now(),
  constraint campana_bienvenida_singleton check (id = 'global')
);

insert into public.campana_bienvenida (id, activa, puntos) values ('global', false, 100);

alter table public.campana_bienvenida enable row level security;

create policy campana_bienvenida_select_admin on public.campana_bienvenida
  for select using (is_platform_admin());

create policy campana_bienvenida_update_admin on public.campana_bienvenida
  for update using (is_platform_admin()) with check (is_platform_admin());

comment on table public.campana_bienvenida is 'Configuración global (fila única) de la campaña "100 puntos de bienvenida" para nuevos registros. Solo el admin la lee/edita — el cliente nunca la consulta directo, se entera del resultado a través de registrar_bienvenida_si_aplica().';

-- cliente_puntos_movimientos.organization_id era NOT NULL (pensado para
-- movimientos ligados a un taller). La bienvenida es a nivel de plataforma,
-- sin taller asociado, así que se vuelve nullable.
alter table public.cliente_puntos_movimientos
  alter column organization_id drop not null;

-- ── Otorgar bienvenida (una sola vez por cliente, solo si la campaña está activa) ──

create or replace function public.registrar_bienvenida_si_aplica()
returns table(otorgado boolean, puntos integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid text;
  v_activa boolean;
  v_puntos integer;
  v_ya_existe boolean;
begin
  v_uid := auth.uid()::text;
  if v_uid is null then
    raise exception 'Sesión no establecida.';
  end if;

  select exists(
    select 1 from cliente_puntos_movimientos
    where cliente_id = v_uid and tipo = 'bienvenida'
  ) into v_ya_existe;

  if v_ya_existe then
    return query select false, 0;
    return;
  end if;

  select c.activa, c.puntos into v_activa, v_puntos from campana_bienvenida c where c.id = 'global';

  if not coalesce(v_activa, false) then
    return query select false, 0;
    return;
  end if;

  insert into cliente_puntos_movimientos (cliente_id, tipo, puntos, motivo, organization_id)
  values (v_uid, 'bienvenida', v_puntos, 'Bono de bienvenida por registro en Tallergo', null);

  return query select true, v_puntos;
end;
$$;

revoke all on function public.registrar_bienvenida_si_aplica() from public;
grant execute on function public.registrar_bienvenida_si_aplica() to authenticated;

-- =============================================================================
-- Checklist:
--   1. Con campana_bienvenida.activa=false, un registro nuevo llama a la RPC
--      y recibe otorgado=false — no inserta fila.
--   2. Admin pone activa=true; un cliente nuevo se registra, la RPC inserta
--      una fila con tipo='bienvenida' y devuelve otorgado=true, puntos=100.
--   3. Ese mismo cliente vuelve a llamar la RPC (ej. refresca la página) y
--      recibe otorgado=false — no duplica la fila (idempotente por cliente_id).
--   4. Un cliente que ya existía antes de activar la campaña NUNCA la recibe
--      salvo que el frontend la llame — y el frontend solo la llama en el
--      flujo de registro, nunca en login, así que nunca es retroactivo.
-- =============================================================================
