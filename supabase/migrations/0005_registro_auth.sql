-- =============================================================================
-- Registro real con Supabase Auth — completa lo que dejaba abierto
-- 0000_base_schema.sql: cómo una fila nueva en auth.users (creada por
-- supabase.auth.signUp desde el frontend) termina generando su fila en
-- public.users y, si es un taller, su organization + membership.
--
-- Por qué un trigger en auth.users y no una función que llame el frontend
-- después del signUp: auth.users se crea en el momento del signUp sin
-- importar si el proyecto tiene confirmación de correo activada o no. Si
-- en cambio se esperara a que el frontend llame a una función aparte
-- después de loguearse, un registro con confirmación de correo pendiente
-- se quedaría sin fila en public.users hasta que el usuario vuelva a
-- confirmar y loguearse — y para ese momento el frontend ya perdió los
-- datos del formulario (nombre del negocio, ciudad, etc.). Guardando esos
-- datos en auth.users.raw_user_meta_data al momento del signUp (vía el
-- parámetro `options.data` del SDK), el trigger los tiene disponibles sin
-- importar cuándo se dispare.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := coalesce(new.raw_user_meta_data->>'rol', 'Cliente');
  v_org_id text;
begin
  if v_rol not in ('Admin', 'Taller', 'Cliente') then
    v_rol := 'Cliente';
  end if;

  insert into public.users (id, rol, nombre, correo, celular, documento_tipo, documento_numero)
  values (
    new.id::text,
    v_rol,
    new.raw_user_meta_data->>'nombre',
    new.email,
    new.raw_user_meta_data->>'celular',
    new.raw_user_meta_data->>'documento_tipo',
    new.raw_user_meta_data->>'documento_numero'
  )
  on conflict (id) do nothing; -- ya existiría si el trigger se disparó dos veces por algún reintento

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

  return new;
end;
$$;

-- auth.users no es una tabla nuestra (la administra Supabase Auth) pero sí
-- se le pueden agregar triggers — patrón estándar de Supabase para este
-- caso exacto (ver su propia documentación de "Managing user data").
drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row execute function public.handle_new_user();

-- =============================================================================
-- Qué manda el frontend en options.data del signUp (ver src/lib/AuthProvider.tsx):
--
--   Cliente:
--     { rol: 'Cliente', nombre, celular, documento_tipo?, documento_numero? }
--
--   Taller:
--     { rol: 'Taller', nombre, celular, nombre_negocio, tipo_negocio,
--       ciudad, metadata: { barrio, direccion, tipo_vehiculo,
--       carro_motorizacion, moto_motorizacion, especialista_electricos } }
--
--   Admin: NO se crea por signUp público — un Admin se promueve a mano
--   (update directo de users.rol desde el SQL Editor de Supabase, o desde
--   un futuro panel de super-admin) para que nadie pueda auto-asignarse
--   ese rol completando un formulario.
-- =============================================================================

-- =============================================================================
-- Checklist antes de dar esto por conectado en el proyecto real:
--   20. Registrar un cliente nuevo crea su fila en public.users con
--       rol='Cliente' y sin organization/membership.
--   21. Registrar un taller nuevo crea su fila en public.users (rol='Taller'),
--       su organization en status='pendiente', y su membership como
--       'Propietario' — las tres en la misma transacción del trigger (si el
--       insert de organization falla, el de users también se revierte).
--   22. Si el proyecto tiene confirmación de correo activada, un registro
--       queda con la fila creada igual (el trigger corre al insertar en
--       auth.users, no al confirmar) — probar el flujo completo con
--       confirmación activada Y desactivada, según lo que se decida usar.
--   23. Nadie puede registrarse con rol='Admin' desde el formulario público
--       (el frontend nunca debe mandar rol:'Admin' en options.data — y aun
--       si alguien lo fuerza manualmente contra la API, confirmar que no
--       hay forma de pasar por el chequeo `if v_rol not in (...)`).
-- =============================================================================
