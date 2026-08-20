import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Phone, Store, MapPin, Zap, Sparkles, CarFront, Bike, Car, Wrench, Package, Check, Lock, FileText, AlertCircle, Loader2 } from "lucide-react";
import { TextField } from "@/components/TextField";
import { TextareaField } from "@/components/Textarea";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SelectableCard } from "@/components/SelectableCard";
import { ScheduleEditor, defaultSchedule, type WeekSchedule } from "@/components/ScheduleEditor";
import {
  CIUDADES,
  BARRIOS_POR_CIUDAD,
  SERVICIOS_CARRO,
  SERVICIOS_MOTO,
  REPUESTOS_CARRO,
  REPUESTOS_MOTO,
  OPCIONES_MOTORIZACION,
  type Motorizacion,
} from "@/lib/data";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";

export const DESCRIPCION_NEGOCIO_MIN = 40;
export const DESCRIPCION_NEGOCIO_MAX = 220;

type TipoVehiculo = "carro" | "moto" | "ambos";
type TipoNegocio = "taller" | "almacen";

interface FormData {
  nombreNegocio: string;
  ciudad: string;
  barrio: string;
  direccion: string;
  encargadoNombre: string;
  celular: string;
  tipoNegocio: TipoNegocio;
  tipoVehiculo: TipoVehiculo;
  carroMotorizacion: Motorizacion | null;
  motoMotorizacion: Motorizacion | null;
  especialistaElectricos: boolean;
  servicios: string[];
  horario: WeekSchedule;
  descripcionNegocio: string | null;
}

const FORM_VACIO: FormData = {
  nombreNegocio: "",
  ciudad: "",
  barrio: "",
  direccion: "",
  encargadoNombre: "",
  celular: "",
  tipoNegocio: "taller",
  tipoVehiculo: "carro",
  carroMotorizacion: null,
  motoMotorizacion: null,
  especialistaElectricos: false,
  servicios: [],
  horario: defaultSchedule(),
  descripcionNegocio: null,
};

/**
 * Edición de perfil — reusa los mismos componentes del registro
 * (RegistroTaller.tsx) pero ya con los datos reales cargados desde
 * organizations (id = perfil.organizationId). "Guardar cambios" hace un
 * update real: organizations (name, ciudad, type, metadata,
 * descripcion_negocio) + users (nombre, celular) del encargado logueado.
 * El correo de acceso no se edita acá — cambiar el email de login requiere
 * su propio flujo de confirmación en Supabase Auth, todavía no conectado.
 */
