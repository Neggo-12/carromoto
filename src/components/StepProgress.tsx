import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: string[];
  current: number; // 0-indexed
  accent?: "brand" | "signal";
}

/**
 * Indicador de progreso del wizard — punto por paso, con el tramo
 * recorrido animándose y una etiqueta del paso actual. Pensado para que
 * llenar un formulario largo se sienta como un recorrido con dirección
 * clara, no una planilla infinita.
 */
export function StepProgress({ steps, current, accent = "brand" }: StepProgressProps) {
  const dotActive = accent === "brand" ? "bg-brand-500 border-brand-500" : "bg-signal-500 border-signal-500";
  const barActive = accent === "brand" ? "bg-brand-500" : "bg-signal-500";
  const textActive = accent === "brand" ? "text-brand-700" : "text-signal-700";

  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((_, i) => (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
                i < current
                  ? cn(dotActive, "text-white")
                  : i === current
                  ? cn("bg-white", dotActive.split(" ")[1], textActive)
                  : "border-black/15 bg-white text-muted-foreground"
              )}
            >
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="relative mx-1.5 h-0.5 flex-1 overflow-hidden rounded-full bg-black/10">
                <motion.div
                  initial={false}
                  animate={{ width: i < current ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn("absolute inset-y-0 left-0 rounded-full", barActive)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className={cn("mt-2.5 text-xs font-bold uppercase tracking-wider", textActive)}>
        Paso {current + 1} de {steps.length} — {steps[current]}
      </p>
    </div>
  );
}
