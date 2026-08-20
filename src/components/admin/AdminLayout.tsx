import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutGrid, Store, Users, BarChart3, Wrench, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", label: "Resumen", icon: LayoutGrid, end: true },
  { to: "/admin/talleres", label: "Talleres", icon: Store },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/servicios", label: "Servicios", icon: BarChart3 },
];

/**
 * Shell del panel administrativo — barra lateral fija + contenido.
 * Paleta neutra (slate) a propósito: es una herramienta interna, no debe
 * verse ni sentirse como el sitio público de Clientes/Talleres.
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  async function handleLogout() {
    await cerrarSesion();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:shrink-0 lg:min-h-screen bg-slate-900 text-white">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight leading-none">Taller Aval</div>
              <div className="text-[10px] text-white/40 font-semibold tracking-wide">Panel administrativo</div>
            </div>
          </Link>
        </div>

        <nav className="px-3 py-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block mt-auto px-3 py-5">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 py-3.5 sm:px-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Solo visible para el equipo de Taller Aval
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
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
