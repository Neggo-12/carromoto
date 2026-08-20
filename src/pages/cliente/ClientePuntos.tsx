import { Coins, Info } from "lucide-react";

/**
 * "Mis Puntos" — el saldo real de puntos lo maneja un proyecto externo y
 * separado, "Puntos Neggo" (ver notas en supabase/migrations/0002_puntos_
 * score.sql y 0004_comprobantes_puntos_neggo.sql: Taller Aval nunca guarda
 * el saldo como verdad, solo genera un comprobante y le avisa a Puntos
 * Neggo server-to-server). Esa integración todavía no está conectada en
 * este proyecto, así que esta pantalla no muestra un saldo ni un historial
 * inventados — cuando la integración exista, esto se reemplaza por el saldo
 * real.
 */
export default function ClientePuntos() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
            <Coins className="h-3.5 w-3.5 text-brand-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">Mis Puntos</h1>
        </div>
        <p className="text-xs text-muted-foreground">Puntos de la red Taller Aval.</p>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
          <Coins className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="mt-4 text-sm font-bold text-foreground">Todavía no está conectado</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Tu saldo de puntos se calcula del lado de Puntos Neggo. Apenas esa conexión esté lista, vas a ver acá tu
          saldo real y tu historial de movimientos.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-xs text-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>
          Ganás puntos cada vez que pagás un servicio o producto en un comercio de la red Taller Aval — el taller ya
          genera un comprobante por cada venta (ver "Comprobantes" en su panel), solo falta activar el envío de
          puntos.
        </p>
      </div>
    </div>
  );
}
