import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Search, Sparkles, ArrowRight, Coins, PartyPopper, X } from "lucide-react";
import { leerYLimpiarResultadoBienvenida, type ResultadoBienvenida } from "@/lib/bienvenida";

export default function ClienteInicio() {
  const [bienvenida, setBienvenida] = useState<ResultadoBienvenida | null>(null);

  useEffect(() => {
    const resultado = leerYLimpiarResultadoBienvenida();
    if (resultado?.otorgado) setBienvenida(resultado);
  }, []);

  return (
    <div className="space-y-6">
      {bienvenida?.otorgado && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
            <PartyPopper className="h-5 w-5 text-amber-600" />
          </div>
          <p className="flex-1 text-xs font-semibold leading-relaxed text-amber-800">
            ¡Ganó {bienvenida.puntos} puntos de bienvenida por registrarse! Los verá reflejados en "Mis Puntos" apenas
            esté activa la conexión con el sistema de puntos.
          </p>
          <button
            type="button"
            onClick={() => setBienvenida(null)}
            className="shrink-0 rounded-lg p-1 text-amber-600/60 hover:bg-amber-400/20 hover:text-amber-800"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] font-bold text-brand-700">
          <Sparkles className="h-3 w-3" />
          Portal de Cliente
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground">Busque talleres, revise ofertas y lleve el control de sus puntos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/portal/cliente/ofertas"
          className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-brand-500/30 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Gift className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Ofertas para usted</h3>
          <p className="mt-1 text-xs text-muted-foreground">Promociones de talleres y almacenes verificados cerca de usted.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-all group-hover:gap-2">
            Ver ofertas <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          to="/portal/cliente/buscar-talleres"
          className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-brand-500/30 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Search className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Buscar talleres</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Encuentre talleres y almacenes con Sello de Confianza y contáctelos directamente.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-all group-hover:gap-2">
            Buscar ahora <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          to="/portal/cliente/puntos"
          className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-brand-500/30 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Coins className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Mis puntos</h3>
          <p className="mt-1 text-xs text-muted-foreground">Gane puntos con cada pago y redímalos por beneficios.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-all group-hover:gap-2">
            Ver mis puntos <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
