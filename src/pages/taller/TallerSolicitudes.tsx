import { useEffect, useState } from "react";
import { Users, Phone, MessageCircle, KeyRound, Calendar, AlertTriangle, Send, Search, Loader2 } from "lucide-react";
import { TextareaField } from "@/components/Textarea";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";

type EstadoLead = "nuevo" | "contactado" | "cotizado" | "ganado" | "perdido";

const ESTADOS_LEAD: { value: EstadoLead; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "cotizado", label: "Cotizado" },
  { value: "ganado", label: "Ganado" },
  { value: "perdido", label: "Perdido" },
];

interface ContactoReal {
  id: string;
  nombre: string;
  telefono: string;
  whatsapp: string | null;
  descripcion: string;
  status: EstadoLead;
  notas: string | null;
  codigo_verificacion: string;
  created_at: string;
}

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

function mensajePredeterminado(c: ContactoReal, nombreTaller: string): string {
  return `Hola ${c.nombre}, te escribimos de ${nombreTaller} por tu solicitud: "${c.descripcion}". ¿Seguís interesado/a?`;
}

function linkWhatsapp(telefono: string, mensaje: string): string {
  const digits = telefono.replace(/\D/g, "");
  const conIndicativo = digits.startsWith("57") ? digits : `57${digits}`;
  return `https://wa.me/${conIndicativo}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * CRM de clientes que contactaron desde Buscar Talleres — leído directo de
 * comercio_contactos (RLS: solo filas de la organización del taller
 * logueado). El origen "oferta" (Me interesa en una oferta) se suma acá
 * cuando Ofertas quede conectado a datos reales — por ahora esta pantalla
 * solo muestra lo que sí existe: contactos reales desde Buscar Talleres.
 */
export default function TallerSolicitudes() {
  const { perfil } = useAuth();
  const [nombreNegocio, setNombreNegocio] = useState<string>("tu taller");
  const [contactos, setContactos] = useState<ContactoReal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<"todos" | EstadoLead>("todos");

  useEffect(() => {
    let activo = true;
    async function cargar() {
      if (!perfil?.organizationId) {
        setCargando(false);
        return;
      }
      setCargando(true);
      const [{ data: org }, { data: rows, error }] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", perfil.organizationId).maybeSingle(),
        supabase
          .from("comercio_contactos")
          .select("id, nombre, telefono, whatsapp, descripcion, status, notas, codigo_verificacion, created_at")
          .eq("comercio_id", perfil.organizationId)
          .order("created_at", { ascending: false }),
      ]);
      if (!activo) return;
      if (org?.name) setNombreNegocio(org.name);
      if (!error && rows) setContactos(rows as ContactoReal[]);
      setCargando(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [perfil?.organizationId]);

  function mensajeDe(c: ContactoReal): string {
    return mensajes[c.id] ?? mensajePredeterminado(c, nombreNegocio);
  }

  function setMensaje(id: string, value: string) {
    setMensajes((prev) => ({ ...prev, [id]: value }));
  }

  async function cambiarEstado(id: string, status: EstadoLead) {
    setContactos((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await supabase.from("comercio_contactos").update({ status }).eq("id", id);
  }

  function cambiarNotasLocal(id: string, notas: string) {
    setContactos((prev) => prev.map((c) => (c.id === id ? { ...c, notas } : c)));
  }

  async function guardarNotas(id: string, notas: string) {
    await supabase.from("comercio_contactos").update({ notas }).eq("id", id);
  }

  const visibles = contactos
    .filter((c) => filtro === "todos" || c.status === filtro)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500/10">
            <Users className="h-3.5 w-3.5 text-signal-600" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground">CRM de Clientes</h1>
        </div>
        <p className="text-xs text-muted-foreground">Clientes que te contactaron desde Buscar Talleres.</p>
      </div>

      <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-800">
          Si el cliente te llegó desde Buscar Talleres, decile su código de verificación cuando lo contactes, para
          que confirme que sos vos y no alguien haciéndose pasar por tu taller.
        </p>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando clientes...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltro("todos")}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors",
                filtro === "todos" ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
              )}
            >
              Todos ({contactos.length})
            </button>
            {ESTADOS_LEAD.map((e) => {
              const count = contactos.filter((c) => c.status === e.value).length;
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
                Cuando alguien te contacte desde Buscar Talleres, va a aparecer acá.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {visibles.map((c) => (
                <LeadCard
                  key={c.id}
                  contacto={c}
                  mensaje={mensajeDe(c)}
                  onMensajeChange={(v) => setMensaje(c.id, v)}
                  onEstadoChange={(e) => cambiarEstado(c.id, e)}
                  onNotasChange={(n) => cambiarNotasLocal(c.id, n)}
                  onNotasGuardar={(n) => guardarNotas(c.id, n)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeadCard({
  contacto,
  mensaje,
  onMensajeChange,
  onEstadoChange,
  onNotasChange,
  onNotasGuardar,
}: {
  contacto: ContactoReal;
  mensaje: string;
  onMensajeChange: (v: string) => void;
  onEstadoChange: (estado: EstadoLead) => void;
  onNotasChange: (notas: string) => void;
  onNotasGuardar: (notas: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">{contacto.nombre}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" /> {formatFecha(contacto.created_at)}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", ESTADO_COLOR[contacto.status])}>
          {ESTADOS_LEAD.find((e) => e.value === contacto.status)?.label}
        </span>
      </div>

      <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-signal-500/10 px-2.5 py-1 text-[10px] font-bold text-signal-600">
        <Search className="h-3 w-3" /> Buscar Talleres
      </span>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{contacto.descripcion}</p>

      <div className="mt-3 space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-foreground">
          <Phone className="h-3 w-3 text-signal-600" /> {contacto.telefono}
        </p>
        {contacto.whatsapp && (
          <p className="flex items-center gap-1.5 text-xs text-foreground">
            <MessageCircle className="h-3 w-3 text-signal-600" /> {contacto.whatsapp} (WhatsApp)
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-signal-500/20 bg-signal-500/5 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-signal-600">
          <KeyRound className="h-3 w-3" /> Código a decir
        </span>
        <span className="font-mono text-sm font-black tracking-widest text-foreground">{contacto.codigo_verificacion}</span>
      </div>

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
        href={linkWhatsapp(contacto.whatsapp ?? contacto.telefono, mensaje)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-signal-500 to-signal-600 text-sm font-bold text-white shadow-md shadow-signal-500/20"
      >
        <Send className="h-4 w-4" /> Enviar por WhatsApp
      </a>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Notas internas</p>
        <textarea
          value={contacto.notas ?? ""}
          onChange={(e) => onNotasChange(e.target.value)}
          onBlur={(e) => onNotasGuardar(e.target.value)}
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
              contacto.status === e.value ? "border-signal-500 bg-signal-500 text-white" : "border-black/10 bg-white text-foreground hover:border-black/20"
            )}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
