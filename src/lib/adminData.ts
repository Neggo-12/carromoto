// Datos de EJEMPLO para el panel administrativo — todavía no hay base de
// datos conectada (eso será Supabase). Esta data solo sirve para diseñar y
// probar el panel; cuando conectemos Supabase, se reemplaza por datos reales
// sin tener que rediseñar nada.

import type { Motorizacion } from "./data";

export type EstadoAprobacion = "pendiente" | "aprobado" | "rechazado";

export interface Encargado {
  nombre: string;
  rol: string; // "Propietario", "Administrador", etc.
}

export interface TallerAdmin {
  id: string;
  nombreNegocio: string;
  correo: string;
  celular: string;
  direccion: string;
  ciudad: string;
  barrio: string;
  encargado: Encargado;
  tipoNegocio: "taller" | "almacen";
  tipoVehiculo: "carro" | "moto" | "ambos";
  carroMotorizacion: Motorizacion | null;
  motoMotorizacion: Motorizacion | null;
  especialistaElectricos: boolean;
  estado: EstadoAprobacion;
  planId: string;
  selloActivo: boolean;
  fechaRegistro: string; // ISO
  // Espejo de descripcionNegocio en tallerData.ts — null hasta que el
  // taller la complete (obligatoria recién después de aprobado).
  descripcionNegocio: string | null;
}

export interface ClienteAdmin {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  ciudad: string;
  vehiculo: "carro" | "moto" | "ambos";
  carroMotorizacion: Motorizacion | null;
  motoMotorizacion: Motorizacion | null;
  fechaRegistro: string;
}

export interface Plan {
  id: string;
  nombre: string;
  precioMensual: number; // COP — valor de ejemplo, precio real pendiente de definir
  descripcion: string;
}

// Precios de ejemplo — todavía no está definido el modelo de precios real.
export const PLANES: Plan[] = [
  { id: "basico", nombre: "Básico", precioMensual: 0, descripcion: "Perfil visible, sin Sello de Confianza todavía." },
  { id: "plus", nombre: "Plus", precioMensual: 79000, descripcion: "Sello de Confianza activo + prioridad en resultados." },
  { id: "premium", nombre: "Premium", precioMensual: 149000, descripcion: "Sello de Confianza + destacado + estadísticas del negocio." },
];

