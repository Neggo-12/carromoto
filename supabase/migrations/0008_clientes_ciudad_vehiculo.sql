-- =============================================================================
-- Fix — RegistroCliente.tsx ya le pregunta al cliente su ciudad y su
-- vehículo (pasos "Tu ciudad" / "Tu vehículo" del formulario, con su propia
-- validación) pero registrarCliente() en AuthProvider.tsx nunca los mandaba
-- en options.data — se perdían en el aire apenas el usuario los llenaba.
-- Encontrado al conectar Admin > Clientes (esta pantalla) contra datos
-- reales: no había NINGUNA columna en public.users donde pudiera vivir esa
-- información, así que no había forma de mostrarla sin inventarla.
--
-- Se agregan las columnas reales y se actualiza el trigger para que las
-- guarde cuando vengan en el metadata del signUp — igual que ya hace con
-- nombre/celular/documento.
-- =============================================================================

alter table public.users
  add column if not exists ciudad text,
  add column if not exists vehiculo text check (vehiculo in ('carro', 'moto', 'ambos')),
  add column if not exists carro_motorizacion text check (carro_motorizacion in ('electrico', 'hibrido', 'combustion')),
  add column if not exists moto_motorizacion text check (moto_motorizacion in ('electrico', 'hibrido', 'combustion'));

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

-- =============================================================================
-- Checklist:
--   26. Registrar un cliente nuevo con carro eléctrico y moto a combustión
--       guarda ciudad='<lo elegido>', vehiculo='ambos',
--       carro_motorizacion='electrico', moto_motorizacion='combustion'.
--   27. Un cliente viejo (registrado antes de esta migración) tiene estas
--       columnas en null — Admin > Clientes debe mostrar "Sin datos" en vez
--       de romperse o mostrar un dato falso.
-- =============================================================================
