import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench,
  ShieldCheck,
  Check,
  Search,
  Car,
  Bike,
  Zap,
  Battery,
  MapPin,
  Loader2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { geocodificarDireccion, guardarBusquedaPendiente, type Coordenadas } from "@/lib/geocoding";

/**
 * Home de CarroMoto / Taller Aval — segunda iteración del rediseño
 * (20/08/2026). Cambio central respecto a la primera versión: la Home
 * pública YA NO carga ni muestra datos reales de talleres — ni en el Hero,
 * ni en resultados de búsqueda. "No basta con ocultar los talleres con
 * CSS": literalmente no se llama a ningún RPC que devuelva filas de
 * talleres desde esta página sin sesión.
 *
 * El buscador público solo pide una dirección, la geocodifica (Nominatim,
 * ver src/lib/geocoding.ts) y llama a contar_talleres_cercanos() — un RPC
 * que devuelve un número, nada de nombres/ubicaciones/fotos. Para ver la
 * lista real hace falta cuenta: se guarda la búsqueda pendiente
 * (sessionStorage) y se manda a registro/login; ClienteBuscarTalleres.tsx
 * la recoge del otro lado con buscar_talleres_cercanos() (sí exige sesión,
 * autoprotegido en el propio RPC).
 *
 * Paleta cerrada (refinada en esta iteración): #111827, #0B1120, #FFFFFF,
 * #F8FAFC, #F3F4F6, #E4E7EC, #667085, #16A34A, #ECFDF3, #166534 — nada de
 * azul/naranja de marca ni degradados, a propósito distinto del resto del
 * sitio (Talleres/Clientes/portales), que no está en el alcance de esta
 * orden y mantiene su paleta.
 */

