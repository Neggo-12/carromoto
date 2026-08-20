import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./lib/AuthProvider";
import { RequireAuth } from "./components/RequireAuth";
import LandingHub from "./pages/LandingHub";
import LandingClientes from "./pages/LandingClientes";
import LandingTalleres from "./pages/LandingTalleres";
import LoginChooser from "./pages/LoginChooser";
import LoginCliente from "./pages/LoginCliente";
import LoginTaller from "./pages/LoginTaller";
import RecuperarContrasenaCliente from "./pages/RecuperarContrasenaCliente";
import RecuperarContrasenaTaller from "./pages/RecuperarContrasenaTaller";
import RegistroCliente from "./pages/RegistroCliente";
import RegistroTaller from "./pages/RegistroTaller";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminTalleres from "./pages/admin/AdminTalleres";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminServicios from "./pages/admin/AdminServicios";
import { ClientePortalLayout } from "./components/cliente/ClientePortalLayout";
import ClienteInicio from "./pages/cliente/ClienteInicio";
import ClienteOfertas from "./pages/cliente/ClienteOfertas";
import ClienteBuscarTalleres from "./pages/cliente/ClienteBuscarTalleres";
import ClientePuntos from "./pages/cliente/ClientePuntos";
import { TallerLayout } from "./components/taller/TallerLayout";
import TallerResumen from "./pages/taller/TallerResumen";
import TallerPerfil from "./pages/taller/TallerPerfil";
import TallerSolicitudes from "./pages/taller/TallerSolicitudes";
import TallerOfertas from "./pages/taller/TallerOfertas";
import TallerScore from "./pages/taller/TallerScore";
import TallerComprobantes from "./pages/taller/TallerComprobantes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingHub />} />
          <Route path="/clientes" element={<LandingClientes />} />
          <Route path="/talleres" element={<LandingTalleres />} />

          <Route path="/login" element={<LoginChooser />} />
          <Route path="/login/cliente" element={<LoginCliente />} />
          <Route path="/login/taller" element={<LoginTaller />} />

          <Route path="/recuperar-contrasena" element={<Navigate to="/recuperar-contrasena/cliente" replace />} />
          <Route path="/recuperar-contrasena/cliente" element={<RecuperarContrasenaCliente />} />
          <Route path="/recuperar-contrasena/taller" element={<RecuperarContrasenaTaller />} />

          <Route path="/registro/cliente" element={<RegistroCliente />} />
          <Route path="/registro/taller" element={<RegistroTaller />} />

          {/* Portal de Cliente — Ofertas, Buscar Talleres y Puntos. Protegido
              con sesión real de Supabase en cuanto esté configurado; hasta
              entonces sigue abierto con datos de ejemplo. */}
          <Route
            path="/portal/cliente"
            element={
              <RequireAuth rol="Cliente" loginPath="/login/cliente">
                <ClientePortalLayout />
              </RequireAuth>
            }
          >
            <Route index element={<ClienteInicio />} />
            <Route path="ofertas" element={<ClienteOfertas />} />
            <Route path="buscar-talleres" element={<ClienteBuscarTalleres />} />
            <Route path="puntos" element={<ClientePuntos />} />
          </Route>

          {/* Panel de Taller — perfil, CRM, ofertas y score. Mismo criterio
              de protección que el Portal de Cliente. */}
          <Route
            path="/portal/taller"
            element={
              <RequireAuth rol="Taller" loginPath="/login/taller">
                <TallerLayout />
              </RequireAuth>
            }
          >
            <Route index element={<TallerResumen />} />
            <Route path="perfil" element={<TallerPerfil />} />
            <Route path="solicitudes" element={<TallerSolicitudes />} />
            <Route path="ofertas" element={<TallerOfertas />} />
            <Route path="comprobantes" element={<TallerComprobantes />} />
            <Route path="score" element={<TallerScore />} />
          </Route>

          {/* Panel administrativo — no enlazado desde el sitio público, y el
              único que exige rol='Admin' específicamente (nadie se lo
              autoasigna desde un formulario público, ver 0005_registro_auth.sql). */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAuth rol="Admin" loginPath="/admin/login">
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="talleres" element={<AdminTalleres />} />
            <Route path="clientes" element={<AdminClientes />} />
            <Route path="servicios" element={<AdminServicios />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
