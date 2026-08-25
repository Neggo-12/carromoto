// Helpers de la campaña "100 puntos de bienvenida" (ver
// supabase/migrations/0013_campana_bienvenida.sql). El otorgamiento en sí
// vive en el RPC registrar_bienvenida_si_aplica() — acá solo coordinamos
// CUÁNDO se llama, para que nunca sea retroactivo:
//
// - Si el registro deja sesión activa de una (no requiere confirmar correo),
//   RegistroCliente.tsx llama al RPC directo y ahí mismo puede mostrar el
//   resultado.
// - Si el registro requiere confirmar el correo primero, no hay sesión
//   todavía para llamar al RPC. Guardamos una marca en localStorage
//   (PENDIENTE_KEY) y LoginCliente.tsx la consume la primera vez que ese
//   cliente entra con sesión real — nunca en logins posteriores, y nunca
//   para una cuenta que no dejó esa marca (o sea, nunca para clientes viejos).
//
// El resultado para mostrar en pantalla (banner en ClienteInicio) viaja por
// sessionStorage (RESULTADO_KEY) — se borra apenas se lee, para que solo se
// muestre una vez.

const PENDIENTE_KEY = "tallergo_bienvenida_pendiente";
const RESULTADO_KEY = "tallergo_bienvenida_resultado";

export interface ResultadoBienvenida {
  otorgado: boolean;
  puntos: number;
}

export function marcarRegistroPendienteDeBienvenida() {
  try {
    localStorage.setItem(PENDIENTE_KEY, "1");
  } catch {
    // localStorage puede fallar en navegación privada — no es crítico, en el
    // peor caso ese cliente puntual no ve el banner de bienvenida.
  }
}

export function hayRegistroPendienteDeBienvenida(): boolean {
  try {
    return localStorage.getItem(PENDIENTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function limpiarRegistroPendienteDeBienvenida() {
  try {
    localStorage.removeItem(PENDIENTE_KEY);
  } catch {
    // no-op
  }
}

export function guardarResultadoBienvenida(resultado: ResultadoBienvenida) {
  try {
    sessionStorage.setItem(RESULTADO_KEY, JSON.stringify(resultado));
  } catch {
    // no-op
  }
}

export function leerYLimpiarResultadoBienvenida(): ResultadoBienvenida | null {
  try {
    const raw = sessionStorage.getItem(RESULTADO_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(RESULTADO_KEY);
    return JSON.parse(raw) as ResultadoBienvenida;
  } catch {
    return null;
  }
}