export const TALLERES_MOCK: TallerAdmin[] = [
  {
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
    estado: "aprobado",
    planId: "plus",
    selloActivo: true,
    fechaRegistro: "2026-06-02",
    descripcionNegocio: null,
  },
  {
    id: "t2",
    nombreNegocio: "MotoExpress Repuestos",
    correo: "ventas@motoexpress.co",
    celular: "3012345678",
    direccion: "Cl 30 # 65-10",
    ciudad: "Medellín",
    barrio: "Belén",
    encargado: { nombre: "Diana Osorio", rol: "Administradora" },
    tipoNegocio: "almacen",
    tipoVehiculo: "moto",
    carroMotorizacion: null,
    motoMotorizacion: "combustion",
    especialistaElectricos: false,
    estado: "pendiente",
    planId: "basico",
    selloActivo: false,
    fechaRegistro: "2026-08-10",
    descripcionNegocio: null,
  },
  {
    id: "t3",
    nombreNegocio: "EV Taller Especializado",
    correo: "info@evtaller.co",
    celular: "3023456789",
    direccion: "Av. El Poblado # 12-50",
    ciudad: "Envigado",
    barrio: "San Marcos",
    encargado: { nombre: "Julián Restrepo", rol: "Propietario" },
    tipoNegocio: "taller",
    tipoVehiculo: "ambos",
    carroMotorizacion: "electrico",
    motoMotorizacion: "electrico",
    especialistaElectricos: true,
    estado: "aprobado",
    planId: "premium",
    selloActivo: true,
    fechaRegistro: "2026-05-14",
    descripcionNegocio: "Especialistas en mantenimiento y diagnóstico de vehículos eléctricos e híbridos, con más de 8 años de experiencia.",
  },
  {
    id: "t4",
    nombreNegocio: "Almacén Repuestos Sabaneta",
    correo: "repuestossabaneta@gmail.com",
    celular: "3034567890",
    direccion: "Cl 77 Sur # 42-15",
    ciudad: "Sabaneta",
    barrio: "Betania",
    encargado: { nombre: "Marta Zuluaga", rol: "Propietaria" },
    tipoNegocio: "almacen",
    tipoVehiculo: "ambos",
    carroMotorizacion: "hibrido",
    motoMotorizacion: "combustion",
    especialistaElectricos: false,
    estado: "pendiente",
    planId: "basico",
    selloActivo: false,
    fechaRegistro: "2026-08-12",
    descripcionNegocio: null,
  },
  {
    id: "t5",
    nombreNegocio: "Taller Bogotá Motos",
    correo: "contacto@bogotamotos.com",
    celular: "3045678901",
    direccion: "Cra 15 # 100-30",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    encargado: { nombre: "Andrés Pardo", rol: "Propietario" },
    tipoNegocio: "taller",
    tipoVehiculo: "moto",
    carroMotorizacion: null,
    motoMotorizacion: "hibrido",
    especialistaElectricos: false,
    estado: "aprobado",
    planId: "plus",
    selloActivo: true,
    fechaRegistro: "2026-04-20",
    descripcionNegocio: "Taller de motos con atención rápida: frenos, kits de arrastre y mantenimiento general el mismo día.",
  },
  {
    id: "t6",
    nombreNegocio: "Cali Carros y Repuestos",
    correo: "info@calicarros.co",
    celular: "3056789012",
    direccion: "Av. 6N # 23-45",
    ciudad: "Cali",
    barrio: "Granada",
    encargado: { nombre: "Laura Vidal", rol: "Administradora" },
    tipoNegocio: "taller",
    tipoVehiculo: "carro",
    carroMotorizacion: "combustion",
    motoMotorizacion: null,
    especialistaElectricos: false,
    estado: "rechazado",
    planId: "basico",
    selloActivo: false,
    fechaRegistro: "2026-07-28",
    descripcionNegocio: null,
  },
  {
    id: "t7",
    nombreNegocio: "Híbridos y Eléctricos del Valle",
    correo: "servicio@hibridosvalle.co",
    celular: "3067890123",
    direccion: "Cl 5 # 38-12",
    ciudad: "Cali",
    barrio: "Versalles",
    encargado: { nombre: "Felipe Ospina", rol: "Propietario" },
    tipoNegocio: "taller",
    tipoVehiculo: "carro",
    carroMotorizacion: "hibrido",
    motoMotorizacion: null,
    especialistaElectricos: true,
    estado: "pendiente",
    planId: "premium",
    selloActivo: false,
    fechaRegistro: "2026-08-13",
    descripcionNegocio: null,
  },
  {
    id: "t8",
    nombreNegocio: "Repuestos Itagüí Motos",
    correo: "repuestositagui@gmail.com",
    celular: "3078901234",
    direccion: "Cl 51 # 48-20",
    ciudad: "Itagüí",
    barrio: "Ditaires",
    encargado: { nombre: "Sandra Muñoz", rol: "Propietaria" },
    tipoNegocio: "almacen",
    tipoVehiculo: "moto",
    carroMotorizacion: null,
    motoMotorizacion: "combustion",
    especialistaElectricos: false,
    estado: "aprobado",
    planId: "basico",
    selloActivo: true,
    fechaRegistro: "2026-03-11",
    descripcionNegocio: "Repuestos originales y genéricos para moto, con asesoría para encontrar la pieza exacta que necesitás.",
  },
];

