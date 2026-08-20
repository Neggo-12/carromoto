import { useCallback, useEffect, useState } from "react";
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
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";
import { leerBusquedaPendiente, limpiarBusquedaPendiente } from "@/lib/geocoding";

// Fila real que devuelve buscar_comercios_verificados() — ver
// supabase/migrations/0007_buscar_talleres_datos_reales.sql. Ya no hay data
// de ejemplo acá: esto lee directo del taller que un admin haya aprobado y
// sellado de verdad. `distancia_km` solo viene poblado cuando la fila salió
// de buscar_talleres_cercanos() (búsqueda por dirección que vino de la Home
// pública) — la búsqueda por nombre de acá abajo no la usa.
interface TallerVerificado {
  id: string;
  name: string;
  ciudad: string | null;
  tipo_negocio: "taller" | "almacen";
  tipo_vehiculo: "carro" | "moto" | "ambos" | null;
  especialista_electricos: boolean;
  descripcion_negocio: string | null;
  afiliado_desde: string;
  codigo_publico: string;
  distancia_km?: number;
}

interface ContactoTaller {
  id: string;
  comercio_id: string;
  descripcion: string;
  telefono: string;
  status: string;
  codigo_verificacion: string;
  created_at: string;
  // nombre del taller — no viene en comercio_contactos, se guarda aparte al
  // enviar para no tener que hacer un join solo para mostrarlo en la lista.
  tallerNombre?: string;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function tipoVehiculoLabel(t: TallerVerificado["tipo_vehiculo"]) {
  if (t === "carro") return "Carro";
  if (t === "moto") return "Moto";
  if (t === "ambos") return "Carro y moto";
  return null;
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
          {typeof taller.distancia_km === "number" && (
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold text-brand-700">
              {taller.distancia_km < 1 ? "A menos de 1 km" : `A ${taller.distancia_km.toFixed(1)} km`}
            </span>
          )}
          <span
            className="text-[10px] font-mono text-muted-foreground/60"
            title="Código único — confírmalo con el taller para verificar su identidad"
          >
            {taller.codigo_publico}
          </span>
        </div>
      </div>

      <h3 className="text-sm font-bold text-foreground">{taller.name}</h3>
      {taller.descripcion_negocio && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{taller.descripcion_negocio}</p>
      )}

