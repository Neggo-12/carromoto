-- =============================================================================
-- Reemplazo del código de referido aleatorio por un código legible: primer
-- nombre del CLIENTE + últimos 2 dígitos de su cédula (documento_numero).
-- Pedido del negocio (25 ago 2026): "generar algo que se llame codigo o
-- indetificacion del cliente que sea su primer nombre y los dos ultimos
-- numeros de la cedula... ejemplo jheison68". Debe ser único y funcionar como
-- "llave" para una futura transferencia de puntos entre clientes (ver
-- puntos-neggo/docs/modelo-economico-v1.md §5, que ya exige "destinatario
-- registrado" para transferir).
--
-- Decisiones de diseño:
--   1. Solo para clientes (rol='Cliente'). Un taller no tiene "llave" — el
--      código de referido de 0015 se había dejado abierto a ambos roles,
--      pero el negocio lo pidió explícitamente "para el cliente a nivel".
--      Los talleres se quedan sin codigo_referido (columna en null).
--   2. Ya no se puede generar en el INSERT (trigger de 0015) porque el
--      documento del cliente casi nunca se conoce al registrarse — se pide
--      después, a través del gate obligatorio RequireDocumento.tsx (ver
--      src/components/RequireDocumento.tsx: bloquea TODO el portal hasta que
--      documento_tipo y documento_numero estén guardados). Por eso el código
--      se genera recién cuando se guarda el documento, no antes.
--   3. Colisiones: nombre+2 dígitos no es único por diseño (dos "jheison"
--      con cédula terminada en 68 sí pueden existir). Se resuelve agregando
--      un sufijo numérico (jheison68, jheison682, jheison683, ...) hasta
--      encontrar uno libre.
-- =============================================================================

-- ── 1. Función generadora: nombre + últimos 2 dígitos de cédula ──

create or replace function public.generar_codigo_cliente(p_nombre text, p_documento text)
returns text
language plpgsql
set search_path to 'public'
as $$
declare
  v_base text;
  v_digitos text;
  v_codigo text;
  v_sufijo int := 1;
  v_existe boolean;
begin
  -- Primer nombre: solo la primera "palabra", sin tildes/ñ normalizadas a su
  -- letra base, solo letras, todo en minúscula. Si no queda nada utilizable
  -- (nombre vacío/nulo, o son puros caracteres raros), usa "cliente".
  v_base := lower(split_part(coalesce(trim(p_nombre), ''), ' ', 1));
  v_base := translate(
    v_base,
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc'
  );
  v_base := regexp_replace(v_base, '[^a-z]', '', 'g');
  if v_base = '' then
    v_base := 'cliente';
  end if;

  -- Últimos 2 dígitos del documento (solo dígitos, ignora puntos/guiones).
  v_digitos := regexp_replace(coalesce(p_documento, ''), '[^0-9]', '', 'g');
  if length(v_digitos) >= 2 then
    v_digitos := right(v_digitos, 2);
  elsif length(v_digitos) = 1 then
    v_digitos := '0' || v_digitos;
  else
    v_digitos := '00';
  end if;

  v_codigo := v_base || v_digitos;

  loop
    select exists(select 1 from public.users where codigo_referido = v_codigo) into v_existe;
    exit when not v_existe;
    v_sufijo := v_sufijo + 1;
    v_codigo := v_base || v_digitos || v_sufijo::text;
  end loop;

  return v_codigo;
end;
$$;

comment on function public.generar_codigo_cliente(text, text) is 'Código legible tipo "llave" para un cliente: primer nombre + últimos 2 dígitos de la cédula, con sufijo numérico si hay colisión. Ejemplo real: Jheison con documento terminado en 68 -> jheison68.';

-- ── 2. Ya no se genera solo en el INSERT: el documento no se conoce ahí ──

drop trigger if exists trg_set_codigo_referido on public.users;
drop function if exists public.set_codigo_referido();
drop function if exists public.generar_codigo_referido();

-- ── 3. RPC que guarda el documento del cliente y, en ese momento, le asigna
--       su código (si todavía no tenía uno). La llama RequireDocumento.tsx
--       en vez de hacer un update directo — así el cálculo del código queda
--       centralizado y no depende de que el frontend "se acuerde" de pedirlo.

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

  select rol, nombre, codigo_referido into v_rol, v_nombre, v_codigo_actual
  from public.users where id = v_uid;

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

-- ── 4. Validación de código: ahora en minúscula (antes comparaba en upper) ──

create or replace function public.validar_codigo_referido(p_codigo text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from public.users
    where codigo_referido = lower(trim(p_codigo)) and trim(coalesce(p_codigo, '')) <> ''
  );
$$;

-- ── 5. handle_new_user(): comparar/guardar el código en minúscula ──

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
begin
  if v_rol not in ('Admin', 'Taller', 'Cliente') then
    v_rol := 'Cliente';
  end if;

  insert into public.users (
    id, rol, nombre, correo, celular, documento_tipo, documento_numero,
    ciudad, vehiculo, carro_motorizacion, moto_motorizacion
  )
  values (
    new.id::text,
    v_rol,
    new.raw_user_meta_data->>'nombre',
    new.email,
    new.raw_user_meta_data->>'celular',
    new.raw_user_meta_data->>'documento_tipo',
    new.raw_user_meta_data->>'documento_numero',
    new.raw_user_meta_data->>'ciudad',
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

  -- Referidos: código en minúscula desde acá en adelante (antes era upper).
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

-- ── 6. mis_referidos(): agregar el código del referido, no solo el nombre ──
-- Pedido del negocio: "debo tener el nombre y su codigo" de cada persona
-- referida, no solo el nombre.

drop function if exists public.mis_referidos();

create or replace function public.mis_referidos()
returns table(referido_nombre text, referido_codigo text, fecha timestamptz, puntos_otorgados integer)
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce(u.nombre, 'Cliente'), u.codigo_referido, r.created_at, r.puntos_otorgados
  from referidos r
  join users u on u.id = r.referido_id
  where r.referente_id = (auth.uid())::text
  order by r.created_at desc;
$$;

revoke all on function public.mis_referidos() from public;
grant execute on function public.mis_referidos() to authenticated;

-- ── 7. Backfill de clientes existentes ──
-- Fila por fila (no un UPDATE masivo) porque cada llamada a
-- generar_codigo_cliente() necesita ver los códigos ya asignados por las
-- filas anteriores DE ESTE MISMO backfill para evitar colisiones — un UPDATE
-- de una sola sentencia no vería esos cambios entre sí (todas las subquery
-- leen la foto de arranque de la sentencia).
do $$
declare
  r record;
begin
  for r in
    select id, nombre, documento_numero
    from public.users
    where rol = 'Cliente' and documento_numero is not null and trim(documento_numero) <> ''
    order by created_at
  loop
    update public.users
    set codigo_referido = public.generar_codigo_cliente(r.nombre, r.documento_numero)
    where id = r.id;
  end loop;

  -- Clientes sin documento todavía (les tocará el gate RequireDocumento en
  -- su próximo ingreso), todos los talleres, y el admin (le había quedado un
  -- código aleatorio de 0015): sin código, porque esto es solo para clientes.
  update public.users
  set codigo_referido = null
  where (rol = 'Cliente' and (documento_numero is null or trim(documento_numero) = ''))
     or rol in ('Taller', 'Admin');
end;
$$;

-- =============================================================================
-- Checklist:
--   1. Cliente Jheison (documento terminado en 68, nombre "Jheison") ya tiene
--      documento guardado antes de esta migración -> el backfill le asigna
--      codigo_referido = 'jheison68'.
--   2. Cliente nuevo sin documento se registra: codigo_referido queda null
--      hasta que complete el gate RequireDocumento -> ahí
--      guardar_documento_cliente() se lo asigna en el mismo momento.
--   3. Dos clientes distintos llamados "Jheison" con cédula terminada en 68:
--      el segundo en guardar su documento recibe 'jheison682' (no choca con
--      el primero).
--   4. Un taller nunca tiene codigo_referido (rol != 'Cliente' en
--      guardar_documento_cliente, y el backfill lo deja en null).
--   5. validar_codigo_referido('JHEISON68') y ('jheison68') devuelven lo
--      mismo (comparación en minúscula).
--   6. mis_referidos() ahora trae también el codigo_referido de cada
--      persona referida, no solo su nombre.
-- =============================================================================
