import { ShieldCheck } from "lucide-react";

// Código ilustrativo — cuando haya login real conectado a Supabase, este
// código será personal de cada cliente (viene del backend, no se inventa en
// el navegador). Por ahora es fijo, solo para mostrar cómo se va a ver.
const CODIGO_DEMO = "482 917";

/**
 * Aviso anti-suplantación: si alguien de Taller Aval llama o escribe al
 * cliente, debe decir este código para que el cliente confirme que es real.
 * Es distinto del código de verificación que se genera al contactar a un
 * taller (ese es específico de cada solicitud, ver Buscar Talleres).
 */
export function AntiPhishingBanner() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-brand-500/15 bg-brand-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
        </div>
        <span className="text-xs text-muted-foreground">
          Si alguien de Taller Aval te contacta, te dirá este código para que confirmes que es real
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
          Protegido
        </span>
        <span className="font-mono text-xs font-black tracking-[0.1em] text-brand-700 tabular-nums">{CODIGO_DEMO}</span>
      </div>
    </div>
  );
}
