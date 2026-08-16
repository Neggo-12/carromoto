import type { ElementType } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  icon?: ElementType;
  accent?: "slate" | "emerald" | "amber" | "red" | "brand";
  hint?: string;
}

const ACCENT_BG: Record<NonNullable<StatTileProps["accent"]>, string> = {
  slate: "bg-slate-900/5 text-slate-700",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
  red: "bg-red-500/10 text-red-600",
  brand: "bg-brand-500/10 text-brand-600",
};

/**
 * Tarjeta KPI — label en sentence case, valor grande, ícono con su propio
 * bloque de color. Un dato por tarjeta, nada de saturarla.
 */
export function StatTile({ label, value, icon: Icon, accent = "slate", hint }: StatTileProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        {Icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", ACCENT_BG[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
