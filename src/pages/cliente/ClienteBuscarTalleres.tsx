import { useState, useCallback } from "react";
import {
  Search,
  Store,
  ShieldCheck,
  MapPin,
  Calendar,
  MessageCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Frown,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Zap,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import { TextareaField } from "@/components/Textarea";
import {
  buscarTalleresVerificados,
  generarCodigoVerificacion,
  CATEGORIA_LABELS,
  type TallerVerificado,
  type ContactoTaller,
} from "@/lib/clienteData";
import { cn } from "@/lib/utils";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

// ───── Tarjeta de resultado ─────

function TallerCard({ taller, onContactar }: { taller: TallerVerificado; onContactar: (t: TallerVerificado) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-brand-500/30 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10">
          <Store className="h-5 w-5 text-brand-600" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <ShieldCheck className="h-3 w-3" /> Sello de Confianza
          </span>
          <span
            className="text-[10px] font-mono text-muted-foreground/60"
            title="Código único — confírmalo con el taller para verificar su identidad"
          >
            {taller.codigoPublico}
          </span>
        </div>
      </div>

      <h3 className="text-sm font-bold text-foreground">{taller.nombre}</h3>
      {taller.descripcionNegocio && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{taller.descripcionNegocio}</p>
      )}

      <div className="mt-1 space-y-1">
        <p className="text-xs text-muted-foreground">{taller.categorias.map((c) => CATEGORIA_LABELS[c]).join(" · ")}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {taller.ciudad}
        </p>
        {taller.especialistaElectricos && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Zap className="h-3 w-3" /> Especialista en eléctricos e híbridos
          </p>
        )}
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Calendar className="h-3 w-3" /> Afiliado desde {formatFecha(taller.afiliadoDesde)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onContactar(taller)}
        className="mt-4 flex h-9 items-center justify-center gap-2 rounded-lg border border-brand-500/20 bg-brand-500/10 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-500/20"
      >
        <MessageCircle className="h-3.5 w-3.5" /> Contactar
      </button>
    </div>
  );
}

// ───── Dialog de contacto ─────

