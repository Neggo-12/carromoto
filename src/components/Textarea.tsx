import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accent?: "brand" | "signal";
  helpText?: string;
}

const accentRing: Record<"brand" | "signal", string> = {
  brand: "focus-within:border-brand-500 focus-within:ring-brand-500/15",
  signal: "focus-within:border-signal-500 focus-within:ring-signal-500/15",
};

/** Misma piel visual que TextField, pero para textos largos. */
export function TextareaField({
  label,
  value,
  onChange,
  accent = "brand",
  helpText,
  required,
  rows = 4,
  ...rest
}: TextareaFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
        {label} {required && <span className="text-signal-600">*</span>}
      </label>
      <div
        className={cn(
          "rounded-xl border border-black/10 bg-white px-3.5 py-3 shadow-sm transition-all focus-within:ring-4",
          accentRing[accent]
        )}
      >
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={rows}
          className="w-full resize-none bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          {...rest}
        />
      </div>
      {helpText && <p className="mt-1.5 text-[11px] text-muted-foreground">{helpText}</p>}
    </div>
  );
}
