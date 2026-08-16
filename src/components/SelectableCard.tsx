import type { ElementType } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectableCardProps {
  icon?: ElementType;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  accent?: "brand" | "signal";
  compact?: boolean;
}

/**
 * Tarjeta/chip seleccionable — usada para todo lo que en un form normal
 * sería un checkbox o radio aburrido: tipo de vehículo, servicios,
 * eléctrico sí/no. Da feedback visual claro (borde + check + glow) en vez
 * de una casilla gris de toda la vida.
 */
export function SelectableCard({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
  accent = "brand",
  compact = false,
}: SelectableCardProps) {
  const activeClasses =
    accent === "brand"
      ? "border-brand-500 bg-brand-500/[0.06] shadow-md shadow-brand-500/10"
      : "border-signal-500 bg-signal-500/[0.06] shadow-md shadow-signal-500/10";
  const checkBg = accent === "brand" ? "bg-brand-500" : "bg-signal-500";
  const iconActive = accent === "brand" ? "text-brand-600" : "text-signal-600";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border-2 text-left transition-colors",
        compact ? "px-4 py-2.5" : "p-4",
        selected ? activeClasses : "border-black/10 bg-white hover:border-black/20"
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            compact ? "h-8 w-8" : "h-10 w-10",
            selected ? "bg-white" : "bg-black/[0.04]"
          )}
        >
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", selected ? iconActive : "text-muted-foreground")} />
        </div>
      )}
      <div className="min-w-0">
        <div className={cn("font-bold text-foreground", compact ? "text-xs" : "text-sm")}>{label}</div>
        {description && <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{description}</div>}
      </div>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn("absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow", checkBg)}
        >
          <Check className="h-3 w-3" />
        </motion.span>
      )}
    </motion.button>
  );
}
