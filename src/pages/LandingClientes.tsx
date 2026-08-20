import { Link } from "react-router-dom";
import {
  Wrench,
  Sparkles,
  Shield,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  LayoutGrid,
  Search,
  Star,
  Gauge,
  BadgeCheck,
  MessageSquareOff,
  Car,
  Bike,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 bg-brand-400" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-400" />
    </span>
  );
}

function FeatureItem({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
        <Icon className="h-5 w-5 text-brand-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function LandingClientes() {
  return (
    <div className="min-h-screen bg-background">
      {/* ═════════════════════════════════════════════════════════
          NAVBAR
         ═════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 glow-brand">
              <Wrench className="h-5 w-5 text-brand-600" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">Taller Aval</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#como-funciona" className="hidden lg:inline text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Cómo funciona</a>
            {/* Visible en todas las resoluciones — antes tenía "hidden sm:inline"
                y en celular desaparecía, dejando "Crear cuenta" como única
                opción visible en el navbar. */}
            <Button as={Link} to="/login/cliente" variant="outline" size="sm">
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Button>
            <Button as={Link} to="/registro/cliente" variant="brand" size="sm">
              Crear cuenta
            </Button>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════
          HERO
         ═════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-500/[0.05] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-500/[0.03] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-1.5 text-xs font-medium text-brand-700">
                <LiveDot />
                Para dueños de carro y moto
              </div>

              <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[0.98]">
                Encontrá un{" "}
                <span className="inline-block text-white bg-brand-500 px-2 -rotate-1 rounded-md">
                  taller de confianza
                </span>{" "}
                sin jugártela a la suerte
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Talleres y repuestos verificados antes de que hables con nadie. Contás qué le pasa
                a tu vehículo, comparás cotizaciones reales y decidís vos, sin presión.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button as={Link} to="/registro/cliente" variant="brand" size="lg" icon={ArrowRight}>
                  Crear cuenta gratis
                </Button>
                <Button as="a" href="#como-funciona" variant="outline" size="lg">
                  Cómo funciona
                </Button>
              </div>
            </div>

            {/* Right: What you get, color-blocked, no fake counters */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Talleres verificados con Sello de Confianza", icon: BadgeCheck, bg: "bg-brand-500", fg: "text-white" },
                { label: "Cotizaciones comparadas de varios talleres", icon: LayoutGrid, bg: "bg-signal-500", fg: "text-white" },
                { label: "Carro, moto, eléctricos e híbridos", icon: Car, bg: "bg-brand-700", fg: "text-white" },
                { label: "Sin llamadas ni mensajes no solicitados", icon: MessageSquareOff, bg: "bg-signal-600", fg: "text-white" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn("flex flex-col justify-between gap-6 rounded-2xl p-5 min-h-[152px]", item.bg, item.fg)}
                >
                  <item.icon className="h-7 w-7" />
                  <div className="text-sm font-bold leading-snug">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          HOW IT WORKS
         ═════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="border-t border-border/50 bg-card/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600 font-bold mb-3">
              Simple y directo
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Encontrá el taller correcto en 3 pasos
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
            {[
              { step: "01", title: "Contás qué necesitás", desc: "Tipo de vehículo, servicio o repuesto — sin trámites ni papeleo.", icon: Search },
              { step: "02", title: "Verificamos el taller", desc: "Confirmamos identidad y legitimidad antes de mostrártelo como opción.", icon: ShieldCheck },
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
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          FEATURES
         ═════════════════════════════════════════════════════════ */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600 font-bold mb-3">
              ¿Por qué buscar acá?
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Tu vehículo, en manos de confianza
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureItem
              icon={BadgeCheck}
              title="Sello de Confianza"
              description="Cada taller o negocio de repuestos pasa por verificación de identidad antes de aparecer en la plataforma."
            />
            <FeatureItem
              icon={LayoutGrid}
              title="Cotizaciones comparadas"
              description="Recibís propuestas de más de un taller para el mismo trabajo, y comparás antes de decidir."
            />
            <FeatureItem
              icon={Shield}
              title="Sin sobrecostos escondidos"
              description="La cotización es el punto de partida. Cualquier cambio se te informa antes de autorizar el trabajo."
            />
            <FeatureItem
              icon={Car}
              title="Carro, moto, eléctricos e híbridos"
              description="Cobertura completa del vertical automotriz, incluyendo talleres especializados en vehículos eléctricos."
            />
            <FeatureItem
              icon={Star}
              title="Repuestos con trazabilidad"
              description="El repuesto que te cotizan es el que te instalan — sin sustitutos de última hora sin avisar."
            />
            <FeatureItem
              icon={MessageSquareOff}
              title="Sin spam"
              description="Vos decidís a qué taller le compartís tus datos. Sin llamadas ni mensajes no solicitados."
            />
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          CATEGORÍAS RÁPIDAS
         ═════════════════════════════════════════════════════════ */}
      <section className="border-t border-border/50 bg-card/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600 font-bold mb-2">
              Cobertura
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              ¿Qué estás buscando?
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto mb-10">
            {[
              { title: "Talleres de carro y moto", desc: "Mecánica general, latonería, frenos, suspensión, eléctrico, A/C, llantas y más.", icon: Car, bg: "bg-brand-500" },
              { title: "Repuestos de carro y moto", desc: "Al detal o al mayor, con trazabilidad entre lo cotizado y lo entregado.", icon: Bike, bg: "bg-signal-500" },
            ].map((cat) => (
              <Link
                to="/registro/cliente"
                key={cat.title}
                className={cn(
                  "group rounded-2xl p-6 text-white transition-transform hover:scale-[1.02]",
                  cat.bg
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 mb-4">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-black mb-1.5">{cat.title}</h4>
                <p className="text-xs font-medium leading-relaxed opacity-90 mb-4">{cat.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-4">
                  Buscar
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          CTA / ACCESO
         ═════════════════════════════════════════════════════════ */}
      <section id="acceso" className="border-t border-border/50">
        <div className="mx-auto max-w-lg px-4 sm:px-6 py-24">
          <div className="rounded-3xl border border-black/[0.06] bg-white shadow-xl p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 mx-auto mb-5">
              <Sparkles className="h-8 w-8 text-brand-600" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2.5">
              ¿Listo para encontrar tu taller?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Creá tu cuenta gratis y empezá a comparar talleres y repuestos verificados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button as={Link} to="/registro/cliente" variant="brand" size="lg" icon={ArrowRight}>
                Crear cuenta gratis
              </Button>
              <Button as={Link} to="/login/cliente" variant="outline" size="lg">
                Ya tengo cuenta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          FOOTER
         ═════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-bold text-foreground">Taller Aval</span>
              <span className="text-[10px] text-muted-foreground">— Para Clientes (nombre temporal)</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/talleres" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Tengo un taller</Link>
              <Link to="/" className="text-xs text-brand-600 hover:text-brand-400 transition-colors">Inicio</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
