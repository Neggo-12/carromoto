import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  accent?: "brand" | "signal";
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
  icon?: LucideIcon;
  children: React.ReactNode;
}

/**
 * Shell de dos paneles para login/registro. Izquierda: fondo futurista
 * (grilla escaneando, orbes flotantes, badge tipo radar) con la promesa
 * de marca — cambia de texto según el contexto (cliente vs taller,
 * login vs registro). Derecha: la tarjeta blanca con el formulario en sí.
 * En mobile el panel izquierdo colapsa a una franja superior compacta.
 */
export function AuthLayout({
  accent = "brand",
  eyebrow,
  title,
  subtitle,
  bullets,
  icon: Icon = ShieldCheck,
  children,
}: AuthLayoutProps) {
  const isBrand = accent === "brand";

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* ── Panel izquierdo: futurista, branding contextual ── */}
      <div
        className={cn(
          "relative overflow-hidden lg:w-[42%] lg:min-h-screen",
          isBrand ? "bg-brand-900" : "bg-signal-600"
        )}
      >
        <div className="absolute inset-0 bg-grid-scan opacity-[0.35] [mask-image:radial-gradient(ellipse_70%_70%_at_30%_20%,black_10%,transparent_75%)]" />
        <div
          className={cn(
            "absolute -top-32 -left-24 h-80 w-80 rounded-full blur-[100px] animate-float-slow",
            isBrand ? "bg-brand-400/30" : "bg-white/20"
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 right-0 h-72 w-72 rounded-full blur-[100px] animate-float-slower",
            isBrand ? "bg-signal-500/20" : "bg-brand-400/20"
          )}
        />

        <div className="relative flex flex-col justify-between px-8 py-8 sm:px-12 sm:py-12 lg:min-h-screen">
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-base font-extrabold tracking-tight">Taller Aval</span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-white/50 font-semibold">nombre temporal</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="my-10 lg:my-0"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white/50 animate-radar-ping" />
                <Icon className="relative h-2.5 w-2.5" />
              </span>
              {eyebrow}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.05] max-w-sm">
              {title}
            </h1>
            <p className="mt-4 max-w-sm text-sm text-white/70 leading-relaxed">{subtitle}</p>

            <ul className="mt-8 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm font-medium text-white/85">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-white/60" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <p className="hidden text-[11px] text-white/40 lg:block">
            &copy; 2026 Taller Aval — proyecto en construcción.
          </p>
        </div>
      </div>

      {/* ── Panel derecho: la tarjeta con el formulario ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
