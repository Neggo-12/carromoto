import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  ShieldCheck,
  Check,
  ArrowRight,
  Search,
  Store,
  Car,
  Bike,
  Zap,
  Battery,
  MapPin,
  Loader2,
  MessageCircle,
  CheckCircle2,
  KeyRound,
  AlertTriangle,
  ExternalLink,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { CIUDADES, SERVICIOS_CARRO, SERVICIOS_MOTO } from "@/lib/data";

/**
 * Home de CarroMoto / Taller Aval — reescrita completa siguiendo la Orden
 * Maestra de Rediseño del 20/08/2026: textos, colores, tamaños y orden de
 * sección son los que pidió el negocio de forma literal, no una
 * interpretación de UX propia. Paleta cerrada a los tokens oficiales de la
 * orden (#111827, #0B1120, #F8FAFC, #F3F4F6, #E5E7EB, #6B7280, #16A34A,
 * #ECFDF3, #166534, blanco) — nada de azul/naranja de marca ni degradados,
 * a propósito distinto del resto del sitio (Talleres/Clientes/portales),
 * que no está en el alcance de esta orden y mantiene su paleta.
 *
 * El buscador y las tarjetas de taller son reales — llaman a
 * buscar_comercios_verificados() (RPC pública, ver migraciones
 * buscar_comercios_verificados_*), no hay datos inventados. "Contactar
 * taller" reutiliza registrar_contacto_comercio(), que exige sesión de
 * Cliente (auth.uid() en el server) — si no hay sesión, se pide iniciar
 * sesión o registrarse en vez de fallar en silencio.
 *
 * Nota de alcance: la "página de detalle del taller" de la orden (sección
 * 20-23, con fotos/reseñas/horarios) todavía no existe como ruta propia —
 * acá "Ver taller" abre un panel con los campos reales que sí tenemos
 * (nombre, sello, descripción, especialidades, ubicación, contacto). Fotos,
 * reseñas y horarios público quedan para cuando se construya esa página
 * dedicada, para no inventar contenido que la base de datos no tiene hoy.
 */

// ─────────────────────────────────────────────────────────────────────────
// Datos reales de un taller verificado — fila que devuelve
// buscar_comercios_verificados() (ver supabase/migrations/
// buscar_comercios_verificados_servicios.sql).
// ─────────────────────────────────────────────────────────────────────────
interface TallerVerificado {
  id: string;
  name: string;
  ciudad: string | null;
  tipo_negocio: "taller" | "almacen";
  tipo_vehiculo: "carro" | "moto" | "ambos" | null;
  especialista_electricos: boolean;
  descripcion_negocio: string | null;
  direccion: string | null;
  barrio: string | null;
  servicios: string[];
  afiliado_desde: string;
  codigo_publico: string;
}

