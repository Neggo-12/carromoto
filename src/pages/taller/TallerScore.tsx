import { Star, Clock, Target, CalendarClock, ShieldCheck, Info, Trophy } from "lucide-react";

/**
 * "Mi Score" — el motor de calidad que pidió el negocio para priorizar los
 * mejores talleres cuando haya muchos en un mismo sector. Todavía no hay
 * datos reales para calcularlo (faltan reseñas de clientes, medición de
 * tiempo de respuesta e historial — taller_score_factores existe en la base
 * pero está vacía), así que esta pantalla no muestra un número inventado:
 * explica cómo se va a calcular y qué falta.
 */
export default function TallerScore() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500/10">
            <Trophy className="h-3.5 w-3.5 text-signal-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">Mi Score</h1>
        </div>
        <p className="text-xs text-muted-foreground">Qué tan bien te está yendo en servicio y calidad.</p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-xs text-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>
          Todavía no tenemos suficientes datos tuyos para calcular tu score — necesitamos reseñas de clientes y más
          actividad en tu CRM. Apenas los tengamos, vas a ver tu número acá.
        </p>
      </div>

      {/* Desglose por factor — metodología, sin números todavía */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Cómo se va a calcular</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-bold text-foreground">Calificación de clientes</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Promedio de las reseñas que dejan tus clientes. Va a pesar 35% del score.</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              <p className="text-xs font-bold text-foreground">Velocidad de respuesta</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Qué tan rápido respondés los leads nuevos de tu CRM. Va a pesar 20% del score.</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-foreground">Leads ganados vs. perdidos</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Cuántos leads marcás como "Ganado" en tu CRM. Va a pesar 25% del score.</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-signal-600" />
              <p className="text-xs font-bold text-foreground">Antigüedad y actividad</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tiempo activo en Taller Aval. Va a pesar 10% del score.</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:col-span-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-600" />
              <p className="text-xs font-bold text-foreground">Historial de registro en la plataforma</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Sin quejas ni reportes graves desde que te registraste. Va a pesar 10% del score.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