function ContactarDialog({
  taller,
  onClose,
  onSuccess,
}: {
  taller: TallerVerificado | null;
  onClose: () => void;
  onSuccess: (contacto: ContactoTaller) => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "done">("idle");
  const [codigo, setCodigo] = useState<string | null>(null);

  const canSubmit = descripcion.trim() !== "" && telefono.trim() !== "" && estado === "idle";

  const resetAndClose = useCallback(() => {
    setDescripcion("");
    setTelefono("");
    setWhatsapp("");
    setEstado("idle");
    setCodigo(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !taller) return;
    setEstado("loading");
    setTimeout(() => {
      const id = `ct-${Date.now().toString(36)}`;
      const codigoGenerado = generarCodigoVerificacion(id);
      setCodigo(codigoGenerado);
      setEstado("done");
      onSuccess({
        id,
        tallerId: taller.id,
        tallerNombre: taller.nombre,
        descripcion: descripcion.trim(),
        nombre: "Tú",
        telefono: telefono.trim(),
        whatsapp: whatsapp.trim() || null,
        status: "pendiente",
        codigoVerificacion: codigoGenerado,
        createdAt: new Date().toISOString(),
      });
    }, 700);
  }, [canSubmit, taller, descripcion, telefono, whatsapp, onSuccess]);

  return (
    <Modal
      open={taller !== null}
      onClose={resetAndClose}
      title={`Contactar a ${taller?.nombre ?? ""}`}
      description="Cuéntale al taller qué necesitas — te contactará directo a tu teléfono."
    >
      {estado === "done" && codigo ? (
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Solicitud enviada</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {taller?.nombre} recibió tus datos y te va a contactar por WhatsApp.
            </p>
          </div>

          <div className="w-full space-y-2 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
            <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
              <KeyRound className="h-3 w-3" /> Tu código de verificación
            </p>
            <p className="text-2xl font-black font-mono tracking-widest text-foreground">{codigo}</p>
          </div>

          <div className="flex w-full gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-left">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-800">
              Cuando {taller?.nombre} te escriba, debe decirte este código:{" "}
              <span className="font-mono font-bold">{codigo}</span>. Si no coincide, o te piden plata o datos antes
              de decírtelo, no sigas.
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            Puedes volver a ver este código en "Mis Solicitudes", más abajo.
          </p>

          <button
            type="button"
            onClick={resetAndClose}
            className="h-10 w-full rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md shadow-brand-500/20"
          >
            Entendido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <TextareaField
            label="¿Qué necesitas?"
            value={descripcion}
            onChange={setDescripcion}
            placeholder="Ej: quiero saber si tienen disponibilidad para..."
            maxLength={500}
            required
            accent="brand"
          />
          <TextField label="Teléfono" value={telefono} onChange={setTelefono} placeholder="300 000 0000" required accent="brand" />
          <TextField
            label="WhatsApp (opcional, si es distinto)"
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="Si prefieres que te escriban por WhatsApp"
            accent="brand"
          />

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
            {estado === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" /> Enviar
              </>
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}

// ───── Mis Solicitudes ─────

function MisSolicitudes({ contactos }: { contactos: ContactoTaller[] }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <KeyRound className="h-3.5 w-3.5 text-brand-600" /> Mis Solicitudes
        </span>
        {abierto ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {abierto && (
        <div className="space-y-3 border-t border-black/[0.06] p-4">
          {contactos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Todavía no has contactado a ningún taller desde aquí.</p>
          ) : (
            contactos.map((c) => (
              <div key={c.id} className="space-y-1.5 rounded-lg border border-black/[0.06] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{c.tallerNombre}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatFecha(c.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">{c.descripcion}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-brand-700">{c.codigoVerificacion}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      c.status === "atendido"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-700"
                    )}
                  >
                    {c.status === "atendido" ? "Atendido" : "Pendiente"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ───── Vista principal ─────

type SearchStatus = "idle" | "loading" | "done";

export default function ClienteBuscarTalleres() {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<TallerVerificado[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [buscado, setBuscado] = useState(false);
  const [contactando, setContactando] = useState<TallerVerificado | null>(null);
  const [contactos, setContactos] = useState<ContactoTaller[]>([]);

  const handleSearch = useCallback(() => {
    const q = termino.trim();
    if (!q || status === "loading") return;
    setStatus("loading");
    setBuscado(true);
    setTimeout(() => {
      setResultados(buscarTalleresVerificados(q));
      setStatus("done");
    }, 500);
  }, [termino, status]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
            <Store className="h-3.5 w-3.5 text-brand-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">Buscar Talleres</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Encuentra talleres y almacenes de repuestos verificados con Sello de Confianza y contáctalos directo.
        </p>
      </div>

      <div className="flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Busca por nombre del taller o almacén..."
            className="h-11 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-sm font-medium shadow-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!termino.trim() || status === "loading"}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 text-sm font-bold text-white shadow-md shadow-brand-500/20 disabled:opacity-50"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Buscar
        </button>
      </div>

      {status === "loading" ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : buscado && resultados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.06] bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
            <Frown className="h-6 w-6 text-brand-600" />
          </div>
          <h4 className="mb-1 text-sm font-bold text-foreground">No encontramos talleres con ese nombre</h4>
          <p className="max-w-sm text-xs text-muted-foreground">Pronto tendremos más aliados verificados en tu zona.</p>
        </div>
      ) : resultados.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((t) => (
            <TallerCard key={t.id} taller={t} onContactar={setContactando} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
            <Search className="h-6 w-6 text-brand-600" />
          </div>
          <h4 className="mb-1 text-sm font-bold text-foreground">Busca un taller aliado</h4>
          <p className="max-w-sm text-xs text-muted-foreground">Escribe el nombre del taller o almacén que buscas y presiona Buscar.</p>
        </div>
      )}

      <MisSolicitudes contactos={contactos} />

      <ContactarDialog taller={contactando} onClose={() => setContactando(null)} onSuccess={(c) => setContactos((prev) => [c, ...prev])} />
    </div>
  );
}
