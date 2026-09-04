-- =============================================================================
-- Mini CRM de talleres para el Admin (4 sep 2026, pedido del negocio):
-- "quiero ser admin en la pestaña de talleres en cada taller que este
-- pendiente y activado, tenga como su mini CRM, para poder llevar mejor el
-- control, por ejemplo que me diga que documentos debo de pedir al taller".
--
-- Dos tablas nuevas, ambas de uso EXCLUSIVO del admin (RLS: is_platform_admin()
-- únicamente — el taller nunca ve esto, es información interna de gestión):
--
--   taller_documentos: una fila por (taller, tipo de documento) con estado
--   (pendiente/solicitado/recibido/aprobado/rechazado) y una nota libre. Los
--   5 tipos de documento son los que ya se documentaron en el checklist de
--   afiliación: RUT, cédula del representante, Cámara de Comercio (si es
--   empresa), cuenta bancaria (cuando se conecte Puntos) y fotos del local.
--
--   taller_notas: bitácora de interacciones con el taller (llamadas,
--   mensajes, acuerdos) — igual que cualquier CRM, un historial de texto
--   libre con autor y fecha, nunca editable ni borrable después de escrito
--   (append-only, como consentimientos).
--
-- No se agregan funciones RPC: como la policy ya exige is_platform_admin(),
-- el propio cliente de Supabase del admin puede leer/escribir estas tablas
-- directamente (mismo patrón que ya usa AdminTalleres.tsx con
-- organizations.status) sin necesitar una función intermediaria.
-- =============================================================================

create table public.taller_documentos (
  id text primary key default (gen_random_uuid())::text,
  organization_id text not null references public.organizations(id) on delete cascade,
  tipo text not null check (tipo in ('rut', 'cedula_representante', 'camara_comercio', 'cuenta_bancaria', 'fotos_taller')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'solicitado', 'recibido', 'aprobado', 'rechazado')),
  notas text null,
  actualizado_por text null references public.users(id),
  updated_at timestamptz not null default now(),
  unique (organization_id, tipo)
);

create index idx_taller_documentos_org on public.taller_documentos(organization_id);

alter table public.taller_documentos enable row level security;

create policy taller_documentos_admin on public.taller_documentos
  for all using (is_platform_admin()) with check (is_platform_admin());

comment on table public.taller_documentos is 'Checklist interno del admin por taller (RUT, cédula, Cámara de Comercio, cuenta bancaria, fotos) — nunca visible para el taller mismo. Una fila por (organization_id, tipo), creada bajo demanda (upsert) la primera vez que el admin abre el mini CRM de ese taller.';

create table public.taller_notas (
  id text primary key default (gen_random_uuid())::text,
  organization_id text not null references public.organizations(id) on delete cascade,
  autor_id text not null references public.users(id),
  texto text not null,
  created_at timestamptz not null default now()
);

create index idx_taller_notas_org on public.taller_notas(organization_id, created_at desc);

alter table public.taller_notas enable row level security;

create policy taller_notas_admin on public.taller_notas
  for all using (is_platform_admin()) with check (is_platform_admin());

comment on table public.taller_notas is 'Bitácora interna del admin por taller — historial de gestión (llamadas, acuerdos, seguimiento), append-only. Nunca visible para el taller.';

-- =============================================================================
-- Checklist:
--   1. Un admin abre el mini CRM de un taller nuevo: se crean solas las 5
--      filas de taller_documentos en estado 'pendiente' (upsert desde el
--      frontend), sin necesitar ninguna acción manual.
--   2. Un usuario Cliente o Taller que intente leer taller_documentos o
--      taller_notas por su cuenta no ve nada (RLS solo admin).
--   3. Cambiar el estado de un documento o agregar una nota queda con fecha
--      y (para notas) autor — nunca se pierde el historial.
-- =============================================================================
