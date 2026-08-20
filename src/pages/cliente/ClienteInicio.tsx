import { Link } from "react-router-dom";
import { Gift, Search, Sparkles, ArrowRight, Coins } from "lucide-react";

export default function ClienteInicio() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] font-bold text-brand-700">
          <Sparkles className="h-3 w-3" />
          Portal de Cliente
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground">Buscá talleres, mirá ofertas y llevá el control de tus puntos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/portal/cliente/ofertas"
          className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-brand-500/30 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Gift className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Ofertas para ti</h3>
          <p className="mt-1 text-xs text-muted-foreground">Promociones de talleres y almacenes verificados cerca de ti.</p>
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
            Encuentra talleres y almacenes con Sello de Confianza y contáctalos directo.
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
          <p className="mt-1 text-xs text-muted-foreground">Ganá puntos con cada pago y redimilos por beneficios.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-all group-hover:gap-2">
            Ver mis puntos <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
