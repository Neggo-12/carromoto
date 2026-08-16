import { Star, Clock, Target, CalendarClock, ShieldCheck, Info, Trophy } from "lucide-react";
import { MI_TALLER_MOCK } from "@/lib/tallerData";
import { calcularScore, nivelPorScore, factoresPorTallerId, NIVELES_TALLER } from "@/lib/scoreData";
import { cn } from "@/lib/utils";

/**
 * "Mi Score" — el motor de calidad que pidió el negocio para poder priorizar
 * los mejores talleres cuando haya muchos en un mismo sector. Por ahora esto
 * SOLO le da al taller una insignia (Bronce/Plata/Oro/Platino) y potenciales
 * beneficios de destacado — todavía no cambia el orden de "Buscar Talleres"
 * (esa decisión queda para más adelante, ver src/lib/scoreData.ts).
 */
export default function TallerScore() {
  const factores = factoresPorTallerId(MI_TALLER_MOCK.id);

  if (!factores) {
    return <p className="text-sm text-muted-foreground">Todavía no hay datos de score para este taller.</p>;
  }

  const score = calcularScore(factores);
  const nivel = nivelPorScore(score);
  const totalLeads = factores.leadsGanados + factores.leadsPerdidos;
  const tasaConversion = totalLeads > 0 ? Math.round((factores.leadsGanados / totalLeads) * 100) : 0;

  const siguienteNivel = NIVELES_TALLER.find((n) => n.minScore > score);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500/10">
            <Trophy className="h-3.5 w-3.5 text-signal-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">Mi Score</h1>
        </div>
        <p className="text-xs text-muted-foreground">Qué tan bien te está yendo en servicio y calidad — datos de ejemplo por ahora.</p>
      </div>

      {/* Score total + nivel */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Tu score actual</p>
            <p className="mt-1 text-4xl font-black tracking-tight text-foreground">{score}<span className="text-lg text-muted-foreground">/100</span></p>
          </div>
          <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black", nivel.bg, nivel.color)}>
            <Trophy className="h-4 w-4" /> Nivel {nivel.label}
          </span>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-signal-500 to-signal-600" style={{ width: `${score}%` }} />
        </div>

        {siguienteNivel ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Te faltan <strong className="text-foreground">{siguienteNivel.minScore - score} puntos</strong> para llegar a nivel {siguienteNivel.label}.
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">Estás en el nivel más alto. ¡Excelente trabajo!</p>
        )}
      </div>

      {/* Aviso sobre qué hace hoy el score */}
      <div className="flex items-start gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-xs text-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>
          Por ahora tu score te da insignia y prioridad para destacar tus promociones. Todavía no cambia el orden en
          que apareces en "Buscar Talleres" — eso lo vamos a ir habilitando más adelante.
        </p>
      </div>

      {/* Desglose por factor */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Cómo se calcula</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-bold text-foreground">Calificación de clientes</p>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">{factores.calificacionClientes.toFixed(1)} / 5</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Promedio de las reseñas que dejan tus clientes. Pesa 35% del score.</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              <p className="text-xs font-bold text-foreground">Velocidad de respuesta</p>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">{factores.tiempoRespuestaHoras}h</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Qué tan rápido respondés los leads nuevos de tu CRM. Pesa 20% del score.</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-foreground">Leads ganados vs. perdidos</p>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">{tasaConversion}%</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {factores.leadsGanados} ganados de {totalLeads} en tu CRM. Pesa 25% del score.
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-signal-600" />
              <p className="text-xs font-bold text-foreground">Antigüedad y actividad</p>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">{factores.mesesActivo} {factores.mesesActivo === 1 ? "mes" : "meses"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Tiempo activo en Taller Aval. Pesa 10% del score.</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:col-span-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-600" />
              <p className="text-xs font-bold text-foreground">Historial de registro en la plataforma</p>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">{factores.historialLimpio ? "Limpio" : "Con reportes"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Sin quejas ni reportes graves desde que te registraste. Pesa 10% del score.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
