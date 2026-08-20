import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight, ShieldCheck, Wrench, AlertCircle } from "lucide-react";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/AuthProvider";

/**
 * Login del administrador — deliberadamente separado de Cliente/Taller,
 * sin enlaces desde el sitio público. Paleta neutra (slate), no lleva
 * branding de marketing: es una puerta de entrada interna. No hay registro
 * público de Admin — ese rol se asigna a mano (ver 0005_registro_auth.sql).
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const avisoRolIncorrecto = (location.state as { motivo?: string } | null)?.motivo === "rol_incorrecto";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const { error: err } = await iniciarSesion(email, password);
    setEnviando(false);
    if (err) return setError(err);
    navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">Taller Aval</span>
        </div>

        <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-2xl sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[11px] font-bold text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Acceso administrativo
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground">Panel del equipo Taller Aval</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Solo para administradores de la plataforma.</p>

          {avisoRolIncorrecto && (
            <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">Esa cuenta no tiene permisos de administrador.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <TextField
              label="Correo administrativo"
              type="email"
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="admin@talleraval.co"
              required
            />
            <PasswordField label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" required />

            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

            <Button as="button" type="submit" variant="brand" size="lg" icon={ArrowRight} className="w-full" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar al panel"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/30">
          Este acceso no está enlazado desde el sitio público.
        </p>
      </div>
    </div>
  );
}
