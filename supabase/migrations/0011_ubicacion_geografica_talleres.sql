-- =============================================================================
-- Ubicación geográfica de talleres — segunda iteración del rediseño de la
-- Home pública (LandingHub.tsx). La Home ya NO debe cargar ni mostrar datos
-- reales de talleres: el buscador público solo pregunta una dirección, la
-- geocodifica en el navegador (Nominatim, ver src/lib/geocoding.ts) y
-- necesita contar cuántos talleres hay cerca de esas coordenadas — sin
-- exponer nombres, ubicaciones ni ningún otro dato del taller a un visitante
-- no autenticado. La búsqueda con resultados reales (nombre, distancia, etc.)
-- solo se puede pedir con sesión iniciada.
--
-- Por eso van DOS funciones separadas, con permisos distintos:
--   1. contar_talleres_cercanos: solo un número. anon + authenticated.
--   2. buscar_talleres_cercanos: filas completas + distancia_km. Se
--      autoprotege exigiendo auth.uid() (no solo por permisos de Postgres,
--      para que quede blindada aunque cambie el grant en el futuro).
--
-- Aplicado directo al proyecto real vía Supabase MCP; este archivo
-- consolida el estado final para que el repo quede sincronizado con la
-- base real.
-- =============================================================================

alter table public.organizations
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.organizations.latitude is 'Latitud del taller/almacén, geocodificada desde su dirección (Nominatim) al registrarse o editar el perfil. Null si aún no se ha geocodificado.';
comment on column public.organizations.longitude is 'Longitud del taller/almacén, geocodificada desde su dirección (Nominatim) al registrarse o editar el perfil. Null si aún no se ha geocodificado.';

-- ── 1. Conteo público (sin PII) ─────────────────────────────────────────

drop function if exists public.contar_talleres_cercanos(double precision, double precision, double precision);

create function public.contar_talleres_cercanos(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision default 10
)
returns integer
language sql stable security definer
set search_path to 'public'
as $$
  select count(*)::integer
  from organizations o
  where o.type in ('taller', 'almacen')
    and o.has_trust_seal = true
    and o.status = 'aprobado'
    and o.latitude is not null
    and o.longitude is not null
    and (
      6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(p_lat)) * cos(radians(o.latitude)) * cos(radians(o.longitude) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(o.latitude))
        ))
      )
    ) <= p_radio_km;
$$;

grant execute on function public.contar_talleres_cercanos(double precision, double precision, double precision) to anon, authenticated;

-- ── 2. Búsqueda completa con distancia (solo autenticado) ──────────────

drop function if exists public.buscar_talleres_cercanos(double precision, double precision, double precision, text, text, text);

create function public.buscar_talleres_cercanos(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision default 10,
  p_tipo_vehiculo text default null,
  p_servicio text default null,
  p_motorizacion text default null
)
returns table(
  id text,
  name text,
  ciudad text,
  tipo_negocio text,
  tipo_vehiculo text,
  especialista_electricos boolean,
  descripcion_negocio text,
  direccion text,
  barrio text,
  servicios jsonb,
  afiliado_desde timestamptz,
  codigo_publico text,
  distancia_km double precision
)
language plpgsql stable security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión no establecida.';
  end if;

  return query
  select
    o.id,
    o.name,
    o.ciudad,
    o.type as tipo_negocio,
    o.metadata->>'tipo_vehiculo' as tipo_vehiculo,
    coalesce((o.metadata->>'especialista_electricos')::boolean, false) as especialista_electricos,
    o.descripcion_negocio,
    o.metadata->>'direccion' as direccion,
    o.metadata->>'barrio' as barrio,
    coalesce(o.metadata->'servicios', '[]'::jsonb) as servicios,
    o.created_at as afiliado_desde,
    'TA-' || upper(left(o.id, 6)) as codigo_publico,
    (
      6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(p_lat)) * cos(radians(o.latitude)) * cos(radians(o.longitude) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(o.latitude))
        ))
      )
    ) as distancia_km
  from organizations o
  where o.type in ('taller', 'almacen')
    and o.has_trust_seal = true
    and o.status = 'aprobado'
    and o.latitude is not null
    and o.longitude is not null
    and (
      p_tipo_vehiculo is null
      or o.metadata->>'tipo_vehiculo' = p_tipo_vehiculo
      or o.metadata->>'tipo_vehiculo' = 'ambos'
    )
    and (p_servicio is null or o.metadata->'servicios' ? p_servicio)
    and (
      p_motorizacion is null
      or o.metadata->'carro_motorizacion' ? p_motorizacion
      or o.metadata->'moto_motorizacion' ? p_motorizacion
      or o.metadata->>'carro_motorizacion' = p_motorizacion
      or o.metadata->>'moto_motorizacion' = p_motorizacion
    )
    and (
      6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(p_lat)) * cos(radians(o.latitude)) * cos(radians(o.longitude) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(o.latitude))
        ))
      )
    ) <= p_radio_km
  order by distancia_km asc
  limit 30;
end;
$$;

revoke all on function public.buscar_talleres_cercanos(double precision, double precision, double precision, text, text, text) from public;
grant execute on function public.buscar_talleres_cercanos(double precision, double precision, double precision, text, text, text) to authenticated;

-- ── Coordenadas aproximadas para el taller real de prueba ──────────────
-- No se pudo geocodificar en vivo desde este sandbox (sin salida de red a
-- Nominatim); se usa una coordenada aproximada real de El Poblado, Medellín
-- como valor de partida — se corregirá con la coordenada exacta la próxima
-- vez que el taller edite su perfil (TallerPerfil.tsx geocodifica al guardar).

update public.organizations
set latitude = 6.2087, longitude = -75.5679
where name = 'yita taller' and latitude is null;

-- =============================================================================
-- Checklist:
--   33. contar_talleres_cercanos(6.2087, -75.5679, 10) devuelve >= 1 (el
--       taller de prueba está dentro del radio).
--   34. contar_talleres_cercanos ejecutable por un cliente anon (no requiere
--       sesión) — verificado por el grant explícito a anon.
--   35. buscar_talleres_cercanos llamado sin sesión (auth.uid() null) lanza
--       la excepción 'Sesión no establecida.' en vez de devolver filas.
--   36. buscar_talleres_cercanos con sesión válida devuelve las mismas
--       columnas que buscar_comercios_verificados más distancia_km, y viene
--       ordenado ascendente por distancia.
-- =============================================================================
