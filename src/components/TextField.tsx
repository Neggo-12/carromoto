import { useId } from "react";
import type { ElementType, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ElementType;
  accent?: "brand" | "signal";
  helpText?: string;
  prefix?: string;
}

const accentRing: Record<"brand" | "signal", string> = {
  brand: "focus-within:border-brand-500 focus-within:ring-brand-500/15",
  signal: "focus-within:border-signal-500 focus-within:ring-signal-500/15",
};

export function TextField({
  label,
  value,
  onChange,
  icon: Icon,
  accent = "brand",
  helpText,
  prefix,
  required,
  ...rest
}: TextFieldProps) {
  const inputId = useId();
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold text-foreground">
        {label} {required && <span className="text-signal-600">*</span>}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-3 shadow-sm transition-all focus-within:ring-4",
          accentRing[accent]
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        {prefix && <span className="shrink-0 text-sm font-semibold text-muted-foreground">{prefix}</span>}
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          {...rest}
        />
      </div>
      {helpText && <p className="mt-1.5 text-[11px] text-muted-foreground">{helpText}</p>}
    </div>
  );
}
