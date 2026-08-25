-- =============================================================================
-- Consentimientos legales (Términos y Condiciones + Autorización de
-- Tratamiento de Datos) — pedido del negocio de implementar lo del
-- documento MASTER_LEGAL_PRIVACY_GOVERNANCE_SYSTEM_ECOSISTEMA, alcance
-- acotado a este proyecto (Tallergo): registrar evidencia real de que cada
-- usuario aceptó, con qué versión de documento y cuándo — nunca casillas
-- premarcadas, y NUNCA se mezcla "acepto términos" con "autorizo el
-- tratamiento de mis datos" en un solo consentimiento (son cosas jurídicas
-- distintas — ver sección 7 y 25 del documento maestro).
--
-- Se escribe desde el mismo trigger que crea la fila en `users` al
-- registrarse (handle_new_user, ver 0005_registro_auth.sql) para que quede
-- atómico con la creación de la cuenta y funcione aunque el registro
-- requiera confirmar el correo (en ese momento todavía no hay sesión de
-- cliente para hacer un insert normal bajo RLS).
--
-- Es un registro de solo lectura para el usuario: no hay política de
-- update/delete — la evidencia histórica de un consentimiento nunca se
-- edita ni se borra (una revocatoria futura sería una fila nueva, no un
-- borrado de esta).
--
-- Aplicado directo al proyecto real vía Supabase MCP; este archivo
-- consolida el estado final para que el repo quede sincronizado con la
-- base real.
-- =============================================================================

create table public.consentimientos (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users(id) on delete cascade,
  documento text not null check (documento in ('terminos', 'tratamiento_datos')),
  version text not null,
  metodo text not null default 'checkbox_registro',
  aceptado_en timestamptz not null default now()
);

create index consentimientos_user_id_idx on public.consentimientos(user_id);

comment on table public.consentimientos is 'Evidencia de aceptación de Términos y Condiciones / autorización de Tratamiento de Datos — un consentimiento por documento y por usuario (no se mezclan). Se escribe únicamente desde handle_new_user() al registrarse. Nunca se actualiza ni se borra: es evidencia histórica.';

alter table public.consentimientos enable row level security;

create policy consentimientos_select_propio on public.consentimientos
  for select using (user_id = (auth.uid())::text or is_platform_admin());

-- Extiende handle_new_user() (definida en 0005_registro_auth.sql) para
-- registrar los dos consentimientos cuando el frontend los manda en el
-- metadata del signUp — RegistroCliente.tsx y RegistroTaller.tsx exigen
-- ambas casillas marcadas (sin premarcar) antes de poder enviar el
-- formulario, así que en el flujo normal siempre van a venir presentes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_rol text := coalesce(new.raw_user_meta_data->>'rol', 'Cliente');
  v_org_id text;
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

  return new;
end;
$$;

-- =============================================================================
-- Checklist:
--   1. Un registro nuevo con acepto_terminos_version='2026-08-25' y
--      acepto_tratamiento_version='2026-08-25' en el metadata del signUp
--      deja DOS filas en consentimientos (una por documento) con esa
--      versión y aceptado_en = momento del registro.
--   2. Un registro sin esas claves en el metadata (no debería pasar desde
--      el frontend actual, pero por si acaso) no rompe el registro — el
--      trigger sigue insertando en users/organizations normal, solo no
--      deja evidencia de consentimiento.
--   3. El cliente puede leer sus propios consentimientos (select) pero no
--      puede insertar, actualizar ni borrar ninguno directamente.
--   4. El admin puede leer los consentimientos de cualquier usuario.
-- =============================================================================
