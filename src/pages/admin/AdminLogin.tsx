import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ShieldCheck, Wrench } from "lucide-react";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/Button";

/**
 * Login del administrador — deliberadamente separado de Cliente/Taller,
 * sin enlaces desde el sitio público. Paleta neutra (slate), no lleva
 * branding de marketing: es una puerta de entrada interna.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    // Sin backend todavía — dejamos el flujo listo para conectar auth real
    // (Supabase) con permisos de administrador.
    setTimeout(() => {
      setEnviando(false);
      navigate("/admin");
    }, 700);
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

            <Button as="button" type="submit" variant="brand" size="lg" icon={ArrowRight} className="w-full">
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
