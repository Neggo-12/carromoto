// Datos de EJEMPLO para el Panel de Taller — todavía no hay Supabase
// conectado. Sirve para diseñar y probar la experiencia del taller ya
// mismo; cuando conectemos la base de datos real, esto se reemplaza sin
// tener que rediseñar nada. El taller de ejemplo ("Taller El Motor Feliz")
// es el mismo que aparece en el panel de Admin y en Buscar Talleres, para
// que la historia de ejemplo sea consistente en todo el proyecto.

import type { Motorizacion } from "./data";
import { defaultSchedule, type WeekSchedule } from "@/components/ScheduleEditor";
import type { EstadoAprobacion } from "./adminData";
import type { CategoriaTaller } from "./clienteData";

export interface TallerPerfil {
  id: string;
  nombreNegocio: string;
  correo: string;
  celular: string;
  direccion: string;
  ciudad: string;
  barrio: string;
  encargado: { nombre: string; rol: string };
  tipoNegocio: "taller" | "almacen";
  tipoVehiculo: "carro" | "moto" | "ambos";
  carroMotorizacion: Motorizacion | null;
  motoMotorizacion: Motorizacion | null;
  especialistaElectricos: boolean;
  servicios: string[];
  horario: WeekSchedule;
  estado: EstadoAprobacion;
  planId: string;
  selloActivo: boolean;
  fechaRegistro: string; // ISO
  // Descripción corta del negocio, para que el cliente identifique qué lo
  // hace distinto (años de experiencia, especialidad, etc.). Se pide recién
  // cuando el admin aprueba el taller — antes de eso el campo ni se
  // muestra, así que queda null hasta ese momento.
  descripcionNegocio: string | null;
}

export const DESCRIPCION_NEGOCIO_MIN = 40;
export const DESCRIPCION_NEGOCIO_MAX = 220;

/**
 * A qué categorías puede aplicar una oferta de este taller — nunca las 4
 * categorías del catálogo completo, solo las que corresponden a lo que el
 * taller realmente hace. Un taller de solo motos no debe poder marcar
 * "Taller de carros" en sus ofertas: no tiene sentido y confunde al cliente.
 */
export function categoriasDelTaller(taller: Pick<TallerPerfil, "tipoNegocio" | "tipoVehiculo">): CategoriaTaller[] {
  const prefijo = taller.tipoNegocio === "almacen" ? "repuestos" : "taller";
  const cats: CategoriaTaller[] = [];
  if (taller.tipoVehiculo === "carro" || taller.tipoVehiculo === "ambos") cats.push(`${prefijo}_carro` as CategoriaTaller);
  if (taller.tipoVehiculo === "moto" || taller.tipoVehiculo === "ambos") cats.push(`${prefijo}_moto` as CategoriaTaller);
  return cats;
}

export const MI_TALLER_MOCK: TallerPerfil = {
  id: "t1",
  nombreNegocio: "Taller El Motor Feliz",
  correo: "contacto@motorfeliz.com",
  celular: "3001234567",
  direccion: "Cra 70 # 44-20",
  ciudad: "Medellín",
  barrio: "Laureles",
  encargado: { nombre: "Carlos Ramírez", rol: "Propietario" },
  tipoNegocio: "taller",
  tipoVehiculo: "carro",
  carroMotorizacion: "combustion",
  motoMotorizacion: null,
  especialistaElectricos: false,
  servicios: ["mecanica_general", "frenos", "cambio_aceite"],
  horario: defaultSchedule(),
  estado: "aprobado",
  planId: "plus",
  selloActivo: true,
  fechaRegistro: "2026-06-02",
  // Vacío a propósito: este taller ya está aprobado pero todavía no
  // completó el campo obligatorio — así se ve la pantalla de "Mi perfil"
  // pidiéndoselo, tal como lo va a ver un taller recién aprobado.
  descripcionNegocio: null,
};

// ── CRM de clientes interesados ──
// Unifica las dos formas en que le puede llegar un cliente interesado al
// taller: (a) te escribió directo desde "Buscar Talleres" (trae código de
// verificación, mecanismo anti-suplantación), o (b) dio "Me interesa" en una
// de tus ofertas (trae a qué oferta respondió). Mismo pipeline de gestión
// para las dos, para que el taller no tenga que mirar dos pantallas distintas.

export type OrigenLead = "buscar_talleres" | "oferta";
export type EstadoLead = "nuevo" | "contactado" | "cotizado" | "ganado" | "perdido";

export const ESTADOS_LEAD: { value: EstadoLead; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "cotizado", label: "Cotizado" },
  { value: "ganado", label: "Ganado" },
  { value: "perdido", label: "Perdido" },
];