      <div className="mt-1 space-y-1">
        <p className="text-xs text-muted-foreground">
          {taller.tipo_negocio === "almacen" ? "Repuestos" : "Taller"}
          {tipoVehiculoLabel(taller.tipo_vehiculo) ? ` · ${tipoVehiculoLabel(taller.tipo_vehiculo)}` : ""}
        </p>
        {taller.ciudad && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {taller.ciudad}
          </p>
        )}
        {taller.especialista_electricos && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Zap className="h-3 w-3" /> Especialista en eléctricos e híbridos
          </p>
        )}
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Calendar className="h-3 w-3" /> Afiliado desde {formatFecha(taller.afiliado_desde)}
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
  onSuccess: () => void;
}) {
  const { perfil } = useAuth();
  const [descripcion, setDescripcion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "done">("idle");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const canSubmit = descripcion.trim() !== "" && telefono.trim() !== "" && estado === "idle";

  const resetAndClose = useCallback(() => {
    setDescripcion("");
    setTelefono("");
    setWhatsapp("");
    setEstado("idle");
    setCodigo(null);
    setError("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !taller) return;
    setEstado("loading");
    setError("");
    // registrar_contacto_comercio genera el código de verificación del lado
    // del servidor (security definer) — no se inventa nada en el navegador.
    const { data, error: err } = await supabase.rpc("registrar_contacto_comercio", {
      p_comercio_id: taller.id,
      p_descripcion: descripcion.trim(),
      p_nombre: perfil?.nombre ?? "Cliente",
      p_telefono: telefono.trim(),
      p_whatsapp: whatsapp.trim() || null,
    });
    if (err || !data) {
      setEstado("idle");
      setError("No pudimos enviar tu solicitud. Intentá de nuevo.");
      return;
    }
    const { data: fila } = await supabase
      .from("comercio_contactos")
      .select("codigo_verificacion")
      .eq("id", data)
      .maybeSingle();
    setCodigo(fila?.codigo_verificacion ?? null);
    setEstado("done");
    onSuccess();
  }, [canSubmit, taller, descripcion, telefono, whatsapp, perfil, onSuccess]);

  return (
    <Modal
      open={taller !== null}
      onClose={resetAndClose}
      title={`Contactar a ${taller?.name ?? ""}`}
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
              {taller?.name} recibió tus datos y te va a contactar por WhatsApp.
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
              Cuando {taller?.name} te escriba, debe decirte este código:{" "}
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

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

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
                  <p className="text-xs font-bold text-foreground">{c.tallerNombre ?? "Taller"}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatFecha(c.created_at)}</span>
                </div>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">{c.descripcion}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-brand-700">{c.codigo_verificacion}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      c.status === "ganado" || c.status === "contactado"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-700"
                    )}
                  >
                    {c.status === "nuevo" ? "Pendiente" : c.status === "contactado" ? "Contactado" : c.status}
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
  const { session } = useAuth();
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<TallerVerificado[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [buscado, setBuscado] = useState(false);
  const [contactando, setContactando] = useState<TallerVerificado | null>(null);
  const [contactos, setContactos] = useState<ContactoTaller[]>([]);

  // Búsqueda por dirección que el usuario dejó a medias en la Home pública
  // antes de registrarse/iniciar sesión (ver LandingHub.tsx + geocoding.ts).
  // Se consume una sola vez al entrar acá — direccionCercana null significa
  // "no había ninguna pendiente", no "todavía no cargó".
  const [direccionCercana, setDireccionCercana] = useState<string | null>(null);
  const [resultadosCercanos, setResultadosCercanos] = useState<TallerVerificado[]>([]);
  const [cargandoCercanos, setCargandoCercanos] = useState(false);

  const cargarContactos = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from("comercio_contactos")
      .select("id, comercio_id, descripcion, telefono, status, codigo_verificacion, created_at")
      .order("created_at", { ascending: false });
    if (data) setContactos(data as ContactoTaller[]);
  }, [session]);

  useEffect(() => {
    void cargarContactos();
  }, [cargarContactos]);

  useEffect(() => {
    const pendiente = leerBusquedaPendiente();
    if (!pendiente) return;
    setDireccionCercana(pendiente.direccion);
    setCargandoCercanos(true);
    void (async () => {
      const { data, error } = await supabase.rpc("buscar_talleres_cercanos", {
        p_lat: pendiente.lat,
        p_lng: pendiente.lng,
        p_radio_km: 30,
        p_tipo_vehiculo: pendiente.vehiculo || null,
        p_servicio: pendiente.servicio || null,
      });
      setResultadosCercanos(!error && data ? (data as TallerVerificado[]) : []);
      setCargandoCercanos(false);
      limpiarBusquedaPendiente();
    })();
  }, []);

  const handleSearch = useCallback(async () => {
    const q = termino.trim();
    if (!q || status === "loading") return;
    setStatus("loading");
    setBuscado(true);
    const { data, error } = await supabase.rpc("buscar_comercios_verificados", { p_termino: q });
    setResultados(!error && data ? (data as TallerVerificado[]) : []);
    setStatus("done");
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

      {direccionCercana && (
        <div className="space-y-3 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-bold text-foreground">Talleres cerca de "{direccionCercana}"</h2>
          </div>
          {cargandoCercanos ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : resultadosCercanos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No encontramos talleres verificados cerca de esa dirección todavía. Seguimos sumando cobertura — probá
              buscando por nombre más abajo.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resultadosCercanos.map((t) => (
                <TallerCard key={t.id} taller={t} onContactar={setContactando} />
              ))}
            </div>
          )}
        </div>
      )}

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

      <ContactarDialog taller={contactando} onClose={() => setContactando(null)} onSuccess={() => void cargarContactos()} />
    </div>
  );
}
