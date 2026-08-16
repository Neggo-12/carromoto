import { Link } from "react-router-dom";
import { Store, Clock, Users, DollarSign, ArrowRight, Zap } from "lucide-react";
import { StatTile } from "@/components/admin/StatTile";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TALLERES_MOCK, CLIENTES_MOCK, planPorId, formatCOP } from "@/lib/adminData";

export default function AdminOverview() {
  const aprobados = TALLERES_MOCK.filter((t) => t.estado === "aprobado");
  const pendientes = TALLERES_MOCK.filter((t) => t.estado === "pendiente");
  const especialistasElectricos = TALLERES_MOCK.filter((t) => t.especialistaElectricos);
  const ingresosMensuales = aprobados.reduce((sum, t) => sum + planPorId(t.planId).precioMensual, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Resumen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Datos de ejemplo para diseñar el panel — todavía no hay base de datos conectada.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Talleres aprobados" value={String(aprobados.length)} icon={Store} accent="emerald" hint={`${TALLERES_MOCK.length} registrados en total`} />
        <StatTile label="Pendientes de aprobación" value={String(pendientes.length)} icon={Clock} accent="amber" hint="Requieren tu revisión" />
        <StatTile label="Clientes registrados" value={String(CLIENTES_MOCK.length)} icon={Users} accent="brand" />
        <StatTile label="Ingresos mensuales estimados" value={formatCOP(ingresosMensuales)} icon={DollarSign} accent="slate" hint="Solo talleres aprobados" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Especialistas en eléctricos/híbridos" value={String(especialistasElectricos.length)} icon={Zap} accent="emerald" />
      </div>

      {pendientes.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900">Talleres esperando tu aprobación</h2>
            <Link to="/admin/talleres" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {pendientes.map((t) => (
              <div key={t.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.nombreNegocio}</p>
                  <p className="text-xs text-slate-500">
                    {t.encargado.nombre} · {t.ciudad}, {t.barrio}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge estado={t.estado} />
                  <Link
                    to="/admin/talleres"
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
