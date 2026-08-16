import { useState } from "react";
import { Users, Phone, MessageCircle, KeyRound, Calendar, AlertTriangle, Send, Gift, Search } from "lucide-react";
import { TextareaField } from "@/components/Textarea";
import {
  LEADS_MOCK,
  ESTADOS_LEAD,
  MI_TALLER_MOCK,
  mensajePredeterminado,
  linkWhatsapp,
  type LeadCRM,
  type EstadoLead,
} from "@/lib/tallerData";
import { cn } from "@/lib/utils";

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

const ESTADO_COLOR: Record<EstadoLead, string> = {
  nuevo: "bg-amber-500/10 text-amber-700",
  contactado: "bg-brand-500/10 text-brand-700",
  cotizado: "bg-signal-500/10 text-signal-600",
  ganado: "bg-emerald-500/10 text-emerald-700",
  perdido: "bg-black/5 text-muted-foreground",
};

/**
 * CRM de clientes interesados — junta en un solo lugar a quien te escribió
 * directo desde "Buscar Talleres" y a quien dio "Me interesa" en una oferta.
 * Por cada uno: sus datos de contacto, un mensaje de WhatsApp ya redactado
 * (editable) y un botón que abre WhatsApp listo para enviar, más un estado
 * simple para ir siguiendo la gestión (Nuevo → Contactado → Cotizado →
 * Ganado/Perdido).
 */
export default function TallerSolicitudes() {
  const [leads, setLeads] = useState<LeadCRM[]>(LEADS_MOCK);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<"todos" | EstadoLead>("todos");

  function mensajeDe(lead: LeadCRM): string {
    return mensajes[lead.id] ?? mensajePredeterminado(lead, MI_TALLER_MOCK.nombreNegocio);
  }

  function setMensaje(id: string, value: string) {
    setMensajes((prev) => ({ ...prev, [id]: value }));
  }

  function cambiarEstado(id: string, estado: EstadoLead) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado } : l)));
  }

  function cambiarNotas(id: string, notas: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notas } : l)));
  }

  const visibles = leads
    .filter((l) => filtro === "todos" || l.estado === filtro)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500/10">
            <Users className="h-3.5 w-3.5 text-signal-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">CRM de Clientes</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Clientes que te contactaron desde Buscar Talleres o dijeron "Me interesa" en una oferta — datos de ejemplo.
        </p>
      </div>

      <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-800">
          Si el cliente te llegó desde Buscar Talleres, decile su código de verificación cuando lo contactes, para
          que confirme que sos vos y no alguien haciéndose pasar por tu taller.
        </p>
      </div>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFiltro("todos")}
          className={cn(
            "rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors",
            filtro === "todos" ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
          )}
        >
          Todos ({leads.length})
        </button>
        {ESTADOS_LEAD.map((e) => {
          const count = leads.filter((l) => l.estado === e.value).length;
          return (
            <button
              key={e.value}
              type="button"
              onClick={() => setFiltro(e.value)}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors",
                filtro === e.value ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
              )}
            >
              {e.label} ({count})
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-500/10">
            {filtro === "todos" ? <Users className="h-6 w-6 text-signal-600" /> : <Search className="h-6 w-6 text-signal-600" />}
          </div>
          <h4 className="mb-1 text-sm font-bold text-foreground">
            {filtro === "todos" ? "Todavía no tenés clientes interesados" : "No hay clientes en este estado"}
          </h4>
          <p className="max-w-sm text-xs text-muted-foreground">
            Cuando alguien te contacte desde Buscar Talleres o dé "Me interesa" en una oferta, va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibles.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              mensaje={mensajeDe(lead)}
              onMensajeChange={(v) => setMensaje(lead.id, v)}
              onEstadoChange={(e) => cambiarEstado(lead.id, e)}
              onNotasChange={(n) => cambiarNotas(lead.id, n)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  mensaje,
  onMensajeChange,
  onEstadoChange,
  onNotasChange,
}: {
  lead: LeadCRM;
  mensaje: string;
  onMensajeChange: (v: string) => void;
  onEstadoChange: (estado: EstadoLead) => void;
  onNotasChange: (notas: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">{lead.clienteNombre}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" /> {formatFecha(lead.createdAt)}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", ESTADO_COLOR[lead.estado])}>
          {ESTADOS_LEAD.find((e) => e.value === lead.estado)?.label}
        </span>
      </div>

      <span
        className={cn(
          "mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
          lead.origen === "oferta" ? "bg-brand-500/10 text-brand-700" : "bg-signal-500/10 text-signal-600"
        )}
      >
        {lead.origen === "oferta" ? <Gift className="h-3 w-3" /> : <Search className="h-3 w-3" />}
        {lead.origen === "oferta" ? "Interesado en oferta" : "Buscar Talleres"}
      </span>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{lead.detalle}</p>

      <div className="mt-3 space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-foreground">
          <Phone className="h-3 w-3 text-signal-600" /> {lead.clienteTelefono}
        </p>
        {lead.clienteWhatsapp && (
          <p className="flex items-center gap-1.5 text-xs text-foreground">
            <MessageCircle className="h-3 w-3 text-signal-600" /> {lead.clienteWhatsapp} (WhatsApp)
          </p>
        )}
      </div>

      {lead.codigoVerificacion && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-signal-500/20 bg-signal-500/5 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-signal-600">
            <KeyRound className="h-3 w-3" /> Código a decir
          </span>
          <span className="font-mono text-sm font-black tracking-widest text-foreground">{lead.codigoVerificacion}</span>
        </div>
      )}

      <div className="mt-4">
        <TextareaField
          label="Mensaje para WhatsApp"
          value={mensaje}
          onChange={onMensajeChange}
          accent="signal"
          rows={3}
          helpText="Ya viene redactado — lo podés editar antes de enviarlo."
        />
      </div>

      <a
        href={linkWhatsapp(lead.clienteWhatsapp ?? lead.clienteTelefono, mensaje)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-signal-500 to-signal-600 text-sm font-bold text-white shadow-md shadow-signal-500/20"
      >
        <Send className="h-4 w-4" /> Enviar por WhatsApp
      </a>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Notas internas</p>
        <textarea
          value={lead.notas}
          onChange={(e) => onNotasChange(e.target.value)}
          placeholder="Ej: pidió que lo llamen después de las 5pm…"
          rows={2}
          className="w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-signal-500 focus:outline-none focus:ring-4 focus:ring-signal-500/15"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {ESTADOS_LEAD.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => onEstadoChange(e.value)}
            className={cn(
              "rounded-full border-2 px-3 py-1 text-[11px] font-bold transition-colors",
              lead.estado === e.value ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
            )}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
