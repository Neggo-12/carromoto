import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Phone,
  Store,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Car,
  Bike,
  CarFront,
  Zap,
  PartyPopper,
  Package,
  Wrench,
  Sparkles,
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SelectableCard } from "@/components/SelectableCard";
import { StepProgress } from "@/components/StepProgress";
import { Button } from "@/components/Button";
import { ScheduleEditor, defaultSchedule, type WeekSchedule } from "@/components/ScheduleEditor";
import {
  CIUDADES,
  BARRIOS_POR_CIUDAD,
  SERVICIOS_CARRO,
  SERVICIOS_MOTO,
  REPUESTOS_CARRO,
  REPUESTOS_MOTO,
  OPCIONES_MOTORIZACION,
  type Motorizacion,
} from "@/lib/data";

type TipoVehiculo = "carro" | "moto" | "ambos";
type TipoNegocio = "taller" | "almacen";

export default function RegistroTaller() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [barrio, setBarrio] = useState("");
  const [direccion, setDireccion] = useState("");

  const [tipoNegocio, setTipoNegocioState] = useState<TipoNegocio | null>(null);
  const [tipoVehiculo, setTipoVehiculoState] = useState<TipoVehiculo | null>(null);
  const [carroMotorizacion, setCarroMotorizacion] = useState<Motorizacion | null>(null);
  const [motoMotorizacion, setMotoMotorizacion] = useState<Motorizacion | null>(null);
  const [especialistaElectricos, setEspecialistaElectricos] = useState<boolean | null>(null);

  const [servicios, setServicios] = useState<string[]>([]);

  const [horario, setHorario] = useState<WeekSchedule>(defaultSchedule());

  const STEPS = useMemo(
    () => ["Acceso", "Tu negocio", "Tipo de negocio", tipoNegocio === "almacen" ? "Repuestos" : "Servicios", "Horario", "Listo"],
    [tipoNegocio]
  );

  const barriosDisponibles = useMemo(() => BARRIOS_POR_CIUDAD[ciudad] ?? [], [ciudad]);

  const opcionesDisponibles = useMemo(() => {
    const listaCarro = tipoNegocio === "almacen" ? REPUESTOS_CARRO : SERVICIOS_CARRO;
    const listaMoto = tipoNegocio === "almacen" ? REPUESTOS_MOTO : SERVICIOS_MOTO;
    if (tipoVehiculo === "carro") return listaCarro;
    if (tipoVehiculo === "moto") return listaMoto;
    if (tipoVehiculo === "ambos") return [...listaCarro, ...listaMoto];
    return [];
  }, [tipoNegocio, tipoVehiculo]);

  const algunoElectrificado =
    carroMotorizacion === "electrico" ||
    carroMotorizacion === "hibrido" ||
    motoMotorizacion === "electrico" ||
    motoMotorizacion === "hibrido";

  // Si dejan de aplicar los eléctricos/híbridos, limpiamos la pregunta de especialista.
  useEffect(() => {
    if (!algunoElectrificado) setEspecialistaElectricos(null);
  }, [algunoElectrificado]);

  function handleCiudadChange(v: string) {
    setCiudad(v);
    setBarrio("");
  }

  function selectTipoNegocio(v: TipoNegocio) {
    setTipoNegocioState(v);
    setServicios([]);
  }

  function selectTipoVehiculo(v: TipoVehiculo) {
    setTipoVehiculoState(v);
    if (v !== "carro" && v !== "ambos") setCarroMotorizacion(null);
    if (v !== "moto" && v !== "ambos") setMotoMotorizacion(null);
    setServicios([]);
  }

  function toggleServicio(value: string) {
    setServicios((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
  }

  function fail(msg: string) {
    setError(msg);
    return false;
  }

  function validateStep(): boolean {
    setError("");
    if (step === 0) {
      if (!/^\S+@\S+\.\S+$/.test(correo)) return fail("Ese correo no se ve válido.");
      if (celular.replace(/\D/g, "").length < 10) return fail("Escribí el celular completo, con indicativo.");
      if (password.length < 6) return fail("La contraseña necesita al menos 6 caracteres.");
      if (password !== confirmar) return fail("Las contraseñas no coinciden.");
      return true;
    }
    if (step === 1) {
      if (!nombreNegocio.trim()) return fail("Contanos el nombre de tu negocio.");
      if (!ciudad.trim()) return fail("Elegí la ciudad.");
      if (!barrio.trim()) return fail("Contanos el barrio.");
      if (!direccion.trim()) return fail("Escribí la dirección.");
      return true;
    }
    if (step === 2) {
      if (!tipoNegocio) return fail("Contanos si sos un taller o un almacén de repuestos.");
      if (!tipoVehiculo) return fail("Elegí si trabajás con carro, moto o ambos.");
      if ((tipoVehiculo === "carro" || tipoVehiculo === "ambos") && carroMotorizacion === null) {
        return fail(tipoNegocio === "almacen" ? "Contanos si vendés repuestos para carros eléctricos o híbridos." : "Contanos si atendés carros eléctricos o híbridos.");
      }
      if ((tipoVehiculo === "moto" || tipoVehiculo === "ambos") && motoMotorizacion === null) {
        return fail(tipoNegocio === "almacen" ? "Contanos si vendés repuestos para motos eléctricas o híbridas." : "Contanos si atendés motos eléctricas o híbridas.");
      }
      if (algunoElectrificado && especialistaElectricos === null) {
        return fail("Contanos si sos especialista exclusivamente en eléctricos e híbridos.");
      }
      return true;
    }
    if (step === 3) {
      if (servicios.length === 0) {
        return fail(tipoNegocio === "almacen" ? "Elegí al menos un tipo de repuesto que vendés." : "Elegí al menos un servicio que ofrecés.");
      }
      return true;
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <AuthLayout
      accent="signal"
      icon={Store}
      eyebrow="Registro de Taller"
      title="Sumá tu taller y ganá el Sello de Confianza"
      subtitle="Cinco minutos hoy, para empezar a recibir clientes que ya saben qué necesitan."
      bullets={[
        "Sello de Confianza verificado, no autodeclarado",
        "Clientes que ya saben qué necesitan",
        "Vos decidís qué solicitudes atender",
      ]}
    >
      <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-xl sm:p-9">
        {step < STEPS.length - 1 && (
          <div className="mb-7">
            <StepProgress steps={STEPS.slice(0, -1)} current={step} accent="signal" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Creá el acceso de tu taller</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Con esto vas a entrar a tu panel más adelante.</p>

              <div className="mt-6 space-y-4">
                <TextField label="Correo electrónico" type="email" icon={Mail} value={correo} onChange={setCorreo} placeholder="negocio@ejemplo.com" accent="signal" required />
                <TextField label="Celular (WhatsApp)" icon={Phone} prefix="+57" value={celular} onChange={setCelular} placeholder="300 123 4567" accent="signal" required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                  <PasswordField label="Contraseña" value={password} onChange={setPassword} accent="signal" required />
                  <PasswordField label="Confirmar" value={confirmar} onChange={setConfirmar} accent="signal" required />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Contanos de tu negocio</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Así los clientes saben dónde encontrarte.</p>

              <div className="mt-6 space-y-4">
                <TextField label="Nombre del negocio" icon={Store} value={nombreNegocio} onChange={setNombreNegocio} placeholder="Taller El Motor Feliz" accent="signal" required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                  <SearchableSelect label="Ciudad" value={ciudad} onChange={handleCiudadChange} options={CIUDADES} accent="signal" required placeholder="Ej: Medellín" />
                  <SearchableSelect
                    label="Barrio"
                    value={barrio}
                    onChange={setBarrio}
                    options={barriosDisponibles}
                    accent="signal"
                    creatable
                    required
                    placeholder={ciudad ? "Empezá a escribir…" : "Primero elegí la ciudad"}
                  />
                </div>
                <TextField label="Dirección" icon={MapPin} value={direccion} onChange={setDireccion} placeholder="Cra 45 # 12-30" accent="signal" required />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Sos almacén o taller?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Así te mostramos a los clientes correctos.</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectableCard
                  icon={Wrench}
                  label="Taller de reparación"
                  description="Hacés mantenimiento y reparaciones."
                  selected={tipoNegocio === "taller"}
                  onClick={() => selectTipoNegocio("taller")}
                  accent="signal"
                />
                <SelectableCard
                  icon={Package}
                  label="Almacén de repuestos"
                  description="Vendés repuestos, no hacés reparaciones."
                  selected={tipoNegocio === "almacen"}
                  onClick={() => selectTipoNegocio("almacen")}
                  accent="signal"
                />
              </div>

              <AnimatePresence>
                {tipoNegocio && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground">
                      {tipoNegocio === "almacen" ? "¿Para qué vehículos vendés repuestos?" : "¿Qué tipo de vehículos atendés?"}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <SelectableCard icon={CarFront} label="Carro" selected={tipoVehiculo === "carro"} onClick={() => selectTipoVehiculo("carro")} accent="signal" compact />
                      <SelectableCard icon={Bike} label="Moto" selected={tipoVehiculo === "moto"} onClick={() => selectTipoVehiculo("moto")} accent="signal" compact />
                      <SelectableCard icon={Car} label="Ambos" selected={tipoVehiculo === "ambos"} onClick={() => selectTipoVehiculo("ambos")} accent="signal" compact />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(tipoVehiculo === "carro" || tipoVehiculo === "ambos") && (
                  <motion.div key="carro-motorizacion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-signal-600" />
                      {tipoNegocio === "almacen" ? "¿Vendés repuestos para carros eléctricos o híbridos?" : "¿Ofrecés servicios para carros eléctricos o híbridos?"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {OPCIONES_MOTORIZACION.map((opt) => (
                        <SelectableCard
                          key={opt.value}
                          label={opt.label}
                          description={opt.description}
                          selected={carroMotorizacion === opt.value}
                          onClick={() => setCarroMotorizacion(opt.value)}
                          accent="signal"
                          compact
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
                {(tipoVehiculo === "moto" || tipoVehiculo === "ambos") && (
                  <motion.div key="moto-motorizacion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-signal-600" />
                      {tipoNegocio === "almacen" ? "¿Vendés repuestos para motos eléctricas o híbridas?" : "¿Ofrecés servicios para motos eléctricas o híbridas?"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {OPCIONES_MOTORIZACION.map((opt) => (
                        <SelectableCard
                          key={opt.value}
                          label={opt.label}
                          description={opt.description}
                          selected={motoMotorizacion === opt.value}
                          onClick={() => setMotoMotorizacion(opt.value)}
                          accent="signal"
                          compact
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {algunoElectrificado && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-signal-600" />
                      ¿Sos especialista exclusivamente en eléctricos e híbridos?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SelectableCard
                        label="Sí, solo eléctricos e híbridos"
                        description="Nos especializamos únicamente en vehículos electrificados."
                        selected={especialistaElectricos === true}
                        onClick={() => setEspecialistaElectricos(true)}
                        accent="signal"
                        compact
                      />
                      <SelectableCard
                        label="No, también convencionales"
                        description="Atendemos electrificados y a combustión."
                        selected={especialistaElectricos === false}
                        onClick={() => setEspecialistaElectricos(false)}
                        accent="signal"
                        compact
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {tipoNegocio === "almacen" ? "¿Qué repuestos vendés?" : "¿Qué servicios ofrecés?"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Elegí todos los que apliquen.</p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {opcionesDisponibles.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleServicio(s.value)}
                    className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-colors ${
                      servicios.includes(s.value)
                        ? "border-signal-500 bg-signal-500 text-white"
                        : "border-black/10 bg-white text-foreground hover:border-black/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Cuándo atendés?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Los clientes van a ver esto antes de escribirte.</p>

              <div className="mt-6">
                <ScheduleEditor value={horario} onChange={setHorario} accent="signal" />
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="5" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-500/10"
              >
                <PartyPopper className="h-8 w-8 text-signal-600" />
              </motion.div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                ¡Listo, {nombreNegocio || "bienvenido"}!
              </h2>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Ya tenemos los datos de tu negocio. El siguiente paso es la verificación de
                identidad para activar tu Sello de Confianza — te avisamos apenas esté disponible.
              </p>
              <Link to="/talleres" className="mt-7 inline-block">
                <Button as="span" variant="signal" size="lg">
                  Volver a la página de talleres
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
            <Button as="button" type="button" onClick={next} variant="signal" size="md" icon={ArrowRight}>
              {step === STEPS.length - 2 ? "Terminar" : "Continuar"}
            </Button>
          </div>
        )}

        {step === 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login/taller" className="font-bold text-signal-600 hover:underline">
              Iniciá sesión
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
