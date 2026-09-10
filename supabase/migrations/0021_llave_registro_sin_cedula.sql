-- =============================================================================
-- MIGRACIÓN 0021: LLAVE DE REGISTRO SIN DEPENDER DE LA CÉDULA
-- =============================================================================
--
-- CONTEXTO (decisión de negocio, 2026-09-10):
--
-- Hasta ahora la "llave" (codigo_referido) de un Cliente se calculaba con su
-- primer nombre + los 2 últimos dígitos de su cédula (0016_codigo_cliente_nombre_cedula.sql),
-- y solo se generaba cuando guardaba su documento en el gate obligatorio
-- RequireDocumento.tsx. Los Talleres nunca tenían llave.
--
-- El negocio decidió que, por ahora, no se le va a pedir la cédula a nadie
-- (la gente es reacia a darla apenas se registra) — ver
-- src/components/RequireDocumento.tsx, donde el gate quedó desactivado con
-- el flag PEDIR_DOCUMENTO = false. Pero sigue haciendo falta una forma de
-- identificar a cada persona desde el primer momento, que más adelante se
-- pueda relacionar con su cédula cuando sí se la pidamos (la cédula pasará
-- a ser el ID real en ese momento; la llave es el enlace hacia esa persona
-- mientras tanto).
--
-- Cambios de esta migración:
--   1. Nueva llave: primer nombre + 3 dígitos ALEATORIOS (ya no depende de
--      la cédula). Ejemplo: "jheison482". Aplica tanto a Cliente como a
--      Taller (antes solo a Cliente) — así decidió el negocio.
--   2. handle_new_user() asigna la llave en el momento del registro, no
--      cuando se guarda el documento (porque ahora mismo el documento no se
--      pide). Sigue siendo válido para roles nuevos: Taller y Cliente.
--   3. guardar_documento_cliente() deja de generar una llave nueva — cuando
--      en el futuro sí se guarde la cédula (con el gate reactivado, o desde
--      donde sea), simplemente se guarda junto a la llave que la persona ya
--      tenía desde su registro, sin reemplazarla. Así la cédula queda
--      relacionada con la llave existente, tal como lo pidió el negocio.
--   4. Backfill: talleres y clientes existentes sin llave reciben una ahora.
-- =============================================================================

-- ── 1. Función generadora: nombre + 3 dígitos aleatorios ──

create or replace function public.generar_llave_registro(p_nombre text)
returns text
language plpgsql
set search_path to 'public'
as $$
declare
  v_base text;
  v_codigo text;
  v_intento int := 0;
  v_existe boolean;
begin
  -- Primer nombre: solo la primera "palabra", tildes/ñ normalizadas a su
  -- letra base, solo letras, todo en minúscula. Si no queda nada utilizable
  -- (nombre vacío/nulo, o son puros caracteres raros), usa "usuario" —
  -- genérico a propósito porque ahora aplica tanto a Cliente como a Taller.
  v_base := lower(split_part(coalesce(trim(p_nombre), ''), ' ', 1));
  v_base := translate(
    v_base,
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc'
  );
  v_base := regexp_replace(v_base, '[^a-z]', '', 'g');
  if v_base = '' then
    v_base := 'usuario';
  end if;

  -- 3 dígitos aleatorios (000-999): 1000 combinaciones por nombre, muchas
  -- más que las 100 de antes (2 dígitos de cédula) — para un nombre común
  -- las colisiones deberían ser raras, pero igual se resuelven reintentando
  -- con otro número aleatorio, y si de verdad hay mala suerte varias veces
  -- seguidas, se garantiza terminar agregando un sufijo incremental.
  loop
    v_codigo := v_base || lpad(floor(random() * 1000)::int::text, 3, '0');
    select exists(select 1 from public.users where codigo_referido = v_codigo) into v_existe;
    exit when not v_existe;
    v_intento := v_intento + 1;
    exit when v_intento >= 20;
  end loop;

  if v_existe then
    -- Solo se llega acá tras 20 intentos aleatorios fallidos seguidos (en la
    -- práctica, nunca) — se garantiza unicidad con un sufijo incremental.
    v_intento := 1;
    loop
      v_codigo := v_base || lpad(floor(random() * 1000)::int::text, 3, '0') || v_intento::text;
      select exists(select 1 from public.users where codigo_referido = v_codigo) into v_existe;
      exit when not v_existe;
      v_intento := v_intento + 1;
    end loop;
  end if;

  return v_codigo;
end;
$$;

