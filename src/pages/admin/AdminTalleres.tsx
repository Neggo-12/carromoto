import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, MapPin, User, Check, X, CarFront, Bike, Car, Zap, Store, Package, ShieldCheck, FileText, AlertCircle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type EstadoAprobacion = "pendiente" | "aprobado" | "rechazado";
type TipoVehiculo = "carro" | "moto" | "ambos" | null;

// Organización real, tal como vive en la tabla `organizations` — ya no hay
// data de ejemplo acá. `metadata` trae lo que RegistroTaller.tsx guardó al
// registrarse (ver handle_new_user() en 0005_registro_auth.sql).
interface OrganizacionAdmin {
  id: string;
  name: string;
  type: "taller" | "almacen";
  status: EstadoAprobacion;
  has_trust_seal: boolean;
  ciudad: string | null;
  descripcion_negocio: string | null;
  created_at: string;
  metadata: {
    direccion?: string;
    barrio?: string;
    tipo_vehiculo?: TipoVehiculo;
    carro_motorizacion?: string | null;
    moto_motorizacion?: string | null;
    especialista_electricos?: boolean;
  } | null;
}

// El encargado (correo/celular/nombre) vive en `users`, no en
// `organizations` — se cruza por membership.user_id para mostrarlo acá.
interface EncargadoInfo {
  nombre: string | null;
  correo: string | null;
  celular: string | null;
  rol: string;
}

type FiltroEstado = "todos" | EstadoAprobacion;
type FiltroCategoria = "todos" | "carro" | "moto" | "especialistas" | "electrificados";

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

function esElectrificado(m: string | null | undefined) {
  return m === "electrico" || m === "hibrido";
}

function coincideCategoria(t: OrganizacionAdmin, cat: FiltroCategoria): boolean {
  if (cat === "todos") return true;
  const tv = t.metadata?.tipo_vehiculo;
  if (cat === "carro") return tv === "carro" || tv === "ambos";
  if (cat === "moto") return tv === "moto" || tv === "ambos";
  if (cat === "especialistas") return !!t.metadata?.especialista_electricos;
  if (cat === "electrificados") return esElectrificado(t.metadata?.carro_motorizacion) || esElectrificado(t.metadata?.moto_motorizacion);
  return true;
}

