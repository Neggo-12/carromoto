import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Plus, MapPin, Users, Zap, Pause, Play, Megaphone, Loader2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import { TextareaField } from "@/components/Textarea";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SelectableCard } from "@/components/SelectableCard";
import { CIUDADES } from "@/lib/data";
import { CATEGORIA_LABELS, type CategoriaTaller } from "@/lib/categorias";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";

interface Segmentacion {
  ciudades?: string[];
  tipoVehiculo?: string[];
  categoria?: CategoriaTaller[];
}

interface CampanaReal {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: "activa" | "pausada";
  segmentacion: Segmentacion;
  created_at: string;
  interesados: number;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

/** Solo las categorías que el taller realmente atiende, según su perfil. */
function categoriasDelTaller(taller: { tipoNegocio: "taller" | "almacen"; tipoVehiculo: "carro" | "moto" | "ambos" }): CategoriaTaller[] {
  const prefijo = taller.tipoNegocio === "almacen" ? "repuestos" : "taller";
  const cats: CategoriaTaller[] = [];
  if (taller.tipoVehiculo === "carro" || taller.tipoVehiculo === "ambos") cats.push(`${prefijo}_carro` as CategoriaTaller);
  if (taller.tipoVehiculo === "moto" || taller.tipoVehiculo === "ambos") cats.push(`${prefijo}_moto` as CategoriaTaller);
  return cats;
}

// ───── Formulario para publicar una oferta nueva ─────

function NuevaOfertaModal({
  open,
  onClose,
  onCreate,
  categoriasDisponibles,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (datos: { titulo: string; descripcion: string; ciudad: string; categorias: CategoriaTaller[]; soloElectricosHibridos: boolean }) => void;
  categoriasDisponibles: CategoriaTaller[];
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [categorias, setCategorias] = useState<CategoriaTaller[]>(categoriasDisponibles);
  const [soloElectricosHibridos, setSoloElectricosHibridos] = useState(false);

  const canSubmit = titulo.trim() !== "" && descripcion.trim() !== "" && ciudad.trim() !== "" && categorias.length > 0;

  function toggleCategoria(c: CategoriaTaller) {
    setCategorias((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function reset() {
    setTitulo("");
    setDescripcion("");
    setCiudad("");
    setCategorias(categoriasDisponibles);
    setSoloElectricosHibridos(false);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({ titulo: titulo.trim(), descripcion: descripcion.trim(), ciudad, categorias, soloElectricosHibridos });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Publicar nueva oferta" description="Los clientes la van a ver en su sección de Ofertas.">
      <div className="space-y-4">
        <TextField label="Título de la oferta" value={titulo} onChange={setTitulo} placeholder="Ej: 20% de descuento en cambio de aceite" accent="signal" required />
        <TextareaField label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Contá qué incluye, hasta cuándo aplica, etc." maxLength={300} accent="signal" required />
        <SearchableSelect label="Ciudad" value={ciudad} onChange={setCiudad} options={CIUDADES} accent="signal" required />

        <div>
          <p className="mb-2 text-xs font-bold text-foreground">¿A quién aplica?</p>
          {categoriasDisponibles.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {categoriasDisponibles.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategoria(c)}
                  className={cn(
                    "rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors",
                    categorias.includes(c) ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
                  )}
                >
                  {CATEGORIA_LABELS[c]}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-black/[0.03] px-3 py-2 text-xs font-semibold text-muted-foreground">
              {categoriasDisponibles.length === 1 ? CATEGORIA_LABELS[categoriasDisponibles[0]] : "Completá tu perfil para elegir a quién aplica."}{" "}
              <span className="font-normal text-muted-foreground/70">(según lo que ofrecés en tu perfil)</span>
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Zap className="h-3.5 w-3.5 text-signal-600" /> ¿Es solo para eléctricos e híbridos?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <SelectableCard label="Sí" selected={soloElectricosHibridos} onClick={() => setSoloElectricosHibridos(true)} accent="signal" compact />
            <SelectableCard label="No" description="Aplica también a combustión" selected={!soloElectricosHibridos} onClick={() => setSoloElectricosHibridos(false)} accent="signal" compact />
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
            canSubmit ? "bg-gradient-to-br from-signal-500 to-signal-600 text-white shadow-md shadow-signal-500/20" : "cursor-not-allowed bg-black/5 text-muted-foreground"
          )}
        >
          <Gift className="h-4 w-4" /> Publicar oferta
        </button>
      </div>
    </Modal>
  );
}

// ───── Tarjeta de oferta publicada ─────

function OfertaCard({ oferta, onToggleEstado }: { oferta: CampanaReal; onToggleEstado: () => void }) {
  const activa = oferta.estado === "activa";
  const ciudad = oferta.segmentacion.ciudades?.[0] ?? "Todas las ciudades";
  const categorias = oferta.segmentacion.categoria ?? [];
  const soloElectricosHibridos = (oferta.segmentacion.tipoVehiculo ?? []).length > 0;
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-white p-5 shadow-sm", activa ? "border-black/[0.06]" : "border-black/[0.06] opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">{oferta.titulo}</h3>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", activa ? "bg-emerald-500/10 text-emerald-700" : "bg-black/5 text-muted-foreground")}>
          {activa ? "Activa" : "Pausada"}
        </span>
      </div>

      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{oferta.descripcion}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          <MapPin className="h-3 w-3 text-signal-600" /> {ciudad}
        </span>
        {categorias.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {CATEGORIA_LABELS[c]}
          </span>
        ))}
        {soloElectricosHibridos && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <Zap className="h-3 w-3" /> Eléctricos/Híbridos
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-signal-600" /> {oferta.interesados} interesados
        </p>
        <p className="text-[11px] text-muted-foreground/70">Publicada {formatFecha(oferta.created_at)}</p>
      </div>

      <button
        type="button"
        onClick={onToggleEstado}
        className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-black/10 text-xs font-bold text-foreground transition-colors hover:bg-black/[0.03]"
      >
        {activa ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {activa ? "Pausar oferta" : "Reactivar oferta"}
      </button>
    </div>
  );
}

// ───── Vista principal ─────

export default function TallerOfertas() {
  const { session, perfil } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaTaller[]>([]);
  const [ofertas, setOfertas] = useState<CampanaReal[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = useCallback(async () => {
    if (!perfil?.organizationId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    const { data: org } = await supabase.from("organizations").select("type, metadata").eq("id", perfil.organizationId).maybeSingle();
    if (org) {
      const meta = (org.metadata ?? {}) as Record<string, unknown>;
      setCategoriasDisponibles(
        categoriasDelTaller({ tipoNegocio: org.type as "taller" | "almacen", tipoVehiculo: (meta.tipo_vehiculo as "carro" | "moto" | "ambos") ?? "carro" })
      );
    }

    const { data: campanas } = await supabase
      .from("campanas")
      .select("id, titulo, descripcion, estado, segmentacion, created_at")
      .eq("organization_id", perfil.organizationId)
      .order("created_at", { ascending: false });

    const campanaIds = (campanas ?? []).map((c) => c.id);
    let conteos: Record<string, number> = {};
    if (campanaIds.length > 0) {
      const { data: solicitudes } = await supabase.from("oferta_solicitudes").select("campana_id").in("campana_id", campanaIds);
      conteos = (solicitudes ?? []).reduce<Record<string, number>>((acc, s) => {
        acc[s.campana_id] = (acc[s.campana_id] ?? 0) + 1;
        return acc;
      }, {});
    }

    setOfertas(
      (campanas ?? []).map((c) => ({
        id: c.id,
        titulo: c.titulo,
        descripcion: c.descripcion,
        estado: c.estado as "activa" | "pausada",
        segmentacion: (c.segmentacion ?? {}) as Segmentacion,
        created_at: c.created_at,
        interesados: conteos[c.id] ?? 0,
      }))
    );
    setCargando(false);
  }, [perfil?.organizationId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleCrear(datos: { titulo: string; descripcion: string; ciudad: string; categorias: CategoriaTaller[]; soloElectricosHibridos: boolean }) {
    if (!perfil?.organizationId || !session?.user.id) return;
    const segmentacion: Segmentacion = {
      ciudades: [datos.ciudad],
      tipoVehiculo: datos.soloElectricosHibridos ? ["electrico", "hibrido"] : [],
      categoria: datos.categorias,
    };
    await supabase.from("campanas").insert({
      organization_id: perfil.organizationId,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      segmentacion,
      creado_por: session.user.id,
    });
    await cargar();
  }

  async function toggleEstado(id: string, estadoActual: "activa" | "pausada") {
    const nuevo = estadoActual === "activa" ? "pausada" : "activa";
    setOfertas((prev) => prev.map((o) => (o.id === id ? { ...o, estado: nuevo } : o)));
    await supabase.from("campanas").update({ estado: nuevo }).eq("id", id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500/10">
              <Gift className="h-3.5 w-3.5 text-signal-600" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-foreground">Ofertas</h1>
          </div>
          <p className="text-xs text-muted-foreground">Promociones que publicás para que las vean los clientes.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="flex h-10 shrink-0 items-center gap-2 self-start rounded-xl bg-gradient-to-br from-signal-500 to-signal-600 px-4 text-xs font-bold text-white shadow-md shadow-signal-500/20"
        >
          <Plus className="h-4 w-4" /> Publicar nueva oferta
        </button>
      </div>

      <Link
        to="/portal/taller/comprobantes"
        className="flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-500/10"
      >
        <Megaphone className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        ¿Querés dar puntos dobles o triples por un tiempo? Eso se activa desde "Comprobantes", no acá — aplica a todo
        el taller, no a una oferta puntual.
      </Link>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando ofertas...
        </div>
      ) : ofertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-500/10">
            <Gift className="h-6 w-6 text-signal-600" />
          </div>
          <h4 className="mb-1 text-sm font-bold text-foreground">Todavía no publicaste ofertas</h4>
          <p className="max-w-sm text-xs text-muted-foreground">Publicá una promoción para que los clientes la vean en su portal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ofertas.map((o) => (
            <OfertaCard key={o.id} oferta={o} onToggleEstado={() => toggleEstado(o.id, o.estado)} />
          ))}
        </div>
      )}

      <NuevaOfertaModal open={modalAbierto} onClose={() => setModalAbierto(false)} onCreate={handleCrear} categoriasDisponibles={categoriasDisponibles} />
    </div>
  );
}
