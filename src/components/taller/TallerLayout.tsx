import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutGrid, Store, Users, Gift, LogOut, Wrench, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/portal/taller", label: "Resumen", icon: LayoutGrid, end: true },
  { to: "/portal/taller/perfil", label: "Mi Perfil", icon: Store },
  { to: "/portal/taller/solicitudes", label: "CRM", icon: Users },
  { to: "/portal/taller/ofertas", label: "Ofertas", icon: Gift },
  { to: "/portal/taller/score", label: "Mi Score", icon: Trophy },
];

/**
 * Shell del Panel de Taller — mismo patrón que AdminLayout/ClientePortalLayout
 * (sidebar + <Outlet/>), con la paleta signal (naranja) del lado de talleres.
 * Sin login real todavía, así que cualquiera puede entrar directo a esta
 * ruta — igual que /admin y /portal/cliente hoy. Se protege de verdad cuando
 * conectemos Supabase y la aprobación del taller controle el acceso real.
 */
export function TallerLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/login/taller");
  }

  return (
    <div className="min-h-screen bg-orange-50/40 lg:flex">
      {/* Sidebar */}
      <aside className="border-b border-black/[0.06] bg-white lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link to="/portal/taller" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500 text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold leading-none tracking-tight text-foreground">Taller Aval</div>
              <div className="text-[10px] font-semibold tracking-wide text-muted-foreground">Panel de Taller</div>
            </div>
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  isActive ? "bg-signal-500/10 text-signal-600" : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden px-3 py-5 lg:block">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-black/[0.03] hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-xs font-semibold text-muted-foreground">Panel de Taller</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
