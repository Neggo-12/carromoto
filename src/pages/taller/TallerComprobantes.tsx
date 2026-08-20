import { useEffect, useState } from "react";
import { Receipt, User, IdCard, Wrench, Banknote, Calendar, CheckCircle2, AlertCircle, History, Megaphone, Power, Loader2, Clock } from "lucide-react";
import { TextField } from "@/components/TextField";
import { SelectableCard } from "@/components/SelectableCard";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { formatCOP, cn } from "@/lib/utils";

const TIPOS_DOCUMENTO: { value: string; label: string }[] = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PA", label: "Pasaporte" },
];

interface ComprobanteReal {
  id: string;
  cliente_nombre: string;
  servicio_o_producto: string;
  monto_pagado: number;
  estado_envio_puntos: string;
  created_at: string;
}

interface CampanaPuntosReal {
  organization_id: string;
  multiplicador: 2 | 3;
  motivo: string;
  vigencia: string;
  activa: boolean;
}

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Panel de campaña de puntos — real, contra campanas_puntos (una fila por
 * taller). El multiplicador que otorga puntos de verdad todavía depende de
 * la integración con Puntos Neggo (server-to-server, no construida en este
 * proyecto todavía) — esto solo prende/apaga la señal para cuando esa
 * integración exista.
 */
function CampanaPuntosPanel({ organizationId }: { organizationId: string }) {
  const [campana, setCampana] = useState<CampanaPuntosReal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [multiplicador, setMultiplicador] = useState<2 | 3>(2);
  const [motivo, setMotivo] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    supabase
      .from("campanas_puntos")
      .select("organization_id, multiplicador, motivo, vigencia, activa")
      .eq("organization_id", organizationId)
      .eq("activa", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!activo) return;
        setCampana(data as CampanaPuntosReal | null);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [organizationId]);

  async function handleActivar() {
    if (!motivo.trim() || !vigencia.trim()) return setError("Contanos el motivo y hasta cuándo aplica.");
    setError("");
    const nueva = { organization_id: organizationId, multiplicador, motivo: motivo.trim(), vigencia: vigencia.trim(), activa: true };
    const { error: err } = await supabase.from("campanas_puntos").upsert(nueva, { onConflict: "organization_id" });
    if (err) return setError("No se pudo activar la campaña.");
    setCampana(nueva);
    setEditando(false);
    setMotivo("");
    setVigencia("");
  }

  async function handleDesactivar() {
    await supabase.from("campanas_puntos").update({ activa: false }).eq("organization_id", organizationId);
    setCampana(null);
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-white p-5 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando campaña de puntos...
      </div>
    );
  }

  if (campana && !editando) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Campaña activa: puntos x{campana.multiplicador}</p>
            <p className="text-xs text-muted-foreground">{campana.motivo} · {campana.vigencia}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 text-xs font-bold text-foreground transition-colors hover:bg-black/[0.03]"
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={handleDesactivar}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 text-xs font-bold text-foreground transition-colors hover:bg-black/[0.03]"
          >
            <Power className="h-3.5 w-3.5" /> Desactivar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-signal-600" />
        <h2 className="text-sm font-bold text-foreground">Campaña de puntos</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Activá puntos dobles o triples por un tiempo — esta señal queda lista para cuando conectemos Puntos Neggo.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <SelectableCard label="x2 puntos" selected={multiplicador === 2} onClick={() => setMultiplicador(2)} accent="signal" compact />
        <SelectableCard label="x3 puntos" selected={multiplicador === 3} onClick={() => setMultiplicador(3)} accent="signal" compact />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Motivo" value={motivo} onChange={setMotivo} placeholder="Ej: Puntos dobles en todo el taller" accent="signal" required />
        <TextField label="¿Hasta cuándo aplica?" value={vigencia} onChange={setVigencia} placeholder="Ej: Este fin de semana (sáb-dom)" accent="signal" required />
      </div>

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleActivar}
        className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-signal-500 to-signal-600 px-4 text-xs font-bold text-white shadow-md shadow-signal-500/20"
      >
        <Megaphone className="h-3.5 w-3.5" /> Activar campaña
      </button>
    </div>
  );
}

/**
 * Generar comprobante de venta — guarda un comprobante real en
 * public.comprobantes. Los puntos NO se otorgan todavía: eso requiere la
 * integración server-to-server con Puntos Neggo (ver 0004_comprobantes_
 * puntos_neggo.sql), que no está construida en este proyecto. Cada
 * comprobante queda con estado_envio_puntos='pendiente' hasta que esa
 * integración exista — esta pantalla lo muestra tal como es, sin inventar
 * un número de puntos otorgados.
 */
