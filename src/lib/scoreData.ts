// Datos de EJEMPLO para el "motor del negocio" que califica y prioriza
// talleres según qué tan buenos son en servicio y calidad — lo que pidió el
// negocio pensando en el caso de "1000 talleres en un sector, hay que
// premiar a los mejores". Por ahora esto SOLO se usa para mostrarle al
// taller (y al admin) su nivel/insignia y habilitar beneficios de
// destacado — todavía NO cambia el orden en que aparecen los talleres en
// "Buscar Talleres". Esa fue una decisión explícita del negocio para esta
// etapa; queda documentada acá por si se retoma más adelante.

export interface TallerScoreFactores {
  calificacionClientes: number; // promedio 0–5 estrellas
  tiempoRespuestaHoras: number; // qué tan rápido responde leads del CRM — menos es mejor
  leadsGanados: number;
  leadsPerdidos: number;
  mesesActivo: number; // antigüedad y actividad en la plataforma
  historialLimpio: boolean; // historial de registro limpio, sin reportes/quejas graves
}

export type NivelTaller = "bronce" | "plata" | "oro" | "platino";

export const NIVELES_TALLER: { value: NivelTaller; label: string; minScore: number; color: string; bg: string }[] = [
  { value: "bronce", label: "Bronce", minScore: 0, color: "text-orange-700", bg: "bg-orange-500/10" },
  { value: "plata", label: "Plata", minScore: 50, color: "text-slate-600", bg: "bg-slate-500/10" },
  { value: "oro", label: "Oro", minScore: 72, color: "text-amber-600", bg: "bg-amber-500/10" },
  { value: "platino", label: "Platino", minScore: 88, color: "text-cyan-600", bg: "bg-cyan-500/10" },
];

/**
 * Score de 0 a 100. Pesos de ejemplo — se pueden recalibrar cuando haya
 * datos reales: calificación de clientes (35%), velocidad de respuesta
 * (20%), % de leads que convierte en cliente ganado (25%), antigüedad y
 * actividad (10%), historial limpio (10%).
 */
export function calcularScore(f: TallerScoreFactores): number {
  const scoreCalificacion = (f.calificacionClientes / 5) * 35;
  const scoreVelocidad = Math.max(0, 20 - f.tiempoRespuestaHoras); // penaliza cada hora de demora, tope 20
  const totalLeads = f.leadsGanados + f.leadsPerdidos;
  const tasaConversion = totalLeads > 0 ? f.leadsGanados / totalLeads : 0.5;
  const scoreConversion = tasaConversion * 25;
  const scoreAntiguedad = Math.min(f.mesesActivo / 12, 1) * 10; // 12 meses = tope
  const scoreHistorial = f.historialLimpio ? 10 : 0;
  const total = scoreCalificacion + scoreVelocidad + scoreConversion + scoreAntiguedad + scoreHistorial;
  return Math.round(Math.min(100, Math.max(0, total)));
}

export function nivelPorScore(score: number): (typeof NIVELES_TALLER)[number] {
  return [...NIVELES_TALLER].reverse().find((n) => score >= n.minScore) ?? NIVELES_TALLER[0];
}

export interface TallerScoreDetalle {
  tallerId: string;
  factores: TallerScoreFactores;
}

// Mismos ids que TALLERES_MOCK (adminData.ts) y MI_TALLER_MOCK (tallerData.ts, id "t1").
export const TALLER_SCORES_MOCK: TallerScoreDetalle[] = [
  { tallerId: "t1", factores: { calificacionClientes: 4.6, tiempoRespuestaHoras: 2, leadsGanados: 18, leadsPerdidos: 4, mesesActivo: 3, historialLimpio: true } },
  { tallerId: "t2", factores: { calificacionClientes: 3.8, tiempoRespuestaHoras: 10, leadsGanados: 5, leadsPerdidos: 6, mesesActivo: 1, historialLimpio: true } },
  { tallerId: "t3", factores: { calificacionClientes: 4.9, tiempoRespuestaHoras: 1, leadsGanados: 22, leadsPerdidos: 2, mesesActivo: 4, historialLimpio: true } },
  { tallerId: "t4", factores: { calificacionClientes: 4.0, tiempoRespuestaHoras: 14, leadsGanados: 3, leadsPerdidos: 5, mesesActivo: 1, historialLimpio: true } },
  { tallerId: "t5", factores: { calificacionClientes: 4.4, tiempoRespuestaHoras: 4, leadsGanados: 14, leadsPerdidos: 5, mesesActivo: 5, historialLimpio: true } },
  { tallerId: "t6", factores: { calificacionClientes: 2.9, tiempoRespuestaHoras: 20, leadsGanados: 2, leadsPerdidos: 9, mesesActivo: 2, historialLimpio: false } },
  { tallerId: "t7", factores: { calificacionClientes: 4.2, tiempoRespuestaHoras: 6, leadsGanados: 7, leadsPerdidos: 3, mesesActivo: 1, historialLimpio: true } },
  { tallerId: "t8", factores: { calificacionClientes: 4.1, tiempoRespuestaHoras: 5, leadsGanados: 10, leadsPerdidos: 4, mesesActivo: 6, historialLimpio: true } },
];

export function factoresPorTallerId(tallerId: string): TallerScoreFactores | null {
  return TALLER_SCORES_MOCK.find((d) => d.tallerId === tallerId)?.factores ?? null;
}

export function scorePorTallerId(tallerId: string): number {
  const factores = factoresPorTallerId(tallerId);
  return factores ? calcularScore(factores) : 0;
}
