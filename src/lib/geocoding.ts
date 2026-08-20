// Geocodificación de direcciones — usa Nominatim (OpenStreetMap), API
// pública gratuita sin API key, llamada directo desde el navegador del
// usuario (no desde el servidor). Se usa en dos lugares:
//   1. RegistroTaller.tsx / TallerPerfil.tsx: geocodifican la dirección del
//      taller al guardar, para poblar organizations.latitude/longitude
//      (ver migración 0011_ubicacion_geografica.sql).
//   2. LandingHub.tsx: geocodifica la dirección que escribe un visitante en
//      el buscador público, para poder contar/buscar talleres cercanos por
//      coordenadas en vez de solo por texto.
//
// Nota: este entorno de desarrollo (sandbox de Claude) no tiene salida de
// red hacia nominatim.openstreetmap.org, así que esta función no se pudo
// probar end-to-end acá — sí corre normalmente en el navegador del usuario
// una vez desplegado, que es donde realmente se ejecuta (fetch del lado del
// cliente, no del servidor).

export interface Coordenadas {
  lat: number;
  lng: number;
  /** Nombre normalizado que devolvió el geocodificador — útil para confirmarle al usuario qué entendimos. */
  etiqueta: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Convierte una dirección de texto libre en coordenadas. Devuelve `null`
 * si no se pudo geocodificar (dirección no encontrada, o error de red) —
 * quien llama decide qué mensaje mostrar (ver copy de error en LandingHub).
 */
export async function geocodificarDireccion(direccion: string): Promise<Coordenadas | null> {
  const q = direccion.trim();
  if (!q) return null;
  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) return null;
    const primero = data[0];
    const lat = Number.parseFloat(primero.lat);
    const lng = Number.parseFloat(primero.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng, etiqueta: primero.display_name };
  } catch {
    return null;
  }
}

/** Distancia en km entre dos puntos (fórmula de Haversine) — solo para mostrar en el frontend; el orden real por cercanía lo hace el RPC en la base. */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// ── Búsqueda pendiente guardada al pasar por el registro/login ──────────
// sessionStorage (no localStorage): solo debe sobrevivir el viaje
// home → registro/login → resultados de esta misma pestaña, no quedar
// pegada para siempre en el dispositivo.

const CLAVE_BUSQUEDA_PENDIENTE = "ta_busqueda_pendiente";

export interface BusquedaPendiente {
  direccion: string;
  lat: number;
  lng: number;
  vehiculo?: string;
  servicio?: string;
}

export function guardarBusquedaPendiente(b: BusquedaPendiente) {
  try {
    sessionStorage.setItem(CLAVE_BUSQUEDA_PENDIENTE, JSON.stringify(b));
  } catch {
    // sessionStorage puede no estar disponible (modo privado estricto) — no es crítico, el usuario solo tendrá que volver a escribir la dirección.
  }
}

export function leerBusquedaPendiente(): BusquedaPendiente | null {
  try {
    const raw = sessionStorage.getItem(CLAVE_BUSQUEDA_PENDIENTE);
    if (!raw) return null;
    return JSON.parse(raw) as BusquedaPendiente;
  } catch {
    return null;
  }
}

export function limpiarBusquedaPendiente() {
  try {
    sessionStorage.removeItem(CLAVE_BUSQUEDA_PENDIENTE);
  } catch {
    // no-op
  }
}
