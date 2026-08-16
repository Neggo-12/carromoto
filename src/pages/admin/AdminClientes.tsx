import { useMemo, useState } from "react";
import { Mail, Phone, MapPin, CarFront, Bike, Car, Zap } from "lucide-react";
import { CLIENTES_MOCK, type ClienteAdmin } from "@/lib/adminData";
import { cn } from "@/lib/utils";

type FiltroVehiculo = "todos" | "carro" | "moto" | "ambos";

const FILTROS_VEHICULO: { value: FiltroVehiculo; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "carro", label: "Carro" },
  { value: "moto", label: "Moto" },
  { value: "ambos", label: "Ambos" },
];

function esElectrificado(m: ClienteAdmin["carroMotorizacion"]) {
  return m === "electrico" || m === "hibrido";
}

function motorizacionLabel(m: ClienteAdmin["carroMotorizacion"]) {
  if (m === "electrico") return "Eléctrico";
  if (m === "hibrido") return "Híbrido";
  if (m === "combustion") return "Combustión";
  return null;
}

export default function AdminClientes() {
  const [ciudadFiltro, setCiudadFiltro] = useState("todas");
  const [vehiculoFiltro, setVehiculoFiltro] = useState<FiltroVehiculo>("todos");

  const ciudades = useMemo(() => Array.from(new Set(CLIENTES_MOCK.map((c) => c.ciudad))).sort(), []);

  const clientesFiltrados = useMemo(
    () =>
      CLIENTES_MOCK.filter(
        (c) => (ciudadFiltro === "todas" || c.ciudad === ciudadFiltro) && (vehiculoFiltro === "todos" || c.vehiculo === vehiculoFiltro)
      ),
    [ciudadFiltro, vehiculoFiltro]
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Clientes registrados</h1>
        <p className="mt-1 text-sm text-slate-500">Ciudad, vehículo y datos de contacto de cada cliente.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={ciudadFiltro}
          onChange={(e) => setCiudadFiltro(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="todas">Todas las ciudades</option>
          {ciudades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          {FILTROS_VEHICULO.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setVehiculoFiltro(f.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                vehiculoFiltro === f.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold text-slate-400">
        {clientesFiltrados.length} cliente{clientesFiltrados.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clientesFiltrados.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-900">
              {c.nombres} {c.apellidos}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" /> {c.ciudad}
            </p>

            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0" /> {c.correo}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" /> {c.celular}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(c.vehiculo === "carro" || c.vehiculo === "ambos") && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    esElectrificado(c.carroMotorizacion) ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}
                >
                  <CarFront className="h-3 w-3" /> Carro
                  {motorizacionLabel(c.carroMotorizacion) && ` · ${motorizacionLabel(c.carroMotorizacion)}`}
                  {esElectrificado(c.carroMotorizacion) && <Zap className="h-2.5 w-2.5" />}
                </span>
              )}
              {(c.vehiculo === "moto" || c.vehiculo === "ambos") && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    esElectrificado(c.motoMotorizacion) ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Bike className="h-3 w-3" /> Moto
                  {motorizacionLabel(c.motoMotorizacion) && ` · ${motorizacionLabel(c.motoMotorizacion)}`}
                  {esElectrificado(c.motoMotorizacion) && <Zap className="h-2.5 w-2.5" />}
                </span>
              )}
              {c.vehiculo === "ambos" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  <Car className="h-3 w-3" /> Ambos
                </span>
              )}
            </div>
          </div>
        ))}

        {clientesFiltrados.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            No hay clientes que coincidan con este filtro.
          </div>
        )}
      </div>
    </div>
  );
}
