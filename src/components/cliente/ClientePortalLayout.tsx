import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutGrid, Gift, Search, LogOut, Car, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/portal/cliente", label: "Inicio", icon: LayoutGrid, end: true },
  { to: "/portal/cliente/ofertas", label: "Ofertas", icon: Gift },
  { to: "/portal/cliente/buscar-talleres", label: "Buscar Talleres", icon: Search },
  { to: "/portal/cliente/puntos", label: "Mis Puntos", icon: Coins },
];

/**
 * Shell del Portal de Cliente — sidebar fija + contenido. Mismo patrón que
 * AdminLayout (sidebar + <Outlet/>), pero con la paleta brand (azul) del
 * lado público, para que se sienta parte del sitio de clientes.
 * Nota: todavía no hay login real conectado, así que cualquiera puede entrar
 * a esta ruta directamente — igual que pasa hoy con /admin. Cuando conectemos
 * Supabase, esto se protege con la sesión real del cliente.
 */
export function ClientePortalLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/login/cliente");
  }

  return (
    <div className="min-h-screen bg-brand-50/40 lg:flex">
      {/* Sidebar */}
      <aside className="border-b border-black/[0.06] bg-white lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link to="/portal/cliente" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold leading-none tracking-tight text-foreground">Taller Aval</div>
              <div className="text-[10px] font-semibold tracking-wide text-muted-foreground">Portal de Cliente</div>
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
                  isActive ? "bg-brand-500/10 text-brand-700" : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
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
            <span className="text-xs font-semibold text-muted-foreground">Portal de Cliente</span>
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
