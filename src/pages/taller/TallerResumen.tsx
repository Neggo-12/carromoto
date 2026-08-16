import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Users, Gift, CreditCard, ArrowRight, Store, Trophy } from "lucide-react";
import { EstadoBadge } from "@/components/taller/EstadoBadge";
import { MI_TALLER_MOCK, LEADS_MOCK, MIS_OFERTAS_MOCK } from "@/lib/tallerData";
import { planPorId, formatCOP } from "@/lib/adminData";
import { calcularScore, nivelPorScore, factoresPorTallerId } from "@/lib/scoreData";
import { cn } from "@/lib/utils";

export default function TallerResumen() {
  const taller = MI_TALLER_MOCK;
  const plan = planPorId(taller.planId);
  const leadsNuevos = LEADS_MOCK.filter((l) => l.estado === "nuevo").length;
  const ofertasActivas = MIS_OFERTAS_MOCK.filter((o) => o.estado === "activa").length;
  const factoresScore = factoresPorTallerId(taller.id);
  const score = factoresScore ? calcularScore(factoresScore) : 0;
  const nivel = nivelPorScore(score);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Hola, {taller.nombreNegocio}</h1>
        <p className="text-sm text-muted-foreground">Datos de ejemplo para diseñar el panel — todavía no hay base de datos conectada.</p>
      </div>

      {/* Estado de aprobación */}
      <div className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500/10">
            {taller.estado === "aprobado" ? (
              <ShieldCheck className="h-5 w-5 text-signal-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-signal-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Estado de tu taller</p>
            <p className="text-xs text-muted-foreground">
              {taller.estado === "aprobado"
                ? "Ya podés recibir clientes — tu Sello de Confianza está activo."
                : taller.estado === "pendiente"
                ? "El equipo de Taller Aval todavía está revisando tu registro. No podés iniciar sesión de verdad hasta que te aprueben."
                : "Tu registro fue rechazado. Escribinos si creés que es un error."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EstadoBadge estado={taller.estado} />
          {taller.selloActivo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Sello activo
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Leads nuevos</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{leadsNuevos}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{LEADS_MOCK.length} en tu CRM en total</p>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Ofertas activas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500/10 text-signal-600">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{ofertasActivas}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{MIS_OFERTAS_MOCK.length} publicadas en total</p>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Tu plan</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{plan.nombre}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{formatCOP(plan.precioMensual)}/mes — {plan.descripcion}</p>
        </div>

        <Link to="/portal/taller/score" className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:border-signal-500/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Tu score</p>
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", nivel.bg, nivel.color)}>
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{score}<span className="text-sm text-muted-foreground">/100</span></p>
          <p className={cn("mt-1 text-[11px] font-bold", nivel.color)}>Nivel {nivel.label}</p>
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
          <p className="mt-1 text-xs text-muted-foreground">Clientes que te contactaron o dieron "Me interesa" en una oferta.</p>
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
