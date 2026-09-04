import { useEffect, useState } from "react";
import { FileText, MessageCircle, Loader2, Send, ClipboardList, History, ExternalLink } from "lucide-react";
import { Modal } from "@/components/Modal";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";
import {
  DOCUMENTOS_TALLER,
  ESTADOS_DOCUMENTO,
  ESTILO_ESTADO_DOCUMENTO,
  enlaceWhatsappDocumentos,
  type DocumentoTaller,
  type NotaTaller,
  type EstadoDocumento,
} from "@/lib/tallerCrm";

interface TallerCrmModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  nombreTaller: string;
  celular: string | null;
}

function tiempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return `hace ${dias} d`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Mini CRM interno del admin para un taller puntual — checklist de
 * documentos de afiliación + bitácora de gestión. Ver 0019_crm_documentos_talleres.sql.
 * Nada de esto lo ve el taller: es una herramienta de trabajo del admin,
 * pensada para responder "¿qué le falta a este taller y qué hemos hablado
 * con él?" sin tener que recordarlo de memoria.
 */
export function TallerCrmModal({ open, onClose, organizationId, nombreTaller, celular }: TallerCrmModalProps) {
  const { perfil } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [documentos, setDocumentos] = useState<DocumentoTaller[]>([]);
  const [notas, setNotas] = useState<NotaTaller[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [notaAbierta, setNotaAbierta] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let activo = true;

    async function cargar() {
      setCargando(true);
      // Crea las 5 filas de documentos si es la primera vez que se abre el
      // CRM de este taller — idempotente, nunca pisa un estado ya guardado.
      await supabase
        .from("taller_documentos")
        .upsert(
          DOCUMENTOS_TALLER.map((d) => ({ organization_id: organizationId, tipo: d.tipo })),
          { onConflict: "organization_id,tipo", ignoreDuplicates: true }
        );

      const [{ data: docs }, { data: notasData }] = await Promise.all([
        supabase.from("taller_documentos").select("*").eq("organization_id", organizationId),
        supabase
          .from("taller_notas")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),
      ]);
      if (!activo) return;

      const listaNotas = (notasData as NotaTaller[]) ?? [];
      const autorIds = [...new Set(listaNotas.map((n) => n.autor_id))];
      let nombresPorId: Record<string, string | null> = {};
      if (autorIds.length > 0) {
        const { data: autores } = await supabase.from("users").select("id, nombre").in("id", autorIds);
        nombresPorId = Object.fromEntries((autores ?? []).map((a) => [a.id as string, a.nombre as string | null]));
      }

      setDocumentos((docs as DocumentoTaller[]) ?? []);
      setNotas(listaNotas.map((n) => ({ ...n, autor_nombre: nombresPorId[n.autor_id] ?? null })));
      setCargando(false);
    }
    void cargar();
    return () => {
      activo = false;
    };
  }, [open, organizationId]);

  async function cambiarEstado(tipo: string, estado: EstadoDocumento) {
    setDocumentos((prev) => prev.map((d) => (d.tipo === tipo ? { ...d, estado } : d)));
    await supabase
      .from("taller_documentos")
      .update({ estado, actualizado_por: perfil?.id ?? null, updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("tipo", tipo);
  }

  async function guardarNotaDocumento(tipo: string, texto: string) {
    setDocumentos((prev) => prev.map((d) => (d.tipo === tipo ? { ...d, notas: texto } : d)));
    await supabase
      .from("taller_documentos")
      .update({ notas: texto || null, actualizado_por: perfil?.id ?? null, updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("tipo", tipo);
  }

  async function agregarNota() {
    const texto = nuevaNota.trim();
    if (!texto || !perfil) return;
    setGuardandoNota(true);
    const { data } = await supabase
      .from("taller_notas")
      .insert({ organization_id: organizationId, autor_id: perfil.id, texto })
      .select()
      .single();
    if (data) {
      setNotas((prev) => [{ ...(data as NotaTaller), autor_nombre: perfil.nombre }, ...prev]);
      setNuevaNota("");
    }
    setGuardandoNota(false);
  }

  const faltantes = documentos.filter((d) => d.estado === "pendiente" || d.estado === "rechazado").length;
  const enlaceWa = enlaceWhatsappDocumentos(nombreTaller, celular, documentos);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={nombreTaller}
      description={
        faltantes > 0
          ? `Faltan ${faltantes} documento${faltantes === 1 ? "" : "s"} por resolver.`
          : documentos.length > 0
            ? "Toda la documentación está al día."
            : undefined
      }
    >
      {cargando ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Documentación ── */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                <ClipboardList className="h-3.5 w-3.5" /> Documentación
              </h3>
              {enlaceWa ? (
                <a
                  href={enlaceWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Pedir por WhatsApp
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              ) : (
                faltantes > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400">Sin celular registrado para escribirle</span>
                )
              )}
            </div>

            <div className="space-y-2">
              {DOCUMENTOS_TALLER.map((def) => {
                const doc = documentos.find((d) => d.tipo === def.tipo);
                const estado = doc?.estado ?? "pendiente";
                const abierta = notaAbierta === def.tipo;
                return (
                  <div key={def.tipo} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800">{def.label}</p>
                          {def.condicion && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-500">
                              {def.condicion}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{def.descripcion}</p>
                      </div>
                      <select
                        value={estado}
                        onChange={(e) => void cambiarEstado(def.tipo, e.target.value as EstadoDocumento)}
                        className={cn(
                          "shrink-0 rounded-lg border-0 px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-offset-1",
                          ESTILO_ESTADO_DOCUMENTO[estado]
                        )}
                      >
                        {ESTADOS_DOCUMENTO.map((e) => (
                          <option key={e.value} value={e.value}>
                            {e.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {abierta ? (
                      <input
                        autoFocus
                        type="text"
                        defaultValue={doc?.notas ?? ""}
                        placeholder="Nota sobre este documento (opcional)"
                        onBlur={(e) => {
                          setNotaAbierta(null);
                          void guardarNotaDocumento(def.tipo, e.target.value.trim());
                        }}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                      />
                    ) : doc?.notas ? (
                      <button
                        type="button"
                        onClick={() => setNotaAbierta(def.tipo)}
                        className="mt-2 block w-full rounded-lg bg-slate-50 px-2.5 py-1.5 text-left text-[11px] text-slate-600 hover:bg-slate-100"
                      >
                        {doc.notas}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNotaAbierta(def.tipo)}
                        className="mt-1.5 text-[11px] font-semibold text-slate-400 hover:text-brand-600"
                      >
                        + Agregar nota
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Bitácora ── */}
          <section className="border-t border-slate-100 pt-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
              <History className="h-3.5 w-3.5" /> Bitácora de gestión
            </h3>

            <div className="flex items-start gap-2">
              <textarea
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                placeholder="Ej: Llamé al encargado, quedó en enviar el RUT esta semana."
                rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
              <button
                type="button"
                onClick={() => void agregarNota()}
                disabled={!nuevaNota.trim() || guardandoNota}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Agregar nota"
              >
                {guardandoNota ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
              {notas.length === 0 ? (
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <FileText className="h-3.5 w-3.5" /> Todavía no hay notas sobre este taller.
                </p>
              ) : (
                notas.map((n) => (
                  <div key={n.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs leading-relaxed text-slate-700">{n.texto}</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      {n.autor_nombre ?? "Admin"} · {tiempoRelativo(n.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
