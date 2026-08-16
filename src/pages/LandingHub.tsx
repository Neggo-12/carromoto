import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  Bike,
  Car,
  Zap,
  Shield,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  Search,
  UserCircle,
  Store,
  Sparkles,
  BadgeCheck,
  PaintBucket,
  Gauge,
  Snowflake,
  CircleDot,
  Battery,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";

// Entrada escalonada del hero — cada hijo directo aparece con un pequeño
// desfase, en vez de aparecer todo de golpe.
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

// ── Audience Card ─────────────────────────────────────────────
interface AudienceCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  benefits: string[];
  accent: "brand" | "signal";
  tag: string;
}

function AudienceCard({ href, icon: Icon, title, subtitle, benefits, accent, tag }: AudienceCardProps) {
  const config = {
    brand: {
      border: "border-black/[0.06] hover:border-brand-500/30",
      glow: "hover:shadow-brand-500/15",
      iconBg: "bg-brand-500/10 text-brand-600 group-hover:bg-brand-500 group-hover:text-white",
      tag: "bg-brand-500/10 text-brand-700 border-brand-500/20",
      check: "text-brand-600",
      cta: "hsl(226 68% 45%)",
      line: "from-transparent via-brand-500 to-transparent",
    },
    signal: {
      border: "border-black/[0.06] hover:border-signal-500/30",
      glow: "hover:shadow-signal-500/15",
      iconBg: "bg-signal-500/10 text-signal-600 group-hover:bg-signal-500 group-hover:text-white",
      tag: "bg-signal-500/10 text-signal-600 border-signal-500/20",
      check: "text-signal-600",
      cta: "hsl(24 90% 42%)",
      line: "from-transparent via-signal-500 to-transparent",
    },
  }[accent];

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm",
        "transition-all duration-500 hover:scale-[1.015] hover:shadow-2xl",
        config.border,
        config.glow
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100", config.line)} />

      <div className="relative flex flex-col p-7 sm:p-9">
        <div className="flex items-start justify-between mb-6">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300", config.iconBg)}>
            <Icon className="h-7 w-7" />
          </div>
          <span className={cn("rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider", config.tag)}>
            {tag}
          </span>
        </div>

        <h3 className="text-2xl font-black text-foreground tracking-tight mb-2.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-7">{subtitle}</p>

        <ul className="space-y-3 mb-7">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
              <CheckCircle2 className={cn("h-4 w-4 shrink-0 mt-0.5", config.check)} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center gap-2 text-sm font-bold transition-colors" style={{ color: config.cta }}>
          <span>Continuar</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

// ── Category chip ────────────────────────────────────────────
function CategoryChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white px-4 py-3 shadow-sm">
      <Icon className="h-4 w-4 text-brand-600 shrink-0" />
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </div>
  );
}

