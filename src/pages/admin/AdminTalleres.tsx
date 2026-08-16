import { useMemo, useState } from "react";
import { Mail, Phone, MapPin, User, Check, X, CarFront, Bike, Car, Zap, Store, Package, ShieldCheck, Trophy, FileText, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TALLERES_MOCK, planPorId, formatCOP, type TallerAdmin, type EstadoAprobacion } from "@/lib/adminData";
import { scorePorTallerId, nivelPorScore } from "@/lib/scoreData";
import { cn } from "@/lib/utils";

type FiltroEstado = "todos" | EstadoAprobacion;
type FiltroCategoria = "todos" | "carro" | "moto" | "especialistas" | "electrificados";
type Orden = "score" | "recientes";

const FILTROS_ESTADO: { value: FiltroEstado; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
];

const FILTROS_CATEGORIA: { value: FiltroCategoria; label: string; icon: typeof CarFront }[] = [
  { value: "todos", label: "Todas las categorías", icon: Store },
  { value: "carro", label: "Carro", icon: CarFront },
  { value: "moto", label: "Moto", icon: Bike },
  { value: "especialistas", label: "Especialistas eléctricos/híbridos", icon: Zap },
  { value: "electrificados", label: "Atiende eléctricos/híbridos", icon: Zap },
];

function esElectrificado(m: TallerAdmin["carroMotorizacion"]) {
  return m === "electrico" || m === "hibrido";
}

function coincideCategoria(t: TallerAdmin, cat: FiltroCategoria): boolean {
  if (cat === "todos") return true;
  if (cat === "carro") return t.tipoVehiculo === "carro" || t.tipoVehiculo === "ambos";
  if (cat === "moto") return t.tipoVehiculo === "moto" || t.tipoVehiculo === "ambos";
  if (cat === "especialistas") return t.especialistaElectricos;
  if (cat === "electrificados") return esElectrificado(t.carroMotorizacion) || esElectrificado(t.motoMotorizacion);
  return true;
}

export default function AdminTalleres() {
  const [talleres, setTalleres] = useState<TallerAdmin[]>(TALLERES_MOCK);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>("todos");
  const [orden, setOrden] = useState<Orden>("score");

  const talleresFiltrados = useMemo(
    () =>
      talleres
        .filter((t) => (filtroEstado === "todos" || t.estado === filtroEstado) && coincideCategoria(t, filtroCategoria))
        .sort((a, b) => {
          if (orden === "score") return scorePorTallerId(b.id) - scorePorTallerId(a.id);
          return b.fechaRegistro.localeCompare(a.fechaRegistro);
        }),
    [talleres, filtroEstado, filtroCategoria, orden]
  );

  function actualizarEstado(id: string, estado: EstadoAprobacion) {
    setTalleres((prev) => prev.map((t) => (t.id === id ? { ...t, estado, selloActivo: estado === "aprobado" ? t.selloActivo : false } : t)));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Talleres registrados</h1>
        <p className="mt-1 text-sm text-slate-500">
          Aprobá un taller para que pueda iniciar sesión. Mientras esté pendiente o rechazado, no puede entrar a su panel.
        </p>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltroEstado(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
              filtroEstado === f.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS_CATEGORIA.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltroCategoria(f.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
              filtroCategoria === f.value
                ? "border-brand-500 bg-brand-500/10 text-brand-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            )}
          >
            <f.icon className="h-3 w-3" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400">
          {talleresFiltrados.length} taller{talleresFiltrados.length === 1 ? "" : "es"}
        </p>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setOrden("score")}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
              orden === "score" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <Trophy className="h-3 w-3" /> Mejor score
          </button>
          <button
            type="button"
            onClick={() => setOrden("recientes")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
              orden === "recientes" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            Más recientes
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {talleresFiltrados.map((t) => {
          const plan = planPorId(t.planId);
          const score = scorePorTallerId(t.id);
          const nivel = nivelPorScore(score);
          return (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{t.nombreNegocio}</h3>
                    <StatusBadge estado={t.estado} />
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", nivel.bg, nivel.color)}>
                      <Trophy className="h-3 w-3" /> {score} · {nivel.label}
                    </span>
                    {t.selloActivo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        <ShieldCheck className="h-3 w-3" /> Sello activo
                      </span>
                    )}
                  </div>

                  {/* Contacto del negocio */}
                  <div className="mt-3 grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> {t.correo}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {t.celular}
                    </span>
                    <span className="flex items-center gap-1.5 sm:col-span-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {t.direccion}, {t.barrio}, {t.ciudad}
                    </span>
                  </div>

                  {/* Encargado / dueño */}
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 w-fit">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-bold text-slate-800">{t.encargado.nombre}</span>
                    <span className="text-slate-400">·</span>
                    <span>{t.encargado.rol}</span>
                  </div>

                  {/* Categorías */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      {t.tipoNegocio === "almacen" ? <Package className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                      {t.tipoNegocio === "almacen" ? "Almacén de repuestos" : "Taller de reparación"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      {t.tipoVehiculo === "carro" ? <CarFront className="h-3 w-3" /> : t.tipoVehiculo === "moto" ? <Bike className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                      {t.tipoVehiculo === "carro" ? "Carro" : t.tipoVehiculo === "moto" ? "Moto" : "Carro y moto"}
                    </span>
                    {t.especialistaElectricos && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        <Zap className="h-3 w-3" /> Especialista eléctricos/híbridos
                      </span>
                    )}
                    {!t.especialistaElectricos && (esElectrificado(t.carroMotorizacion) || esElectrificado(t.motoMotorizacion)) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold text-brand-700">
                        <Zap className="h-3 w-3" /> Atiende eléctricos/híbridos
                      </span>
                    )}
                  </div>

                  {/* Descripción del negocio — obligatoria recién después de aprobado */}
                  {t.descripcionNegocio ? (
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {t.descripcionNegocio}
                    </p>
                  ) : t.estado === "aprobado" ? (
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Todavía no completó la descripción de su negocio
                    </p>
                  ) : null}
                </div>

                {/* Plan / pago + acciones */}
                <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                  <div className="text-left lg:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Plan {plan.nombre}</p>
                    <p className="text-lg font-black text-slate-900">{formatCOP(plan.precioMensual)}{plan.precioMensual > 0 && <span className="text-xs font-semibold text-slate-400">/mes</span>}</p>
                  </div>

                  {t.estado === "pendiente" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => actualizarEstado(t.id, "aprobado")}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" /> Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => actualizarEstado(t.id, "rechazado")}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Rechazar
                      </button>
                    </div>
                  )}
                  {t.estado === "aprobado" && (
                    <button
                      type="button"
                      onClick={() => actualizarEstado(t.id, "rechazado")}
                      className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors"
                    >
                      Revocar aprobación
                    </button>
                  )}
                  {t.estado === "rechazado" && (
                    <button
                      type="button"
                      onClick={() => actualizarEstado(t.id, "pendiente")}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      Volver a pendiente
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {talleresFiltrados.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            No hay talleres que coincidan con este filtro.
          </div>
        )}
      </div>
    </div>
  );
}
