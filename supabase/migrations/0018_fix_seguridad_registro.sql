-- =============================================================================
-- FIX CRÍTICO DE SEGURIDAD (4 sep 2026, encontrado por el dueño del negocio
-- al revisar cuentas de prueba en la base):
--
-- 1) CUALQUIER PERSONA PODÍA AUTO-ASIGNARSE rol='Admin'. Ninguna pantalla de
--    registro de Tallergo ofrece "Admin" como opción — pero handle_new_user()
--    confiaba ciegamente en new.raw_user_meta_data->>'rol', que es un campo
--    que CUALQUIERA puede mandar llamando la API de Supabase Auth
--    directamente (curl, Postman, devtools), sin pasar por la app. Evidencia
--    real encontrada en la base: una cuenta 'test_seguridad_0017@ejemplo.com'
--    quedó con rol='Admin'. is_platform_admin() solo mira rol='Admin' en
--    public.users, así que esa cuenta tenía acceso total de administrador:
--    aprobar/rechazar talleres, ver campañas, referidos, consentimientos de
--    TODOS los usuarios, etc. Las cuentas de auth ya no existen (fueron
--    borradas, probablemente por quien hizo la prueba), así que ya no se
--    puede iniciar sesión con ellas — pero el hueco seguía abierto para
--    cualquiera que lo intentara de nuevo.
--
-- 2) Se podían crear cuentas de Cliente/Taller SIN celular ni ciudad,
--    saltándose la validación del formulario (que solo corre en el
--    navegador) llamando la API directo. Evidencia real: cuenta
--    'test_seguridad_v2@ejemplo.com' con celular y ciudad en null. Ambos
--    datos ya eran obligatorios en el formulario de registro, pero nada los
--    exigía del lado del servidor.
--
-- FIX: handle_new_user() ahora (a) nunca acepta 'Admin' desde el registro
-- público — cualquier valor que no sea 'Taller' o 'Cliente' cae a 'Cliente',
-- igual que antes se hacía con valores inválidos — y (b) rechaza la creación
-- de la cuenta (con una excepción, que hace fallar el signUp() completo) si
-- falta nombre, celular o ciudad. Como el formulario real siempre manda los
-- tres, esto no cambia nada para un cliente o taller que se registra
-- normalmente por la app — solo cierra la puerta a saltarse la UI.
--
-- Nota: los administradores de verdad de la plataforma se siguen creando
-- manualmente (por SQL, con acceso directo a la base) — nunca a través del
-- registro público. Esta migración no toca ninguna cuenta Admin existente.
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
  -- CRÍTICO: 'Admin' nunca se acepta acá. Es la única línea que cierra el
  -- hueco de auto-asignación de administrador.
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

-- ── Limpieza de las cuentas de prueba encontradas ──
-- Sus auth.users ya no existen (nadie puede iniciar sesión con ellas), así
-- que las filas en public.users quedaron huérfanas — no representan a
-- ninguna persona real. Se borran para no dejar basura de prueba en la base,
-- incluyendo una con rol='Admin' que ya no debería existir de todas formas.
delete from public.users
where correo in ('test_seguridad_v2@ejemplo.com', 'test_seguridad_0017@ejemplo.com')
  and id not in (select id::text from auth.users);

-- =============================================================================
-- Checklist:
--   1. supabase.auth.signUp({ data: { rol: 'Admin', ... } }) ya NO crea un
--      admin — la cuenta queda como Cliente.
--   2. Llamar signUp() sin celular o sin ciudad en la metadata hace fallar
--      el registro completo (error de Postgres, que llega como error de
--      auth.signUp() al que llama).
--   3. RegistroCliente.tsx y RegistroTaller.tsx (que ya mandan estos tres
--      datos siempre) siguen funcionando exactamente igual — cero cambio
--      para un registro real por la app.
--   4. Las dos cuentas de prueba ya no aparecen en public.users.
-- =============================================================================
