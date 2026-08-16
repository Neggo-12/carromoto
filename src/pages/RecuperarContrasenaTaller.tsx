import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, MailCheck, Store } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";

export default function RecuperarContrasenaTaller() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
    }, 900);
  }

  return (
    <AuthLayout
      accent="signal"
      icon={Store}
      eyebrow="Recuperar acceso — Taller"
      title="Te ayudamos a volver a entrar"
      subtitle="Te mandamos un enlace a tu correo para que crees una contraseña nueva."
      bullets={["Enlace de un solo uso", "Válido por tiempo limitado"]}
    >
      <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-xl sm:p-9">
        {!enviado ? (
          <>
            <Link to="/login/taller" className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a iniciar sesión
            </Link>
            <h2 className="text-2xl font-black tracking-tight text-foreground">¿Olvidaste tu contraseña?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Escribí el correo con el que registraste tu taller y te mandamos cómo recuperarla.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <TextField
                label="Correo electrónico"
                type="email"
                icon={Mail}
                value={email}
                onChange={setEmail}
                placeholder="negocio@ejemplo.com"
                accent="signal"
                required
              />
              <Button as="button" type="submit" variant="signal" size="lg" className="w-full">
                {enviando ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-500/10">
              <MailCheck className="h-8 w-8 text-signal-600" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Revisá tu correo</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Si <span className="font-semibold text-foreground">{email}</span> tiene una cuenta de taller con nosotros,
              te va a llegar un enlace para crear una contraseña nueva.
            </p>
            <Link to="/login/taller" className="mt-7 inline-block">
              <Button as="span" variant="outline" size="md">
                Volver a iniciar sesión
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}