export interface LeadCRM {
  id: string;
  origen: OrigenLead;
  clienteNombre: string;
  clienteTelefono: string;
  clienteWhatsapp: string | null;
  detalle: string; // descripción de la solicitud, o el título de la oferta que le interesó
  ofertaTitulo?: string; // solo si origen === "oferta"
  codigoVerificacion?: string; // solo si origen === "buscar_talleres" — el taller debe decírselo al cliente
  estado: EstadoLead;
  notas: string;
  createdAt: string; // ISO
}

export const LEADS_MOCK: LeadCRM[] = [
  {
    id: "l1",
    origen: "buscar_talleres",
    clienteNombre: "Juan Pérez",
    clienteTelefono: "3101234567",
    clienteWhatsapp: "3101234567",
    detalle: "Necesito cambio de aceite y revisión de frenos para mi carro.",
    codigoVerificacion: "482 917",
    estado: "nuevo",
    notas: "",
    createdAt: "2026-08-14",
  },
  {
    id: "l2",
    origen: "buscar_talleres",
    clienteNombre: "María Gómez",
    clienteTelefono: "3112345678",
    clienteWhatsapp: null,
    detalle: "¿Tienen disponibilidad esta semana para alineación y balanceo?",
    codigoVerificacion: "205 638",
    estado: "cotizado",
    notas: "Le pasé precio de alineación + balanceo, quedó en confirmar día.",
    createdAt: "2026-08-12",
  },
  {
    id: "l3",
    origen: "buscar_talleres",
    clienteNombre: "Andrés Salazar",
    clienteTelefono: "3123456789",
    clienteWhatsapp: "3123456789",
    detalle: "Quiero cotizar mantenimiento general, carro con 40.000 km.",
    codigoVerificacion: "731 049",
    estado: "nuevo",
    notas: "",
    createdAt: "2026-08-10",
  },
  {
    id: "l4",
    origen: "oferta",
    clienteNombre: "Camila Rojas",
    clienteTelefono: "3134567890",
    clienteWhatsapp: "3134567890",
    detalle: "Le interesa: 20% de descuento en cambio de aceite",
    ofertaTitulo: "20% de descuento en cambio de aceite",
    estado: "contactado",
    notas: "",
    createdAt: "2026-08-13",
  },
  {
    id: "l5",
    origen: "oferta",
    clienteNombre: "Santiago Herrera",
    clienteTelefono: "3145678901",
    clienteWhatsapp: null,
    detalle: "Le interesa: 20% de descuento en cambio de aceite",
    ofertaTitulo: "20% de descuento en cambio de aceite",
    estado: "ganado",
    notas: "Vino el sábado, hizo el cambio de aceite.",
    createdAt: "2026-08-09",
  },
];

/** Mensaje de WhatsApp listo para enviar — el taller lo puede editar antes de mandarlo. */
export function mensajePredeterminado(lead: LeadCRM, nombreTaller: string): string {
  if (lead.origen === "oferta") {
    return `Hola ${lead.clienteNombre}, te escribimos de ${nombreTaller} por tu interés en la oferta "${lead.ofertaTitulo}". Contanos qué necesitás y te ayudamos.`;
  }
  return `Hola ${lead.clienteNombre}, te escribimos de ${nombreTaller} por tu solicitud: "${lead.detalle}". ¿Seguís interesado/a?`;
}

/** Link que abre WhatsApp con el mensaje ya escrito, listo para revisar y enviar. */
export function linkWhatsapp(telefono: string, mensaje: string): string {
  const digits = telefono.replace(/\D/g, "");
  const conIndicativo = digits.startsWith("57") ? digits : `57${digits}`;
  return `https://wa.me/${conIndicativo}?text=${encodeURIComponent(mensaje)}`;
}

export interface MiOferta {
  id: string;
  titulo: string;
  descripcion: string;
  ciudad: string;
  categorias: CategoriaTaller[];
  soloElectricosHibridos: boolean;
  estado: "activa" | "pausada";
  interesados: number; // contador de ejemplo — el detalle de cada interesado vive en LEADS_MOCK (CRM)
  createdAt: string; // ISO
  // Puntos extra por esta oferta — ej. "gana el doble de puntos este fin de
  // semana por traer tu moto a mantenimiento". Ambos van juntos: si hay
  // multiplicador, tiene que haber vigencia (y viceversa).
  multiplicadorPuntos?: 2 | 3;
  multiplicadorVigencia?: string; // texto libre, ej. "Este fin de semana (sáb-dom)"
}

export const MIS_OFERTAS_MOCK: MiOferta[] = [
  {
    id: "of1",
    titulo: "20% de descuento en cambio de aceite",
    descripcion: "Válido para carros a gasolina o diésel. Incluye revisión de filtros sin costo adicional.",
    ciudad: "Medellín",
    categorias: ["taller_carro"],
    soloElectricosHibridos: false,
    estado: "activa",
    interesados: 14,
    createdAt: "2026-08-01",
    multiplicadorPuntos: 2,
    multiplicadorVigencia: "Este fin de semana (sáb-dom)",
  },
];
