-- =============================================================================
-- Cupo máximo + reserva atómica para "Ofertas" (campanas) — pedido del
-- negocio: una campaña puede tener un cupo limitado de interesados ("3x
-- puntos para las primeras N personas"); al agotarse pasa a 'cumplida' y
-- deja de aceptar más reservas. Antes el frontend hacía un insert directo a
-- oferta_solicitudes sin ningún control de cupo — dos clientes reservando
-- al mismo tiempo podían sobrepasar el cupo (race condition), así que el
-- control de cupo + el cambio de estado van en un RPC con `for update` que
-- bloquea la fila de la campaña mientras decide.
--
-- También se agrega comprobantes.oferta_solicitud_id: permite que, cuando
-- un cliente que reservó una campaña llegue al taller, el comprobante que
-- el taller genera quede enlazado a ESA reserva puntual y se le marque
-- multiplicador=3 — sin inventar que ya se otorgan puntos de verdad (eso
-- sigue dependiendo de la integración con Puntos Neggo, no construida en
-- este proyecto), solo dejamos el dato correcto listo en el outbox
-- (comprobantes.multiplicador, ya existía sin usar) para cuando esa
-- integración exista.
--
-- Aplicado directo al proyecto real vía Supabase MCP; este archivo
-- consolida el estado final para que el repo quede sincronizado con la
-- base real.
-- =============================================================================

alter table public.campanas
  add column if not exists cupo_maximo integer null;

alter table public.campanas
  add constraint campanas_cupo_maximo_check check (cupo_maximo is null or cupo_maximo > 0);

comment on column public.campanas.cupo_maximo is 'Cupo máximo de interesados (oferta_solicitudes) para esta campaña. Null = sin límite. Al alcanzarse, reservar_oferta() cambia estado a ''cumplida'' automáticamente.';

alter table public.comprobantes
  add column if not exists oferta_solicitud_id text null references public.oferta_solicitudes(id);

comment on column public.comprobantes.oferta_solicitud_id is 'Si este comprobante corresponde a un cliente que había reservado una campaña ("Me interesa" en Ofertas), acá queda el id de esa reserva (oferta_solicitudes) — el taller lo elige al generar el comprobante. Cuando está presente, multiplicador se guarda en 3.';

-- ── Reserva atómica con control de cupo ─────────────────────────────────

create or replace function public.reservar_oferta(
  p_campana_id text,
  p_nombre text,
  p_telefono text,
  p_whatsapp text default null
)
returns table(
  solicitud_id text,
  estado_campana text,
  interesados integer,
  cupo_maximo integer
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid text;
  v_estado text;
  v_cupo integer;
  v_conteo integer;
  v_solicitud_id text;
begin
  v_uid := auth.uid()::text;
  if v_uid is null then
    raise exception 'Sesión no establecida.';
  end if;

  if p_nombre is null or btrim(p_nombre) = '' or p_telefono is null or btrim(p_telefono) = '' then
    raise exception 'Nombre y teléfono son obligatorios.';
  end if;

  select c.estado, c.cupo_maximo into v_estado, v_cupo
  from campanas c
  where c.id = p_campana_id
  for update;

  if v_estado is null then
    raise exception 'Esa oferta ya no existe.';
  end if;
  if v_estado <> 'activa' then
    raise exception 'Esta oferta ya no está disponible.';
  end if;

  select count(*)::integer into v_conteo from oferta_solicitudes where campana_id = p_campana_id;

  if v_cupo is not null and v_conteo >= v_cupo then
    update campanas set estado = 'cumplida' where id = p_campana_id and estado = 'activa';
    raise exception 'Cupo agotado.';
  end if;

  v_solicitud_id := gen_random_uuid()::text;
  insert into oferta_solicitudes (id, cliente_id, campana_id, nombre, telefono, whatsapp)
  values (v_solicitud_id, v_uid, p_campana_id, btrim(p_nombre), btrim(p_telefono), nullif(btrim(coalesce(p_whatsapp, '')), ''));

  v_conteo := v_conteo + 1;

  if v_cupo is not null and v_conteo >= v_cupo then
    update campanas set estado = 'cumplida' where id = p_campana_id;
    v_estado := 'cumplida';
  end if;

  return query select v_solicitud_id, v_estado, v_conteo, v_cupo;
end;
$$;

revoke all on function public.reservar_oferta(text, text, text, text) from public;
grant execute on function public.reservar_oferta(text, text, text, text) to authenticated;

-- =============================================================================
-- Checklist:
--   1. Crear una campaña con cupo_maximo=2, reservar 2 veces (2 clientes
--      distintos): la campaña queda en estado='cumplida' automáticamente.
--   2. Un tercer intento de reservar la misma campaña falla con 'Cupo
--      agotado.' y NO inserta fila en oferta_solicitudes.
--   3. reservar_oferta llamado sin sesión (auth.uid() null) lanza 'Sesión
--      no establecida.'.
--   4. Una campaña sin cupo_maximo (null) nunca pasa a 'cumplida' sola por
--      volumen de reservas.
--   5. comprobantes.oferta_solicitud_id acepta null (comprobantes sin
--      relación a ninguna campaña siguen funcionando igual que antes).
-- =============================================================================
