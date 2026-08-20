-- =============================================================================
-- Extiende buscar_comercios_verificados() para el buscador público de la
-- Home nueva (LandingHub.tsx, rediseño del 20/08/2026) — antes solo
-- buscaba por nombre (usado en Buscar Talleres del Portal de Cliente). El
-- buscador de la Home pregunta "¿qué vehículo tenés?", "¿qué necesitás?" y
-- "¿dónde estás?", así que hacen falta filtros de tipo_vehiculo, servicio y
-- ciudad, más un filtro de motorización para las tarjetas "Híbridos" /
-- "Eléctricos" de la sección "Tipos de vehículo".
--
-- Todos los parámetros nuevos son opcionales con default null/'' (= sin
-- filtrar por ese campo), así que la llamada vieja de un solo argumento
-- posicional (ClienteBuscarTalleres.tsx: buscar_comercios_verificados({p_termino}))
-- sigue funcionando sin cambios.
--
-- También se agregan direccion, barrio y servicios (ya viven en metadata
-- desde el registro/perfil del taller) para que las tarjetas nuevas puedan
-- mostrar especialidades reales y armar un link de "Cómo llegar" con la
-- dirección real, sin inventar campos que no existen.
--
-- Aplicado directo al proyecto real vía Supabase MCP en 3 pasos
-- incrementales durante el rediseño; este archivo consolida el estado
-- final para que el repo quede sincronizado con la base real.
-- =============================================================================

drop function if exists public.buscar_comercios_verificados(text);
drop function if exists public.buscar_comercios_verificados(text, text, text);
drop function if exists public.buscar_comercios_verificados(text, text, text, text);
drop function if exists public.buscar_comercios_verificados(text, text, text, text, text);

create function public.buscar_comercios_verificados(
  p_termino text default '',
  p_tipo_vehiculo text default null,
  p_ciudad text default null,
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
  codigo_publico text
)
language sql stable security definer
set search_path to 'public'
as $$
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
    'TA-' || upper(left(o.id, 6)) as codigo_publico
  from organizations o
  where o.type in ('taller', 'almacen') and o.has_trust_seal = true and o.status = 'aprobado'
    and lower(regexp_replace(o.name, '\s+', '', 'g'))
        ilike '%' || lower(regexp_replace(coalesce(p_termino, ''), '\s+', '', 'g')) || '%'
    and (
      p_tipo_vehiculo is null
      or o.metadata->>'tipo_vehiculo' = p_tipo_vehiculo
      or o.metadata->>'tipo_vehiculo' = 'ambos'
    )
    and (p_ciudad is null or o.ciudad = p_ciudad)
    and (p_servicio is null or o.metadata->'servicios' ? p_servicio)
    and (
      p_motorizacion is null
      or o.metadata->'carro_motorizacion' ? p_motorizacion
      or o.metadata->'moto_motorizacion' ? p_motorizacion
      -- compatibilidad con datos viejos donde carro_motorizacion/moto_motorizacion
      -- se guardaron como string único en vez de array (ver TallerPerfil.tsx
      -- normalizarMotorizaciones) — jsonb ?  no matchea un string suelto.
      or o.metadata->>'carro_motorizacion' = p_motorizacion
      or o.metadata->>'moto_motorizacion' = p_motorizacion
    )
  order by
    case
      when lower(o.name) = lower(coalesce(p_termino, '')) then 0
      when p_termino is not null and p_termino <> '' and lower(o.name) ilike lower(p_termino) || '%' then 1
      else 2
    end,
    o.name
  limit 20;
$$;

-- =============================================================================
-- Checklist:
--   29. Llamar buscar_comercios_verificados('') sin más argumentos (como ya
--       hace ClienteBuscarTalleres via un solo positional arg) sigue
--       funcionando igual que antes.
--   30. Llamar con p_tipo_vehiculo='moto' devuelve talleres de moto Y de
--       'ambos', pero no de 'carro'.
--   31. Llamar con p_motorizacion='electrico' devuelve talleres cuyo
--       carro_motorizacion o moto_motorizacion (array o string viejo)
--       incluya 'electrico', sin importar si también atienden combustión.
--   32. Llamar con p_ciudad='Medellín' y/o p_servicio='frenos' filtra
--       correctamente combinado con los demás filtros.
-- =============================================================================
