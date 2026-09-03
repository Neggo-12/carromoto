-- =============================================================================
-- FIX urgente (3 sep 2026, reportado por el dueño del negocio con capturas):
-- guardar_documento_cliente() fallaba SIEMPRE con "column reference
-- codigo_referido is ambiguous" — bug introducido en
-- 0016_codigo_cliente_nombre_cedula.sql.
--
-- Causa: `returns table(codigo_referido text)` crea automáticamente una
-- variable interna llamada codigo_referido (el parámetro de salida). El
-- cuerpo de la función después hacía:
--
--   select rol, nombre, codigo_referido into v_rol, v_nombre, v_codigo_actual
--   from public.users where id = v_uid;
--
-- Acá "codigo_referido" sin alias es ambiguo: Postgres no sabe si es la
-- columna de la tabla users o la variable de salida de la función, y por
-- default PL/pgSQL lo trata como error (ver Postgres docs 43.11.1,
-- "Variable Substitution" / #variable_conflict). Esto pasa en TODA llamada
-- a la función, sin excepción.
--
-- Efecto real en producción: todo cliente que llegaba al paso obligatorio
-- "Necesitamos un dato más" (RequireDocumento.tsx) y pulsaba "Guardar y
-- continuar" recibía "No pudimos guardar su documento. Intente de nuevo." y
-- quedaba bloqueado — no podía terminar su registro ni entrar al portal.
--
-- Se corrige calificando la consulta con el alias de tabla `u.` — con alias,
-- la referencia ya no es ambigua (regla estándar de PL/pgSQL: una referencia
-- CALIFICADA a una columna nunca compite con una variable local).
--
-- Verificado en vivo contra el proyecto real (25 ago 2026): se simuló una
-- sesión del cliente Jheison (auth.uid() vía request.jwt.claims) y se llamó
-- guardar_documento_cliente('CC', '1214731768') — devolvió 'jheison68' sin
-- error, igual que su código ya guardado. Antes del fix esa misma llamada
-- fallaba siempre con el error de ambigüedad.
-- =============================================================================

create or replace function public.guardar_documento_cliente(p_tipo text, p_numero text)
returns table(codigo_referido text)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid text;
  v_rol text;
  v_nombre text;
  v_codigo_actual text;
  v_codigo_nuevo text;
begin
  v_uid := auth.uid()::text;
  if v_uid is null then
    raise exception 'Sesión no establecida.';
  end if;

  select u.rol, u.nombre, u.codigo_referido into v_rol, v_nombre, v_codigo_actual
  from public.users u where u.id = v_uid;

  if not found then
    raise exception 'Usuario no encontrado.';
  end if;

  v_codigo_nuevo := v_codigo_actual;
  if v_rol = 'Cliente' and v_codigo_actual is null then
    v_codigo_nuevo := public.generar_codigo_cliente(v_nombre, p_numero);
  end if;

  update public.users
  set documento_tipo = p_tipo,
      documento_numero = p_numero,
      codigo_referido = v_codigo_nuevo
  where id = v_uid;

  return query select v_codigo_nuevo;
end;
$$;

revoke all on function public.guardar_documento_cliente(text, text) from public;
grant execute on function public.guardar_documento_cliente(text, text) to authenticated;

-- =============================================================================
-- Checklist:
--   1. Un cliente que llega por primera vez a "Necesitamos un dato más" y
--      guarda su documento ya no ve el error — su código se genera y queda
--      guardado en el mismo momento.
--   2. Un cliente que ya tenía documento y código guardados (ej. Jheison)
--      puede volver a pasar por acá sin que le cambie el código.
--   3. Un Taller que llega a esa misma pantalla también guarda su documento
--      sin error (no se le asigna código, porque no es Cliente).
-- =============================================================================