export default function AdminTalleres() {
  const [talleres, setTalleres] = useState<OrganizacionAdmin[]>([]);
  const [encargados, setEncargados] = useState<Record<string, EncargadoInfo>>({});
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>("todos");

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, type, status, has_trust_seal, ciudad, descripcion_negocio, created_at, metadata")
      .order("created_at", { ascending: false });
    setTalleres((orgs ?? []) as OrganizacionAdmin[]);

    if (orgs && orgs.length > 0) {
      const { data: memberships } = await supabase
        .from("memberships")
        .select("organization_id, rol, user_id, users(nombre, correo, celular)")
        .in(
          "organization_id",
          orgs.map((o) => o.id)
        );
      const map: Record<string, EncargadoInfo> = {};
      for (const m of memberships ?? []) {
        // Un solo encargado por organización en el registro actual — se
        // queda con el primero que aparezca (el Propietario del alta).
        const u = (m as unknown as { users: { nombre: string | null; correo: string | null; celular: string | null } | null }).users;
        if (u && !map[m.organization_id as string]) {
          map[m.organization_id as string] = { nombre: u.nombre, correo: u.correo, celular: u.celular, rol: (m as { rol: string }).rol };
        }
      }
      setEncargados(map);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const talleresFiltrados = useMemo(
    () =>
      talleres
        .filter((t) => (filtroEstado === "todos" || t.status === filtroEstado) && coincideCategoria(t, filtroCategoria))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [talleres, filtroEstado, filtroCategoria]
  );

  async function actualizarEstado(id: string, status: EstadoAprobacion) {
    const patch: Partial<OrganizacionAdmin> = { status };
    // Rechazar retira el sello automáticamente — no tiene sentido que un
    // taller rechazado siga apareciendo con Sello de Confianza en Buscar
    // Talleres.
    if (status === "rechazado") patch.has_trust_seal = false;
    setTalleres((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await supabase.from("organizations").update(patch).eq("id", id);
  }

  async function toggleSello(id: string, activo: boolean) {
    setTalleres((prev) => prev.map((t) => (t.id === id ? { ...t, has_trust_seal: activo } : t)));
    await supabase.from("organizations").update({ has_trust_seal: activo }).eq("id", id);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Talleres registrados</h1>
        <p className="mt-1 text-sm text-slate-500">
          Aprobá un taller para que pueda iniciar sesión, y activá su Sello de Confianza para que aparezca en Buscar
          Talleres.
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

      <p className="mb-3 text-xs font-semibold text-slate-400">
        {talleresFiltrados.length} taller{talleresFiltrados.length === 1 ? "" : "es"}
      </p>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {talleresFiltrados.map((t) => {
            const enc = encargados[t.id];
            const tv = t.metadata?.tipo_vehiculo;
            return (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{t.name}</h3>
                      <StatusBadge estado={t.status} />
                      {t.has_trust_seal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                          <ShieldCheck className="h-3 w-3" /> Sello activo
                        </span>
                      )}
                    </div>

                    {/* Contacto del negocio */}
                    <div className="mt-3 grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                      {enc?.correo && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0" /> {enc.correo}
                        </span>
                      )}
                      {enc?.celular && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" /> {enc.celular}
                        </span>
                      )}
                      {(t.metadata?.direccion || t.metadata?.barrio || t.ciudad) && (
                        <span className="flex items-center gap-1.5 sm:col-span-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {[t.metadata?.direccion, t.metadata?.barrio, t.ciudad].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Encargado / dueño */}
                    {enc?.nombre && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 w-fit">
                        <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="font-bold text-slate-800">{enc.nombre}</span>
                        <span className="text-slate-400">·</span>
                        <span>{enc.rol}</span>
                      </div>
                    )}

                    {/* Categorías */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        {t.type === "almacen" ? <Package className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                        {t.type === "almacen" ? "Almacén de repuestos" : "Taller de reparación"}
                      </span>
                      {tv && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                          {tv === "carro" ? <CarFront className="h-3 w-3" /> : tv === "moto" ? <Bike className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                          {tv === "carro" ? "Carro" : tv === "moto" ? "Moto" : "Carro y moto"}
                        </span>
                      )}
                      {t.metadata?.especialista_electricos && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                          <Zap className="h-3 w-3" /> Especialista eléctricos/híbridos
                        </span>
                      )}
                      {!t.metadata?.especialista_electricos &&
                        (esElectrificado(t.metadata?.carro_motorizacion) || esElectrificado(t.metadata?.moto_motorizacion)) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold text-brand-700">
                            <Zap className="h-3 w-3" /> Atiende eléctricos/híbridos
                          </span>
                        )}
                    </div>

                    {/* Descripción del negocio — obligatoria recién después de aprobado */}
                    {t.descripcion_negocio ? (
                      <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {t.descripcion_negocio}
                      </p>
                    ) : t.status === "aprobado" ? (
                      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Todavía no completó la descripción de su negocio
                      </p>
                    ) : null}
                  </div>

                  {/* Acciones */}
                  <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                    {t.status === "pendiente" && (
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
                    {t.status === "aprobado" && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleSello(t.id, !t.has_trust_seal)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
                            t.has_trust_seal
                              ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                              : "bg-brand-600 text-white hover:bg-brand-700"
                          )}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> {t.has_trust_seal ? "Quitar Sello" : "Activar Sello"}
                        </button>
                        <button
                          type="button"
                          onClick={() => actualizarEstado(t.id, "rechazado")}
                          className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors"
                        >
                          Revocar aprobación
                        </button>
                      </>
                    )}
                    {t.status === "rechazado" && (
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
      )}
    </div>
  );
}