export default function TallerPerfil() {
  const { perfil } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState<"pendiente" | "aprobado" | "rechazado">("pendiente");
  const [data, setData] = useState<FormData>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      if (!perfil?.organizationId) {
        setCargando(false);
        return;
      }
      setCargando(true);
      const { data: org, error } = await supabase
        .from("organizations")
        .select("name, type, ciudad, status, metadata, descripcion_negocio")
        .eq("id", perfil.organizationId)
        .maybeSingle();
      if (!activo) return;
      if (!error && org) {
        const meta = (org.metadata ?? {}) as Record<string, unknown>;
        setEstado(org.status);
        setData({
          nombreNegocio: org.name ?? "",
          ciudad: org.ciudad ?? "",
          barrio: (meta.barrio as string) ?? "",
          direccion: (meta.direccion as string) ?? "",
          encargadoNombre: perfil.nombre ?? "",
          celular: perfil.celular ?? "",
          tipoNegocio: org.type as TipoNegocio,
          tipoVehiculo: (meta.tipo_vehiculo as TipoVehiculo) ?? "carro",
          carroMotorizacion: (meta.carro_motorizacion as Motorizacion) ?? null,
          motoMotorizacion: (meta.moto_motorizacion as Motorizacion) ?? null,
          especialistaElectricos: Boolean(meta.especialista_electricos),
          servicios: (meta.servicios as string[]) ?? [],
          horario: (meta.horario as WeekSchedule) ?? defaultSchedule(),
          descripcionNegocio: org.descripcion_negocio,
        });
      }
      setCargando(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [perfil?.organizationId, perfil?.nombre, perfil?.celular]);

  const barriosDisponibles = useMemo(() => BARRIOS_POR_CIUDAD[data.ciudad] ?? [], [data.ciudad]);

  const opcionesDisponibles = useMemo(() => {
    const listaCarro = data.tipoNegocio === "almacen" ? REPUESTOS_CARRO : SERVICIOS_CARRO;
    const listaMoto = data.tipoNegocio === "almacen" ? REPUESTOS_MOTO : SERVICIOS_MOTO;
    if (data.tipoVehiculo === "carro") return listaCarro;
    if (data.tipoVehiculo === "moto") return listaMoto;
    return [...listaCarro, ...listaMoto];
  }, [data.tipoNegocio, data.tipoVehiculo]);

  const algunoElectrificado =
    data.carroMotorizacion === "electrico" ||
    data.carroMotorizacion === "hibrido" ||
    data.motoMotorizacion === "electrico" ||
    data.motoMotorizacion === "hibrido";

  useEffect(() => {
    if (!algunoElectrificado && data.especialistaElectricos) {
      setData((d) => ({ ...d, especialistaElectricos: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algunoElectrificado]);

  function patch(partial: Partial<FormData>) {
    setGuardado(false);
    setData((d) => ({ ...d, ...partial }));
  }

  function selectTipoNegocio(v: TipoNegocio) {
    patch({ tipoNegocio: v, servicios: [] });
  }

  function selectTipoVehiculo(v: TipoVehiculo) {
    patch({
      tipoVehiculo: v,
      carroMotorizacion: v === "carro" || v === "ambos" ? data.carroMotorizacion : null,
      motoMotorizacion: v === "moto" || v === "ambos" ? data.motoMotorizacion : null,
      servicios: [],
    });
  }

  function toggleServicio(value: string) {
    setGuardado(false);
    setData((d) => ({
      ...d,
      servicios: d.servicios.includes(value) ? d.servicios.filter((s) => s !== value) : [...d.servicios, value],
    }));
  }

  const descripcionRequerida = estado === "aprobado";
  const descripcionLen = data.descripcionNegocio?.trim().length ?? 0;
  const descripcionValida = !descripcionRequerida || descripcionLen >= DESCRIPCION_NEGOCIO_MIN;
  const canGuardar = descripcionValida && !guardando;

  async function handleGuardar() {
    if (!canGuardar || !perfil?.organizationId) return;
    setGuardando(true);
    const metadata = {
      barrio: data.barrio,
      direccion: data.direccion,
      tipo_vehiculo: data.tipoVehiculo,
      carro_motorizacion: data.carroMotorizacion,
      moto_motorizacion: data.motoMotorizacion,
      especialista_electricos: data.especialistaElectricos,
      servicios: data.servicios,
      horario: data.horario,
    };
    const [{ error: orgError }, { error: userError }] = await Promise.all([
      supabase
        .from("organizations")
        .update({
          name: data.nombreNegocio,
          type: data.tipoNegocio,
          ciudad: data.ciudad,
          metadata,
          descripcion_negocio: data.descripcionNegocio,
        })
        .eq("id", perfil.organizationId),
      supabase.from("users").update({ nombre: data.encargadoNombre, celular: data.celular }).eq("id", perfil.id),
    ]);
    setGuardando(false);
    if (!orgError && !userError) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu perfil...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Así te ven los clientes en Buscar Talleres y en tus ofertas.</p>
      </div>

      {/* Datos del negocio */}
      <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-black text-foreground">Datos del negocio</h2>
        <TextField label="Nombre del negocio" icon={Store} value={data.nombreNegocio} onChange={(v) => patch({ nombreNegocio: v })} accent="signal" required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Correo de acceso"
            type="email"
            icon={Mail}
            value={perfil?.correo ?? ""}
            onChange={() => {}}
            accent="signal"
            disabled
            helpText="Para cambiar tu correo de acceso, escribinos — todavía no se puede hacer desde acá."
          />
          <TextField label="Celular (WhatsApp)" icon={Phone} prefix="+57" value={data.celular} onChange={(v) => patch({ celular: v })} accent="signal" required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchableSelect label="Ciudad" value={data.ciudad} onChange={(v) => patch({ ciudad: v, barrio: "" })} options={CIUDADES} accent="signal" required />
          <SearchableSelect label="Barrio" value={data.barrio} onChange={(v) => patch({ barrio: v })} options={barriosDisponibles} accent="signal" creatable required />
        </div>
        <TextField label="Dirección" icon={MapPin} value={data.direccion} onChange={(v) => patch({ direccion: v })} accent="signal" required />
        <TextField label="Nombre del encargado" value={data.encargadoNombre} onChange={(v) => patch({ encargadoNombre: v })} accent="signal" required />
      </div>

      {/* Descripción del negocio — se habilita recién cuando el admin aprueba el taller */}
      <div className="space-y-3 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-foreground">
          <FileText className="h-4 w-4 text-signal-600" /> Descripción de tu negocio
        </h2>

        {descripcionRequerida ? (
          <>
            {descripcionLen === 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-signal-500/30 bg-signal-500/5 px-4 py-3 text-xs text-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-signal-600" />
                <p>
                  Ya te aprobamos — ahora nos falta este dato obligatorio: contanos brevemente de tu negocio para que
                  los clientes te identifiquen.
                </p>
              </div>
            )}
            <TextareaField
              label="Contanos de tu negocio"
              value={data.descripcionNegocio ?? ""}
              onChange={(v) => patch({ descripcionNegocio: v })}
              placeholder="Ej: Taller familiar con 10 años de experiencia en mecánica general, especialistas en frenos y suspensión."
              maxLength={DESCRIPCION_NEGOCIO_MAX}
              rows={3}
              accent="signal"
              required
              helpText={`${descripcionLen}/${DESCRIPCION_NEGOCIO_MAX} caracteres — mínimo ${DESCRIPCION_NEGOCIO_MIN} para que se pueda publicar.`}
            />
            {!descripcionValida && descripcionLen > 0 && (
              <p className="text-[11px] font-semibold text-red-600">
                Te faltan {DESCRIPCION_NEGOCIO_MIN - descripcionLen} caracteres para poder guardar.
              </p>
            )}
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Este campo se habilita apenas el equipo de Taller Aval apruebe tu registro.</p>
          </div>
        )}
      </div>

      {/* Categoría del negocio */}
      <div className="space-y-5 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-black text-foreground">Categoría</h2>

        <div>
          <p className="mb-2 text-xs font-bold text-foreground">¿Sos almacén o taller?</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectableCard icon={Wrench} label="Taller de reparación" description="Hacés mantenimiento y reparaciones." selected={data.tipoNegocio === "taller"} onClick={() => selectTipoNegocio("taller")} accent="signal" />
            <SelectableCard icon={Package} label="Almacén de repuestos" description="Vendés repuestos, no hacés reparaciones." selected={data.tipoNegocio === "almacen"} onClick={() => selectTipoNegocio("almacen")} accent="signal" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-foreground">
            {data.tipoNegocio === "almacen" ? "¿Para qué vehículos vendés repuestos?" : "¿Qué tipo de vehículos atendés?"}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <SelectableCard icon={CarFront} label="Carro" selected={data.tipoVehiculo === "carro"} onClick={() => selectTipoVehiculo("carro")} accent="signal" compact />
            <SelectableCard icon={Bike} label="Moto" selected={data.tipoVehiculo === "moto"} onClick={() => selectTipoVehiculo("moto")} accent="signal" compact />
            <SelectableCard icon={Car} label="Ambos" selected={data.tipoVehiculo === "ambos"} onClick={() => selectTipoVehiculo("ambos")} accent="signal" compact />
          </div>
        </div>

        <AnimatePresence>
          {(data.tipoVehiculo === "carro" || data.tipoVehiculo === "ambos") && (
            <motion.div key="carro-motorizacion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Zap className="h-3.5 w-3.5 text-signal-600" />
                {data.tipoNegocio === "almacen" ? "¿Vendés repuestos para carros eléctricos o híbridos?" : "¿Ofrecés servicios para carros eléctricos o híbridos?"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                {OPCIONES_MOTORIZACION.map((opt) => (
                  <SelectableCard key={opt.value} label={opt.label} description={opt.description} selected={data.carroMotorizacion === opt.value} onClick={() => patch({ carroMotorizacion: opt.value as Motorizacion })} accent="signal" compact />
                ))}
              </div>
            </motion.div>
          )}
          {(data.tipoVehiculo === "moto" || data.tipoVehiculo === "ambos") && (
            <motion.div key="moto-motorizacion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Zap className="h-3.5 w-3.5 text-signal-600" />
                {data.tipoNegocio === "almacen" ? "¿Vendés repuestos para motos eléctricas o híbridas?" : "¿Ofrecés servicios para motos eléctricas o híbridas?"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                {OPCIONES_MOTORIZACION.map((opt) => (
                  <SelectableCard key={opt.value} label={opt.label} description={opt.description} selected={data.motoMotorizacion === opt.value} onClick={() => patch({ motoMotorizacion: opt.value as Motorizacion })} accent="signal" compact />
                ))}
              </div>
            </motion.div>
          )}
          {algunoElectrificado && (
            <motion.div key="especialista" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-signal-600" />
                ¿Sos especialista exclusivamente en eléctricos e híbridos?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectableCard label="Sí, solo eléctricos e híbridos" description="Nos especializamos únicamente en vehículos electrificados." selected={data.especialistaElectricos === true} onClick={() => patch({ especialistaElectricos: true })} accent="signal" compact />
                <SelectableCard label="No, también convencionales" description="Atendemos electrificados y a combustión." selected={data.especialistaElectricos === false} onClick={() => patch({ especialistaElectricos: false })} accent="signal" compact />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Servicios */}
      <div className="space-y-3 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-black text-foreground">{data.tipoNegocio === "almacen" ? "Repuestos que vendés" : "Servicios que ofrecés"}</h2>
        <div className="flex flex-wrap gap-2.5">
          {opcionesDisponibles.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => toggleServicio(s.value)}
              className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-colors ${
                data.servicios.includes(s.value) ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horario */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-black text-foreground">Horario de atención</h2>
        <ScheduleEditor value={data.horario} onChange={(horario) => patch({ horario })} accent="signal" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canGuardar}
          onClick={handleGuardar}
          className={cn(
            "flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold transition-all",
            canGuardar
              ? "bg-gradient-to-br from-signal-500 to-signal-600 text-white shadow-md shadow-signal-500/20"
              : "cursor-not-allowed bg-black/5 text-muted-foreground"
          )}
        >
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </button>
        {!descripcionValida && (
          <span className="text-[11px] font-semibold text-red-600">Completá la descripción de tu negocio para poder guardar.</span>
        )}
        <AnimatePresence>
          {guardado && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"
            >
              <Check className="h-4 w-4" /> Cambios guardados
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
