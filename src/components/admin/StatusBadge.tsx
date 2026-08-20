import { Check, Clock, X } from "lucide-react";
import type { EstadoAprobacion } from "@/lib/estados";
import { cn } from "@/lib/utils";

const CONFIG: Record<EstadoAprobacion, { label: string; icon: typeof Check; className: string }> = {
  aprobado: { label: "Aprobado", icon: Check, className: "bg-emerald-500/10 text-emerald-700" },
  pendiente: { label: "Pendiente", icon: Clock, className: "bg-amber-500/10 text-amber-700" },
  rechazado: { label: "Rechazado", icon: X, className: "bg-red-500/10 text-red-700" },
};

/** Insignia de estado — color reservado (verde/ámbar/rojo), siempre con ícono + texto, nunca solo color. */
export function StatusBadge({ estado }: { estado: EstadoAprobacion }) {
  const { label, icon: Icon, className } = CONFIG[estado];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
