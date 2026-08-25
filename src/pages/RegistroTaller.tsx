import { useMemo, useState } from "react";
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
import { useAuth } from "@/lib/AuthProvider";
import { VERSION_TERMINOS, VERSION_TRATAMIENTO_DATOS } from "@/lib/legal";

type TipoVehiculo = "carro" | "moto" | "ambos";
type TipoNegocio = "taller" | "almacen";

export default function RegistroTaller() {
  const { registrarTaller } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [requiereConfirmacion, setRequiereConfirmacion] = useState(false);

  const [nombreEncargado, setNombreEncargado] = useState("");
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
  // Multi-select: un taller puede atender varias motorizaciones a la vez
  // (ej. combustión Y eléctrico), no una sola — antes esto era un valor
  // único y forzaba a elegir solo una opción, lo cual era confuso y además
  // no reflejaba la realidad de la mayoría de talleres.
  const [carroMotorizaciones, setCarroMotorizaciones] = useState<Motorizacion[]>([]);
  const [motoMotorizaciones, setMotoMotorizaciones] = useState<Motorizacion[]>([]);

  const [servicios, setServicios] = useState<string[]>([]);

  const [horario, setHorario] = useState<WeekSchedule>(defaultSchedule());
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [aceptoTratamiento, setAceptoTratamiento] = useState(false);

  const STEPS = useMemo(
    () => ["Acceso", "Su negocio", "Tipo de negocio", tipoNegocio === "almacen" ? "Repuestos" : "Servicios", "Horario", "Listo"],
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

  // Motorizaciones que de verdad aplican según el tipo de vehículo elegido
  // (si solo atiende carro, lo de moto no cuenta aunque haya quedado en el
  // estado de un paso anterior).
  const motorizacionesAplicables = useMemo(() => {
    const deCarro = tipoVehiculo === "carro" || tipoVehiculo === "ambos" ? carroMotorizaciones : [];
    const deMoto = tipoVehiculo === "moto" || tipoVehiculo === "ambos" ? motoMotorizaciones : [];
    return [...deCarro, ...deMoto];
  }, [tipoVehiculo, carroMotorizaciones, motoMotorizaciones]);

  const algunoElectrificado = motorizacionesAplicables.some((m) => m === "electrico" || m === "hibrido");
  // Especialista exclusivo = todo lo que marcó es eléctrico/híbrido, sin
  // combustión — se calcula solo, ya no hace falta preguntarlo aparte (esa
  // pregunta repetía lo que ya habían contestado arriba y confundía).
  const especialistaElectricos = algunoElectrificado && !motorizacionesAplicables.includes("combustion");

  function toggleCarroMotorizacion(v: Motorizacion) {
    setCarroMotorizaciones((prev) => (prev.includes(v) ? prev.filter((m) => m !== v) : [...prev, v]));
  }

  function toggleMotoMotorizacion(v: Motorizacion) {
    setMotoMotorizaciones((prev) => (prev.includes(v) ? prev.filter((m) => m !== v) : [...prev, v]));
  }

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
    if (v !== "carro" && v !== "ambos") setCarroMotorizaciones([]);
    if (v !== "moto" && v !== "ambos") setMotoMotorizaciones([]);
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
      if (!nombreEncargado.trim()) return fail("Indíquenos su nombre.");
      if (!/^\S+@\S+\.\S+$/.test(correo)) return fail("Ese correo electrónico no parece válido.");
      if (celular.replace(/\D/g, "").length < 10) return fail("Ingrese el celular completo, con indicativo.");
      if (password.length < 6) return fail("La contraseña necesita al menos 6 caracteres.");
      if (password !== confirmar) return fail("Las contraseñas no coinciden.");
      return true;
    }
    if (step === 1) {
      if (!nombreNegocio.trim()) return fail("Indíquenos el nombre de su negocio.");
      if (!ciudad.trim()) return fail("Seleccione la ciudad.");
      if (!barrio.trim()) return fail("Indíquenos el barrio.");
      if (!direccion.trim()) return fail("Ingrese la dirección.");
      return true;
    }
    if (step === 2) {
      if (!tipoNegocio) return fail("Indíquenos si es un taller o un almacén de repuestos.");
      if (!tipoVehiculo) return fail("Seleccione si trabaja con carro, moto o ambos.");
      if ((tipoVehiculo === "carro" || tipoVehiculo === "ambos") && carroMotorizaciones.length === 0) {
        return fail(tipoNegocio === "almacen" ? "Seleccione qué motorización de carros vende en repuestos." : "Seleccione qué motorización de carros atiende.");
      }
      if ((tipoVehiculo === "moto" || tipoVehiculo === "ambos") && motoMotorizaciones.length === 0) {
        return fail(tipoNegocio === "almacen" ? "Seleccione qué motorización de motos vende en repuestos." : "Seleccione qué motorización de motos atiende.");
      }
      return true;
    }
    if (step === 3) {
      if (servicios.length === 0) {
        return fail(tipoNegocio === "almacen" ? "Seleccione al menos un tipo de repuesto que venda." : "Seleccione al menos un servicio que ofrezca.");
      }
      return true;
    }
    if (step === 4) {
      if (!aceptoTerminos) return fail("Debe aceptar los Términos y Condiciones para continuar.");
      if (!aceptoTratamiento) return fail("Debe autorizar el tratamiento de sus datos personales para continuar.");
      return true;
    }
    return true;
  }

  async function next() {
    if (!validateStep()) return;
    if (step === STEPS.length - 2) {
      // Último paso con datos reales — acá se crea la cuenta + el negocio.
      setEnviando(true);
      const { error: err, requiereConfirmacion: pendiente } = await registrarTaller({
        correo,
        password,
        nombre: nombreEncargado.trim(),
        celular,
        nombreNegocio: nombreNegocio.trim(),
        tipoNegocio: tipoNegocio ?? "taller",
        ciudad,
        metadata: {
          barrio,
          direccion,
          tipo_vehiculo: tipoVehiculo,
          carro_motorizacion: carroMotorizaciones,
          moto_motorizacion: motoMotorizaciones,
          especialista_electricos: especialistaElectricos,
          servicios,
          horario,
        },
        aceptoTerminosVersion: VERSION_TERMINOS,
        aceptoTratamientoVersion: VERSION_TRATAMIENTO_DATOS,
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
      accent="signal"
      icon={Store}
      eyebrow="Registro de Taller"
      title="Sume su taller y gane el Sello de Confianza"
      subtitle="Cinco minutos hoy, para empezar a recibir clientes que ya saben qué necesitan."
      bullets={[
        "Sello de Confianza verificado, no autodeclarado",
        "Clientes que ya saben qué necesitan",
        "Usted decide qué solicitudes atender",
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
              <h2 className="text-2xl font-black tracking-tight text-foreground">Cree el acceso de su taller</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Con esto va a entrar a su panel más adelante.</p>

              <div className="mt-6 space-y-4">
                <TextField label="Su nombre" icon={Store} value={nombreEncargado} onChange={setNombreEncargado} placeholder="Carlos Ramírez" accent="signal" required />
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
              <h2 className="text-2xl font-black tracking-tight text-foreground">Cuéntenos sobre su negocio</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Así los clientes saben dónde encontrarlo.</p>

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
                    placeholder={ciudad ? "Empiece a escribir…" : "Primero seleccione la ciudad"}
                  />
                </div>
                <TextField label="Dirección" icon={MapPin} value={direccion} onChange={setDireccion} placeholder="Cra 45 # 12-30" accent="signal" required />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Es almacén o taller?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Así le mostramos a los clientes correctos.</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectableCard
                  icon={Wrench}
                  label="Taller de reparación"
                  description="Realiza mantenimiento y reparaciones."
                  selected={tipoNegocio === "taller"}
                  onClick={() => selectTipoNegocio("taller")}
                  accent="signal"
                />
                <SelectableCard
                  icon={Package}
                  label="Almacén de repuestos"
                  description="Vende repuestos, no realiza reparaciones."
                  selected={tipoNegocio === "almacen"}
                  onClick={() => selectTipoNegocio("almacen")}
                  accent="signal"
                />
              </div>

              <AnimatePresence>
                {tipoNegocio && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                    <p className="mb-2 text-xs font-bold text-foreground">
                      {tipoNegocio === "almacen" ? "¿Para qué vehículos vende repuestos?" : "¿Qué tipo de vehículos atiende?"}
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
                    <p className="mb-0.5 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-signal-600" />
                      {tipoNegocio === "almacen" ? "¿Para qué motorización de carros vende repuestos?" : "¿Qué motorización de carros atiende?"}
                    </p>
                    <p className="mb-2 text-[11px] text-muted-foreground">Seleccione todas las que apliquen.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {OPCIONES_MOTORIZACION.map((opt) => (
                        <SelectableCard
                          key={opt.value}
                          label={opt.label}
                          description={opt.description}
                          selected={carroMotorizaciones.includes(opt.value)}
                          onClick={() => toggleCarroMotorizacion(opt.value)}
                          accent="signal"
                          compact
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
                {(tipoVehiculo === "moto" || tipoVehiculo === "ambos") && (
                  <motion.div key="moto-motorizacion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                    <p className="mb-0.5 text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-signal-600" />
                      {tipoNegocio === "almacen" ? "¿Para qué motorización de motos vende repuestos?" : "¿Qué motorización de motos atiende?"}
                    </p>
                    <p className="mb-2 text-[11px] text-muted-foreground">Seleccione todas las que apliquen.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {OPCIONES_MOTORIZACION.map((opt) => (
                        <SelectableCard
                          key={opt.value}
                          label={opt.label}
                          description={opt.description}
                          selected={motoMotorizaciones.includes(opt.value)}
                          onClick={() => toggleMotoMotorizacion(opt.value)}
                          accent="signal"
                          compact
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Se calcula solo a partir de lo que marcaron arriba — ya no
                  se vuelve a preguntar. Eléctrico/híbrido queda destacado
                  con su propia insignia en vez de una pregunta aparte. */}
              <AnimatePresence>
                {algunoElectrificado && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 rounded-xl border border-signal-500/25 bg-signal-500/[0.06] px-4 py-3">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal-600" />
                      <p className="text-xs text-foreground">
                        {especialistaElectricos ? (
                          <>
                            <span className="font-bold">Lo destacaremos como especialista en eléctricos e híbridos.</span>{" "}
                            Aparecerá resaltado para los clientes que busquen justo eso.
                          </>
                        ) : (
                          <>
                            <span className="font-bold">También aparecerá entre los talleres que atienden eléctricos e híbridos,</span>{" "}
                            además de los convencionales.
                          </>
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {tipoNegocio === "almacen" ? "¿Qué repuestos vende?" : "¿Qué servicios ofrece?"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Seleccione todos los que apliquen.</p>

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
              <h2 className="text-2xl font-black tracking-tight text-foreground">¿Cuándo atiende?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Los clientes verán esto antes de escribirle.</p>

              <div className="mt-6">
                <ScheduleEditor value={horario} onChange={setHorario} accent="signal" />
              </div>

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
                    <Link to="/legal/terminos" target="_blank" className="font-bold text-signal-600 hover:underline">
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
                    <Link to="/legal/privacidad" target="_blank" className="font-bold text-signal-600 hover:underline">
                      Política de Tratamiento de Datos
                    </Link>
                    .
                  </span>
                </label>
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
              {requiereConfirmacion ? (
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                  Le enviamos un correo a <span className="font-semibold text-foreground">{correo}</span> para confirmar
                  su cuenta — confírmelo y luego podrá iniciar sesión. Su negocio queda pendiente de aprobación
                  hasta que verifiquemos su identidad.
                </p>
              ) : (
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                  Ya creamos su cuenta y guardamos los datos de su negocio. El siguiente paso es la verificación de
                  identidad para activar su Sello de Confianza — le avisaremos apenas esté disponible.
                </p>
              )}
              <Link to={requiereConfirmacion ? "/login/taller" : "/portal/taller"} className="mt-7 inline-block">
                <Button as="span" variant="signal" size="lg">
                  {requiereConfirmacion ? "Ir a iniciar sesión" : "Ir a mi panel"}
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
            <Button as="button" type="button" onClick={next} variant="signal" size="md" icon={ArrowRight} disabled={enviando}>
              {enviando ? "Creando cuenta…" : step === STEPS.length - 2 ? "Terminar" : "Continuar"}
            </Button>
          </div>
        )}

        {step === 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Ya tiene una cuenta?{" "}
            <Link to="/login/taller" className="font-bold text-signal-600 hover:underline">
              Inicie sesión
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
