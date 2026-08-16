// Datos de EJEMPLO para el sistema de Puntos de Cliente — todavía no hay
// Supabase conectado. La idea de fondo (definida por el negocio): el
// cliente gana puntos cada vez que PAGA un servicio o producto en un
// comercio de la red Taller Aval. Por eso los puntos se modelan como "puntos
// de la red" y no "puntos del taller X" — la visión a futuro es sumar
// comercios de otros rubros (no solo talleres/repuestos) para que el mismo
// saldo se pueda redimir en cualquiera de ellos. Por ahora el catálogo de
// canje solo tiene comercios de Taller Aval, pero el modelo ya está listo
// para esa expansión sin tener que rediseñar nada.

export type TipoMovimientoPuntos = "ganado" | "redimido";

export interface MovimientoPuntos {
  id: string;
  tipo: TipoMovimientoPuntos;
  puntos: number; // positivo si "ganado", negativo si "redimido"
  motivo: string;
  comercioNombre: string;
  createdAt: string; // ISO
}

// Tasa de ejemplo: 1 punto por cada $1.000 COP pagados. El precio real
// (y si varía por plan del taller) queda pendiente de definir con el
// negocio — esto solo sirve para probar la experiencia completa ya mismo.
export const PUNTOS_POR_COP = 1 / 1000;

/** El multiplicador viene de una promoción del taller (ver `multiplicadorPuntos` en las ofertas). */
export function calcularPuntosGanados(montoCOP: number, multiplicador = 1): number {
  return Math.round(montoCOP * PUNTOS_POR_COP * multiplicador);
}

export const MOVIMIENTOS_PUNTOS_MOCK: MovimientoPuntos[] = [
  { id: "m1", tipo: "ganado", puntos: 45, motivo: "Cambio de aceite y filtros", comercioNombre: "Taller El Motor Feliz", createdAt: "2026-08-10" },
  { id: "m2", tipo: "ganado", puntos: 90, motivo: "Mantenimiento general (doble puntos de fin de semana)", comercioNombre: "Taller El Motor Feliz", createdAt: "2026-08-02" },
  { id: "m3", tipo: "redimido", puntos: -60, motivo: "Canje: Lavado completo gratis", comercioNombre: "Taller El Motor Feliz", createdAt: "2026-07-20" },
  { id: "m4", tipo: "ganado", puntos: 32, motivo: "Revisión de frenos", comercioNombre: "EV Taller Especializado", createdAt: "2026-07-15" },
  { id: "m5", tipo: "ganado", puntos: 20, motivo: "Compra de repuestos", comercioNombre: "Repuestos Itagüí Motos", createdAt: "2026-07-05" },
];

export function saldoPuntos(movimientos: MovimientoPuntos[]): number {
  return movimientos.reduce((total, m) => total + m.puntos, 0);
}

export interface RecompensaCanje {
  id: string;
  comercioNombre: string;
  titulo: string;
  descripcion: string;
  puntosNecesarios: number;
}

export const RECOMPENSAS_MOCK: RecompensaCanje[] = [
  { id: "r1", comercioNombre: "Taller El Motor Feliz", titulo: "Lavado completo gratis", descripcion: "Lavado exterior e interior, sin costo.", puntosNecesarios: 60 },
  { id: "r2", comercioNombre: "Taller El Motor Feliz", titulo: "10% de descuento en tu próxima visita", descripcion: "Aplica sobre mano de obra.", puntosNecesarios: 100 },
  { id: "r3", comercioNombre: "EV Taller Especializado", titulo: "Diagnóstico eléctrico gratis", descripcion: "Revisión completa del sistema eléctrico.", puntosNecesarios: 80 },
  { id: "r4", comercioNombre: "Repuestos Itagüí Motos", titulo: "Filtro de aceite de regalo", descripcion: "Al comprar cualquier otro repuesto.", puntosNecesarios: 40 },
  { id: "r5", comercioNombre: "MotoExpress Repuestos", titulo: "15% de descuento en accesorios", descripcion: "Cascos, guantes y más.", puntosNecesarios: 120 },
];