comment on function public.generar_llave_registro(text) is 'Llave de identificación para cualquier usuario nuevo (Cliente o Taller): primer nombre + 3 dígitos aleatorios. Ejemplo: "jheison482". Ya no depende de la cédula — ver migración 0021 y docs/SEGURIDAD.md.';

-- ── 2. handle_new_user(): asigna la llave en el registro, para Taller y Cliente ──

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
  v_llave text;
begin
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

  -- Llave de identificación (@nombre + 3 dígitos) — se asigna siempre, para
  -- Taller y Cliente, desde el registro. Ya no se espera a que guarde su
  -- documento (ver guardar_documento_cliente() más abajo).
  v_llave := public.generar_llave_registro(v_nombre);

  insert into public.users (
    id, rol, nombre, correo, celular, documento_tipo, documento_numero,
    ciudad, vehiculo, carro_motorizacion, moto_motorizacion, codigo_referido
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
    new.raw_user_meta_data->>'moto_motorizacion',
    v_llave
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
  'Trigger AFTER INSERT ON auth.users. Roles válidos desde registro público: Taller, Cliente (nunca Admin). Nombre/celular/ciudad obligatorios. Asigna la llave de identificación (@nombre+3 dígitos) a Taller y Cliente desde el registro — ya no depende de la cédula. Ver migraciones 0018, 0020, 0021 y docs/SEGURIDAD.md.';

-- ── 3. guardar_documento_cliente(): ya no genera llave, solo guarda el
--       documento y lo relaciona con la llave que la persona ya tenía ──
-- Queda lista para cuando el negocio vuelva a pedir la cédula (reactivando
-- RequireDocumento.tsx con PEDIR_DOCUMENTO = true, o desde cualquier otro
-- flujo que la llame) — en ese momento la cédula se guarda junto a la llave
-- ya asignada en el registro, sin reemplazarla.

create or replace function public.guardar_documento_cliente(p_tipo text, p_numero text)
returns table(codigo_referido text)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid text;
  v_nombre text;
  v_codigo_actual text;
begin
  v_uid := auth.uid()::text;
  if v_uid is null then
    raise exception 'Sesión no establecida.';
  end if;

  select u.nombre, u.codigo_referido into v_nombre, v_codigo_actual
  from public.users u where u.id = v_uid;

  if not found then
    raise exception 'Usuario no encontrado.';
  end if;

  -- Salvavidas: si por algún motivo esta cuenta no tiene llave todavía (por
  -- ejemplo, se creó antes de esta migración y el backfill de abajo no la
  -- alcanzó por algún borde), se le asigna una acá, nunca se deja en null.
  if v_codigo_actual is null then
    v_codigo_actual := public.generar_llave_registro(v_nombre);
  end if;

  update public.users
  set documento_tipo = p_tipo,
      documento_numero = p_numero,
      codigo_referido = v_codigo_actual
  where id = v_uid;

  return query select v_codigo_actual;
end;
$$;

revoke all on function public.guardar_documento_cliente(text, text) from public;
grant execute on function public.guardar_documento_cliente(text, text) to authenticated;

-- ── 4. Backfill: Talleres y Clientes existentes sin llave ──
-- Fila por fila, igual que en 0016, para que cada llamada a
-- generar_llave_registro() vea las llaves ya asignadas por las filas
-- anteriores de este mismo backfill.
do $$
declare
  r record;
begin
  for r in
    select id, nombre
    from public.users
    where rol in ('Cliente', 'Taller') and codigo_referido is null
    order by created_at
  loop
    update public.users
    set codigo_referido = public.generar_llave_registro(r.nombre)
    where id = r.id;
  end loop;
end;
$$;

-- =============================================================================
-- Checklist:
--   1. Un Cliente nuevo se registra sin que se le pida cédula en ningún
--      momento (RequireDocumento.tsx desactivado) y ya sale con su llave
--      (ej. "jheison482") desde el primer instante.
--   2. Un Taller nuevo también recibe su llave desde el registro — antes no
--      tenía ninguna.
--   3. Un Taller o Cliente que ya existía y no tenía llave la recibe con el
--      backfill de esta migración.
--   4. Si algún día se reactiva el gate de documento, guardar_documento_cliente()
--      guarda la cédula junto a la llave que la persona ya tenía — no le
--      cambia la llave.
--   5. Dos personas distintas llamadas "Jheison" no chocan: si el número
--      aleatorio coincide, se reintenta con otro número aleatorio (hasta 20
--      veces) y, en el peor de los casos, se agrega un sufijo incremental.
-- =============================================================================
