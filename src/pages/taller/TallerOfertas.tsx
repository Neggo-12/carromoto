import { useState, useCallback } from "react";
import { Gift, Plus, MapPin, Users, Zap, Pause, Play, Coins } from "lucide-react";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import { TextareaField } from "@/components/Textarea";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SelectableCard } from "@/components/SelectableCard";
import { CIUDADES } from "@/lib/data";
import { MIS_OFERTAS_MOCK, MI_TALLER_MOCK, categoriasDelTaller, type MiOferta } from "@/lib/tallerData";
import { CATEGORIA_LABELS, type CategoriaTaller } from "@/lib/clienteData";
import { cn } from "@/lib/utils";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

// ───── Formulario para publicar una oferta nueva ─────

function NuevaOfertaModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (o: MiOferta) => void }) {
  // Solo las categorías que este taller realmente atiende — nunca "carros"
  // para un taller que solo hace motos, por ejemplo.
  const categoriasDisponibles = categoriasDelTaller(MI_TALLER_MOCK);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [categorias, setCategorias] = useState<CategoriaTaller[]>(categoriasDisponibles);
  const [soloElectricosHibridos, setSoloElectricosHibridos] = useState(false);
  const [puntosExtra, setPuntosExtra] = useState<2 | 3 | null>(null);
  const [vigenciaMultiplicador, setVigenciaMultiplicador] = useState("");

  const canSubmit =
    titulo.trim() !== "" &&
    descripcion.trim() !== "" &&
    ciudad.trim() !== "" &&
    categorias.length > 0 &&
    (puntosExtra === null || vigenciaMultiplicador.trim() !== "");

  function toggleCategoria(c: CategoriaTaller) {
    setCategorias((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function reset() {
    setTitulo("");
    setDescripcion("");
    setCiudad("");
    setCategorias(categoriasDisponibles);
    setSoloElectricosHibridos(false);
    setPuntosExtra(null);
    setVigenciaMultiplicador("");
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({
      id: `of-${Date.now().toString(36)}`,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      ciudad,
      categorias,
      soloElectricosHibridos,
      estado: "activa",
      interesados: 0,
      createdAt: new Date().toISOString(),
      multiplicadorPuntos: puntosExtra ?? undefined,
      multiplicadorVigencia: puntosExtra ? vigenciaMultiplicador.trim() : undefined,
    });
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

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Coins className="h-3.5 w-3.5 text-signal-600" /> ¿Querés dar puntos extra por esta oferta?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <SelectableCard label="No" selected={puntosExtra === null} onClick={() => setPuntosExtra(null)} accent="signal" compact />
            <SelectableCard label="x2 puntos" selected={puntosExtra === 2} onClick={() => setPuntosExtra(2)} accent="signal" compact />
            <SelectableCard label="x3 puntos" selected={puntosExtra === 3} onClick={() => setPuntosExtra(3)} accent="signal" compact />
          </div>
          {puntosExtra !== null && (
            <div className="mt-3">
              <TextField
                label="¿Hasta cuándo aplica?"
                value={vigenciaMultiplicador}
                onChange={setVigenciaMultiplicador}
                placeholder="Ej: Este fin de semana, hasta el domingo"
                accent="signal"
                required
              />
            </div>
          )}
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

function OfertaCard({ oferta, onToggleEstado }: { oferta: MiOferta; onToggleEstado: () => void }) {
  const activa = oferta.estado === "activa";
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
          <MapPin className="h-3 w-3 text-signal-600" /> {oferta.ciudad}
        </span>
        {oferta.categorias.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {CATEGORIA_LABELS[c]}
          </span>
        ))}
        {oferta.soloElectricosHibridos && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <Zap className="h-3 w-3" /> Eléctricos/Híbridos
          </span>
        )}
        {oferta.multiplicadorPuntos && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            <Coins className="h-3 w-3" /> x{oferta.multiplicadorPuntos} puntos · {oferta.multiplicadorVigencia}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-signal-600" /> {oferta.interesados} interesados
        </p>
        <p className="text-[11px] text-muted-foreground/70">Publicada {formatFecha(oferta.createdAt)}</p>
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
  const [ofertas, setOfertas] = useState<MiOferta[]>(MIS_OFERTAS_MOCK);
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleCrear = useCallback((o: MiOferta) => {
    setOfertas((prev) => [o, ...prev]);
  }, []);

  const toggleEstado = useCallback((id: string) => {
    setOfertas((prev) => prev.map((o) => (o.id === id ? { ...o, estado: o.estado === "activa" ? "pausada" : "activa" } : o)));
  }, []);

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
          <p className="text-xs text-muted-foreground">Promociones que publicás para que las vean los clientes — datos de ejemplo.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="flex h-10 shrink-0 items-center gap-2 self-start rounded-xl bg-gradient-to-br from-signal-500 to-signal-600 px-4 text-xs font-bold text-white shadow-md shadow-signal-500/20"
        >
          <Plus className="h-4 w-4" /> Publicar nueva oferta
        </button>
      </div>

      {ofertas.length === 0 ? (
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
            <OfertaCard key={o.id} oferta={o} onToggleEstado={() => toggleEstado(o.id)} />
          ))}
        </div>
      )}

      <NuevaOfertaModal open={modalAbierto} onClose={() => setModalAbierto(false)} onCreate={handleCrear} />
    </div>
  );
}
