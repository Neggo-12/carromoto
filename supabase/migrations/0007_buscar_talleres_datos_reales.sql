-- =============================================================================
-- Fix — buscar_comercios_verificados() todavía asumía el esquema copiado de
-- Neggo (una columna `categoria` plana en metadata que nunca existió acá).
-- El contrato real de metadata de un taller (ver handle_new_user() en
-- 0005_registro_auth.sql y RegistroTaller.tsx) es tipo_vehiculo +
-- especialista_electricos + servicios, no "categoria". Con la versión vieja,
-- Buscar Talleres iba a devolver siempre 0 resultados aunque hubiera talleres
-- reales aprobados y con sello — la función nunca podía construir una
-- `categoria` que no existe. Se encontró al conectar la primera pantalla real
-- (Buscar Talleres) contra este proyecto.
-- =============================================================================

-- Cambia la forma de la tabla que devuelve (columnas nuevas) — hay que
-- soltar la versión vieja antes de poder recrearla con otra forma.
drop function if exists public.buscar_comercios_verificados(text);

create function public.buscar_comercios_verificados(p_termino text)
returns table(
  id text,
  name text,
  ciudad text,
  tipo_negocio text,
  tipo_vehiculo text,
  especialista_electricos boolean,
  descripcion_negocio text,
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
    o.created_at as afiliado_desde,
    'TA-' || upper(left(o.id, 6)) as codigo_publico
  from organizations o
  where o.type in ('taller', 'almacen') and o.has_trust_seal = true and o.status = 'aprobado'
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

-- =============================================================================
-- Checklist:
--   24. Buscar un taller sembrado real (type in ('taller','almacen'),
--       has_trust_seal = true, status = 'aprobado') devuelve resultado con
--       tipo_vehiculo y especialista_electricos correctos, leídos de metadata.
--   25. Un taller aprobado pero SIN sello no aparece — el admin tiene que
--       activar el sello explícitamente, aprobar no alcanza.
-- =============================================================================
