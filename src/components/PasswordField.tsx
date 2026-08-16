import { useId, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accent?: "brand" | "signal";
  required?: boolean;
  autoComplete?: string;
  helpText?: string;
}

const accentRing: Record<"brand" | "signal", string> = {
  brand: "focus-within:border-brand-500 focus-within:ring-brand-500/15",
  signal: "focus-within:border-signal-500 focus-within:ring-signal-500/15",
};

export function PasswordField({
  label,
  value,
  onChange,
  placeholder = "••••••••",
  accent = "brand",
  required,
  autoComplete = "new-password",
  helpText,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
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
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helpText && <p className="mt-1.5 text-[11px] text-muted-foreground">{helpText}</p>}
    </div>
  );
}
