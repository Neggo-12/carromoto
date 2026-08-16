import { useState } from "react";
import { Coins, Sparkles, TrendingUp, TrendingDown, Gift, Info } from "lucide-react";
import { MOVIMIENTOS_PUNTOS_MOCK, RECOMPENSAS_MOCK, saldoPuntos, type MovimientoPuntos } from "@/lib/puntosData";
import { cn } from "@/lib/utils";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Mis Puntos" — el cliente gana puntos cada vez que paga un servicio o
 * producto en un comercio de la red Taller Aval, y los redime acá mismo. El
 * canje es local (datos de ejemplo): descuenta del saldo mostrado, todavía
 * no hay backend. Cuando conectemos Supabase, esto llama a
 * canjear_recompensa() (ver supabase/migrations/0002_puntos_score.sql).
 */
export default function ClientePuntos() {
  const [movimientos, setMovimientos] = useState<MovimientoPuntos[]>(MOVIMIENTOS_PUNTOS_MOCK);
  const [canjeando, setCanjeando] = useState<string | null>(null);
  const saldo = saldoPuntos(movimientos);

  const historial = [...movimientos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  function handleCanjear(recompensaId: string) {
    const recompensa = RECOMPENSAS_MOCK.find((r) => r.id === recompensaId);
    if (!recompensa || saldo < recompensa.puntosNecesarios) return;
    setCanjeando(recompensaId);
    setTimeout(() => {
      setMovimientos((prev) => [
        {
          id: `m-${Date.now().toString(36)}`,
          tipo: "redimido",
          puntos: -recompensa.puntosNecesarios,
          motivo: `Canje: ${recompensa.titulo}`,
          comercioNombre: recompensa.comercioNombre,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCanjeando(null);
    }, 600);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
            <Coins className="h-3.5 w-3.5 text-brand-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">Mis Puntos</h1>
        </div>
        <p className="text-xs text-muted-foreground">Puntos de la red Taller Aval — datos de ejemplo por ahora.</p>
      </div>

      {/* Saldo */}
      <div className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-md shadow-brand-500/20">
        <p className="text-xs font-semibold text-white/80">Tu saldo disponible</p>
        <p className="mt-1 text-4xl font-black tracking-tight">{saldo.toLocaleString("es-CO")} pts</p>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/80">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Ganás puntos cada vez que pagás un servicio o producto en un comercio de la red Taller Aval. Más adelante
          también los vas a poder redimir en otros comercios aliados, aunque sean de otro rubro.
        </p>
      </div>

      {/* Catálogo de canje */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Canjear puntos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {RECOMPENSAS_MOCK.map((r) => {
            const alcanza = saldo >= r.puntosNecesarios;
            const estaCanjeando = canjeando === r.id;
            return (
              <div key={r.id} className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{r.comercioNombre}</p>
                <h3 className="mt-1 text-sm font-bold text-foreground">{r.titulo}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{r.descripcion}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                    <Coins className="h-3 w-3" /> {r.puntosNecesarios} pts
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!alcanza || estaCanjeando}
                  onClick={() => handleCanjear(r.id)}
                  className={cn(
                    "mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all",
                    alcanza && !estaCanjeando
                      ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
                      : "cursor-not-allowed bg-black/5 text-muted-foreground"
                  )}
                >
                  <Gift className="h-3.5 w-3.5" />
                  {estaCanjeando ? "Canjeando..." : alcanza ? "Canjear" : "Te faltan puntos"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Historial de movimientos</h2>
        <div className="space-y-2">
          {historial.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-4 py-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    m.tipo === "ganado" ? "bg-emerald-500/10 text-emerald-600" : "bg-black/5 text-muted-foreground"
                  )}
                >
                  {m.tipo === "ganado" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">{m.motivo}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {m.comercioNombre} · {formatFecha(m.createdAt)}
                  </p>
                </div>
              </div>
              <span className={cn("shrink-0 text-sm font-black", m.tipo === "ganado" ? "text-emerald-600" : "text-foreground")}>
                {m.puntos > 0 ? "+" : ""}
                {m.puntos}
              </span>
            </div>
          ))}
          {historial.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-10 text-center">
              <Sparkles className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Todavía no tenés movimientos de puntos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
