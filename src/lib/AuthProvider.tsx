// Contexto de autenticación real (Supabase Auth) para las tres cuentas del
// proyecto: Cliente, Taller, Admin. Mientras VITE_SUPABASE_URL/ANON_KEY no
// estén configuradas (ver supabaseClient.ts), este provider queda inerte —
// session/perfil se quedan en null y `cargando` pasa a false enseguida, así
// que el resto de la app (que hoy corre sobre datos de ejemplo) no se
// rompe. En cuanto esas dos variables existan, esto empieza a hablar de
// verdad con el proyecto de Supabase propio de Taller Aval.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigurado } from "@/lib/supabaseClient";
import type { EstadoAprobacion } from "@/lib/estados";

export type RolUsuario = "Admin" | "Taller" | "Cliente";

export interface Perfil {
  id: string;
  rol: RolUsuario;
  nombre: string | null;
  correo: string | null;
  celular: string | null;
  documentoTipo: string | null;
  documentoNumero: string | null;
  // Solo tienen sentido para rol='Cliente' — usados para filtrar Ofertas por
  // ciudad/tipo de vehículo del cliente logueado.
  ciudad: string | null;
  vehiculo: "carro" | "moto" | "ambos" | null;
  carroMotorizacion: "electrico" | "hibrido" | "combustion" | null;
  motoMotorizacion: "electrico" | "hibrido" | "combustion" | null;
  // Solo poblado para rol='Taller' — el organization_id de su membership
  // activa. Todas las pantallas de Panel de Taller lo necesitan para
  // consultar/actualizar "su" fila en organizations, comercio_contactos,
  // etc. sin repetir el join a memberships en cada pantalla.
  organizationId: string | null;
  // También solo para rol='Taller' — el status de esa organization
  // ('pendiente' | 'aprobado' | 'rechazado'). RequireTallerAprobado usa esto
  // para bloquear TODO el panel de taller hasta que un admin apruebe: un
  // taller registrado no debe poder "entrar" (ver CRM, publicar ofertas,
  // editar perfil) mientras esté pendiente, aunque ya tenga sesión activa.
  organizationStatus: EstadoAprobacion | null;
}

export interface DatosRegistroCliente {
  correo: string;
  password: string;
  nombre: string;
  celular: string;
  documentoTipo?: string;
  documentoNumero?: string;
  ciudad?: string;
  vehiculo?: "carro" | "moto" | "ambos";
  carroMotorizacion?: "electrico" | "hibrido" | "combustion" | null;
  motoMotorizacion?: "electrico" | "hibrido" | "combustion" | null;
}

export interface DatosRegistroTaller {
  correo: string;
  password: string;
  nombre: string; // nombre del encargado que se registra
  celular: string;
  nombreNegocio: string;
  tipoNegocio: "taller" | "almacen";
  ciudad: string;
  metadata?: Record<string, unknown>; // barrio, dirección, motorizaciones, etc. — ver TallerPerfil
}

interface ResultadoAuth {
  error: string | null;
  // Id del usuario que efectivamente inició sesión — lo usan las pantallas
  // de login para esperar a que session/perfil del contexto correspondan a
  // ESTE login puntual, y no a una sesión vieja de otra cuenta/rol que haya
  // quedado en el navegador (ver el bug "esa cuenta no pertenece" que salía
  // en el primer intento al cambiar de cuenta sin cerrar sesión antes).
  userId?: string;
}

interface ResultadoRegistro extends ResultadoAuth {
  // true si el proyecto tiene confirmación de correo activada: la cuenta se
  // creó, pero todavía no hay sesión — hay que avisarle que revise su correo,
  // no mandarlo directo al portal como si ya estuviera adentro.
  requiereConfirmacion: boolean;
}

interface AuthContextValue {
  cargando: boolean;
  session: Session | null;
  perfil: Perfil | null;
  iniciarSesion: (correo: string, password: string) => Promise<ResultadoAuth>;
  cerrarSesion: () => Promise<void>;
  registrarCliente: (datos: DatosRegistroCliente) => Promise<ResultadoRegistro>;
  registrarTaller: (datos: DatosRegistroTaller) => Promise<ResultadoRegistro>;
  // Guarda el tipo/número de documento del usuario logueado (Cliente o
  // Taller) en public.users — una sola vez. RequireDocumento.tsx lo llama
  // cuando perfil.documentoTipo/documentoNumero todavía están vacíos, y
  // como actualiza `perfil` directamente (sin refetch) el gate deja de
  // pedirlo apenas se guarda, sin esperar a un refresh de página.
  actualizarDocumento: (documentoTipo: string, documentoNumero: string) => Promise<ResultadoAuth>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Antes esto solo miraba error.message con .includes("email") / .includes("password")
// — eso hacía que CUALQUIER error que mencionara "email" (incluido "email ya
// registrado", "confirmá tu email", "límite de envío de emails") mostrara
// siempre "Ese correo no se ve válido.", aunque el correo estuviera perfecto.
// Ahora se usa primero error.code (estable, lo manda Supabase Auth explícito
// en cada respuesta — ver @supabase/auth-js/lib/error-codes.ts) y el texto
// del mensaje queda solo como respaldo para versiones viejas del SDK que no
// mandan code.
function traducirError(error: { message: string; code?: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "user_already_exists":
    case "email_exists":
    case "identity_already_exists":
      return "Ya existe una cuenta con ese correo.";
    case "weak_password":
      return "La contraseña necesita ser más segura (mínimo 6 caracteres, con letras y números).";
    case "email_address_invalid":
      return "Ese correo no se ve válido.";
    case "email_not_confirmed":
      return "Confirmá tu correo antes de iniciar sesión — revisá tu bandeja de entrada.";
    case "over_email_send_rate_limit":
      return "Muchos intentos seguidos — esperá un minuto y probá de nuevo.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "El registro por correo está desactivado en este momento.";
  }

  // Respaldo por si el SDK no manda `code` (versiones viejas de supabase-js).
  const msg = error.message ?? "";
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (/already (registered|exists)/i.test(msg)) return "Ya existe una cuenta con ese correo.";
  if (/password/i.test(msg)) return "La contraseña no cumple los requisitos mínimos.";
  if (/invalid[^.]*email|email[^.]*invalid/i.test(msg)) return "Ese correo no se ve válido.";
  return msg || "Algo salió mal. Intentá de nuevo.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!supabaseConfigurado) {
      setCargando(false);
      return;
    }