export const CLIENTES_MOCK: ClienteAdmin[] = [
  { id: "c1", nombres: "Juan", apellidos: "Pérez", correo: "juan.perez@gmail.com", celular: "3101234567", ciudad: "Medellín", vehiculo: "carro", carroMotorizacion: "combustion", motoMotorizacion: null, fechaRegistro: "2026-07-01" },
  { id: "c2", nombres: "María", apellidos: "Gómez", correo: "maria.gomez@gmail.com", celular: "3112345678", ciudad: "Medellín", vehiculo: "ambos", carroMotorizacion: "hibrido", motoMotorizacion: "combustion", fechaRegistro: "2026-07-03" },
  { id: "c3", nombres: "Andrés", apellidos: "Salazar", correo: "andres.salazar@gmail.com", celular: "3123456789", ciudad: "Bogotá", vehiculo: "moto", carroMotorizacion: null, motoMotorizacion: "electrico", fechaRegistro: "2026-07-05" },
  { id: "c4", nombres: "Camila", apellidos: "Rojas", correo: "camila.rojas@gmail.com", celular: "3134567890", ciudad: "Cali", vehiculo: "carro", carroMotorizacion: "electrico", motoMotorizacion: null, fechaRegistro: "2026-07-10" },
  { id: "c5", nombres: "Santiago", apellidos: "Herrera", correo: "santiago.herrera@gmail.com", celular: "3145678901", ciudad: "Envigado", vehiculo: "ambos", carroMotorizacion: "combustion", motoMotorizacion: "combustion", fechaRegistro: "2026-07-15" },
  { id: "c6", nombres: "Valentina", apellidos: "Cárdenas", correo: "valentina.cardenas@gmail.com", celular: "3156789012", ciudad: "Bucaramanga", vehiculo: "carro", carroMotorizacion: "hibrido", motoMotorizacion: null, fechaRegistro: "2026-07-20" },
  { id: "c7", nombres: "Daniel", apellidos: "Torres", correo: "daniel.torres@gmail.com", celular: "3167890123", ciudad: "Medellín", vehiculo: "moto", carroMotorizacion: null, motoMotorizacion: "combustion", fechaRegistro: "2026-07-22" },
  { id: "c8", nombres: "Isabella", apellidos: "Moreno", correo: "isabella.moreno@gmail.com", celular: "3178901234", ciudad: "Barranquilla", vehiculo: "carro", carroMotorizacion: "combustion", motoMotorizacion: null, fechaRegistro: "2026-07-25" },
  { id: "c9", nombres: "Sebastián", apellidos: "Vargas", correo: "sebastian.vargas@gmail.com", celular: "3189012345", ciudad: "Cali", vehiculo: "ambos", carroMotorizacion: "electrico", motoMotorizacion: "electrico", fechaRegistro: "2026-08-01" },
  { id: "c10", nombres: "Manuela", apellidos: "Castro", correo: "manuela.castro@gmail.com", celular: "3190123456", ciudad: "Medellín", vehiculo: "carro", carroMotorizacion: "combustion", motoMotorizacion: null, fechaRegistro: "2026-08-05" },
];

export interface ServicioSolicitado {
  label: string;
  count: number;
}

// Ranking de ejemplo — cuando haya datos reales, esto sale de las solicitudes
// que los clientes efectivamente hagan en la plataforma.
export const SERVICIOS_SOLICITADOS_MOCK: ServicioSolicitado[] = [
  { label: "Mecánica general", count: 142 },
  { label: "Frenos", count: 118 },
  { label: "Cambio de aceite y filtros", count: 104 },
  { label: "Llantas y alineación", count: 87 },
  { label: "Eléctrico / diagnóstico", count: 76 },
  { label: "Suspensión", count: 61 },
  { label: "Latonería y pintura", count: 45 },
  { label: "Aire acondicionado", count: 33 },
];

export function planPorId(planId: string): Plan {
  return PLANES.find((p) => p.id === planId) ?? PLANES[0];
}

export function formatCOP(valor: number): string {
  if (valor === 0) return "Gratis";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);
}
