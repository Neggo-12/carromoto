import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Clock, ShieldX, Wrench, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

/**
 * Regla de negocio: un taller recién registrado NO puede usar el panel
 * (CRM, ofertas, perfil, nada) hasta que un admin lo apruebe desde
 * /admin/talleres — solo puede ver este estado. Antes, RequireAuth dejaba
 * pasar a cualquier Taller con sesión válida sin mirar organizations.status,
 * así que un taller 'pendiente' entraba igual al panel completo apenas se
 * registraba (o apenas hacía login). Este componente va DENTRO de
 * RequireAuth (que solo exige sesión + rol correcto) y es lo que de verdad
 * bloquea el acceso mientras no esté 'aprobado'.
 */
export function RequireTallerAprobado({ children }: { children: ReactNode }) {
  const { perfil, cerrarSesion } = useAuth();

  if (perfil?.organizationStatus === "aprobado") {
    return <>{children}</>;
  }

  const rechazado = perfil?.organizationStatus === "rechazado";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f9] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/10">
          <Wrench className="h-5 w-5 text-signal-600" />
        </div>
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
            rechazado ? "bg-red-500/10" : "bg-amber-500/10"
          }`}
        >
          {rechazado ? <ShieldX className="h-7 w-7 text-red-600" /> : <Clock className="h-7 w-7 text-amber-600" />}
        </div>
        <h1 className="text-xl font-black tracking-tight text-foreground">
          {rechazado ? "Tu registro fue rechazado" : "Tu taller está en revisión"}
        </h1>
        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          {rechazado
            ? "El equipo de Taller Aval revisó tu registro y no fue aprobado esta vez. Si creés que es un error, escribinos y lo revisamos de nuevo."
            : "El equipo de Taller Aval está verificando tu negocio antes de darte acceso al panel. Te avisamos a tu correo apenas quede aprobado — normalmente toma poco tiempo."}
        </p>
        <button
          type="button"
          onClick={() => void cerrarSesion()}
          className="mx-auto mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
        </button>
        <p className="mt-4 text-[11px] text-muted-foreground">
          ¿Sos cliente y buscás un taller?{" "}
          <Link to="/clientes" className="font-semibold text-brand-600 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
