import { BarChart3 } from "lucide-react";

/**
 * Ranking de servicios más solicitados — no hay todavía una forma real de
 * medir esto: comercio_contactos.descripcion es texto libre (no categorizado
 * por servicio), así que no existe una fuente de datos real para armar este
 * ranking. Se deja como estado honesto de "sin datos" en vez de mostrar un
 * ranking inventado.
 */
export default function AdminServicios() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Servicios más solicitados</h1>
        <p className="mt-1 text-sm text-slate-500">Ranking de las solicitudes de clientes por tipo de servicio.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <BarChart3 className="h-6 w-6 text-slate-400" />
        </div>
        <h4 className="mb-1 text-sm font-bold text-slate-900">Todavía no hay suficientes datos</h4>
        <p className="max-w-sm text-xs text-slate-500">
          Este ranking necesita que las solicitudes de clientes vengan categorizadas por servicio — hoy son texto
          libre. Se puede activar más adelante si vale la pena pedirle esa categoría al cliente en el formulario.
        </p>
      </div>
    </div>
  );
}
