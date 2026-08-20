-- =============================================================================
-- Fix — campanas.organization_id y comercio_contactos.comercio_id nunca
-- tuvieron una foreign key real hacia organizations(id) (0001 las declaró
-- como `text not null` a secas). Sin la FK, PostgREST no puede resolver un
-- embed tipo `.select("...,organizations(name)")` — Ofertas para Clientes
-- necesita mostrar el nombre del taller dueño de cada campaña, y sin esto
-- la consulta falla con "Could not find a relationship...". Se encontró al
-- conectar ClienteOfertas.tsx contra datos reales.
--
-- Las tres tablas están vacías en este proyecto (recién creado), así que
-- agregar la FK no rompe nada existente.
-- =============================================================================

alter table public.campanas
  add constraint campanas_organization_id_fkey
  foreign key (organization_id) references public.organizations(id);

alter table public.comercio_contactos
  add constraint comercio_contactos_comercio_id_fkey
  foreign key (comercio_id) references public.organizations(id);

-- =============================================================================
-- Checklist:
--   28. ClienteOfertas.tsx: `.select("id, titulo, descripcion, segmentacion,
--       organizations(name)")` contra campanas ya no tira error de relación.
-- =============================================================================
