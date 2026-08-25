// Espejo de bienvenida.ts, para la campaña de puntos por referido — ver
// supabase/migrations/0015_referidos_y_fix_campanas.sql. Se necesita el
// mismo puente localStorage/sessionStorage porque un registro con
// confirmación de correo pendiente no tiene sesión todavía: el enlace
// referente→referido ya quedó fijado en handle_new_user(), pero el
// otorgamiento de puntos (registrar_puntos_referido_si_aplica) solo se
// puede llamar con sesión activa — se resuelve en el primer login real,
// igual que la bienvenida.
const PENDIENTE_KEY = "tallergo_referido_pendiente";
const RESULTADO_KEY = "tallergo_referido_resultado";

export interface ResultadoReferido {
  otorgado: boolean;
  puntos: number;
}

export function marcarRegistroPendienteDeReferido() {
  try {
    localStorage.setItem(PENDIENTE_KEY, "1");
  } catch {
    /* localStorage no disponible — no bloquea el registro */
  }
}

export function hayRegistroPendienteDeReferido(): boolean {
  try {
    return localStorage.getItem(PENDIENTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function limpiarRegistroPendienteDeReferido() {
  try {
    localStorage.removeItem(PENDIENTE_KEY);
  } catch {
    /* noop */
  }
}

export function guardarResultadoReferido(resultado: ResultadoReferido) {
  try {
    sessionStorage.setItem(RESULTADO_KEY, JSON.stringify(resultado));
  } catch {
    /* noop */
  }
}

export function leerYLimpiarResultadoReferido(): ResultadoReferido | null {
  try {
    const raw = sessionStorage.getItem(RESULTADO_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(RESULTADO_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
