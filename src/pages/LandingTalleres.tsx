import { Link } from "react-router-dom";
import {
  Wrench,
  ShieldCheck,
  Tag,
  Zap,
  Users,
  Store,
  Package,
  TrendingUp,
  ArrowRight,
  ListChecks,
  Bike,
  Car,
  Battery,
} from "lucide-react";
import { Button } from "@/components/Button";

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 bg-signal-400" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal-400" />
    </span>
  );
}

function FeatureItem({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500/10">
        <Icon className="h-5 w-5 text-signal-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function LandingTalleres() {
  return (
    <div className="min-h-screen bg-background">
      {/* ═════════════════════════════════════════════════════════
          NAVBAR
         ═════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-500/10 glow-signal">
              <Wrench className="h-5 w-5 text-signal-600" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">Taller Aval</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#features" className="hidden lg:inline text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Beneficios</a>
            <a href="#como-funciona" className="hidden lg:inline text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Cómo funciona</a>
            {/* Visible en todas las resoluciones — antes tenía "hidden sm:inline"
                y en celular directamente desaparecía, dejando "Registrar mi
                taller" como única opción visible en el navbar. Con variant
                outline queda clara la jerarquía: acceso secundario elegante al
                lado del CTA principal, no un link gris perdido. */}
            <Button as={Link} to="/login/taller" variant="outline" size="sm">
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Button>
            <Button as={Link} to="/registro/taller" variant="signal" size="sm">
              <span className="sm:hidden">Registrarme</span>
              <span className="hidden sm:inline">Registrar mi taller</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════
          HERO
         ═════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-signal-500/[0.05] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-signal-500/[0.03] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-signal-500/20 bg-signal-500/5 px-4 py-1.5 text-xs font-medium text-signal-600">
                <LiveDot />
                Para talleres y negocios de repuestos
              </div>

              <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[0.98]">
                Ganá visibilidad con el{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal-600 to-signal-500">
                  Sello de Confianza
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Clientes que ya saben qué necesitan, buscando talleres verificados como el tuyo.
                Sin pautar, sin depender de tráfico frío.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button as={Link} to="/registro/taller" variant="signal" size="lg" icon={ArrowRight}>
                  Registrar mi taller
                </Button>
                <Button as="a" href="#como-funciona" variant="outline" size="lg">
                  Cómo funciona
                </Button>
              </div>
            </div>

            {/* Right: what you get */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sello de Confianza verificado, no autodeclarado", icon: ShieldCheck },
                { label: "Perfil por especialidad y servicios", icon: Tag },
                { label: "Notificación al instante por cada solicitud", icon: Zap },
                { label: "Conexión directa con clientes del ecosistema", icon: Users },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white shadow-sm p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-500/10">
                    <item.icon className="h-5 w-5 text-signal-600" />
                  </div>
                  <div className="text-sm font-semibold text-foreground leading-snug">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          FEATURES
         ═════════════════════════════════════════════════════════ */}
      <section id="features" className="border-t border-border/50 bg-card/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-signal-600 font-bold mb-3">
              ¿Por qué sumarte?
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Todo lo que tu taller necesita para crecer
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureItem
              icon={ShieldCheck}
              title="Sello de Confianza"
              description="Verificación real de identidad y legitimidad de tu negocio. Un distintivo que genera credibilidad inmediata."
            />
            <FeatureItem
              icon={Tag}
              title="Servicios a la medida"
              description="Elegís exactamente qué servicios ofrecés, para que te lleguen solicitudes que sí podés atender."
            />
            <FeatureItem
              icon={Zap}
              title="Notificaciones al instante"
              description="Te enterás apenas llega una solicitud de cliente, sin refrescar ni esperar reportes."
            />
            <FeatureItem
              icon={Users}
              title="Clientes que ya saben qué buscan"
              description="Solicitudes con el problema o repuesto ya descrito — sin perder tiempo calificando curiosos."
            />
            <FeatureItem
              icon={ListChecks}
              title="Perfil por especialidad"
              description="Mecánica general, latonería, eléctrico, llantas, eléctricos e híbridos — tu taller aparece en lo que realmente hacés."
            />
            <FeatureItem
              icon={Package}
              title="Repuestos con trazabilidad"
              description="Publicás tu catálogo o inventario de repuestos con claridad entre lo cotizado y lo entregado."
            />
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          HOW IT WORKS
         ═════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
              Flujo operativo
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Del registro al Sello de Confianza
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Te registrás", desc: "Contás qué hace tu taller o negocio de repuestos: carro, moto o ambos.", icon: Store },
              { step: "02", title: "Verificamos tu negocio", desc: "Confirmamos identidad y legitimidad antes de activarte en la plataforma.", icon: ShieldCheck },
              { step: "03", title: "Recibís el Sello", desc: "Tu perfil queda visible con el Sello de Confianza una vez verificado.", icon: TrendingUp },
              { step: "04", title: "Atendés solicitudes", desc: "Respondés cotizaciones de clientes reales, a tu ritmo y con tus condiciones.", icon: Package },
            ].map((item) => (
              <div
                key={item.step}
                className="relative group rounded-2xl border border-black/[0.06] bg-white shadow-sm p-6 transition-all hover:shadow-xl hover:shadow-signal-500/10"
              >
                <div className="absolute top-0 right-0 p-4 text-5xl font-extrabold font-mono text-muted-foreground/10 select-none">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/10 mb-4">
                    <item.icon className="h-5 w-5 text-signal-600" />
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
          COBERTURA POR VERTICAL
         ═════════════════════════════════════════════════════════ */}
      <section className="border-t border-border/50 bg-card/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-signal-600 font-bold mb-3">
              ¿Tu negocio aplica?
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Carro, moto, eléctricos e híbridos
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
            {[
              { title: "Talleres de carro", desc: "Mecánica, latonería y pintura, frenos, suspensión, eléctrico, A/C, llantas.", icon: Car },
              { title: "Talleres de moto", desc: "Mecánica, mantenimiento, frenos, suspensión y diagnóstico eléctrico.", icon: Bike },
              { title: "Eléctricos e híbridos", desc: "Especialización en carro y moto — diferenciador de un nicho en crecimiento.", icon: Battery },
            ].map((cat) => (
              <div key={cat.title} className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-500/10 mb-4">
                  <cat.icon className="h-5 w-5 text-signal-600" />
                </div>
                <h4 className="text-sm font-black text-foreground mb-1.5">{cat.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          FAQ
         ═════════════════════════════════════════════════════════ */}
      <section className="border-t border-black/[0.06] bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24">
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
                q: "¿Cómo consigo el Sello de Confianza?",
                a: "Te registrás, verificamos identidad y legitimidad de tu negocio, y una vez aprobado el Sello queda visible en tu perfil.",
              },
              {
                q: "¿Cuánto cuesta estar en la plataforma?",
                a: "Todavía estamos definiendo el modelo de precios para este vertical. Por ahora no hay ningún costo ni comisión — te avisamos apenas esté listo.",
              },
              {
                q: "¿Qué pasa si no quiero atender una solicitud?",
                a: "Vos decidís qué solicitudes atender. No hay obligación de responder todo lo que llega.",
              },
              {
                q: "¿Sirve para talleres de moto o solo de carro?",
                a: "Los dos, incluyendo talleres especializados en vehículos eléctricos e híbridos.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-black/[0.06] bg-background p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-bold text-foreground mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          CTA / ACCESO
         ═════════════════════════════════════════════════════════ */}
      <section id="acceso" className="mx-auto max-w-lg px-4 sm:px-6 py-24">
        <div className="rounded-3xl border border-black/[0.06] bg-white shadow-xl p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-500/10 mx-auto mb-5">
            <ShieldCheck className="h-8 w-8 text-signal-600" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-signal-500/30 bg-signal-500/10 px-3 py-1 text-[10px] font-bold text-signal-600 mb-5">
            Registro abierto
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2.5">
            ¿Listo para hacer crecer tu taller?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Registrá tu negocio gratis, pasá por verificación y empezá a recibir solicitudes de
            clientes reales.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button as={Link} to="/registro/taller" variant="signal" size="lg" icon={ArrowRight}>
              Registrar mi taller
            </Button>
            <Button as={Link} to="/login/taller" variant="outline" size="lg">
              Ya tengo cuenta
            </Button>
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
              <Wrench className="h-4 w-4 text-signal-600" />
              <span className="text-sm font-bold text-foreground">Taller Aval</span>
              <span className="text-[10px] text-muted-foreground">— Para Talleres (nombre temporal)</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/clientes" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Busco un taller</Link>
              <Link to="/" className="text-xs text-signal-600 hover:text-signal-400 transition-colors">Inicio</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
