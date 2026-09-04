-- =============================================================================
-- MIGRACIÓN 0017: PARCHES DE SEGURIDAD, CONSOLIDACIÓN Y CORRECCIÓN 0014
-- =============================================================================

-- ── 1. Manejo seguro de la duplicación de migración 0014 (campana_bienvenida) ──

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'campana_bienvenida'
  ) THEN
    CREATE TABLE public.campana_bienvenida (
      id text PRIMARY KEY DEFAULT 'global',
      activa boolean NOT NULL DEFAULT false,
      puntos integer NOT NULL DEFAULT 100 CHECK (puntos > 0),
      actualizado_por text NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT campana_bienvenida_singleton CHECK (id = 'global')
    );
    INSERT INTO public.campana_bienvenida (id, activa, puntos) VALUES ('global', false, 100);
  END IF;
END $$;

INSERT INTO public.campana_bienvenida (id, activa, puntos)
VALUES ('global', false, 100)
ON CONFLICT (id) DO NOTHING;


-- ── 2. Definición Final e Idempotente de handle_new_user() ──
-- Consolida: Seguridad (Anti-Admin escalation), Consentimientos (0014), 
-- Referidos (0015) y Códigos en minúscula (0016).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol text := coalesce(new.raw_user_meta_data->>'rol', 'Cliente');
  v_org_id text;
  v_codigo_usado text;
  v_referente_id text;
BEGIN
  -- SEGURIDAD: Previene autoregistro como Admin
  IF v_rol NOT IN ('Admin', 'Taller', 'Cliente') THEN
    v_rol := 'Cliente';
  END IF;

  INSERT INTO public.users (
    id, rol, nombre, correo, celular, documento_tipo, documento_numero,
    ciudad, vehiculo, carro_motorizacion, moto_motorizacion
  )
  VALUES (
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
  ON CONFLICT (id) DO NOTHING;

  IF v_rol = 'Taller' AND (new.raw_user_meta_data ? 'nombre_negocio') THEN
    INSERT INTO public.organizations (name, type, ciudad, metadata)
    VALUES (
      new.raw_user_meta_data->>'nombre_negocio',
      coalesce(new.raw_user_meta_data->>'tipo_negocio', 'taller'),
      new.raw_user_meta_data->>'ciudad',
      coalesce(new.raw_user_meta_data->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_org_id;

    INSERT INTO public.memberships (user_id, organization_id, rol, is_active)
    VALUES (new.id::text, v_org_id, 'Propietario', true);
  END IF;

  -- Consentimientos legales (0014)
  IF new.raw_user_meta_data ? 'acepto_terminos_version' THEN
    INSERT INTO public.consentimientos (user_id, documento, version)
    VALUES (new.id::text, 'terminos', new.raw_user_meta_data->>'acepto_terminos_version');
  END IF;

  IF new.raw_user_meta_data ? 'acepto_tratamiento_version' THEN
    INSERT INTO public.consentimientos (user_id, documento, version)
    VALUES (new.id::text, 'tratamiento_datos', new.raw_user_meta_data->>'acepto_tratamiento_version');
  END IF;

  -- Enlace de referidos en minúscula (0015 / 0016)
  v_codigo_usado := nullif(trim(new.raw_user_meta_data->>'codigo_referido_usado'), '');
  IF v_codigo_usado IS NOT NULL THEN
    SELECT id INTO v_referente_id FROM public.users
    WHERE codigo_referido = lower(v_codigo_usado) AND id <> new.id::text;

    IF v_referente_id IS NOT NULL THEN
      INSERT INTO public.referidos (referente_id, referido_id, codigo_usado)
      VALUES (v_referente_id, new.id::text, lower(v_codigo_usado))
      ON CONFLICT (referido_id) DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$;