// Categorías de negocio para Ofertas (campanas.segmentacion.categoria) —
// mismo vocabulario que categoriasDelTaller() en TallerOfertas.tsx. Vive en
// su propio archivo porque lo usan tanto el Panel de Taller como el Portal
// de Cliente, y ya no hay un módulo de datos de ejemplo del que colgarlo.
export type CategoriaTaller = "taller_carro" | "taller_moto" | "repuestos_carro" | "repuestos_moto";

export const CATEGORIA_LABELS: Record<CategoriaTaller, string> = {
  taller_carro: "Taller de carros",
  taller_moto: "Taller de motos",
  repuestos_carro: "Repuestos de carro",
  repuestos_moto: "Repuestos de moto",
};