// ─────────────────────────────────────────────────────────────────────────
// Botones — sin degradado, sin sombra fuerte, paleta cerrada a la orden.
// Admiten href (ancla/ruta) u onClick sin href (se renderizan como button).
// ─────────────────────────────────────────────────────────────────────────
function CtaPrimario({
  href,
  onClick,
  children,
  className = "",
  invertido = false,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  invertido?: boolean;
}) {
  const clases = `inline-flex h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-[28px] text-[16px] font-semibold transition-colors ${
    invertido ? "bg-white text-[#111827] hover:bg-[#F3F4F6]" : "bg-[#111827] text-white hover:bg-[#1F2937]"
  } ${className}`;
  if (href) {
    return (
      <a href={href} onClick={onClick} className={clases}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={clases}>
      {children}
    </button>
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
// Carrusel de contenido útil — reemplaza la sección de resultados de
// talleres. Contenido educativo genérico, no datos de negocio.
// ─────────────────────────────────────────────────────────────────────────
const SLIDES_CARRUSEL = [
  {
    titulo: "¿Qué deberías revisar antes de elegir un taller?",
    cuerpo: "Especialidad, experiencia, tipo de vehículo atendido, ubicación y la información disponible sobre el taller.",
  },
  {
    titulo: "¿Tu vehículo es híbrido o eléctrico?",
    cuerpo: "No todos los talleres trabajan con el mismo tipo de vehículo. Conoce qué especialidades necesitas antes de elegir.",
  },
  {
    titulo: "Elegir bien empieza por tener información clara.",
    cuerpo: "Conocer un taller antes de llevar tu vehículo te ayuda a tomar una decisión con mayor tranquilidad.",
  },
  {
    titulo: "No necesitas saber de mecánica para empezar.",
    cuerpo: "Tú conoces tu vehículo. Nosotros te ayudamos a encontrar información para elegir dónde llevarlo.",
  },
];

function CarruselContenidoUtil() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % SLIDES_CARRUSEL.length), 6000);
    return () => clearInterval(t);
  }, [pausado]);

  function anterior() {
    setIndice((i) => (i - 1 + SLIDES_CARRUSEL.length) % SLIDES_CARRUSEL.length);
  }
  function siguiente() {
    setIndice((i) => (i + 1) % SLIDES_CARRUSEL.length);
  }
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      anterior();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      siguiente();
    }
  }

  const slide = SLIDES_CARRUSEL[indice];

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Contenido útil para elegir taller"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="relative mx-auto flex h-[330px] w-full max-w-[1100px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#111827] p-8 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#111827]/20 sm:h-[380px] sm:p-12"
    >
      <div className="max-w-xl">
        <p className="text-[12px] font-bold uppercase tracking-wide text-white/50">Contenido útil</p>
        <h3 className="mt-3 text-[24px] font-bold leading-snug sm:text-[32px]">{slide.titulo}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-white/70 sm:text-[16px]">{slide.cuerpo}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {SLIDES_CARRUSEL.map((s, i) => (
            <button
              key={s.titulo}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir al slide ${i + 1} de ${SLIDES_CARRUSEL.length}`}
              aria-current={i === indice}
              className={`h-1.5 rounded-full transition-all ${i === indice ? "w-6 bg-white" : "w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={anterior}
            aria-label="Slide anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Slide siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Buscador por dirección — geocodifica en el navegador, cuenta talleres
// cercanos (RPC anon-safe), y gatea la lista real detrás de cuenta.
// ─────────────────────────────────────────────────────────────────────────
type EstadoBusqueda = "idle" | "geocodificando" | "contando" | "resultado" | "sin-resultados" | "error";

function BuscadorDireccion() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState<EstadoBusqueda>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [coords, setCoords] = useState<Coordenadas | { lat: number; lng: number; etiqueta: string } | null>(null);
  const [conteo, setConteo] = useState(0);
  const [radioUsado, setRadioUsado] = useState<number | null>(null);
  const [mostrarGate, setMostrarGate] = useState(false);
  const [usandoGps, setUsandoGps] = useState(false);

  async function ejecutarConteo(c: { lat: number; lng: number; etiqueta: string }) {
    setEstado("contando");
    setErrorMsg("");
    setCoords(c);
    for (const radio of [10, 20, 30]) {
      const { data, error } = await supabase.rpc("contar_talleres_cercanos", {
        p_lat: c.lat,
        p_lng: c.lng,
        p_radio_km: radio,
      });
      if (error) {
        setEstado("error");
        setErrorMsg("No pudimos completar la búsqueda. Intentá de nuevo en un momento.");
        return;
      }
      const n = (data as number | null) ?? 0;
      if (n > 0) {
        setConteo(n);
        setRadioUsado(radio);
        setEstado("resultado");
        return;
      }
    }
    setConteo(0);
    setEstado("sin-resultados");
  }

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!direccion.trim() || estado === "geocodificando" || estado === "contando") return;
    setEstado("geocodificando");
    setErrorMsg("");
    const encontrado = await geocodificarDireccion(direccion);
    if (!encontrado) {
      setEstado("error");
      setErrorMsg("No pudimos encontrar esa dirección. Verificá que esté completa (calle, número y ciudad) e intentá de nuevo.");
      return;
    }
    await ejecutarConteo(encontrado);
  }

  function handleUsarUbicacion() {
    if (!("geolocation" in navigator)) {
      setEstado("error");
      setErrorMsg("Tu navegador no permite compartir tu ubicación. Escribí tu dirección arriba.");
      return;
    }
    setUsandoGps(true);
    setEstado("geocodificando");
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setDireccion("Tu ubicación actual");
        await ejecutarConteo({ lat: pos.coords.latitude, lng: pos.coords.longitude, etiqueta: "tu ubicación actual" });
        setUsandoGps(false);
      },
      () => {
        setEstado("error");
        setErrorMsg("No pudimos acceder a tu ubicación. Escribí tu dirección arriba.");
        setUsandoGps(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function handleVerTalleres() {
    if (!coords) return;
    guardarBusquedaPendiente({ direccion: direccion.trim() || coords.etiqueta, lat: coords.lat, lng: coords.lng });
    if (session) {
      navigate("/portal/cliente/buscar-talleres");
      return;
    }
    setMostrarGate(true);
  }

  function handleCrearCuentaSinResultados() {
    if (!coords) return;
    guardarBusquedaPendiente({ direccion: direccion.trim() || coords.etiqueta, lat: coords.lat, lng: coords.lng });
    navigate("/registro/cliente");
  }

  const cargando = estado === "geocodificando" || estado === "contando";

  return (
    <div className="mx-auto mt-10 max-w-3xl rounded-[18px] border border-[#E4E7EC] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)] sm:p-7">
      <form onSubmit={handleBuscar} className="space-y-3">
        <div>
          <label htmlFor="buscador-direccion" className="mb-1.5 block text-[12px] font-bold text-[#374151]">
            ¿Dónde necesitas encontrar un taller?
          </label>
          <div className="flex h-[54px] items-center gap-2 rounded-[12px] border border-[#D1D5DB] bg-white px-3.5 transition-colors focus-within:border-[#111827]">
            <input
              id="buscador-direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Escribe una dirección"
              className="h-full flex-1 bg-transparent text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
            />
            <MapPin className="h-4.5 w-4.5 shrink-0 text-[#667085]" />
          </div>
          <p className="mt-1.5 text-[12px] text-[#667085]">Ejemplo: Calle 100 # 15-20, Bogotá</p>
        </div>

        <button
          type="submit"
          disabled={cargando || !direccion.trim()}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#111827] text-[16px] font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:opacity-60"
        >
          {cargando && !usandoGps ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar talleres
        </button>

        <button
          type="button"
          onClick={handleUsarUbicacion}
          disabled={cargando}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-semibold text-[#374151] transition-colors hover:text-[#111827] disabled:opacity-60"
        >
          {usandoGps ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          Usar mi ubicación actual
        </button>
      </form>

      {/* Estados del resultado — solo un conteo, nunca listados ni tarjetas. */}
      {estado === "error" && (
        <p className="mt-4 rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-red-700">{errorMsg}</p>
      )}

      {estado === "resultado" && (
        <div className="mt-5 rounded-[14px] border border-[#E4E7EC] bg-[#F8FAFC] p-5 text-center">
          <p className="text-[15px] font-semibold text-[#111827]">
            {conteo} taller{conteo === 1 ? "" : "es"} encontrado{conteo === 1 ? "" : "s"}{" "}
            {radioUsado === 10 ? "alrededor de tu zona." : `en un radio más amplio (${radioUsado} km).`}
          </p>
          <button
            type="button"
            onClick={handleVerTalleres}
            className="mt-4 inline-flex h-[46px] items-center justify-center rounded-[12px] bg-[#111827] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#1F2937]"
          >
            Ver talleres disponibles
          </button>
        </div>
      )}

      {estado === "sin-resultados" && (
        <div className="mt-5 rounded-[14px] border border-[#E4E7EC] bg-[#F8FAFC] p-5 text-center">
          <p className="text-[15px] font-semibold text-[#111827]">
            Por ahora no tenemos talleres verificados cerca de esa dirección.
          </p>
          <p className="mt-1.5 text-[13px] text-[#667085]">
            Seguimos sumando cobertura — creá tu cuenta gratis y te avisamos apenas haya opciones cerca tuyo.
          </p>
          <button
            type="button"
            onClick={handleCrearCuentaSinResultados}
            className="mt-4 inline-flex h-[46px] items-center justify-center rounded-[12px] bg-[#111827] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#1F2937]"
          >
            Crear cuenta gratis
          </button>
        </div>
      )}

      {mostrarGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div aria-hidden className="absolute inset-0 bg-[#111827]/50" onClick={() => setMostrarGate(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-[20px] border border-[#E4E7EC] bg-white p-7 text-center shadow-[0_12px_32px_rgba(17,24,39,0.12)]"
          >
            <button
              type="button"
              onClick={() => setMostrarGate(false)}
              aria-label="Cerrar"
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#F3F4F6]"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="mt-2 text-[22px] font-bold tracking-tight text-[#111827]">Ya casi estás.</h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-[#667085]">
              Crea una cuenta para descubrir los talleres disponibles cerca de la dirección que elegiste.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/registro/cliente"
                className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-[#111827] text-[14px] font-semibold text-white transition-colors hover:bg-[#1F2937]"
              >
                Crear cuenta
              </Link>
              <Link
                to="/login/cliente"
                className="flex h-[48px] w-full items-center justify-center rounded-[12px] border border-[#D1D5DB] text-[14px] font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6]"
              >
                Iniciar sesión
              </Link>
            </div>
            <p className="mt-5 text-[12px] text-[#667085]">Tu búsqueda se guardará para que puedas continuar donde la dejaste.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────────────────
export default function LandingHub() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    document.title = "Taller Aval — Encuentra talleres verificados para tu carro o moto";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Encontrá talleres verificados cerca tuyo para tu carro o moto. Buscá por dirección, compará opciones y elegí con información clara antes de llevar tu vehículo."
    );
  }, []);

  function handleCtaPrincipal() {
    if (session) {
      navigate("/portal/cliente/buscar-talleres");
    } else {
      navigate("/registro/cliente");
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      {/* ═══════════════════════════════════════════════════════
          HEADER — con menú hamburguesa en mobile
         ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-[#E4E7EC] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
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

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/clientes" className="text-[14px] font-semibold text-[#374151] hover:text-[#111827]">
              Iniciar sesión
            </Link>
            <a
              href="#buscador"
              className="inline-flex h-[44px] items-center rounded-[10px] bg-[#111827] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1F2937]"
            >
              Encontrar un taller
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[#111827] lg:hidden"
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuAbierto && (
          <div className="border-t border-[#E4E7EC] bg-white px-5 py-5 lg:hidden">
            <nav className="flex flex-col gap-1">
              <Link to="/" onClick={() => setMenuAbierto(false)} className="rounded-[10px] px-2 py-2.5 text-[15px] font-medium text-[#374151] hover:bg-[#F3F4F6]">
                Inicio
              </Link>
              <a href="#buscador" onClick={() => setMenuAbierto(false)} className="rounded-[10px] px-2 py-2.5 text-[15px] font-medium text-[#374151] hover:bg-[#F3F4F6]">
                Encontrar taller
              </a>
              <a href="#como-funciona" onClick={() => setMenuAbierto(false)} className="rounded-[10px] px-2 py-2.5 text-[15px] font-medium text-[#374151] hover:bg-[#F3F4F6]">
                Cómo funciona
              </a>
              <Link to="/talleres" onClick={() => setMenuAbierto(false)} className="rounded-[10px] px-2 py-2.5 text-[15px] font-medium text-[#374151] hover:bg-[#F3F4F6]">
                Para talleres
              </Link>
            </nav>
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                to="/clientes"
                onClick={() => setMenuAbierto(false)}
                className="flex h-[46px] w-full items-center justify-center rounded-[12px] border border-[#D1D5DB] text-[14px] font-semibold text-[#111827]"
              >
                Iniciar sesión
              </Link>
              <a
                href="#buscador"
                onClick={() => setMenuAbierto(false)}
                className="flex h-[46px] w-full items-center justify-center rounded-[12px] bg-[#111827] text-[14px] font-semibold text-white"
              >
                Encontrar un taller
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO — solo información, sin datos de talleres.
          Orden mobile: botones soy-cliente/soy-taller → H1 → subtítulo →
          CTA → línea de confianza → (al final) composición visual.
         ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F8FAFC, #FFFFFF)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[80vh] lg:flex-row lg:items-center lg:gap-10 lg:py-24">
          {/* Columna izquierda */}
          <div className="w-full lg:w-1/2">
            {/* Entrada rápida por rol — para que cliente y taller sepan de
                una vez dónde iniciar sesión o registrarse. */}
            <div className="mb-6 inline-flex items-center gap-1 rounded-full border border-[#E4E7EC] bg-white p-1 shadow-sm">
              <Link
                to="/clientes"
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6]"
              >
                <User className="h-3.5 w-3.5" /> Soy cliente
              </Link>
              <Link
                to="/talleres"
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6]"
              >
                <Wrench className="h-3.5 w-3.5" /> Soy taller
              </Link>
            </div>

            <h1 className="max-w-[650px] text-[38px] font-bold leading-[1.08] text-[#111827] sm:text-[48px] sm:leading-[1.08] lg:text-[64px] lg:leading-[1.05] lg:tracking-[-2.5px]">
              Tu vehículo merece algo más que un taller al azar.
            </h1>
            <p className="mt-6 max-w-[550px] text-[18px] font-normal leading-[1.55] text-[#4B5563] sm:text-[20px]">
              Encuentra talleres verificados y elige con información clara antes de entregar tu carro o moto.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <CtaPrimario onClick={handleCtaPrincipal}>Encontrar un taller</CtaPrimario>
              <CtaGhost href="#como-funciona">Cómo funciona</CtaGhost>
            </div>
            <p className="mt-2.5 text-[13px] font-semibold text-[#667085]">Es gratis comenzar.</p>

            <p className="mt-4 text-[14px] text-[#667085]">Sin llamadas no solicitadas · Sin compromiso · Gratis para buscar</p>
          </div>

          {/* Columna derecha — composición abstracta de producto, sin datos
              reales ni foto de stock: vehículo + pin + tarjeta de búsqueda +
              insignia de confianza + indicador de "varias opciones". */}
          <div className="relative w-full lg:w-1/2">
            <div className="relative mx-auto aspect-square max-w-[380px]">
              <div className="absolute inset-8 rounded-full bg-[#F3F4F6]" />

              <div className="absolute inset-x-8 top-8 flex h-[190px] items-center justify-center rounded-[24px] border border-[#E4E7EC] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]">
                <Car className="h-16 w-16 text-[#111827]" strokeWidth={1.25} />
              </div>

              <div className="absolute -left-2 bottom-24 flex items-center gap-2 rounded-[14px] border border-[#E4E7EC] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(17,24,39,0.08)]">
                <Search className="h-4 w-4 text-[#667085]" />
                <span className="text-[13px] font-medium text-[#374151]">Buscar taller…</span>
              </div>

              <div className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#111827] shadow-[0_10px_24px_rgba(17,24,39,0.12)]">
                <MapPin className="h-5 w-5 text-white" />
              </div>

              <div className="absolute -bottom-2 right-8 flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-2 shadow-[0_10px_24px_rgba(17,24,39,0.08)]">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                <span className="text-[12px] font-bold text-[#166534]">Verificado</span>
              </div>

              <div className="absolute bottom-6 left-6 flex -space-x-2">
                <div className="h-8 w-8 rounded-full border-2 border-white bg-[#E4E7EC]" />
                <div className="h-8 w-8 rounded-full border-2 border-white bg-[#D1D5DB]" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#111827] text-[10px] font-bold text-white">
                  +
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROBLEMA
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
              <div key={frase} className="rounded-[16px] border border-[#E4E7EC] bg-[#F8FAFC] p-6 text-center">
                <p className="text-[15px] font-medium leading-relaxed text-[#374151]">{frase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROMESA
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
          CÓMO FUNCIONA
         ═══════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-[28px] font-bold text-[#111827] sm:text-[42px]">Así de fácil puedes encontrar un taller.</h2>
            <p className="mt-3 text-[16px] text-[#667085] sm:text-[18px]">
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
                <p className="mt-2 text-[14px] leading-relaxed text-[#667085]">{paso.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SELLO DE CONFIANZA
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
                <p className="mt-2 text-[13px] leading-relaxed text-[#667085]">
                  Talleres que forman parte de nuestra plataforma bajo nuestros criterios de validación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TIPOS DE VEHÍCULO — informativo, enlaza al buscador.
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-[28px] font-bold text-[#111827] sm:text-[42px]">Cada vehículo necesita el taller adecuado.</h2>
            <p className="mt-3 text-[16px] text-[#667085] sm:text-[18px]">Encuentra opciones para el vehículo que tienes.</p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Carros", icon: Car },
              { label: "Motos", icon: Bike },
              { label: "Híbridos", icon: Zap },
              { label: "Eléctricos", icon: Battery },
            ].map((cat) => (
              <a
                key={cat.label}
                href="#buscador"
                className="flex flex-col items-center gap-3 rounded-[20px] border border-[#E4E7EC] bg-white px-4 py-8 text-center transition-transform duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(17,24,39,0.06)]"
              >
                <cat.icon className="h-7 w-7 text-[#111827]" strokeWidth={1.75} />
                <span className="text-[14px] font-bold text-[#111827]">{cat.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BUSCADOR POR DIRECCIÓN
         ═══════════════════════════════════════════════════════ */}
      <section id="buscador" className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-[28px] font-bold text-[#111827] sm:text-[42px]">Encuentra talleres cerca de la dirección que elijas.</h2>
            <p className="mt-3 text-[16px] text-[#667085] sm:text-[18px]">
              Escribe una dirección y te mostraremos opciones de talleres según esa ubicación.
            </p>
          </div>

          <BuscadorDireccion />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CARRUSEL DE CONTENIDO ÚTIL
         ═══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
          <CarruselContenidoUtil />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA FINAL
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
          FOOTER
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
                    Iniciar sesión
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
                <li>
                  <Link to="/login/taller" className="text-[13px] text-[#9CA3AF] hover:text-white">
                    Iniciar sesión (taller)
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
    </div>
  );
}