// ── Landing Hub ───────────────────────────────────────────────
export default function LandingHub() {
  return (
    <div className="min-h-screen bg-background">
      {/* ═════════════════════════════════════════════════════════
          NAVBAR
         ═════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 glow-brand">
              <Wrench className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-foreground">Taller Aval</span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold ml-2 align-middle">
                nombre temporal
              </span>
            </div>
          </a>

          <div className="flex items-center gap-1">
            <a
              href="#como-funciona"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg"
            >
              Cómo funciona
            </a>
            <a
              href="#categorias"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg"
            >
              Categorías
            </a>
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            <Button as="a" href="#perfiles" variant="brand" size="sm">
              Empezar
            </Button>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════
          HERO
         ═════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Grilla técnica que se desplaza muy lento — sensación de escaneo */}
        <div className="absolute inset-0 bg-grid-scan [mask-image:radial-gradient(ellipse_60%_60%_at_50%_20%,black_10%,transparent_70%)]" />

        {/* Orbes flotantes en vez de estáticos */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-500/[0.06] blur-[120px] animate-float-slow" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-signal-500/[0.05] blur-[120px] animate-float-slower" />

        {/* Línea de escaneo vertical, sutil, detrás del copy */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-brand-400/[0.08] to-transparent animate-scan-line" />
        </div>

        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center"
        >
          <motion.div variants={heroItem} className="relative inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-1.5 text-xs font-semibold text-brand-700 mb-8">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500/40 animate-radar-ping" />
              <ShieldCheck className="relative h-3.5 w-3.5" />
            </span>
            Verificamos el taller antes de que confíes en él
          </motion.div>

          <motion.h1 variants={heroItem} className="text-5xl font-black tracking-tight text-foreground sm:text-7xl lg:text-8xl max-w-5xl mx-auto leading-[0.95]">
            Llevá tu carro o moto a un taller{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-signal-500">
              en el que sí podés confiar
            </span>
          </motion.h1>

          <motion.p variants={heroItem} className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Talleres y repuestos de carro y moto, verificados antes de que hables con nadie.
            Vos contás qué necesitás — nosotros confirmamos que el taller sea real y confiable
            antes de conectarte.
          </motion.p>

          <motion.div variants={heroItem} className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
            {[
              "1. Contás qué necesita tu carro o moto",
              "2. Verificamos el taller o negocio de repuestos",
              "3. Te conectamos y comparás cotizaciones",
            ].map((claim) => (
              <div key={claim} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                <span>{claim}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={heroItem} className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Button as="a" href="#perfiles" variant="brand" size="lg" icon={ArrowRight}>
              Buscar un taller
            </Button>
            <Button as="a" href="#como-funciona" variant="outline" size="lg">
              Cómo funciona
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          POR QUÉ IMPORTA LA VERIFICACIÓN
         ═════════════════════════════════════════════════════════ */}
      <section className="border-y border-black/[0.06] bg-white">
        <Reveal className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Sello de Confianza",
                desc: "Cada taller o negocio de repuestos pasa por verificación antes de aparecer en la plataforma.",
              },
              {
                icon: Shield,
                title: "Sin sobrecostos escondidos",
                desc: "Cotizaciones claras antes de autorizar cualquier trabajo. Nada de \"encontramos otro daño\" a mitad de camino.",
              },
              {
                icon: BadgeCheck,
                title: "Repuestos originales verificables",
                desc: "El repuesto que te cotizan es el que te instalan — trazabilidad clara, sin sustitutos sin avisar.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10">
                  <item.icon className="h-5 w-5 text-brand-600" />
                </div>
                <div className="text-sm font-bold text-foreground">{item.title}</div>
                <div className="text-[13px] text-muted-foreground leading-relaxed max-w-[26ch]">{item.desc}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═════════════════════════════════════════════════════════
          CÓMO FUNCIONA
         ═════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="border-b border-border/50 bg-card/10">
        <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600 font-bold mb-3">
              Simple y directo
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Encontrá el taller correcto en 3 pasos
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Contás qué necesitás", desc: "Carro o moto, tipo de servicio o repuesto que buscás — sin trámites ni papeleo.", icon: Search },
              { step: "02", title: "Verificamos el taller", desc: "Confirmamos identidad y legitimidad del taller o negocio de repuestos antes de mostrártelo.", icon: ShieldCheck },
              { step: "03", title: "Comparás y decidís", desc: "Recibís cotizaciones reales de talleres verificados y elegís con quién avanzar.", icon: Gauge },
            ].map((item) => (
              <div
                key={item.step}
                className="relative group rounded-2xl border border-black/[0.06] bg-white shadow-sm p-6 transition-all hover:shadow-xl hover:shadow-brand-500/10"
              >
                <div className="absolute top-0 right-0 p-4 text-5xl font-extrabold font-mono text-muted-foreground/10 select-none">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 mb-4">
                    <item.icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═════════════════════════════════════════════════════════
          CATEGORÍAS
         ═════════════════════════════════════════════════════════ */}
      <section id="categorias" className="border-b border-border/50">
        <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600 font-bold mb-3">
              Un solo lugar, todo el vertical automotriz
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Carro, moto, eléctricos e híbridos
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-4">
            <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <Car className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Talleres de carro</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <CategoryChip icon={Wrench} label="Mecánica general" />
                <CategoryChip icon={PaintBucket} label="Latonería y pintura" />
                <CategoryChip icon={Gauge} label="Frenos y suspensión" />
                <CategoryChip icon={Zap} label="Eléctrico / diagnóstico" />
                <CategoryChip icon={Snowflake} label="Aire acondicionado" />
                <CategoryChip icon={CircleDot} label="Llantas y alineación" />
              </div>
            </div>

            <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <Bike className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Talleres de moto</h3>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <CategoryChip icon={Wrench} label="Mecánica y mantenimiento" />
                <CategoryChip icon={Gauge} label="Frenos, suspensión y llantas" />
                <CategoryChip icon={Zap} label="Eléctrico / diagnóstico" />
              </div>
              <div className="mt-4 rounded-2xl bg-signal-500/[0.06] border border-signal-500/15 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Battery className="h-4 w-4 text-signal-600" />
                  <span className="text-xs font-bold text-foreground">Eléctricos e híbridos</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Carro y moto — un nicho en crecimiento, con talleres especializados verificados aparte.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <Store className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Repuestos</h3>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <CategoryChip icon={Car} label="Repuestos de carro (detal y mayor)" />
                <CategoryChip icon={Bike} label="Repuestos de moto (detal y mayor)" />
              </div>
              <div className="mt-4 rounded-2xl bg-brand-500/[0.06] border border-brand-500/15 p-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Trazabilidad clara entre lo que se cotiza y lo que se instala o entrega.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═════════════════════════════════════════════════════════
          AUDIENCE PATHS
         ═════════════════════════════════════════════════════════ */}
      <Reveal as="section" id="perfiles" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
            Dos maneras de usarlo
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            ¿Qué buscás hoy?
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          <AudienceCard
            href="/clientes"
            icon={UserCircle}
            title="Busco un taller o repuesto"
            subtitle="Contanos qué le pasa a tu carro o moto y te conectamos con talleres verificados cerca tuyo."
            accent="brand"
            tag="Gratis para clientes"
            benefits={[
              "Talleres y repuestos verificados con Sello de Confianza",
              "Cotizaciones comparadas antes de decidir",
              "Sin llamadas ni mensajes no solicitados",
              "Cobertura carro, moto, eléctricos e híbridos",
            ]}
          />

          <AudienceCard
            href="/talleres"
            icon={Store}
            title="Tengo un taller o negocio de repuestos"
            subtitle="Sumate como aliado verificado y recibí clientes que ya están buscando lo que ofrecés."
            accent="signal"
            tag="Registro con verificación"
            benefits={[
              "Sello de Confianza verificado, no autodeclarado",
              "Clientes que ya saben qué necesitan",
              "Notificación al instante por cada solicitud",
              "Vos decidís qué solicitudes atender",
            ]}
          />
        </div>
      </Reveal>

      {/* ═════════════════════════════════════════════════════════
          FAQ
         ═════════════════════════════════════════════════════════ */}
      <section className="border-y border-black/[0.06] bg-white">
        <Reveal className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
              Antes de que preguntes
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Las dudas más comunes
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                q: "¿Cómo sé que el taller es real y no me van a clonar el carro?",
                a: "Verificamos identidad y legitimidad del taller o negocio antes de que aparezca en la plataforma. Si algo no cuadra, no se publica.",
              },
              {
                q: "¿Qué pasa si me cotizan algo y después me cobran más?",
                a: "La cotización es el punto de partida de la conversación con el taller — cualquier cambio se te informa antes de autorizar el trabajo, no después.",
              },
              {
                q: "¿Por qué no buscar directo en redes o Google?",
                a: "Porque ahí nadie verifica nada. Ese es justamente el trabajo que hacemos antes de ponerte en contacto con un taller.",
              },
              {
                q: "¿Esto también sirve para moto o solo carro?",
                a: "Los dos, incluyendo talleres especializados en vehículos eléctricos e híbridos.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-black/[0.06] bg-background p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-bold text-foreground mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═════════════════════════════════════════════════════════
          CTA FINAL / ACCESO
         ═════════════════════════════════════════════════════════ */}
      <Reveal as="section" id="acceso" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-lg mx-auto rounded-3xl border border-black/[0.06] bg-white shadow-xl p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 mx-auto mb-5">
            <Sparkles className="h-8 w-8 text-brand-600" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-signal-500/30 bg-signal-500/10 px-3 py-1 text-[10px] font-bold text-signal-600 mb-5">
            En construcción — el registro se habilita pronto
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2.5">
            Todavía estamos armando esto
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Esta es una vista previa de la landing. El registro de talleres y clientes,
            y la verificación real, se conectan en las próximas etapas de construcción.
          </p>
          <Button as="a" href="#perfiles" variant="brand" size="lg" icon={ArrowUpRight}>
            Ver perfiles disponibles
          </Button>
        </div>
      </Reveal>

      {/* ═════════════════════════════════════════════════════════
          FOOTER
         ═════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-bold text-foreground">Taller Aval</span>
              <span className="text-[10px] text-muted-foreground">— nombre temporal, talleres y repuestos verificados</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#como-funciona" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cómo funciona</a>
              <a href="#categorias" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Categorías</a>
              <a href="#perfiles" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Perfiles</a>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground/40">
              &copy; 2026 Taller Aval. Proyecto en construcción — no es Neggo.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
