-- =============================================================================
-- Comprobantes de venta + integración con Puntos Neggo — migración lista
-- para cuando exista el proyecto de Supabase PROPIO de Taller Aval. Sigue a
-- 0001-0003 (mismas advertencias: no correr contra Neggo, revisar contra el
-- esquema real). Reemplaza el enfoque de 0002 sección A: acá Taller Aval NO
-- es la fuente de verdad del saldo de puntos, solo genera y guarda su propio
-- comprobante y reporta la venta a Puntos Neggo.
--
-- Por qué existe esto: el dueño del negocio pidió que, antes de avisarle a
-- Puntos que un cliente ganó puntos, quede un comprobante propio en la base
-- de Talleres (monto, servicio/producto, fecha, documento del cliente,
-- taller/sucursal), visible para el cliente antes de irse del
-- establecimiento, con un ID único que sirve de auditoría y de llave
-- anti-duplicados (`referenciaExterna` del lado de Puntos).
--
-- Contrato real de Puntos Neggo (repo separado, ya en producción — ver
-- puntos-neggo/supabase/functions/otorgar-puntos/index.ts y la función
-- otorgar_puntos en puntos-neggo/supabase/migrations/20260817_ledger_base.sql):
--   POST <url-puntos-neggo>/functions/v1/otorgar-puntos
--   Header: x-internal-secret: <secreto compartido>
--   Body: { tipoDocumento, numeroDocumento, valorCompra, comercioId,
--           origenProducto, referenciaExterna, motivo }
--   Responde: { cliente_id, puntos_otorgados, multiplicador, saldo_nuevo, ya_procesado }
-- Esa llamada la hace una Edge Function de Taller Aval (server-to-server),
-- nunca el navegador. El secreto compartido vive como variable de entorno
-- en ambos proyectos, nunca en el código ni en el cliente.
-- =============================================================================

create table public.comprobantes (
  id text primary key default (gen_random_uuid())::text,
  taller_id text not null references public.organizations(id), -- = comercioId enviado a Puntos Neggo
  cliente_tipo_documento text not null,
  cliente_numero_documento text not null,
  cliente_nombre text not null,
  servicio_o_producto text not null,
  monto_pagado numeric not null check (monto_pagado > 0), -- SOLO lo pagado en dinero real, nunca lo cubierto con puntos
  fecha date not null,
  -- Resultado de la llamada a Puntos Neggo, guardado tal como respondió:
  puntos_otorgados integer,
  multiplicador integer,
  saldo_cliente_reportado integer,
  estado_envio_puntos text not null default 'pendiente' check (estado_envio_puntos in ('pendiente', 'enviado', 'ya_procesado', 'error')),
  error_envio_puntos text, -- detalle si estado_envio_puntos = 'error', para poder reintentar
  created_at timestamptz not null default now(),
  created_by text default (auth.uid())::text
);

create index idx_comprobantes_taller on public.comprobantes(taller_id);
create index idx_comprobantes_cliente_documento on public.comprobantes(cliente_tipo_documento, cliente_numero_documento);

comment on table public.comprobantes is 'Comprobante propio de Talleres por cada venta que otorga puntos. El id de esta fila es lo que viaja como referenciaExterna hacia Puntos Neggo — nunca se genera un id nuevo para esa llamada.';
comment on column public.comprobantes.monto_pagado is 'Regla anti-inflación de Puntos: los puntos se calculan solo sobre esto, nunca sobre el monto cubierto con puntos en una compra mixta.';

alter table public.comprobantes enable row level security;

create policy comprobantes_select
  on public.comprobantes for select
  using (user_belongs_to_organization(taller_id) or is_platform_admin());
  -- Nota: el cliente ve SUS puntos a través de la API de Puntos Neggo, no
  -- leyendo esta tabla directo — por eso no hay policy de select para el
  -- cliente acá. Si más adelante se decide mostrarle también el comprobante
  -- completo desde Taller Aval (no solo el saldo), agregar una policy nueva
  -- basada en cliente_numero_documento, verificando primero cómo se
  -- autentica un cliente sin cuenta en Puntos.

create policy comprobantes_insert
  on public.comprobantes for insert
  with check (user_belongs_to_organization(taller_id));

-- El UPDATE de estado_envio_puntos/puntos_otorgados/etc. lo hace únicamente
-- la Edge Function (service_role, bypassa RLS) después de llamar a Puntos —
-- nunca el cliente del taller directo, por eso no hay policy de update acá.

-- =============================================================================
-- Checklist antes de dar esto por conectado en el proyecto real:
--   16. Crear un comprobante nunca bloquea la UI del taller esperando a
--       Puntos Neggo — se guarda como 'pendiente' primero, la Edge Function
--       llama a Puntos por separado y actualiza el estado (patrón outbox,
--       para no perder la venta si Puntos está caído).
--   17. INTERNAL_SECRET del lado de Taller Aval y del lado de Puntos Neggo
--       tienen que ser exactamente el mismo valor, configurado como secreto
--       de proyecto en ambos Supabase — nunca en un archivo versionado.
--   18. Antes de activar esto en producción, confirmar con Jhey si el
--       campo cliente_numero_documento se pide en el registro del cliente
--       (hoy no existe en ningún formulario de Taller Aval) o si se sigue
--       capturando solo en el momento de la venta, como hace este diseño.
--   19. comercioId enviado a Puntos = taller_id (organization_id) de Taller
--       Aval — confirmar con el equipo de Puntos que no hace falta un alta
--       aparte para comercios "ya afiliados a Talleres" (según sección 4 de
--       sistema-puntos-unificado.md, no debería hacer falta).
-- =============================================================================
