-- =============================================================================
-- MIGRACIÓN 0020: REAFIRMA LA SEGURIDAD DE handle_new_user()
-- =============================================================================
--
-- CONTEXTO (para que quede documentado en la propia base de datos):
--
-- La migración 0018 (fix_seguridad_registro) corrigió una vulnerabilidad de
-- escalamiento de privilegios: el registro público aceptaba "rol": "Admin"
-- en los metadatos y creaba la cuenta como administrador. 0018 restringió
-- los roles válidos a únicamente ('Taller', 'Cliente') y además hizo
-- obligatorios nombre, celular y ciudad (rechazando el registro con
-- `raise exception` si faltan).
--
-- Después, en una migración distinta creada en paralelo por el equipo
-- (0017_parches_seguridad_y_fix_duplicaciones.sql, fusionada a `main` vía
-- PR #2 "feature/security-headers"), handle_new_user() se reescribió con
-- la intención de resolver el mismo problema, pero el chequeo quedó así:
--
--   IF v_rol NOT IN ('Admin', 'Taller', 'Cliente') THEN
--     v_rol := 'Cliente';
--   END IF;
--
-- 'Admin' quedó DENTRO de la lista de roles permitidos, es decir que si esa
-- versión se llega a aplicar, un registro con "rol": "Admin" NO se degrada
-- a Cliente y la vulnerabilidad original vuelve a estar abierta — a pesar
-- de que el comentario de esa función dice "Previene autoregistro como
-- Admin". Esa versión tampoco valida nombre/celular/ciudad obligatorios.
--
-- Se verificó en producción (pg_get_functiondef + list_migrations) que esa
-- versión NUNCA se aplicó contra esta base de datos: la función que ha
-- estado corriendo en todo momento es la de 0018. Esta migración 0020 no
-- corrige nada roto en producción — su propósito es dejar constancia
-- explícita, en el propio historial de migraciones, de cuál es la versión
-- correcta y vigente, para que si algún día se reconstruye la base desde
-- cero corriendo todas las migraciones en orden (0000 → la última), el
-- resultado final siga siendo el seguro, sin depender de que nadie recuerde
-- evitar la migración 0017_parches_seguridad_y_fix_duplicaciones.sql.
--
-- Ver también: docs/SEGURIDAD.md, sección "Incidente 2026-09-04".
-- =============================================================================

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
  v_nombre text;
  v_celular text;
  v_ciudad text;
begin
  -- SEGURIDAD: el registro público solo puede crear cuentas Taller o
  -- Cliente. Cualquier otro valor (incluido 'Admin') se degrada a Cliente.
  -- 'Admin' se otorga únicamente desde el panel de administración, nunca
  -- desde el registro público. No agregar 'Admin' a esta lista.
  if v_rol not in ('Taller', 'Cliente') then
    v_rol := 'Cliente';
  end if;

  v_nombre := nullif(trim(new.raw_user_meta_data->>'nombre'), '');
  v_celular := nullif(trim(new.raw_user_meta_data->>'celular'), '');
  v_ciudad := nullif(trim(new.raw_user_meta_data->>'ciudad'), '');

  if v_nombre is null then
    raise exception 'El nombre es obligatorio.';
  end if;
  if v_celular is null then
    raise exception 'El celular es obligatorio.';
  end if;
  if v_ciudad is null then
    raise exception 'La ciudad es obligatoria.';
  end if;

  insert into public.users (
    id, rol, nombre, correo, celular, documento_tipo, documento_numero,
    ciudad, vehiculo, carro_motorizacion, moto_motorizacion
  )
  values (
    new.id::text,
    v_rol,
    v_nombre,
    new.email,
    v_celular,
    new.raw_user_meta_data->>'documento_tipo',
    new.raw_user_meta_data->>'documento_numero',
    v_ciudad,
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

  v_codigo_usado := nullif(trim(new.raw_user_meta_data->>'codigo_referido_usado'), '');
  if v_codigo_usado is not null then
    select id into v_referente_id from public.users
    where codigo_referido = lower(v_codigo_usado) and id <> new.id::text;

    if v_referente_id is not null then
      insert into public.referidos (referente_id, referido_id, codigo_usado)
      values (v_referente_id, new.id::text, lower(v_codigo_usado))
      on conflict (referido_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Trigger AFTER INSERT ON auth.users. Roles válidos desde registro público: Taller, Cliente (nunca Admin). Nombre/celular/ciudad obligatorios. Ver migraciones 0018 y 0020, y docs/SEGURIDAD.md.';
