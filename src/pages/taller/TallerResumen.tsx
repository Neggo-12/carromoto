import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Users, Gift, ArrowRight, Store, Trophy, Loader2 } from "lucide-react";
import { EstadoBadge } from "@/components/taller/EstadoBadge";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";

type Estado = "pendiente" | "aprobado" | "rechazado";

interface ResumenData {
  nombreNegocio: string;
  estado: Estado;
  selloActivo: boolean;
  leadsTotal: number;
  leadsNuevos: number;
  ofertasTotal: number;
  ofertasActivas: number;
}

export default function TallerResumen() {
  const { perfil } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [data, setData] = useState<ResumenData | null>(null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      if (!perfil?.organizationId) {
        setCargando(false);
        return;
      }
      setCargando(true);
      const [{ data: org }, { data: contactos }, { data: campanas }] = await Promise.all([
        supabase.from("organizations").select("name, status, has_trust_seal").eq("id", perfil.organizationId).maybeSingle(),
        supabase.from("comercio_contactos").select("status").eq("comercio_id", perfil.organizationId),
        supabase.from("campanas").select("estado").eq("organization_id", perfil.organizationId),
      ]);
      if (!activo) return;
      if (org) {
        setData({
          nombreNegocio: org.name,
          estado: org.status as Estado,
          selloActivo: org.has_trust_seal,
          leadsTotal: contactos?.length ?? 0,
          leadsNuevos: (contactos ?? []).filter((c) => c.status === "nuevo").length,
          ofertasTotal: campanas?.length ?? 0,
          ofertasActivas: (campanas ?? []).filter((c) => c.estado === "activa").length,
        });
      }
      setCargando(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [perfil?.organizationId]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu panel...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 p-10 text-center text-sm text-muted-foreground">
        No pudimos cargar los datos de tu negocio.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Hola, {data.nombreNegocio}</h1>
      </div>

      {/* Estado de aprobación */}
      <div className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500/10">
            {data.estado === "aprobado" ? (
              <ShieldCheck className="h-5 w-5 text-signal-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-signal-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Estado de tu taller</p>
            <p className="text-xs text-muted-foreground">
              {data.estado === "aprobado"
                ? "Ya podés recibir clientes."
                : data.estado === "pendiente"
                ? "El equipo de Taller Aval todavía está revisando tu registro."
                : "Tu registro fue rechazado. Escribinos si creés que es un error."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EstadoBadge estado={data.estado} />
          {data.selloActivo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Sello activo
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Leads nuevos</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{data.leadsNuevos}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{data.leadsTotal} en tu CRM en total</p>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Ofertas activas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500/10 text-signal-600">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{data.ofertasActivas}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{data.ofertasTotal} publicadas en total</p>
        </div>

        <Link to="/portal/taller/score" className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-signal-500/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Tu score</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-muted-foreground">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-lg font-black tracking-tight text-foreground">Próximamente</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Todavía no tenemos suficientes datos para calcularlo.</p>
        </Link>
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/portal/taller/perfil" className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-signal-500/30 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/10">
            <Store className="h-5 w-5 text-signal-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Mi perfil</h3>
          <p className="mt-1 text-xs text-muted-foreground">Editá tus datos, servicios y horario.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-signal-600 transition-all group-hover:gap-2">
            Editar <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link to="/portal/taller/solicitudes" className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-signal-500/30 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/10">
            <Users className="h-5 w-5 text-signal-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">CRM de Clientes</h3>
          <p className="mt-1 text-xs text-muted-foreground">Clientes que te contactaron desde Buscar Talleres.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-signal-600 transition-all group-hover:gap-2">
            Ver CRM <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link to="/portal/taller/ofertas" className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-signal-500/30 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/10">
            <Gift className="h-5 w-5 text-signal-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Ofertas</h3>
          <p className="mt-1 text-xs text-muted-foreground">Publicá promociones para que las vean los clientes.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-signal-600 transition-all group-hover:gap-2">
            Ver ofertas <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link to="/portal/taller/score" className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-signal-500/30 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/10">
            <Trophy className="h-5 w-5 text-signal-600" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Mi Score</h3>
          <p className="mt-1 text-xs text-muted-foreground">Mirá cómo te va en calidad y qué te falta para subir de nivel.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-signal-600 transition-all group-hover:gap-2">
            Ver score <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