export default function TallerComprobantes() {
  const { perfil } = useAuth();
  const [comprobantes, setComprobantes] = useState<ComprobanteReal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ultimo, setUltimo] = useState<ComprobanteReal | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [clienteNombre, setClienteNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CC");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [servicio, setServicio] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let activo = true;
    async function cargar() {
      if (!perfil?.organizationId) {
        setCargando(false);
        return;
      }
      const { data } = await supabase
        .from("comprobantes")
        .select("id, cliente_nombre, servicio_o_producto, monto_pagado, estado_envio_puntos, created_at")
        .eq("taller_id", perfil.organizationId)
        .order("created_at", { ascending: false });
      if (!activo) return;
      setComprobantes((data as ComprobanteReal[]) ?? []);
      setCargando(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [perfil?.organizationId]);

  function limpiar() {
    setClienteNombre("");
    setNumeroDocumento("");
    setServicio("");
    setMonto("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!perfil?.organizationId) return;

    const montoNum = Number(monto.replace(/\D/g, ""));
    if (!clienteNombre.trim()) return setError("Escribí el nombre del cliente.");
    if (!numeroDocumento.trim()) return setError("El número de documento es obligatorio — es la llave que usa Puntos Neggo para saber a quién darle los puntos.");
    if (!servicio.trim()) return setError("Contanos qué servicio o producto pagó.");
    if (!montoNum || montoNum <= 0) return setError("El monto pagado tiene que ser mayor a cero.");
    if (!fecha) return setError("Elegí la fecha del pago.");

    setEnviando(true);
    const { data, error: err } = await supabase
      .from("comprobantes")
      .insert({
        taller_id: perfil.organizationId,
        cliente_tipo_documento: tipoDocumento,
        cliente_numero_documento: numeroDocumento.trim(),
        cliente_nombre: clienteNombre.trim(),
        servicio_o_producto: servicio.trim(),
        monto_pagado: montoNum,
        fecha,
      })
      .select("id, cliente_nombre, servicio_o_producto, monto_pagado, estado_envio_puntos, created_at")
      .single();
    setEnviando(false);
    if (err || !data) return setError("No se pudo guardar el comprobante. Intentá de nuevo.");

    setUltimo(data as ComprobanteReal);
    setComprobantes((prev) => [data as ComprobanteReal, ...prev]);
    limpiar();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500/10">
            <Receipt className="h-3.5 w-3.5 text-signal-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">Comprobantes de venta</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Generá el comprobante apenas el cliente pague — antes de que se vaya del taller. Queda una prueba que podés
          mostrarle si algo no cuadra.
        </p>
      </div>

      <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-800">
          El documento del cliente es obligatorio: es la llave que va a usar el sistema de puntos (Puntos Neggo) para
          saber a quién abonarle apenas esa integración esté conectada.
        </p>
      </div>

      {perfil?.organizationId && <CampanaPuntosPanel organizationId={perfil.organizationId} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Nombre del cliente" icon={User} value={clienteNombre} onChange={setClienteNombre} placeholder="Juan Pérez" accent="signal" required />
            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                Tipo de documento <span className="text-signal-600">*</span>
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="h-[46px] w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm font-medium text-foreground shadow-sm focus:border-signal-500 focus:outline-none focus:ring-4 focus:ring-signal-500/15"
              >
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.value} — {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TextField label="Número de documento" icon={IdCard} value={numeroDocumento} onChange={setNumeroDocumento} placeholder="1017234567" accent="signal" required />
          <TextField label="Servicio o producto" icon={Wrench} value={servicio} onChange={setServicio} placeholder="Ej: Cambio de aceite y filtros" accent="signal" required />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Monto pagado (en dinero real)"
              icon={Banknote}
              value={monto}
              onChange={(v) => setMonto(v.replace(/[^\d]/g, ""))}
              placeholder="45000"
              accent="signal"
              required
              helpText="Solo lo que el cliente pagó en efectivo/transferencia — nunca lo que cubrió con puntos."
            />
            <TextField label="Fecha del pago" icon={Calendar} type="date" value={fecha} onChange={setFecha} accent="signal" required />
          </div>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <Button as="button" type="submit" variant="signal" size="md" icon={Receipt} className="w-full justify-center" disabled={enviando}>
            {enviando ? "Guardando..." : "Generar comprobante"}
          </Button>
        </form>

        {/* Recibo del último comprobante generado */}
        <div className="space-y-4">
          {ultimo ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wide">Mostrale esto al cliente antes de que se vaya</p>
              </div>
              <p className="mt-3 font-mono text-2xl font-black tracking-widest text-foreground">{ultimo.id.slice(0, 8)}</p>
              <div className="mt-3 space-y-1.5 text-xs text-foreground">
                <p><span className="text-muted-foreground">Cliente:</span> {ultimo.cliente_nombre}</p>
                <p><span className="text-muted-foreground">Servicio/producto:</span> {ultimo.servicio_o_producto}</p>
                <p><span className="text-muted-foreground">Monto pagado:</span> {formatCOP(ultimo.monto_pagado)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Clock className="h-3.5 w-3.5 text-amber-600" /> Puntos
                </span>
                <span className="text-[11px] font-bold text-amber-700">Pendiente — se activa con Puntos Neggo</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-10 text-center">
              <Receipt className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Generá tu primer comprobante para verlo acá.</p>
            </div>
          )}

          {/* Historial */}
          <div>
            <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Comprobantes generados
            </h2>
            {cargando ? (
              <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando...
              </div>
            ) : (
              <div className="space-y-2">
                {comprobantes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        <span className="font-mono text-signal-600">{c.id.slice(0, 8)}</span> · {c.cliente_nombre}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {c.servicio_o_producto} · {formatFechaHora(c.created_at)}
                      </p>
                    </div>
                    <span className={cn("shrink-0 text-[10px] font-black uppercase", c.estado_envio_puntos === "enviado" ? "text-emerald-600" : "text-amber-600")}>
                      {c.estado_envio_puntos === "enviado" ? "Puntos enviados" : "Pendiente"}
                    </span>
                  </div>
                ))}
                {comprobantes.length === 0 && <p className="text-xs text-muted-foreground">Todavía no generaste comprobantes.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
