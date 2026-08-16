import { Copy } from "lucide-react";
import { DIAS_SEMANA } from "@/lib/data";

export interface DaySchedule {
  abierto: boolean;
  desde: string;
  hasta: string;
}

export type WeekSchedule = Record<(typeof DIAS_SEMANA)[number], DaySchedule>;

export function defaultSchedule(): WeekSchedule {
  const base: Partial<WeekSchedule> = {};
  for (const dia of DIAS_SEMANA) {
    base[dia] = { abierto: dia !== "Domingo", desde: "08:00", hasta: "18:00" };
  }
  return base as WeekSchedule;
}

const HORAS = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

interface ScheduleEditorProps {
  value: WeekSchedule;
  onChange: (value: WeekSchedule) => void;
  accent?: "brand" | "signal";
}

/**
 * Horario semanal — un toggle abierto/cerrado + rango de horas por día,
 * con un atajo para copiar el horario de Lunes al resto de la semana
 * (el caso más común, para no obligar a llenar 7 filas a mano).
 */
export function ScheduleEditor({ value, onChange, accent = "signal" }: ScheduleEditorProps) {
  const activeBg = accent === "signal" ? "bg-signal-500" : "bg-brand-500";

  function updateDay(dia: (typeof DIAS_SEMANA)[number], patch: Partial<DaySchedule>) {
    onChange({ ...value, [dia]: { ...value[dia], ...patch } });
  }

  function copyMondayToAll() {
    const lunes = value["Lunes"];
    const next: WeekSchedule = { ...value };
    for (const dia of DIAS_SEMANA) {
      if (dia === "Lunes") continue;
      next[dia] = { ...lunes };
    }
    onChange(next);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">Horario por día</span>
        <button
          type="button"
          onClick={copyMondayToAll}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="h-3 w-3" />
          Copiar horario de Lunes a todos
        </button>
      </div>

      <div className="space-y-2">
        {DIAS_SEMANA.map((dia) => {
          const d = value[dia];
          return (
            <div
              key={dia}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 shadow-sm"
            >
              <button
                type="button"
                onClick={() => updateDay(dia, { abierto: !d.abierto })}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${d.abierto ? activeBg : "bg-black/15"}`}
                aria-label={`${dia} ${d.abierto ? "abierto" : "cerrado"}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    d.abierto ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="w-20 shrink-0 text-xs font-bold text-foreground">{dia}</span>

              {d.abierto ? (
                <div className="flex flex-1 items-center gap-2">
                  <select
                    value={d.desde}
                    onChange={(e) => updateDay(dia, { desde: e.target.value })}
                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-medium text-foreground focus:outline-none"
                  >
                    {HORAS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">a</span>
                  <select
                    value={d.hasta}
                    onChange={(e) => updateDay(dia, { hasta: e.target.value })}
                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-medium text-foreground focus:outline-none"
                  >
                    {HORAS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="flex-1 text-xs font-medium text-muted-foreground">Cerrado</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
