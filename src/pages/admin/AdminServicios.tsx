import { useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { SERVICIOS_SOLICITADOS_MOCK } from "@/lib/adminData";
import { cn } from "@/lib/utils";

/**
 * Ranking de servicios más solicitados — una sola serie (cantidad de
 * solicitudes), así que un solo color (brand) y sin leyenda. Barra con
 * extremo redondeado en la punta, valor directo al final de cada barra,
 * y una vista de tabla debajo para accesibilidad.
 */
export default function AdminServicios() {
  const [vista, setVista] = useState<"grafico" | "tabla">("grafico");
  const max = Math.max(...SERVICIOS_SOLICITADOS_MOCK.map((s) => s.count));
  const total = SERVICIOS_SOLICITADOS_MOCK.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Servicios más solicitados</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ranking de ejemplo — cuando haya solicitudes reales, esto se arma solo con esos datos.
          </p>
        </div>

        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setVista("grafico")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              vista === "grafico" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Gráfico
          </button>
          <button
            type="button"
            onClick={() => setVista("tabla")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              vista === "tabla" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <Table2 className="h-3.5 w-3.5" /> Tabla
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-6 text-xs font-semibold text-slate-400">{total.toLocaleString("es-CO")} solicitudes en total (ejemplo)</p>

        {vista === "grafico" ? (
          <div className="space-y-4">
            {SERVICIOS_SOLICITADOS_MOCK.map((s) => {
              const widthPct = Math.max((s.count / max) * 100, 4);
              return (
                <div key={s.label} className="group">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{s.label}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-[18px] w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all group-hover:bg-brand-600"
                      style={{ width: `${widthPct}%` }}
                      title={`${s.label}: ${s.count} solicitudes`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="pb-2.5 font-bold">#</th>
                <th className="pb-2.5 font-bold">Servicio</th>
                <th className="pb-2.5 font-bold text-right">Solicitudes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SERVICIOS_SOLICITADOS_MOCK.map((s, i) => (
                <tr key={s.label}>
                  <td className="py-2.5 text-slate-400 tabular-nums">{i + 1}</td>
                  <td className="py-2.5 font-semibold text-slate-700">{s.label}</td>
                  <td className="py-2.5 text-right font-bold text-slate-900 tabular-nums">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