    let activo = true;

    async function cargarPerfil(userId: string) {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
      if (!activo) return;
      if (!error && data) {
        let organizationId: string | null = null;
        let organizationStatus: EstadoAprobacion | null = null;
        if (data.rol === "Taller") {
          const { data: membership } = await supabase
            .from("memberships")
            .select("organization_id, organizations(status)")
            .eq("user_id", userId)
            .eq("is_active", true)
            .maybeSingle();
          if (!activo) return;
          organizationId = membership?.organization_id ?? null;
          const org = membership?.organizations as { status?: EstadoAprobacion } | { status?: EstadoAprobacion }[] | null;
          organizationStatus = (Array.isArray(org) ? org[0]?.status : org?.status) ?? null;
        }
        setPerfil({
          id: data.id,
          rol: data.rol,
          nombre: data.nombre,
          correo: data.correo,
          celular: data.celular,
          documentoTipo: data.documento_tipo,
          documentoNumero: data.documento_numero,
          ciudad: data.ciudad ?? null,
          vehiculo: data.vehiculo ?? null,
          carroMotorizacion: data.carro_motorizacion ?? null,
          motoMotorizacion: data.moto_motorizacion ?? null,
          organizationId,
          organizationStatus,
        });
      } else {
        setPerfil(null);
      }
      setCargando(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      if (data.session) void cargarPerfil(data.session.user.id);
      else setCargando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) void cargarPerfil(newSession.user.id);
      else {
        setPerfil(null);
        setCargando(false);
      }
    });

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function iniciarSesion(correo: string, password: string): Promise<ResultadoAuth> {
    if (!supabaseConfigurado) return { error: "Supabase todavía no está configurado en este entorno." };
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (error) return { error: traducirError(error) };
    return { error: null, userId: data.user?.id };
  }

  async function cerrarSesion() {
    if (!supabaseConfigurado) return;
    await supabase.auth.signOut();
  }

  async function registrarCliente(datos: DatosRegistroCliente): Promise<ResultadoRegistro> {
    if (!supabaseConfigurado) return { error: "Supabase todavía no está configurado en este entorno.", requiereConfirmacion: false };
    const { data, error } = await supabase.auth.signUp({
      email: datos.correo,
      password: datos.password,
      options: {
        data: {
          rol: "Cliente",
          nombre: datos.nombre,
          celular: datos.celular,
          documento_tipo: datos.documentoTipo ?? null,
          documento_numero: datos.documentoNumero ?? null,
          ciudad: datos.ciudad ?? null,
          vehiculo: datos.vehiculo ?? null,
          carro_motorizacion: datos.carroMotorizacion ?? null,
          moto_motorizacion: datos.motoMotorizacion ?? null,
        },
      },
    });
    if (error) return { error: traducirError(error), requiereConfirmacion: false };
    return { error: null, requiereConfirmacion: !data.session };
  }

  async function registrarTaller(datos: DatosRegistroTaller): Promise<ResultadoRegistro> {
    if (!supabaseConfigurado) return { error: "Supabase todavía no está configurado en este entorno.", requiereConfirmacion: false };
    const { data, error } = await supabase.auth.signUp({
      email: datos.correo,
      password: datos.password,
      options: {
        data: {
          rol: "Taller",
          nombre: datos.nombre,
          celular: datos.celular,
          nombre_negocio: datos.nombreNegocio,
          tipo_negocio: datos.tipoNegocio,
          ciudad: datos.ciudad,
          metadata: datos.metadata ?? {},
        },
      },
    });
    if (error) return { error: traducirError(error), requiereConfirmacion: false };
    return { error: null, requiereConfirmacion: !data.session };
  }

  async function actualizarDocumento(documentoTipo: string, documentoNumero: string): Promise<ResultadoAuth> {
    if (!supabaseConfigurado) return { error: "Supabase todavía no está configurado en este entorno." };
    if (!session) return { error: "No hay sesión activa." };
    const { error } = await supabase
      .from("users")
      .update({ documento_tipo: documentoTipo, documento_numero: documentoNumero })
      .eq("id", session.user.id);
    if (error) return { error: "No pudimos guardar tu documento. Intentá de nuevo." };
    setPerfil((prev) => (prev ? { ...prev, documentoTipo, documentoNumero } : prev));
    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{ cargando, session, perfil, iniciarSesion, cerrarSesion, registrarCliente, registrarTaller, actualizarDocumento }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() tiene que usarse dentro de <AuthProvider>");
  return ctx;
}
