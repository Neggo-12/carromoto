import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, Store } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/Button";

export default function LoginTaller() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordarme, setRecordarme] = useState(true);
  const [enviando, setEnviando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    // Sin backend todavía — dejamos el flujo listo para conectar auth real.
    setTimeout(() => {
      setEnviando(false);
      navigate("/portal/taller");
    }, 900);
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

          <Button as="button" type="submit" variant="signal" size="lg" icon={ArrowRight} className="w-full">
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
