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
import { leerBusquedaPendiente } from "@/lib/geocoding";
import { supabase } from "@/lib/supabaseClient";
import { marcarRegistroPendienteDeBienvenida } from "@/lib/bienvenida";
import { VERSION_TERMINOS, VERSION_TRATAMIENTO_DATOS } from "@/lib/legal";

type Vehiculo = "carro" | "moto" | "ambos";

const STEPS = ["Sus datos", "Su ciudad", "Su vehículo", "Listo"];

export default function RegistroCliente() {
  const { registrarCliente } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [requiereConfirmacion, setRequiereConfirmacion] = useState(false);
  // Resultado de la campaña de bienvenida (100 puntos) — null mientras no se
  // sabe, luego { otorgado, puntos }. Solo se consulta una vez, acá mismo,
  // justo al crear la cuenta — nunca en login, para que sea imposible que le
  // llegue a un cliente que ya existía antes de que el admin prendiera la
  // campaña (ver registrar_bienvenida_si_aplica() en
  // 0013_campana_bienvenida.sql).
  const [bienvenida, setBienvenida] = useState<{ otorgado: boolean; puntos: number } | null>(null);

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

  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [aceptoTratamiento, setAceptoTratamiento] = useState(false);

  function validateStep(): boolean {
    setError("");
    if (step === 0) {
      if (!nombres.trim() || !apellidos.trim()) return fail("Indíquenos su nombre y apellido.");
      if (!/^\S+@\S+\.\S+$/.test(correo)) return fail("Ese correo electrónico no parece válido.");
      if (celular.replace(/\D/g, "").length < 10) return fail("Ingrese su número de celular completo, con indicativo.");
      if (password.length < 6) return fail("La contraseña necesita al menos 6 caracteres.");
      if (password !== confirmar) return fail("Las contraseñas no coinciden.");
      return true;
    }
    if (step === 1) {
      if (!ciudad.trim()) return fail("Seleccione su ciudad.");
      return true;
    }
    if (step === 2) {
      if (!vehiculo) return fail("Seleccione qué vehículo tiene: carro, moto o ambos.");
      if ((vehiculo === "carro" || vehiculo === "ambos") && carroMotorizacion === null) return fail("Indíquenos si su carro es eléctrico, híbrido o a combustión.");
      if ((vehiculo === "moto" || vehiculo === "ambos") && motoMotorizacion === null) return fail("Indíquenos si su moto es eléctrica, híbrida o a combustión.");
      if (!aceptoTerminos) return fail("Debe aceptar los Términos y Condiciones para continuar.");
      if (!aceptoTratamiento) return fail("Debe autorizar el tratamiento de sus datos personales para continuar.");
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
        aceptoTerminosVersion: VERSION_TERMINOS,
        aceptoTratamientoVersion: VERSION_TRATAMIENTO_DATOS,
      });
      if (err) {
        setEnviando(false);
        return fail(err);
      }
      setRequiereConfirmacion(pendiente);
      if (pendiente) {
        // No hay sesión activa todavía (falta confirmar el correo) — no se
        // puede llamar al RPC de bienvenida ahora. Se resuelve la primera
        // vez que este cliente inicie sesión de verdad (ver LoginCliente.tsx).
        marcarRegistroPendienteDeBienvenida();
      } else {
        // Sesión activa de una — se puede consultar la campaña de
        // bienvenida ahora mismo y mostrar el resultado en esta misma pantalla.
        const { data, error: bienvenidaErr } = await supabase.rpc("registrar_bienvenida_si_aplica");
        if (!bienvenidaErr && data && data.length > 0) {
          setBienvenida({ otorgado: data[0].otorgado, puntos: data[0].puntos });
        }
      }
      setEnviando(false);
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
      title="Cree su cuenta y encuentre su taller de confianza"
      subtitle="Dos minutos hoy, para no volver a arriesgarse con un taller que no conoce."
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
              <h2 className="text-2xl font-black tracking-tight text-foreground">Confirme sus datos personales</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Lo básico para crear su cuenta.</p>

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
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Desde dónde nos escribe?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Así le mostramos talleres cerca de usted.</p>

              <div className="mt-6">
                <SearchableSelect label="Ciudad" value={ciudad} onChange={setCiudad} options={CIUDADES} accent="brand" required placeholder="Ej: Medellín" />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Qué vehículo tiene?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Para mostrarle solo lo que aplica a su caso.</p>

              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                <SelectableCard icon={CarFront} label="Carro" selected={vehiculo === "carro"} onClick={() => selectVehiculo("carro")} accent="brand" compact />
                <SelectableCard icon={Bike} label="Moto" selected={vehiculo === "moto"} onClick={() => selectVehiculo("moto")} accent="brand" compact />
                <SelectableCard icon={Car} label="Ambos" selected={vehiculo === "ambos"} onClick={() => selectVehiculo("ambos")} accent="brand" compact />
              </div>

              <AnimatePresence>
                {(vehiculo === "carro" || vehiculo === "ambos") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-brand-600" /> ¿Su carro es eléctrico o híbrido?
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
                      <Zap className="h-3.5 w-3.5 text-brand-600" /> ¿Su moto es eléctrica o híbrida?
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

              <div className="mt-6 space-y-2.5 border-t border-black/[0.06] pt-5">
                <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={aceptoTerminos}
                    onChange={(e) => setAceptoTerminos(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20"
                  />
                  <span>
                    He leído y acepto los{" "}
                    <Link to="/legal/terminos" target="_blank" className="font-bold text-brand-600 hover:underline">
                      Términos y Condiciones
                    </Link>
                    .
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={aceptoTratamiento}
                    onChange={(e) => setAceptoTratamiento(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20"
                  />
                  <span>
                    Autorizo el tratamiento de mis datos personales conforme a la{" "}
                    <Link to="/legal/privacidad" target="_blank" className="font-bold text-brand-600 hover:underline">
                      Política de Tratamiento de Datos
                    </Link>
                    .
                  </span>
                </label>
              </div>
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
                  Le enviamos un correo a <span className="font-semibold text-foreground">{correo}</span> para confirmar
                  su cuenta — confírmelo y luego podrá iniciar sesión.
                </p>
              ) : (
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                  Ya creamos su cuenta. Más adelante le solicitaremos algunos datos adicionales
                  (como su dirección o su lugar de trabajo) para afinar aún más las recomendaciones —
                  nada que deba completar de una sola vez.
                </p>
              )}

              {bienvenida?.otorgado && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mx-auto mt-4 flex max-w-sm items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
                    <PartyPopper className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-amber-800">
                    ¡Ganó {bienvenida.puntos} puntos de bienvenida por registrarse! Los verá reflejados en "Mis
                    Puntos" apenas esté activa la conexión con el sistema de puntos.
                  </p>
                </motion.div>
              )}

              <div className="mx-auto mt-4 max-w-sm rounded-xl border border-black/[0.06] bg-slate-50 p-3.5 text-left">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Por el momento no contamos con talleres afiliados, pero estamos trabajando para conseguir los
                  mejores. Le avisaremos apenas haya opciones disponibles en su zona.
                </p>
              </div>

              <Link
                to={
                  requiereConfirmacion
                    ? "/login/cliente"
                    : leerBusquedaPendiente()
                      ? "/portal/cliente/buscar-talleres"
                      : "/portal/cliente"
                }
                className="mt-7 inline-block"
              >
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
            ¿Ya tiene una cuenta?{" "}
            <Link to="/login/cliente" className="font-bold text-brand-600 hover:underline">
              Inicie sesión
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
