import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type RolUsuario } from "@/lib/AuthProvider";
import { supabaseConfigurado } from "@/lib/supabaseClient";

/**
 * Protege un portal completo (taller, cliente, admin) exigiendo sesión real
 * y el rol correcto. Mientras Supabase no esté configurado (VITE_SUPABASE_URL
 * / VITE_SUPABASE_ANON_KEY vacías), deja pasar igual que siempre — así el
 * modo demo con datos de ejemplo no se rompe mientras se termina de
 * conectar el proyecto real. En cuanto esas variables existan, empieza a
 * exigir login de verdad.
 */
export function RequireAuth({ rol, loginPath, children }: { rol: RolUsuario; loginPath: string; children: ReactNode }) {
  const { cargando, session, perfil } = useAuth();
  const location = useLocation();

  if (!supabaseConfigurado) {
    return <>{children}</>;
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!session || !perfil) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (perfil.rol !== rol) {
    return <Navigate to={loginPath} replace state={{ motivo: "rol_incorrecto" }} />;
  }

  return <>{children}</>;
}
