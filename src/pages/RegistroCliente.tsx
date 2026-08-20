import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  Car,
  Bike,
  CarFront,
  Zap,
  PartyPopper,
  UserCircle,
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SelectableCard } from "@/components/SelectableCard";
import { StepProgress } from "@/components/StepProgress";
import { Button } from "@/components/Button";
import { CIUDADES, OPCIONES_MOTORIZACION, type Motorizacion } from "@/lib/data";
import { useAuth } from "@/lib/AuthProvider";

type Vehiculo = "carro" | "moto" | "ambos";

const STEPS = ["Tus datos", "Tu ciudad", "Tu vehículo", "Listo"];

export default function RegistroCliente() {
  const { registrarCliente } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [requiereConfirmacion, setRequiereConfirmacion] = useState(false);

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [ciudad, setCiudad] = useState("");

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [carroMotorizacion, setCarroMotorizacion] = useState<Motorizacion | null>(null);
  const [motoMotorizacion, setMotoMotorizacion] = useState<Motorizacion | null>(null);

  function validateStep(): boolean {
    setError("");
    if (step === 0) {
      if (!nombres.trim() || !apellidos.trim()) return fail("Contanos tu nombre y apellido.");
      if (!/^\S+@\S+\.\S+$/.test(correo)) return fail("Ese correo no se ve válido.");
      if (celular.replace(/\D/g, "").length < 10) return fail("Escribí tu celular completo, con indicativo.");
      if (password.length < 6) return fail("La contraseña necesita al menos 6 caracteres.");
      if (password !== confirmar) return fail("Las contraseñas no coinciden.");
      return true;
    }
    if (step === 1) {
      if (!ciudad.trim()) return fail("Elegí tu ciudad.");
      return true;
    }
    if (step === 2) {
      if (!vehiculo) return fail("Elegí qué tenés: carro, moto o ambos.");
      if ((vehiculo === "carro" || vehiculo === "ambos") && carroMotorizacion === null) return fail("Contanos si tu carro es eléctrico, híbrido o a combustión.");
      if ((vehiculo === "moto" || vehiculo === "ambos") && motoMotorizacion === null) return fail("Contanos si tu moto es eléctrica, híbrida o a combustión.");
      return true;
    }
    return true;
  }

  function fail(msg: string) {
    setError(msg);
    return false;
  }

  function selectVehiculo(v: Vehiculo) {
    setVehiculo(v);
    if (v !== "carro" && v !== "ambos") setCarroMotorizacion(null);
    if (v !== "moto" && v !== "ambos") setMotoMotorizacion(null);
  }

  async function next() {
    if (!validateStep()) return;
    if (step === STEPS.length - 2) {
      // Último paso con datos reales — acá se crea la cuenta de verdad.
      setEnviando(true);
      const { error: err, requiereConfirmacion: pendiente } = await registrarCliente({
        correo,
        password,
        nombre: `${nombres.trim()} ${apellidos.trim()}`.trim(),
        celular,
        ciudad,
        vehiculo: vehiculo ?? undefined,
        carroMotorizacion,
        motoMotorizacion,
      });
      setEnviando(false);
      if (err) return fail(err);
      setRequiereConfirmacion(pendiente);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <AuthLayout
      accent="brand"
      icon={UserCircle}
      eyebrow="Registro de Cliente"
      title="Creá tu cuenta y encontrá tu taller de confianza"
      subtitle="Dos minutos hoy, para no volver a jugártela con un taller que no conocés."
      bullets={[
        "Talleres y repuestos verificados con Sello de Confianza",
        "Cotizaciones comparadas antes de decidir",
        "Cobertura carro, moto, eléctricos e híbridos",
      ]}
    >
      <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-xl sm:p-9">
        {step < STEPS.length - 1 && (
          <div className="mb-7">
            <StepProgress steps={STEPS.slice(0, -1)} current={step} accent="brand" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Contanos quién sos</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Lo básico para crear tu cuenta.</p>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                  <TextField label="Nombres" icon={User} value={nombres} onChange={setNombres} placeholder="Juan" accent="brand" required />
                  <TextField label="Apellidos" icon={User} value={apellidos} onChange={setApellidos} placeholder="Pérez" accent="brand" required />
                </div>
                <TextField label="Correo electrónico" type="email" icon={Mail} value={correo} onChange={setCorreo} placeholder="tucorreo@ejemplo.com" accent="brand" required />
                <TextField label="Celular (WhatsApp)" icon={Phone} prefix="+57" value={celular} onChange={setCelular} placeholder="300 123 4567" accent="brand" required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                  <PasswordField label="Contraseña" value={password} onChange={setPassword} accent="brand" required />
                  <PasswordField label="Confirmar" value={confirmar} onChange={setConfirmar} accent="brand" required />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Desde dónde nos escribís?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Así te mostramos talleres cerca tuyo.</p>

              <div className="mt-6">
                <SearchableSelect label="Ciudad" value={ciudad} onChange={setCiudad} options={CIUDADES} accent="brand" required placeholder="Ej: Medellín" />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Qué tenés?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Para mostrarte solo lo que aplica a vos.</p>

              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                <SelectableCard icon={CarFront} label="Carro" selected={vehiculo === "carro"} onClick={() => selectVehiculo("carro")} accent="brand" compact />
                <SelectableCard icon={Bike} label="Moto" selected={vehiculo === "moto"} onClick={() => selectVehiculo("moto")} accent="brand" compact />
                <SelectableCard icon={Car} label="Ambos" selected={vehiculo === "ambos"} onClick={() => selectVehiculo("ambos")} accent="brand" compact />
              </div>

              <AnimatePresence>
                {(vehiculo === "carro" || vehiculo === "ambos") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-brand-600" /> ¿Tu carro es eléctrico o híbrido?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {OPCIONES_MOTORIZACION.map((opt) => (
                        <SelectableCard
                          key={opt.value}
                          label={opt.label}
                          description={opt.description}
                          selected={carroMotorizacion === opt.value}
                          onClick={() => setCarroMotorizacion(opt.value)}
                          accent="brand"
                          compact
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
                {(vehiculo === "moto" || vehiculo === "ambos") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-brand-600" /> ¿Tu moto es eléctrica o híbrida?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {OPCIONES_MOTORIZACION.map((opt) => (
                        <SelectableCard
                          key={opt.value}
                          label={opt.label}
                          description={opt.description}
                          selected={motoMotorizacion === opt.value}
                          onClick={() => setMotoMotorizacion(opt.value)}
                          accent="brand"
                          compact
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10"
              >
                <PartyPopper className="h-8 w-8 text-brand-600" />
              </motion.div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¡Listo, {nombres || "bienvenido"}!</h2>
              {requiereConfirmacion ? (
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                  Te mandamos un correo a <span className="font-semibold text-foreground">{correo}</span> para confirmar
                  tu cuenta — confirmalo y después ya podés iniciar sesión.
                </p>
              ) : (
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                  Ya creamos tu cuenta. Más adelante te vamos a ir preguntando algunas cosas más
                  (como tu dirección o dónde trabajás) para afinar aún más las recomendaciones —
                  nada que llenar de una sola vez.
                </p>
              )}
              <Link to={requiereConfirmacion ? "/login/cliente" : "/portal/cliente"} className="mt-7 inline-block">
                <Button as="span" variant="brand" size="lg">
                  {requiereConfirmacion ? "Ir a iniciar sesión" : "Ir a mi portal"}
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs font-semibold text-red-600">
            {error}
          </motion.p>
        )}

        {step < STEPS.length - 1 && (
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button as="button" type="button" onClick={back} variant="outline" size="md" icon={ArrowLeft} iconPosition="left">
                Atrás
              </Button>
            ) : (
              <span />
            )}
            <Button as="button" type="button" onClick={next} variant="brand" size="md" icon={ArrowRight} disabled={enviando}>
              {enviando ? "Creando cuenta…" : step === STEPS.length - 2 ? "Terminar" : "Continuar"}
            </Button>
          </div>
        )}

        {step === 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login/cliente" className="font-bold text-brand-600 hover:underline">
              Iniciá sesión
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
