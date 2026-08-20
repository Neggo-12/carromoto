import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Plus, MapPin, Users, Zap, Pause, Play, Megaphone, Loader2, Trophy, Eye, Phone, Hash } from "lucide-react";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import { TextareaField } from "@/components/Textarea";
import { SelectableCard } from "@/components/SelectableCard";
import { CIUDADES } from "@/lib/data";
import { ciudadesSugeridas } from "@/lib/campanas";
import { CATEGORIA_LABELS, type CategoriaTaller } from "@/lib/categorias";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";

type EstadoCampana = "activa" | "pausada" | "cumplida";

interface Segmentacion {
  ciudades?: string[];
  tipoVehiculo?: string[];
  categoria?: CategoriaTaller[];
}

interface CampanaReal {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoCampana;
  segmentacion: Segmentacion;
  cupoMaximo: number | null;
  created_at: string;
  interesados: number;
}

interface Interesado {
  id: string;
  nombre: string;
  telefono: string;
  whatsapp: string | null;
  created_at: string;
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

interface DatosNuevaOferta {
  titulo: string;
  descripcion: string;
  ciudades: string[];
  categorias: CategoriaTaller[];
  soloElectricosHibridos: boolean;
  cupoMaximo: number | null;
}

function NuevaOfertaModal({
  open,
  onClose,
  onCreate,
  categoriasDisponibles,
  ciudadTaller,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (datos: DatosNuevaOferta) => void;
  categoriasDisponibles: CategoriaTaller[];
  ciudadTaller: string | null;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<CategoriaTaller[]>(categoriasDisponibles);
  const [soloElectricosHibridos, setSoloElectricosHibridos] = useState(false);
  const [cupoMaximo, setCupoMaximo] = useState("");

  // Este modal se monta una sola vez (siempre presente en el árbol, solo se
  // le cambia `open`) — un useState(propInicial) solo lee esa prop en el
  // montaje inicial. Como categoriasDisponibles/ciudadTaller se calculan
  // async en el padre (después de leer organizations), la primera vez que
  // se abría el modal podían llegar vacíos y "Publicar oferta" no se
  // habilitaba nunca hasta cerrar y reabrir. Este efecto resincroniza cada
  // vez que se abre, cuando ya seguro llegaron los datos del padre.
  useEffect(() => {
    if (open) {
      setCategorias(categoriasDisponibles);
      setCiudades(ciudadesSugeridas(ciudadTaller));
    }
  }, [open, categoriasDisponibles, ciudadTaller]);

  const canSubmit =
    titulo.trim() !== "" &&
    descripcion.trim() !== "" &&
    ciudades.length > 0 &&
    categorias.length > 0 &&
    (cupoMaximo.trim() === "" || Number(cupoMaximo) > 0);

  function toggleCategoria(c: CategoriaTaller) {
    setCategorias((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }
  function toggleCiudad(c: string) {
    setCiudades((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function reset() {
    setTitulo("");
    setDescripcion("");
    setCiudades(ciudadesSugeridas(ciudadTaller));
    setCategorias(categoriasDisponibles);
    setSoloElectricosHibridos(false);
    setCupoMaximo("");
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      ciudades,
      categorias,
      soloElectricosHibridos,
      cupoMaximo: cupoMaximo.trim() === "" ? null : Number(cupoMaximo),
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Publicar nueva oferta" description="Los clientes la van a ver en su sección de Ofertas.">
      <div className="space-y-4">
        <TextField label="Título de la oferta" value={titulo} onChange={setTitulo} placeholder="Ej: 20% de descuento en cambio de aceite" accent="signal" required />
        <TextareaField label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Contá qué incluye, hasta cuándo aplica, etc." maxLength={300} accent="signal" required />

        <div>
          <p className="mb-2 text-xs font-bold text-foreground">¿En qué ciudades aplica?</p>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Ya marcamos tu ciudad y las cercanas — podés sacar o agregar las que quieras para competir por clientes de
            otras zonas también.
          </p>
          <div className="flex flex-wrap gap-2">
            {CIUDADES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCiudad(c)}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors",
                  ciudades.includes(c) ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

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

        <TextField
          label="Cupo máximo de interesados (opcional)"
          icon={Hash}
          value={cupoMaximo}
          onChange={(v) => setCupoMaximo(v.replace(/[^\d]/g, ""))}
          placeholder="Ej: 20"
          accent="signal"
          helpText='Dejalo vacío para cupo ilimitado. Al llegar al cupo, la oferta se marca "Cumplida" sola y deja de recibir más interesados.'
        />

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

// ───── Panel de interesados en una campaña ─────

function InteresadosModal({ campana, onClose }: { campana: CampanaReal | null; onClose: () => void }) {
  const [interesados, setInteresados] = useState<Interesado[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!campana) return;
    let activo = true;
    setCargando(true);
    supabase
      .from("oferta_solicitudes")
      .select("id, nombre, telefono, whatsapp, created_at")
      .eq("campana_id", campana.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!activo) return;
        setInteresados((data as Interesado[]) ?? []);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [campana]);

  return (
    <Modal
      open={campana !== null}
      onClose={onClose}
      title="Interesados en esta oferta"
      description={campana ? `${campana.titulo} — cuando alguno de estos clientes llegue al taller, elegilo desde "Generar comprobante" para asignarle los puntos x3.` : undefined}
    >
      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
        </div>
      ) : interesados.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Todavía nadie mostró interés en esta oferta.</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {interesados.map((i) => (
            <div key={i.id} className="rounded-xl border border-black/[0.06] bg-white p-3.5">
              <p className="text-sm font-bold text-foreground">{i.nombre}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {i.telefono}
                {i.whatsapp && i.whatsapp !== i.telefono ? ` · WhatsApp: ${i.whatsapp}` : ""}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">{formatFecha(i.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ───── Tarjeta de oferta publicada ─────

function OfertaCard({ oferta, onToggleEstado, onVerInteresados }: { oferta: CampanaReal; onToggleEstado: () => void; onVerInteresados: () => void }) {
  const activa = oferta.estado === "activa";
  const cumplida = oferta.estado === "cumplida";
  const ciudades = oferta.segmentacion.ciudades ?? [];
  const categorias = oferta.segmentacion.categoria ?? [];
  const soloElectricosHibridos = (oferta.segmentacion.tipoVehiculo ?? []).length > 0;
  const porcentaje = oferta.cupoMaximo ? Math.min(100, Math.round((oferta.interesados / oferta.cupoMaximo) * 100)) : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
        cumplida ? "border-emerald-500/25" : activa ? "border-black/[0.06]" : "border-black/[0.06] opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">{oferta.titulo}</h3>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            cumplida ? "bg-emerald-500/10 text-emerald-700" : activa ? "bg-emerald-500/10 text-emerald-700" : "bg-black/5 text-muted-foreground"
          )}
        >
          {cumplida && <Trophy className="h-2.5 w-2.5" />}
          {cumplida ? "Cumplida" : activa ? "Activa" : "Pausada"}
        </span>
      </div>

      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{oferta.descripcion}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          <MapPin className="h-3 w-3 text-signal-600" /> {ciudades.length > 0 ? ciudades.join(", ") : "Todas las ciudades"}
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

      {oferta.cupoMaximo && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div className={cn("h-full rounded-full", cumplida ? "bg-emerald-500" : "bg-signal-500")} style={{ width: `${porcentaje}%` }} />
          </div>
          <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
            {oferta.interesados} de {oferta.cupoMaximo} cupos · {porcentaje}% de la meta
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={onVerInteresados} className="flex items-center gap-1.5 text-xs font-semibold text-signal-700 hover:underline">
          <Users className="h-3.5 w-3.5" /> {oferta.interesados} interesados
        </button>
        <p className="text-[11px] text-muted-foreground/70">Publicada {formatFecha(oferta.created_at)}</p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onVerInteresados}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 text-xs font-bold text-foreground transition-colors hover:bg-black/[0.03]"
        >
          <Eye className="h-3.5 w-3.5" /> Ver interesados
        </button>
        {!cumplida && (
          <button
            type="button"
            onClick={onToggleEstado}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 text-xs font-bold text-foreground transition-colors hover:bg-black/[0.03]"
          >
            {activa ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {activa ? "Pausar" : "Reactivar"}
          </button>
        )}
      </div>
    </div>
  );
}

// ───── Vista principal ─────

export default function TallerOfertas() {
  const { session, perfil } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaTaller[]>([]);
  const [ciudadTaller, setCiudadTaller] = useState<string | null>(null);
  const [ofertas, setOfertas] = useState<CampanaReal[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [interesadosDe, setInteresadosDe] = useState<CampanaReal | null>(null);

  const cargar = useCallback(async () => {
    if (!perfil?.organizationId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    const { data: org } = await supabase.from("organizations").select("type, ciudad, metadata").eq("id", perfil.organizationId).maybeSingle();
    if (org) {
      const meta = (org.metadata ?? {}) as Record<string, unknown>;
      setCategoriasDisponibles(
        categoriasDelTaller({ tipoNegocio: org.type as "taller" | "almacen", tipoVehiculo: (meta.tipo_vehiculo as "carro" | "moto" | "ambos") ?? "carro" })
      );
      setCiudadTaller(org.ciudad ?? null);
    }

    const { data: campanas } = await supabase
      .from("campanas")
      .select("id, titulo, descripcion, estado, segmentacion, cupo_maximo, created_at")
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
        estado: c.estado as EstadoCampana,
        segmentacion: (c.segmentacion ?? {}) as Segmentacion,
        cupoMaximo: c.cupo_maximo ?? null,
        created_at: c.created_at,
        interesados: conteos[c.id] ?? 0,
      }))
    );
    setCargando(false);
  }, [perfil?.organizationId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleCrear(datos: DatosNuevaOferta) {
    if (!perfil?.organizationId || !session?.user.id) return;
    const segmentacion: Segmentacion = {
      ciudades: datos.ciudades,
      tipoVehiculo: datos.soloElectricosHibridos ? ["electrico", "hibrido"] : [],
      categoria: datos.categorias,
    };
    await supabase.from("campanas").insert({
      organization_id: perfil.organizationId,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      segmentacion,
      cupo_maximo: datos.cupoMaximo,
      creado_por: session.user.id,
    });
    await cargar();
  }

  async function toggleEstado(id: string, estadoActual: EstadoCampana) {
    if (estadoActual === "cumplida") return;
    const nuevo = estadoActual === "activa" ? "pausada" : "activa";
    setOfertas((prev) => prev.map((o) => (o.id === id ? { ...o, estado: nuevo } : o)));
    await supabase.from("campanas").update({ estado: nuevo }).eq("id", id);
  }

  const activasYPausadas = ofertas.filter((o) => o.estado !== "cumplida");
  const exitosas = ofertas.filter((o) => o.estado === "cumplida");

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
        ¿Un cliente reservó una oferta y ya llegó al taller? Elegilo desde "Comprobantes" al generar su comprobante
        para asignarle los puntos x3 de esa campaña.
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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activasYPausadas.map((o) => (
              <OfertaCard key={o.id} oferta={o} onToggleEstado={() => toggleEstado(o.id, o.estado)} onVerInteresados={() => setInteresadosDe(o)} />
            ))}
          </div>

          {exitosas.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Trophy className="h-4 w-4 text-emerald-600" /> Campañas exitosas
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {exitosas.map((o) => (
                  <OfertaCard key={o.id} oferta={o} onToggleEstado={() => toggleEstado(o.id, o.estado)} onVerInteresados={() => setInteresadosDe(o)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <NuevaOfertaModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreate={handleCrear}
        categoriasDisponibles={categoriasDisponibles}
        ciudadTaller={ciudadTaller}
      />
      <InteresadosModal campana={interesadosDe} onClose={() => setInteresadosDe(null)} />
    </div>
  );
}
