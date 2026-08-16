-- =============================================================================
-- Descripción del negocio del taller — migración lista para cuando exista
-- el proyecto de Supabase PROPIO de Taller Aval. Sigue a 0001 y 0002 (mismas
-- advertencias: no correr contra Neggo, revisar contra el esquema real).
--
-- Qué resuelve: el cliente necesita poder identificar de un vistazo qué
-- hace distinto a cada taller. El dueño del negocio pidió que este campo
-- sea obligatorio, pero SOLO se le pida al taller una vez que el admin lo
-- aprueba — antes de eso ni se le muestra. La UI de esto vive en
-- src/pages/taller/TallerPerfil.tsx (frontend, con datos de ejemplo).
-- =============================================================================

alter table public.organizations add column if not exists descripcion_negocio text;

-- Nota: la obligatoriedad ("required recién después de aprobado") se
-- valida en el frontend, no con un check constraint acá — así el dato
-- puede quedar null indefinidamente mientras el taller está pendiente o
-- rechazado, sin que la base de datos lo bloquee. Si más adelante se
-- quiere reforzar esto también del lado del servidor (por ejemplo, para
-- que un taller no pueda tener has_trust_seal = true sin haber completado
-- este campo), se puede agregar un trigger acá — no se agrega ahora para
-- no acoplar una regla de negocio que todavía puede cambiar.

comment on column public.organizations.descripcion_negocio is
  'Descripción corta que escribe el taller sobre su negocio, visible para el cliente en Buscar Talleres. Obligatoria en el frontend recién después de que el admin aprueba el taller (status = ''approved'').';

-- =============================================================================
-- Checklist antes de dar esto por conectado en el proyecto real:
--   13. Un taller pendiente o rechazado no ve el campo de descripción en su
--       perfil (queda oculto, no solo deshabilitado).
--   14. Apenas el admin aprueba un taller, el campo aparece marcado como
--       obligatorio y bloquea "Guardar cambios" hasta completarlo con al
--       menos el mínimo de caracteres definido en el frontend.
--   15. La descripción guardada aparece en la tarjeta del taller en
--       Buscar Talleres (cliente) y en el listado de Talleres (admin).
-- =============================================================================
