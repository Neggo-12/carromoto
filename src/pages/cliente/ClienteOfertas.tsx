import { useCallback, useEffect, useState } from "react";
import { Gift, MapPin, Sparkles, CheckCircle2, Loader2, Zap } from "lucide-react";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import { CATEGORIA_LABELS, type CategoriaTaller } from "@/lib/categorias";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";

type EstadoSolicitud = "idle" | "loading" | "enviada";

export interface DatosInteres {
  nombre: string;
  telefono: string;
  whatsapp: string | null;
}

interface Segmentacion {
  ciudades?: string[];
  tipoVehiculo?: string[];
  categoria?: CategoriaTaller[];
}

interface OfertaReal {
  id: string;
  titulo: string;
  descripcion: string | null;
  tallerNombre: string;
  ciudades: string[];
  categorias: CategoriaTaller[];
  soloElectricosHibridos: boolean;
}

/**
 * Tarjeta de oferta — leída directo de campanas (estado='activa', visibles
 * para cualquier cliente autenticado por RLS). El multiplicador de puntos ya
 * no se muestra acá: no hay integración real con Puntos Neggo todavía, así
 * que mostrar un "x2 puntos" sería inventado.
 */
function OfertaCard({
  oferta,
  estado,
  onMeInteresa,
  onDescartar,
}: {
  oferta: OfertaReal;
  estado: EstadoSolicitud;
  onMeInteresa: () => void;
  onDescartar: () => void;
}) {
  return (
    <div className="group flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-brand-500/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-sm font-black text-brand-700">
            {oferta.tallerNombre.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{oferta.tallerNombre}</p>
            <h4 className="truncate text-sm font-bold text-foreground">{oferta.titulo}</h4>
          </div>
        </div>
        {oferta.soloElectricosHibridos && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <Zap className="h-2.5 w-2.5" /> Eléctricos/Híbridos
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{oferta.descripcion}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          <MapPin className="h-3 w-3 text-brand-600" />
          {oferta.ciudades.length > 0 ? oferta.ciudades.join(", ") : "Todas las ciudades"}
        </span>
        {oferta.categorias.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {CATEGORIA_LABELS[c]}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onDescartar}
        disabled={estado !== "idle"}
        className="mt-4 w-full rounded-lg border border-black/[0.06] px-3 py-1.5 text-[10px] text-muted-foreground/60 transition-all hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-500 disabled:opacity-40"
      >
        No me interesa
      </button>

      <button
        type="button"
        disabled={estado !== "idle"}
        onClick={onMeInteresa}
        className={cn(
          "mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
          estado === "idle" && "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20 hover:shadow-lg",
          estado === "loading" && "cursor-wait bg-black/5 text-muted-foreground",
          estado === "enviada" && "cursor-default border border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
        )}
      >
        {estado === "idle" && (
          <>
            Me interesa <Sparkles className="h-3.5 w-3.5" />
          </>
        )}
        {estado === "loading" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
          </>
        )}
        {estado === "enviada" && (
          <>
            <CheckCircle2 className="h-4 w-4" /> Solicitud enviada
          </>
        )}
      </button>
    </div>
  );
}

// ── Formulario de "Me interesa" ──
function InteresModal({
  oferta,
  onClose,
  onSubmit,
}: {
  oferta: OfertaReal | null;
  onClose: () => void;
  onSubmit: (datos: DatosInteres) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const canSubmit = nombre.trim() !== "" && telefono.trim() !== "";

  function reset() {
    setNombre("");
    setTelefono("");
    setWhatsapp("");
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ nombre: nombre.trim(), telefono: telefono.trim(), whatsapp: whatsapp.trim() || null });
    reset();
  }

  return (
    <Modal
      open={oferta !== null}
      onClose={() => { reset(); onClose(); }}
      title={`Contame quién sos`}
      description={oferta ? `${oferta.tallerNombre} va a recibir tus datos para escribirte por "${oferta.titulo}".` : undefined}
    >
      <div className="space-y-4">
        <TextField label="Tu nombre" value={nombre} onChange={setNombre} placeholder="Nombre y apellido" accent="brand" required />
        <TextField label="Teléfono" value={telefono} onChange={setTelefono} placeholder="300 000 0000" accent="brand" required />
        <TextField label="WhatsApp (opcional, si es distinto)" value={whatsapp} onChange={setWhatsapp} placeholder="Si prefieres que te escriban por WhatsApp" accent="brand" />

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
            canSubmit
              ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20"
              : "cursor-not-allowed bg-black/5 text-muted-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" /> Enviar mi interés
        </button>
      </div>
    </Modal>
  );
}