const SERVICIOS_TODOS = [...SERVICIOS_CARRO, ...SERVICIOS_MOTO];
function servicioLabel(value: string): string {
  return SERVICIOS_TODOS.find((s) => s.value === value)?.label ?? value;
}
function tipoVehiculoLabel(t: TallerVerificado["tipo_vehiculo"]): string | null {
  if (t === "carro") return "Carro";
  if (t === "moto") return "Moto";
  if (t === "ambos") return "Carro y moto";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Botones — sin degradado, sin sombra fuerte, paleta cerrada a la orden.
// ─────────────────────────────────────────────────────────────────────────
function CtaPrimario({
  href,
  onClick,
  children,
  className = "",
  invertido = false,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  invertido?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-[28px] text-[16px] font-semibold transition-colors ${
        invertido
          ? "bg-white text-[#111827] hover:bg-[#F3F4F6]"
          : "bg-[#111827] text-white hover:bg-[#1F2937]"
      } ${className}`}
    >
      {children}
    </a>
  );
}

function CtaGhost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-[52px] items-center gap-1.5 text-[16px] font-semibold text-[#111827] transition-opacity hover:opacity-70"
    >
      {children}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tarjeta de taller — sección 17-19 de la orden.
// ─────────────────────────────────────────────────────────────────────────
function TallerCard({ taller, onVer }: { taller: TallerVerificado; onVer: (t: TallerVerificado) => void }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white">
      <div className="relative flex aspect-[16/10] items-center justify-center bg-[#F8FAFC]">
        <Store className="h-9 w-9 text-[#9CA3AF]" strokeWidth={1.5} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-bold text-[#166534]">
          <Check className="h-3 w-3" strokeWidth={2.5} /> Sello de Confianza
        </div>
        <h3 className="text-[20px] font-bold leading-snug text-[#111827]">{taller.name}</h3>
        {taller.ciudad && (
          <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[#6B7280]">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {taller.barrio ? `${taller.barrio}, ` : ""}
            {taller.ciudad}
          </p>
        )}
        <p className="mt-1 text-[14px] text-[#6B7280]">
          {taller.tipo_negocio === "almacen" ? "Repuestos" : "Taller"}
          {tipoVehiculoLabel(taller.tipo_vehiculo) ? ` · ${tipoVehiculoLabel(taller.tipo_vehiculo)}` : ""}
          {taller.especialista_electricos ? " · Especialista en eléctricos e híbridos" : ""}
        </p>

        {taller.servicios.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {taller.servicios.slice(0, 4).map((s) => (
              <span key={s} className="rounded-[8px] bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-medium text-[#374151]">
                {servicioLabel(s)}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onVer(taller)}
          className="mt-5 flex h-[44px] w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#111827] text-[14px] font-semibold text-white transition-colors hover:bg-[#1F2937]"
        >
          Ver taller
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Detalle del taller — versión condensada en panel (ver nota de alcance
// arriba). Orden de campos igual al de la sección 22 hasta donde hay datos
// reales: Nombre, Sello, Descripción, Especialidades, Tipo de vehículo,
// Servicios, Ubicación, Contacto.
// ─────────────────────────────────────────────────────────────────────────
function TallerDetalle({ taller, onClose }: { taller: TallerVerificado; onClose: () => void }) {
  const { session, perfil } = useAuth();
  const [descripcion, setDescripcion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "done">("idle");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const puedeContactar = perfil?.rol === "Cliente";
  const canSubmit = descripcion.trim() !== "" && telefono.trim() !== "" && estado === "idle";

  async function enviar() {
    if (!canSubmit) return;
    setEstado("loading");
    setError("");
    const { data, error: err } = await supabase.rpc("registrar_contacto_comercio", {
      p_comercio_id: taller.id,
      p_descripcion: descripcion.trim(),
      p_nombre: perfil?.nombre ?? "Cliente",
      p_telefono: telefono.trim(),
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
  }

  const direccionCompleta = [taller.direccion, taller.barrio, taller.ciudad].filter(Boolean).join(", ");
  const mapsHref = direccionCompleta
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-[#111827]/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[#E5E7EB] bg-white p-7 shadow-[0_12px_32px_rgba(17,24,39,0.08)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-bold text-[#166534]">
          <Check className="h-3 w-3" strokeWidth={2.5} /> Sello de Confianza
        </div>
        <h2 className="mt-3 pr-6 text-[24px] font-bold leading-snug text-[#111827]">{taller.name}</h2>

        {taller.descripcion_negocio && (
          <p className="mt-2 text-[14px] leading-relaxed text-[#4B5563]">{taller.descripcion_negocio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {tipoVehiculoLabel(taller.tipo_vehiculo) && (
            <span className="rounded-[8px] bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-medium text-[#374151]">
              {tipoVehiculoLabel(taller.tipo_vehiculo)}
            </span>
          )}
          {taller.especialista_electricos && (
            <span className="rounded-[8px] bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-medium text-[#374151]">
              Especialista en eléctricos e híbridos
            </span>
          )}
          {taller.servicios.map((s) => (
            <span key={s} className="rounded-[8px] bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-medium text-[#374151]">
              {servicioLabel(s)}
            </span>
          ))}
        </div>

        {direccionCompleta && (
          <div className="mt-5 flex items-start justify-between gap-3 rounded-[12px] border border-[#E5E7EB] p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
              <p className="text-[14px] text-[#374151]">{direccionCompleta}</p>
            </div>
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#111827] hover:opacity-70"
              >
                Cómo llegar <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-[#E5E7EB] pt-6">
          {!session || !puedeContactar ? (
            <div className="rounded-[12px] bg-[#F8FAFC] p-4 text-center">
              <p className="text-[14px] text-[#374151]">
                {session ? "Este contacto es para cuentas de cliente." : "Iniciá sesión o creá tu cuenta para contactar a este taller."}
              </p>
              {!session && (
                <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                  <Link
                    to="/login/cliente"
                    className="inline-flex h-[40px] items-center justify-center rounded-[10px] bg-[#111827] px-4 text-[13px] font-semibold text-white"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/registro/cliente"
                    className="inline-flex h-[40px] items-center justify-center rounded-[10px] border border-[#D1D5DB] px-4 text-[13px] font-semibold text-[#111827]"
                  >
                    Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          ) : estado === "done" && codigo ? (
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF3]">
                <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />
              </div>
              <p className="text-[14px] font-semibold text-[#111827]">Solicitud enviada</p>
              <p className="max-w-xs text-[13px] text-[#6B7280]">{taller.name} recibió tus datos y te va a contactar.</p>
              <div className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                  <KeyRound className="h-3 w-3" /> Tu código de verificación
                </p>
                <p className="mt-1 font-mono text-2xl font-black tracking-widest text-[#111827]">{codigo}</p>
              </div>
              <div className="flex w-full gap-2 rounded-[12px] border border-[#E5E7EB] bg-white p-3 text-left">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
                <p className="text-[12px] leading-relaxed text-[#374151]">
                  Cuando {taller.name} te escriba, debe decirte este código. Si no coincide, o te piden plata o datos
                  antes, no sigas.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-[44px] w-full rounded-[10px] bg-[#111827] text-[14px] font-semibold text-white"
              >
                Entendido
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#111827]">Contactar taller</p>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="¿Qué necesitas?"
                rows={3}
                maxLength={500}
                className="w-full rounded-[12px] border border-[#D1D5DB] px-3.5 py-3 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#111827] focus:outline-none"
              />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Tu teléfono"
                className="h-[48px] w-full rounded-[12px] border border-[#D1D5DB] px-3.5 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#111827] focus:outline-none"
              />
              {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
              <button
                type="button"
                disabled={!canSubmit}
                onClick={enviar}
                className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#111827] text-[14px] font-semibold text-white disabled:opacity-40"
              >
                {estado === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Enviar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────────────────
export default function LandingHub() {
  const [resultados, setResultados] = useState<TallerVerificado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscado, setBuscado] = useState(false);
  const [tallerVer, setTallerVer] = useState<TallerVerificado | null>(null);

  const [fVehiculo, setFVehiculo] = useState("");
  const [fServicio, setFServicio] = useState("");
  const [fCiudad, setFCiudad] = useState("");

  const buscar = useCallback(async (overrides?: { vehiculo?: string; motorizacion?: string }) => {
    setCargando(true);
    setBuscado(true);
    const { data, error } = await supabase.rpc("buscar_comercios_verificados", {
      p_termino: "",
      p_tipo_vehiculo: (overrides?.vehiculo ?? fVehiculo) || null,
      p_ciudad: fCiudad || null,
      p_servicio: fServicio || null,
      p_motorizacion: overrides?.motorizacion || null,
    });
    setResultados(!error && data ? (data as TallerVerificado[]) : []);
    setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fVehiculo, fServicio, fCiudad]);

  // Carga inicial sin filtros — alimenta la vitrina del Hero y la sección
  // de Talleres antes de que alguien busque nada.
  useEffect(() => {
    void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filtrarPorVehiculo(v: "carro" | "moto") {
    setFVehiculo(v);
    void buscar({ vehiculo: v });
  }
  function filtrarPorMotorizacion(m: "electrico" | "hibrido") {
    void buscar({ motorizacion: m });
  }

  const tallerDestacado = resultados[0] ?? null;

  const serviciosDisponibles = useMemo(() => {
    if (fVehiculo === "carro") return SERVICIOS_CARRO;
    if (fVehiculo === "moto") return SERVICIOS_MOTO;
    return SERVICIOS_TODOS;
  }, [fVehiculo]);

  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      {/* ═══════════════════════════════════════════════════════
          HEADER — sección 8
         ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 h-[72px] border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F3F4F6]">
              <Wrench className="h-4.5 w-4.5 text-[#111827]" />
            </div>
            <span className="text-[16px] font-bold tracking-tight text-[#111827]">Taller Aval</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <Link to="/" className="text-[14px] font-medium text-[#374151] hover:text-[#111827]">
              Inicio
            </Link>
            <a href="#buscador" className="text-[14px] font-medium text-[#374151] hover:text-[#111827]">
              Encontrar taller
            </a>
            <a href="#como-funciona" className="text-[14px] font-medium text-[#374151] hover:text-[#111827]">
              Cómo funciona
            </a>
            <Link to="/talleres" className="text-[14px] font-medium text-[#374151] hover:text-[#111827]">
              Para talleres
            </Link>
          </nav>

          <a
            href="#buscador"
            className="inline-flex h-[40px] items-center rounded-[10px] bg-[#111827] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1F2937] sm:h-[44px] sm:px-5 sm:text-[14px]"
          >
            Encontrar un taller
          </a>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO — secciones 3-7
         ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F8FAFC, #FFFFFF)" }}
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[80vh] lg:flex-row lg:items-center lg:gap-10 lg:py-24">
          {/* Columna izquierda */}
          <div className="w-full lg:w-1/2">
            <h1
              className="max-w-[650px] text-[38px] font-bold leading-[1.08] text-[#111827] sm:text-[48px] sm:leading-[1.08] lg:text-[64px] lg:leading-[1.05] lg:tracking-[-2.5px]"
            >
              Tu vehículo merece algo más que un taller al azar.
            </h1>
            <p className="mt-6 max-w-[550px] text-[18px] font-normal leading-[1.55] text-[#4B5563] sm:text-[20px]">
              Encuentra talleres verificados y elige con información clara antes de entregar tu carro o moto.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <CtaPrimario href="#buscador">Encontrar un taller</CtaPrimario>
              <CtaGhost href="#como-funciona">Cómo funciona</CtaGhost>
            </div>

            <p className="mt-[18px] text-[14px] text-[#6B7280]">
              Sin llamadas no solicitadas · Sin compromiso · Gratis para buscar
            </p>
          </div>

          {/* Columna derecha — composición de tarjetas */}
          <div className="relative w-full lg:w-1/2">
            <div className="relative mx-auto max-w-[380px] pb-10 pt-6">
              {/* Tarjetas secundarias, decorativas, desplazadas detrás */}
              <div className="absolute -right-3 top-10 h-[220px] w-[88%] rotate-[3deg] rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]" />
              <div className="absolute -left-3 top-4 h-[220px] w-[88%] -rotate-[2deg] rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]" />

              {/* Tarjeta principal — real cuando hay datos */}
              <div className="relative rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]">
                <div className="flex aspect-[16/10] items-center justify-center rounded-t-[20px] bg-[#F8FAFC]">
                  <Store className="h-10 w-10 text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <div className="p-5">
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-bold text-[#166534]">
                    <Check className="h-3 w-3" strokeWidth={2.5} /> Sello de Confianza
                  </div>
                  {tallerDestacado ? (
                    <>
                      <h3 className="text-[18px] font-bold text-[#111827]">{tallerDestacado.name}</h3>
                      {tallerDestacado.ciudad && (
                        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#6B7280]">
                          <MapPin className="h-3.5 w-3.5" /> {tallerDestacado.ciudad}
                        </p>
                      )}
                      <p className="mt-1 text-[13px] text-[#6B7280]">
                        {tipoVehiculoLabel(tallerDestacado.tipo_vehiculo) ?? "Taller verificado"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setTallerVer(tallerDestacado)}
                        className="mt-4 flex h-[40px] w-full items-center justify-center rounded-[10px] bg-[#111827] text-[13px] font-semibold text-white"
                      >
                        Ver taller
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-[18px] font-bold text-[#111827]">Talleres verificados</h3>
                      <p className="mt-1 text-[13px] text-[#6B7280]">Cargando opciones cerca tuyo…</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROBLEMA — sección 9
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[32px] font-bold leading-tight text-[#111827] sm:text-[42px]">
              Elegir un taller no debería ser cuestión de suerte.
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-[#4B5563] sm:text-[18px]">
              Cuando tu vehículo necesita atención, muchas veces la parte más difícil no es saber qué reparar. Es
              saber en quién confiar.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {["¿Será realmente bueno?", "¿Tendrá experiencia con mi vehículo?", "¿Estoy tomando una buena decisión?"].map((frase) => (
              <div key={frase} className="rounded-[16px] border border-[#E5E7EB] bg-[#F8FAFC] p-6 text-center">
                <p className="text-[15px] font-medium leading-relaxed text-[#374151]">{frase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROMESA — sección 10
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#111827]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 text-center sm:px-8 sm:py-24">
          <h2 className="mx-auto max-w-3xl text-[28px] font-bold leading-tight text-white sm:text-[42px]">
            No tienes que saber de mecánica para elegir bien dónde llevar tu vehículo.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
            Taller Aval te ayuda a descubrir talleres y conocer mejor tus opciones antes de tomar una decisión.
          </p>
          <div className="mt-9">
            <CtaPrimario href="#buscador" invertido>
              Encontrar un taller
            </CtaPrimario>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CÓMO FUNCIONA — sección 11
         ═══════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-[28px] font-bold text-[#111827] sm:text-[42px]">Así de fácil puedes encontrar un taller.</h2>
            <p className="mt-3 text-[16px] text-[#6B7280] sm:text-[18px]">
              Te ayudamos a pasar de la incertidumbre a una decisión más clara.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Cuéntanos qué vehículo tienes", d: "Selecciona si tienes carro, moto, híbrido o eléctrico." },
              { n: "02", t: "Encuentra talleres adecuados", d: "Explora talleres según tu ubicación, necesidades y tipo de vehículo." },
              { n: "03", t: "Conoce tus opciones", d: "Revisa información importante del taller antes de tomar una decisión." },
              { n: "04", t: "Elige con mayor tranquilidad", d: "Contacta o visita el taller que consideres adecuado para tu vehículo." },
            ].map((paso) => (
              <div key={paso.n}>
                <div className="text-[40px] font-extrabold leading-none text-[#D1D5DB]">{paso.n}</div>
                <h4 className="mt-3 text-[16px] font-bold text-[#111827]">{paso.t}</h4>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{paso.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SELLO DE CONFIANZA — sección 12-13
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-[28px] font-bold leading-tight text-[#111827] sm:text-[42px]">
                Talleres que pasan por nuestro proceso de verificación.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#4B5563] sm:text-[18px]">
                Nuestro Sello de Confianza identifica los talleres que forman parte de nuestra plataforma bajo
                nuestros criterios de validación.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[320px] rounded-[18px] border border-[#D1D5DB] bg-white p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF3]">
                  <ShieldCheck className="h-8 w-8 text-[#16A34A]" strokeWidth={1.75} />
                </div>
                <p className="mt-5 text-[18px] font-bold tracking-tight text-[#111827]">Sello de Confianza</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                  Talleres que forman parte de nuestra plataforma bajo nuestros criterios de validación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TIPOS DE VEHÍCULO — sección 14
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-[28px] font-bold text-[#111827] sm:text-[42px]">Cada vehículo necesita el taller adecuado.</h2>
            <p className="mt-3 text-[16px] text-[#6B7280] sm:text-[18px]">Encuentra opciones para el vehículo que tienes.</p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Carros", icon: Car, onClick: () => filtrarPorVehiculo("carro") },
              { label: "Motos", icon: Bike, onClick: () => filtrarPorVehiculo("moto") },
              { label: "Híbridos", icon: Zap, onClick: () => filtrarPorMotorizacion("hibrido") },
              { label: "Eléctricos", icon: Battery, onClick: () => filtrarPorMotorizacion("electrico") },
            ].map((cat) => (
              <a
                key={cat.label}
                href="#buscador"
                onClick={cat.onClick}
                className="flex flex-col items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-8 text-center transition-transform duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(17,24,39,0.06)]"
              >
                <cat.icon className="h-7 w-7 text-[#111827]" strokeWidth={1.75} />
                <span className="text-[14px] font-bold text-[#111827]">{cat.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BUSCADOR — sección 15-16
         ═══════════════════════════════════════════════════════ */}
      <section id="buscador" className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-[28px] font-bold text-[#111827] sm:text-[42px]">Encuentra opciones cerca de ti.</h2>
            <p className="mt-3 text-[16px] text-[#6B7280] sm:text-[18px]">
              Explora talleres y descubre cuál puede ser una buena opción para lo que necesita tu vehículo.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-[18px] border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-[#374151]">¿Qué vehículo tienes?</label>
                <select
                  value={fVehiculo}
                  onChange={(e) => setFVehiculo(e.target.value)}
                  className="h-[52px] w-full rounded-[12px] border border-[#D1D5DB] bg-white px-3.5 text-[14px] text-[#111827] focus:border-[#111827] focus:outline-none"
                >
                  <option value="">Cualquiera</option>
                  <option value="carro">Carro</option>
                  <option value="moto">Moto</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-[#374151]">¿Qué necesitas?</label>
                <select
                  value={fServicio}
                  onChange={(e) => setFServicio(e.target.value)}
                  className="h-[52px] w-full rounded-[12px] border border-[#D1D5DB] bg-white px-3.5 text-[14px] text-[#111827] focus:border-[#111827] focus:outline-none"
                >
                  <option value="">Cualquier servicio</option>
                  {serviciosDisponibles.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-[#374151]">¿Dónde estás?</label>
                <select
                  value={fCiudad}
                  onChange={(e) => setFCiudad(e.target.value)}
                  className="h-[52px] w-full rounded-[12px] border border-[#D1D5DB] bg-white px-3.5 text-[14px] text-[#111827] focus:border-[#111827] focus:outline-none"
                >
                  <option value="">Toda Colombia</option>
                  {CIUDADES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => buscar()}
              disabled={cargando}
              className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#111827] text-[16px] font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:opacity-60"
            >
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar talleres
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TALLERES — sección 17-19
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
            </div>
          ) : resultados.length === 0 ? (
            <div className="mx-auto max-w-md rounded-[16px] border border-[#E5E7EB] bg-[#F8FAFC] p-10 text-center">
              <p className="text-[15px] font-semibold text-[#111827]">
                {buscado ? "No encontramos talleres con esos filtros." : "Todavía no hay talleres verificados para mostrar."}
              </p>
              <p className="mt-1.5 text-[13px] text-[#6B7280]">
                Estamos sumando talleres verificados — volvé a intentarlo pronto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((t) => (
                <TallerCard key={t.id} taller={t} onVer={setTallerVer} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRUEBA SOCIAL — sección 24
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 text-center sm:px-8 sm:py-24">
          <h2 className="text-[28px] font-bold text-[#111827] sm:text-[36px]">Lo que otros conductores opinan</h2>
          <div className="mx-auto mt-8 max-w-md rounded-[16px] border border-dashed border-[#D1D5DB] bg-white p-8">
            <p className="text-[14px] leading-relaxed text-[#6B7280]">
              Todavía no tenemos suficientes reseñas para mostrar acá. A medida que más clientes visiten talleres
              verificados, sus opiniones van a aparecer en este espacio.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA FINAL — sección 25
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#111827]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 text-center sm:px-8 sm:py-24">
          <h2 className="mx-auto max-w-2xl text-[28px] font-bold leading-tight text-white sm:text-[42px]">
            Encuentra un taller con el que puedas sentirte tranquilo.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
            Empieza a buscar y conoce tus opciones antes de tomar una decisión.
          </p>
          <div className="mt-9">
            <CtaPrimario href="#buscador" invertido>
              Encontrar un taller
            </CtaPrimario>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER — sección 26
         ═══════════════════════════════════════════════════════ */}
      <footer className="bg-[#0B1120]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-white" />
                <span className="text-[15px] font-bold text-white">CarroMoto</span>
              </div>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link to="/" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Inicio
                  </Link>
                </li>
                <li>
                  <a href="#buscador" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Encontrar taller
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Cómo funciona
                  </a>
                </li>
                <li>
                  <Link to="/talleres" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Para talleres
                  </Link>
                </li>
                <li>
                  <Link to="/registro/cliente" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Registrarme
                  </Link>
                </li>
                <li>
                  <Link to="/login/cliente" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Ingresar
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[15px] font-bold text-white">Información para talleres</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link to="/talleres" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Para talleres
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[15px] font-bold text-white">Ayuda</p>
              <ul className="mt-4 space-y-2.5">
                <li className="text-[13px] text-[#9CA3AF]">Preguntas frecuentes</li>
                <li className="text-[13px] text-[#9CA3AF]">Contacto</li>
                <li className="text-[13px] text-[#9CA3AF]">Términos</li>
                <li className="text-[13px] text-[#9CA3AF]">Privacidad</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-center">
            <p className="text-[11px] text-[#9CA3AF]/60">&copy; 2026 CarroMoto / Taller Aval. Proyecto en construcción.</p>
          </div>
        </div>
      </footer>

      {tallerVer && <TallerDetalle taller={tallerVer} onClose={() => setTallerVer(null)} />}
    </div>
  );
}
