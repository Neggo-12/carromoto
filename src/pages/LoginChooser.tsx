import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, UserCircle, Store, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChoiceProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: "brand" | "signal";
}

function Choice({ to, icon: Icon, title, description, accent }: ChoiceProps) {
  const isBrand = accent === "brand";
  return (
    <Link to={to} className="group block h-full">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={cn(
          "relative h-full overflow-hidden rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-xl",
          isBrand
            ? "border-brand-500/15 bg-white hover:shadow-brand-500/10"
            : "border-signal-500/15 bg-white hover:shadow-signal-500/10"
        )}
      >
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl mb-6",
            isBrand ? "bg-brand-500/10" : "bg-signal-500/10"
          )}
        >
          <Icon className={cn("h-7 w-7", isBrand ? "text-brand-600" : "text-signal-600")} />
        </div>
        <h3 className="text-xl font-black tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
        <span
          className={cn(
            "mt-6 inline-flex items-center gap-1.5 text-sm font-bold",
            isBrand ? "text-brand-600" : "text-signal-600"
          )}
        >
          Continuar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </motion.div>
    </Link>
  );
}

export default function LoginChooser() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-5xl flex items-center h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10">
              <Wrench className="h-5 w-5 text-brand-600" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">Taller Aval</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              ¿Cómo querés iniciar sesión?
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Clientes y talleres tienen accesos separados, para que cada uno vea solo lo suyo.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Choice
              to="/login/cliente"
              icon={UserCircle}
              title="Soy cliente"
              description="Busco un taller o repuesto de confianza para mi carro o moto."
              accent="brand"
            />
            <Choice
              to="/login/taller"
              icon={Store}
              title="Tengo un taller"
              description="Ofrezco servicios de reparación o repuestos verificados."
              accent="signal"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
