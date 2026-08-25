import { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Gift, Loader2, CheckCircle2, FileDown, Store, Trophy } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

// ───── Campaña de bienvenida (100 puntos) ─────

interface ConfigBienvenida {
  activa: boolean;
  puntos: number;
}

function CampanaBienvenidaPanel() {
  const [config, setConfig] = useState<ConfigBienvenida | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("campana_bienvenida").select("activa, puntos").eq("id", "global").maybeSingle();
      if (data) setConfig(data as ConfigBienvenida);
      setCargando(false);
    })();
  }, []);

  async function guardar(next: ConfigBienvenida) {
    setConfig(next);
    setGuardando(true);
    setGuardado(false);
    const { error } = await supabase.from("campana_bienvenida").update(next).eq("id", "global");
    setGuardando(false);
    if (!error) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15">
          <Gift className="h-4.5 w-4.5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900">Campaña de bienvenida</h2>
          <p className="text-xs text-slate-500">100 puntos automáticos para los clientes que se registren mientras esté activa.</p>
        </div>
      </div>

      {cargando ? (
        <div className="mt-6 flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : config ? (
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={config.activa}
              onClick={() => guardar({ ...config, activa: !config.activa })}
              disabled={guardando}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
                config.activa ? "bg-emerald-500" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  config.activa ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <span className={cn("text-sm font-bold", config.activa ? "text-emerald-700" : "text-slate-500")}>
              {config.activa ? "Activa — se está otorgando" : "Apagada"}
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Puntos por registro
            <input
              type="number"
              min={1}
              value={config.puntos}
              onChange={(e) => setConfig({ ...config, puntos: Math.max(1, Number(e.target.value) || 1) })}
              onBlur={() => guardar(config)}
              className="h-9 w-24 rounded-lg border border-slate-200 px-2.5 text-sm font-bold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
          </label>

          {guardado && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
            </span>
          )}
        </div>
      ) : null}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
        Se aplica solo a clientes que se registren de ahora en adelante, nunca a cuentas que ya existían. El otorgamiento
        queda registrado para cuando esté conectado el sistema real de puntos — todavía no se envían puntos reales.
      </p>
    </div>
  );
}

// ───── Exportar campañas de talleres a PDF ─────

interface TallerConCampanas {
  id: string;
  name: string;
  ciudad: string | null;
  direccion: string | null;
  barrio: string | null;
  campanas: { titulo: string; descripcion: string | null; cupoMaximo: number | null; interesados: number }[];
}

