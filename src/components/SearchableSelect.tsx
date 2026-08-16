import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  accent?: "brand" | "signal";
  /** Si es true, el usuario puede quedarse con lo que escribió aunque no esté en `options` (ej. barrio). */
  creatable?: boolean;
  required?: boolean;
  helpText?: string;
}

const accentRing: Record<"brand" | "signal", string> = {
  brand: "focus-within:border-brand-500 focus-within:ring-brand-500/15",
  signal: "focus-within:border-signal-500 focus-within:ring-signal-500/15",
};
const accentText: Record<"brand" | "signal", string> = {
  brand: "text-brand-600",
  signal: "text-signal-600",
};

/**
 * Combobox con búsqueda — reemplaza el <select> plano por algo que se
 * siente premium: escribís, filtra en vivo, elegís con mouse o teclado.
 * `creatable` permite quedarse con texto libre (barrio) cuando no hay
 * coincidencia exacta en la lista de sugerencias.
 */
export function SearchableSelect({
  label,
  placeholder = "Escribí para buscar…",
  value,
  onChange,
  options,
  accent = "brand",
  creatable = false,
  required,
  helpText,
}: SearchableSelectProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Si es creatable, lo que haya escrito queda como valor válido.
        if (creatable && query.trim()) onChange(query.trim());
        else if (!creatable && query !== value) setQuery(value);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, value, creatable]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 8);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 8);
  }, [options, query]);

  function select(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold text-foreground">
        {label} {required && <span className="text-signal-600">*</span>}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-3 shadow-sm transition-all",
          "focus-within:ring-4",
          accentRing[accent]
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          id={inputId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[highlight]) select(filtered[highlight]);
              else if (creatable && query.trim()) select(query.trim());
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </div>

      {helpText && !open && <p className="mt-1.5 text-[11px] text-muted-foreground">{helpText}</p>}

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1.5 shadow-xl"
          >
            {filtered.map((option, i) => (
              <li key={option}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(option)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                    i === highlight ? "bg-black/[0.04] text-foreground" : "text-foreground/80"
                  )}
                >
                  {option}
                  {option === value && <Check className={cn("h-4 w-4", accentText[accent])} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
        {open && creatable && filtered.length === 0 && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-20 mt-1.5 w-full rounded-xl border border-black/10 bg-white p-3 text-xs text-muted-foreground shadow-xl"
          >
            Usar "<span className="font-bold text-foreground">{query.trim()}</span>" — no está en la lista pero lo guardamos igual.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
