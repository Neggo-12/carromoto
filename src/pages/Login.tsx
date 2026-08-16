import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, UserCircle, Store } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/Button";

type Perfil = "cliente" | "taller";

export default function Login() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil>("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordarme, setRecordarme] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const accent = perfil === "cliente" ? "brand" : "signal";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    // Sin backend todavía — dejamos el flujo listo para conectar auth real.
    setTimeout(() => {
      setEnviando(false);
      navigate(perfil === "cliente" ? "/clientes" : "/talleres");
    }, 900);
  }

  return (
    <AuthLayout
      accent={accent}
      icon={perfil === "cliente" ? UserCircle : Store}
      eyebrow={perfil === "cliente" ? "Acceso Clientes" : "Acceso Talleres"}
      title={perfil === "cliente" ? "Tu taller de confianza te está esperando" : "Tus próximos clientes te están esperando"}
      subtitle={
        perfil === "cliente"
          ? "Entrá a comparar cotizaciones y seguir tus solicitudes con talleres verificados."
          : "Entrá a administrar tu perfil, tus servicios y las solicitudes que te lleguen."
      }
      bullets={
        perfil === "cliente"
          ? ["Talleres verificados con Sello de Confianza", "Tus cotizaciones, siempre a mano"]
          : ["Sello de Confianza verificado, no autodeclarado", "Clientes que ya saben qué necesitan"]
      }
    >
      <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-xl sm:p-9">
        {/* Toggle de perfil */}
        <div className="mb-7 grid grid-cols-2 gap-1.5 rounded-xl bg-black/[0.04] p-1.5">
          {(["cliente", "taller"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPerfil(p)}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                perfil === p
                  ? p === "cliente"
                    ? "bg-white text-brand-700 shadow-sm"
                    : "bg-white text-signal-600 shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {p === "cliente" ? "Soy cliente" : "Tengo un taller"}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-black tracking-tight text-foreground">Iniciá sesión</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {perfil === "cliente" ? "Accedé a tu cuenta de cliente." : "Accedé al panel de tu taller."}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <TextField
            label="Correo electrónico"
            type="email"
            icon={Mail}
            value={email}
            onChange={setEmail}
            placeholder="tucorreo@ejemplo.com"
            accent={accent}
            required
          />
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            accent={accent}
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
            <Link to="/recuperar-contrasena" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button as="button" type="submit" variant={accent} size="lg" icon={ArrowRight} className="w-full">
            {enviando ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-7 text-center text-xs text-muted-foreground">
          ¿No tenés cuenta todavía?{" "}
          <Link
            to={perfil === "cliente" ? "/registro/cliente" : "/registro/taller"}
            className={`font-bold ${perfil === "cliente" ? "text-brand-600" : "text-signal-600"} hover:underline`}
          >
            Registrate {perfil === "cliente" ? "como cliente" : "tu taller"}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