export default function ClienteOfertas() {
  const { perfil } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [ofertas, setOfertas] = useState<OfertaReal[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoSolicitud>>({});
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());
  const [interesEn, setInteresEn] = useState<OfertaReal | null>(null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      const { data, error } = await supabase
        .from("campanas")
        .select("id, titulo, descripcion, segmentacion, organizations(name)")
        .eq("estado", "activa")
        .order("created_at", { ascending: false });
      if (!activo) return;
      if (!error && data) {
        const mapeadas: OfertaReal[] = data.map((c) => {
          const seg = (c.segmentacion ?? {}) as Segmentacion;
          const org = c.organizations as unknown as { name: string } | null;
          return {
            id: c.id,
            titulo: c.titulo,
            descripcion: c.descripcion,
            tallerNombre: org?.name ?? "Taller verificado",
            ciudades: seg.ciudades ?? [],
            categorias: seg.categoria ?? [],
            soloElectricosHibridos: (seg.tipoVehiculo ?? []).length > 0,
          };
        });
        setOfertas(mapeadas);
      }
      setCargando(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const handleConfirmarInteres = useCallback(
    (datos: DatosInteres) => {
      if (!interesEn) return;
      const id = interesEn.id;
      setEstados((prev) => ({ ...prev, [id]: "loading" }));
      setInteresEn(null);
      supabase
        .from("oferta_solicitudes")
        .insert({ campana_id: id, nombre: datos.nombre, telefono: datos.telefono, whatsapp: datos.whatsapp })
        .then(({ error }) => {
          setEstados((prev) => ({ ...prev, [id]: error ? "idle" : "enviada" }));
        });
    },
    [interesEn]
  );

  const handleDescartar = useCallback((id: string) => {
    setDescartadas((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Filtro liviano por ciudad/vehículo del cliente cuando el dato existe —
  // una oferta sin ciudades/categorías guardadas aplica a todos.
  const visibles = ofertas.filter((o) => {
    if (descartadas.has(o.id)) return false;
    if (perfil?.ciudad && o.ciudades.length > 0 && !o.ciudades.includes(perfil.ciudad)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
              <Gift className="h-3.5 w-3.5 text-brand-600" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-foreground">Ofertas para ti</h1>
          </div>
          <p className="text-xs text-muted-foreground">Promociones activas de talleres y almacenes verificados.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-700">
          <Sparkles className="h-3 w-3" />
          {visibles.length} ofertas disponibles
        </span>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando ofertas...
        </div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
            <Gift className="h-6 w-6 text-brand-600" />
          </div>
          <h4 className="mb-1 text-sm font-bold text-foreground">Sin ofertas por ahora</h4>
          <p className="max-w-sm text-xs text-muted-foreground">
            Vuelve a revisar más tarde, seguimos sumando talleres y almacenes aliados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((o) => (
            <OfertaCard
              key={o.id}
              oferta={o}
              estado={estados[o.id] ?? "idle"}
              onMeInteresa={() => setInteresEn(o)}
              onDescartar={() => handleDescartar(o.id)}
            />
          ))}
        </div>
      )}

      <InteresModal oferta={interesEn} onClose={() => setInteresEn(null)} onSubmit={handleConfirmarInteres} />
    </div>
  );
}
