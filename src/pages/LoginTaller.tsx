import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight, Store, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/AuthProvider";

export default function LoginTaller() {
  const navigate = useNavigate();
  const location = useLocation();
  const { iniciarSesion, session, perfil } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordarme, setRecordarme] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  // Ver LoginCliente.tsx: esperamos a que session/perfil del AuthProvider
  // reflejen el login real antes de navegar, en vez de navegar apenas se
  // resuelve la promesa de signInWithPassword (eso causaba que hiciera
  // falta darle "Iniciar sesión" dos veces).
  const [intentoLogin, setIntentoLogin] = useState(false);

  const avisoRolIncorrecto = (location.state as { motivo?: string } | null)?.motivo === "rol_incorrecto";

  useEffect(() => {
    if (!intentoLogin) return;
    if (session && perfil) {
      navigate("/portal/taller");
    }
  }, [intentoLogin, session, perfil, navigate]);

  useEffect(() => {
    if (!intentoLogin || (session && perfil)) return;
    const timeout = setTimeout(() => {
      setEnviando(false);
      setIntentoLogin(false);
      setError("No se pudo cargar tu sesión. Intentá de nuevo.");
    }, 8000);
    return () => clearTimeout(timeout);
  }, [intentoLogin, session, perfil]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const { error: err } = await iniciarSesion(email, password);
    if (err) {
      setEnviando(false);
      setError(err);
      return;
    }
    setIntentoLogin(true);
  }

  return (
    <AuthLayout
      accent="signal"
      icon={Store}
      eyebrow="Acceso Talleres"
      title="Tus próximos clientes te están esperando"
      subtitle="Entrá a administrar tu perfil, tus servicios y las solicitudes que te lleguen."
      bullets={["Sello de Confianza verificado, no autodeclarado", "Clientes que ya saben qué necesitan"]}
    >
      <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-signal-500/20 bg-signal-500/5 px-3.5 py-1.5 text-[11px] font-bold text-signal-600">
          <Store className="h-3.5 w-3.5" />
          Cuenta de Taller
        </div>

        <h2 className="text-2xl font-black tracking-tight text-foreground">Iniciá sesión</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Accedé al panel de tu taller.</p>

        {avisoRolIncorrecto && (
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">Esa cuenta no es de taller — si sos cliente, entrá por acá abajo.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <TextField
            label="Correo electrónico"
            type="email"
            icon={Mail}
            value={email}
            onChange={setEmail}
            placeholder="tucorreo@ejemplo.com"
            accent="signal"
            required
          />
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            accent="signal"
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
            <Link to="/recuperar-contrasena/taller" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <Button as="button" type="submit" variant="signal" size="lg" icon={ArrowRight} className="w-full" disabled={enviando}>
            {enviando ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-7 text-center text-xs text-muted-foreground">
          ¿No tenés cuenta todavía?{" "}
          <Link to="/registro/taller" className="font-bold text-signal-600 hover:underline">
            Registrá tu taller
          </Link>
        </p>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          ¿Sos cliente y buscás un taller?{" "}
          <Link to="/login/cliente" className="font-semibold text-brand-600 hover:underline">
            Entrá por acá
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