function ExportarCampanasPanel() {
  const [talleres, setTalleres] = useState<TallerConCampanas[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, ciudad, metadata")
      .eq("status", "aprobado")
      .order("name", { ascending: true });

    const filas = (orgs ?? []) as { id: string; name: string; ciudad: string | null; metadata: { direccion?: string; barrio?: string } | null }[];
    const ids = filas.map((o) => o.id);

    let campanasPorTaller: Record<string, TallerConCampanas["campanas"]> = {};
    if (ids.length > 0) {
      const { data: campanas } = await supabase
        .from("campanas")
        .select("id, organization_id, titulo, descripcion, cupo_maximo")
        .in("organization_id", ids)
        .eq("estado", "activa")
        .order("created_at", { ascending: false });

      const campanaIds = (campanas ?? []).map((c) => c.id as string);
      let conteos: Record<string, number> = {};
      if (campanaIds.length > 0) {
        const { data: solicitudes } = await supabase.from("oferta_solicitudes").select("campana_id").in("campana_id", campanaIds);
        conteos = (solicitudes ?? []).reduce<Record<string, number>>((acc, s) => {
          acc[s.campana_id as string] = (acc[s.campana_id as string] ?? 0) + 1;
          return acc;
        }, {});
      }

      campanasPorTaller = (campanas ?? []).reduce<Record<string, TallerConCampanas["campanas"]>>((acc, c) => {
        const orgId = c.organization_id as string;
        if (!acc[orgId]) acc[orgId] = [];
        acc[orgId].push({
          titulo: c.titulo as string,
          descripcion: c.descripcion as string | null,
          cupoMaximo: c.cupo_maximo as number | null,
          interesados: conteos[c.id as string] ?? 0,
        });
        return acc;
      }, {});
    }

    const resultado: TallerConCampanas[] = filas.map((o) => ({
      id: o.id,
      name: o.name,
      ciudad: o.ciudad,
      direccion: o.metadata?.direccion ?? null,
      barrio: o.metadata?.barrio ?? null,
      campanas: campanasPorTaller[o.id] ?? [],
    }));

    setTalleres(resultado);
    // Por defecto, seleccionados solo los que sí tienen campañas activas —
    // son los que realmente vale la pena mandar a los usuarios.
    setSeleccionados(new Set(resultado.filter((t) => t.campanas.length > 0).map((t) => t.id)));
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function toggle(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function seleccionarTodos() {
    setSeleccionados(new Set(talleres.map((t) => t.id)));
  }

  function seleccionarConCampanas() {
    setSeleccionados(new Set(talleres.filter((t) => t.campanas.length > 0).map((t) => t.id)));
  }

  function limpiarSeleccion() {
    setSeleccionados(new Set());
  }

  const talleresSeleccionados = useMemo(() => talleres.filter((t) => seleccionados.has(t.id)), [talleres, seleccionados]);
  const totalCampanas = useMemo(() => talleresSeleccionados.reduce((acc, t) => acc + t.campanas.length, 0), [talleresSeleccionados]);

  function generarPdf() {
    if (talleresSeleccionados.length === 0) return;
    setGenerando(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margenX = 40;
      let y = 50;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Tallergo — Campañas activas", margenX, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      const fecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
      doc.text(`Generado el ${fecha} — ${talleresSeleccionados.length} taller(es), ${totalCampanas} campaña(s)`, margenX, y);
      doc.setTextColor(20);
      y += 25;

      for (const taller of talleresSeleccionados) {
        if (y > 740) {
          doc.addPage();
          y = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(taller.name, margenX, y);
        y += 16;

        const ubicacion = [taller.direccion, taller.barrio, taller.ciudad].filter(Boolean).join(", ");
        if (ubicacion) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(110);
          doc.text(ubicacion, margenX, y);
          doc.setTextColor(20);
          y += 14;
        }

        if (taller.campanas.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor(140);
          doc.text("Sin campañas activas en este momento.", margenX, y);
          doc.setTextColor(20);
          y += 18;
        } else {
          const filas = taller.campanas.map((c) => [
            c.titulo,
            c.descripcion ?? "—",
            c.cupoMaximo ? `${c.interesados}/${c.cupoMaximo}` : "Sin límite",
          ]);
          autoTable(doc, {
            startY: y,
            margin: { left: margenX, right: margenX },
            head: [["Campaña", "Descripción", "Cupo"]],
            body: filas,
            styles: { fontSize: 9, cellPadding: 5 },
            headStyles: { fillColor: [30, 41, 59] },
            columnStyles: { 2: { cellWidth: 70 } },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          y = (doc as any).lastAutoTable.finalY + 22;
        }
      }

      doc.save(`tallergo-campanas-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-500/15">
          <Megaphone className="h-4.5 w-4.5 text-signal-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900">Exportar campañas a PDF</h2>
          <p className="text-xs text-slate-500">
            Elija los talleres a incluir y descargue un PDF con sus campañas activas, listo para compartir con los usuarios.
          </p>
        </div>
      </div>

      {cargando ? (
        <div className="mt-6 flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : talleres.length === 0 ? (
        <p className="mt-5 text-xs text-slate-400">Todavía no hay talleres aprobados.</p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={seleccionarTodos} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
              Seleccionar todos
            </button>
            <button type="button" onClick={seleccionarConCampanas} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
              Solo con campañas activas
            </button>
            <button type="button" onClick={limpiarSeleccion} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
              Limpiar selección
            </button>
          </div>

          <div className="mt-4 max-h-96 space-y-1.5 overflow-y-auto rounded-xl border border-slate-100 p-2">
            {talleres.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  seleccionados.has(t.id) ? "bg-brand-500/5" : "hover:bg-slate-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={seleccionados.has(t.id)}
                  onChange={() => toggle(t.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300"
                />
                <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">{t.name}</span>
                {t.campanas.length > 0 ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-signal-500/10 px-2 py-0.5 text-[10px] font-bold text-signal-700">
                    <Trophy className="h-3 w-3" /> {t.campanas.length} campaña{t.campanas.length === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-semibold text-slate-300">Sin campañas</span>
                )}
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {talleresSeleccionados.length} taller{talleresSeleccionados.length === 1 ? "" : "es"} seleccionado
              {talleresSeleccionados.length === 1 ? "" : "s"} · {totalCampanas} campaña{totalCampanas === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={generarPdf}
              disabled={talleresSeleccionados.length === 0 || generando}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Descargar PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ───── Vista principal ─────

export default function AdminCampanas() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Campañas</h1>
        <p className="mt-1 text-sm text-slate-500">Configure incentivos globales y comparta las campañas de los talleres con los usuarios.</p>
      </div>

      <div className="space-y-5">
        <CampanaBienvenidaPanel />
        <ExportarCampanasPanel />
      </div>
    </div>
  );
}
