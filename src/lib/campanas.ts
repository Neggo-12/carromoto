// Área metropolitana / ciudades cercanas — para que al crear una campaña el
// taller no tenga que elegir ciudad por ciudad si su zona ya tiene varios
// municipios vecinos: le sugerimos el clúster completo (puede sacar o
// agregar ciudades igual, es solo el punto de partida). Solo declaramos
// clústers para ciudades que YA están en CIUDADES (src/lib/data.ts) — no
// inventamos municipios que no existen en esa lista.
//
// Medellín + área metropolitana del Valle de Aburrá: son, en orden, las
// primeras 8 ciudades de CIUDADES (Envigado, Itagüí, Sabaneta, Bello, La
// Estrella, Caldas son literalmente los municipios del área metropolitana;
// Rionegro es del Oriente cercano, se incluye porque también está en la
// lista y es una zona cercana habitual).
export const AREA_METROPOLITANA: Record<string, string[]> = {
  Medellín: ["Medellín", "Envigado", "Itagüí", "Sabaneta", "Bello", "La Estrella", "Caldas", "Rionegro"],
  Envigado: ["Envigado", "Medellín", "Itagüí", "Sabaneta", "La Estrella"],
  Itagüí: ["Itagüí", "Medellín", "Envigado", "Sabaneta", "La Estrella"],
  Sabaneta: ["Sabaneta", "Medellín", "Envigado", "Itagüí", "La Estrella", "Caldas"],
  Bello: ["Bello", "Medellín"],
  "La Estrella": ["La Estrella", "Medellín", "Itagüí", "Sabaneta", "Caldas"],
  Caldas: ["Caldas", "Medellín", "La Estrella", "Sabaneta"],
  Rionegro: ["Rionegro", "Medellín"],
};

/**
 * Ciudades sugeridas para una campaña, a partir de la ciudad base del
 * taller. Si no hay clúster declarado para esa ciudad, sugiere solo esa
 * ciudad — nunca inventa municipios fuera de CIUDADES.
 */
export function ciudadesSugeridas(ciudadBase: string | null | undefined): string[] {
  if (!ciudadBase) return [];
  return AREA_METROPOLITANA[ciudadBase] ?? [ciudadBase];
}
