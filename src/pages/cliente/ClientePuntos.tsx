import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Info, Gift, Copy, Check, Users, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";

interface MovimientoResumen {
  tipo: string;
  puntos: number;
}

interface Referido {
  referido_nombre: string;
  referido_codigo: string | null;
  fecha: string;
  puntos_otorgados: number;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Mis Puntos" — hay dos fuentes de puntos completamente distintas y no hay
 * que confundirlas:
 *   1) Bienvenida y referidos: Tallergo SÍ es la fuente de verdad (viven en
 *      cliente_puntos_movimientos, esta misma base) — por eso acá se pueden
 *      mostrar de una, apenas se otorgan. Antes esta pantalla no mostraba
 *      NADA de saldo, lo que hacía ver la campaña de bienvenida como
 *      inventada ("dice que gané puntos pero no los veo en ningún lado").
 *   2) Puntos por compras/servicios pagados en un taller: esos SÍ dependen
 *      de la integración real con Puntos Neggo (proyecto externo, todavía no
 *      conectada) — no se inventa un saldo de esos acá.
 */
export default function ClientePuntos() {
  const { perfil } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      const [{ data: movimientos }, { data: misReferidos }] = await Promise.all([
        supabase.from("cliente_puntos_movimientos").select("tipo, puntos"),
        supabase.rpc("mis_referidos"),
      ]);
      if (!activo) return;
      const total = ((movimientos as MovimientoResumen[]) ?? []).reduce((acc, m) => acc + m.puntos, 0);
      setSaldo(total);
      setReferidos((misReferidos as Referido[]) ?? []);
      setCargando(false);
    }
    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  function copiarCodigo() {
    if (!perfil?.codigoReferido) return;
    navigator.clipboard
      .writeText(perfil.codigoReferido)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      })
      .catch(() => {
        /* si el navegador bloquea el portapapeles, el código ya está visible para copiar a mano */
      });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
            <Coins className="h-3.5 w-3.5 text-brand-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">Mis Puntos</h1>
        </div>
        <p className="text-xs text-muted-foreground">Puntos de la red Tallergo.</p>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
          <Coins className="h-6 w-6 text-brand-600" />
        </div>
        {cargando ? (
          <p className="mt-4 text-xs text-muted-foreground">Cargando su saldo...</p>
        ) : (
          <>
            <p className="mt-4 text-4xl font-black tracking-tight text-foreground">{saldo.toLocaleString("es-CO")}</p>
            <p className="text-xs font-semibold text-muted-foreground">puntos acumulados</p>
          </>
        )}
        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Pronto podrá redimirlos — por ahora, sigue acumulando cada vez que gana puntos de bienvenida o por referir a
          alguien.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-xs text-foreground">
        <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>
          Gana puntos cada vez que paga un servicio o producto en un comercio de la red Tallergo — el taller ya
          genera un comprobante por cada venta (ver "Comprobantes" en su panel), solo falta activar el envío de esos
          puntos al saldo de arriba.
        </p>
      </div>

      {/* ── Mi código de invitación ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10">
            <Gift className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Invite y gane</h2>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Comparta su código con otras personas. Cuando alguien se registre usándolo, usted gana puntos — sin tener
          que darle su cédula ni ningún otro dato personal.
        </p>

        {perfil?.codigoReferido && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-3 text-center">
              <span className="text-xl font-black tracking-[0.3em] text-amber-700">{perfil.codigoReferido}</span>
            </div>
            <button
              type="button"
              onClick={copiarCodigo}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-muted-foreground transition-colors hover:bg-black/[0.03] hover:text-foreground"
              title="Copiar código"
            >
              {copiado ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}

        <div className="mt-5 border-t border-black/[0.06] pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Users className="h-3.5 w-3.5 text-brand-600" /> Mis referidos
          </p>
          {referidos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Todavía no ha referido a nadie con su código.</p>
          ) : (
            <div className="space-y-2">
              {referidos.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.06] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{r.referido_nombre}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.referido_codigo ? <span className="font-mono">{r.referido_codigo}</span> : null}
                      {r.referido_codigo ? " · " : ""}
                      {formatFecha(r.fecha)}
                    </p>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " +
                      (r.puntos_otorgados > 0
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-black/[0.04] text-muted-foreground")
                    }
                  >
                    {r.puntos_otorgados > 0 ? `+${r.puntos_otorgados} puntos` : "Sin puntos todavía"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-slate-50 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Vea cómo, cuándo y cuánto vale cada punto en las{" "}
          <Link to="/legal/condiciones-puntos" target="_blank" className="font-bold text-brand-700 hover:underline">
            Condiciones de Puntos
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
