import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wrench, ScrollText } from "lucide-react";

/**
 * Layout compartido para las páginas legales públicas (/legal/terminos,
 * /legal/privacidad). Deliberadamente simple y de lectura fácil — es
 * texto legal, no una pantalla de producto. El contenido de cada página
 * debe reflejar exactamente lo que hay en legal/*.md (ver legal/README.md).
 */
export function LegalPageLayout({
  titulo,
  version,
  vigenteDesde,
  children,
}: {
  titulo: string;
  version: string;
  vigenteDesde: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
              <Wrench className="h-4 w-4 text-brand-600" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-foreground">Tallergo</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10">
            <ScrollText className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{titulo}</h1>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Versión {version} · Vigente desde {vigenteDesde}
            </p>
          </div>
        </div>

        <div className="prose-legal space-y-6 text-sm leading-relaxed text-foreground/90">{children}</div>
      </main>
    </div>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-foreground">{titulo}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

export function Pendiente({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 font-mono text-[0.85em] font-bold text-amber-700">
      [PENDIENTE — {children}]
    </span>
  );
}
