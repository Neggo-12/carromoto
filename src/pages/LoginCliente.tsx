import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight, UserCircle, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/AuthProvider";
import { leerBusquedaPendiente } from "@/lib/geocoding";
import { supabase } from "@/lib/supabaseClient";
import {
  hayRegistroPendienteDeBienvenida,
  limpiarRegistroPendienteDeBienvenida,
  guardarResultadoBienvenida,
} from "@/lib/bienvenida";
import { hayRegistroPendienteDeReferido, limpiarRegistroPendienteDeReferido } from "@/lib/referidos";

export default function LoginCliente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { iniciarSesion, session, perfil } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordarme, setRecordarme] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  // Tras un login exitoso, supabase-js resuelve signInWithPassword antes de
  // que el propio AuthProvider (via onAuthStateChange + cargarPerfil, ambos
  // async) termine de poblar session/perfil. Si navegamos apenas se resuelve
  // esa promesa, RequireAuth puede alcanzar a renderizar con session/perfil
  // todavía en null y rebotar al usuario de vuelta al login — de ahí que
  // antes hiciera falta darle "Iniciar sesión" dos veces. Ahora esperamos a
  // que session/perfil reflejen el login real antes de navegar.
  //
  // No alcanza con esperar "session && perfil" a secas: si en el navegador
  // ya quedaba una sesión vieja de OTRA cuenta (p. ej. un taller que no
  // cerró sesión y después probó entrar como cliente), esos dos quedan
  // truthy de entrada con los datos VIEJOS, navegamos de una con el perfil
  // equivocado, RequireAuth nos rebota con "esa cuenta no es de cliente" —
  // y recién el segundo intento funciona porque para entonces sí llegó el
  // perfil correcto. Por eso guardamos el userId que efectivamente inició
  // sesión (userIdEsperado) y solo navegamos cuando session/perfil ya
  // corresponden a ESE usuario puntual.
  const [intentoLogin, setIntentoLogin] = useState(false);
  const [userIdEsperado, setUserIdEsperado] = useState<string | null>(null);

  const avisoRolIncorrecto = (location.state as { motivo?: string } | null)?.motivo === "rol_incorrecto";

  useEffect(() => {
    if (!intentoLogin || !userIdEsperado) return;
    if (session?.user.id !== userIdEsperado) return;
    if (!perfil || perfil.id !== userIdEsperado) return;
    if (perfil.rol !== "Cliente") {
      setEnviando(false);
      setIntentoLogin(false);
      setUserIdEsperado(null);
      setError("Esa cuenta no es de cliente. Si tiene un taller, ingrese por aquí abajo.");
      return;
    }
    const destino = leerBusquedaPendiente() ? "/portal/cliente/buscar-talleres" : "/portal/cliente";

    // Si este login viene justo después de un registro que necesitó
    // confirmar el correo (no había sesión activa todavía para consultar la
    // campaña de bienvenida en ese momento — ver RegistroCliente.tsx), la
    // resolvemos acá, la primera vez que este cliente entra de verdad —
    // esperamos el resultado antes de navegar para que ya esté listo cuando
    // el portal monte. Nunca se dispara para un cliente que no dejó esa
    // marca, así que nunca es retroactivo para cuentas viejas.
    if (hayRegistroPendienteDeBienvenida() || hayRegistroPendienteDeReferido()) {
      limpiarRegistroPendienteDeBienvenida();
      limpiarRegistroPendienteDeReferido();
      void (async () => {
        try {
          const { data, error: bienvenidaErr } = await supabase.rpc("registrar_bienvenida_si_aplica");
          if (!bienvenidaErr && data && data.length > 0) {
            guardarResultadoBienvenida({ otorgado: data[0].otorgado, puntos: data[0].puntos });
          }
          // El bono de referido lo recibe la otra persona (quien invitó), no
          // hay nada que mostrarle a este cliente — solo hace falta llamarlo
          // para que se otorgue.
          await supabase.rpc("registrar_puntos_referido_si_aplica");
        } finally {
          navigate(destino);
        }
      })();
      return;
    }

    // Si el visitante dejó una búsqueda por dirección a medias en la Home
    // pública (buscó, pero no tenía cuenta), lo mandamos directo a que la
    // vea resuelta en vez de al inicio del portal — ClienteBuscarTalleres
    // es quien la consume y la borra.
    navigate(destino);
  }, [intentoLogin, userIdEsperado, session, perfil, navigate]);

  useEffect(() => {
    if (!intentoLogin || !userIdEsperado) return;
    if (session?.user.id === userIdEsperado && perfil?.id === userIdEsperado) return;
    const timeout = setTimeout(() => {
      setEnviando(false);
      setIntentoLogin(false);
      setUserIdEsperado(null);
      setError("No se pudo cargar su sesión. Intente de nuevo.");
    }, 8000);
    return () => clearTimeout(timeout);
  }, [intentoLogin, userIdEsperado, session, perfil]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const { error: err, userId } = await iniciarSesion(email, password);
    if (err || !userId) {
      setEnviando(false);
      setError(err ?? "No se pudo iniciar sesión. Intente de nuevo.");
      return;
    }
    setUserIdEsperado(userId);
    setIntentoLogin(true);
  }

  return (
    <AuthLayout
      accent="brand"
      icon={UserCircle}
      eyebrow="Acceso Clientes"
      title="Su taller de confianza le está esperando"
      subtitle="Ingrese a comparar cotizaciones y dar seguimiento a sus solicitudes con talleres verificados."
      bullets={["Talleres verificados con Sello de Confianza", "Sus cotizaciones, siempre a mano"]}
    >
      <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-3.5 py-1.5 text-[11px] font-bold text-brand-700">
          <UserCircle className="h-3.5 w-3.5" />
          Cuenta de Cliente
        </div>

        <h2 className="text-2xl font-black tracking-tight text-foreground">Inicie sesión</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Acceda a su cuenta de cliente.</p>

        {avisoRolIncorrecto && (
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">Esa cuenta no es de cliente. Si tiene un taller, ingrese por aquí abajo.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <TextField
            label="Correo electrónico"
            type="email"
            icon={Mail}
            value={email}
            onChange={setEmail}
            placeholder="correo@ejemplo.com"
            accent="brand"
            required
          />
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            accent="brand"
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-black/20"
              />
              Recordarme
            </label>
            <Link to="/recuperar-contrasena/cliente" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              ¿Olvidó su contraseña?
            </Link>
          </div>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <Button as="button" type="submit" variant="brand" size="lg" icon={ArrowRight} className="w-full" disabled={enviando}>
            {enviando ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-7 text-center text-xs text-muted-foreground">
          ¿No tiene cuenta todavía?{" "}
          <Link to="/registro/cliente" className="font-bold text-brand-600 hover:underline">
            Regístrese como cliente
          </Link>
        </p>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          ¿Tiene un taller o negocio de repuestos?{" "}
          <Link to="/login/taller" className="font-semibold text-signal-600 hover:underline">
            Ingrese por aquí
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
