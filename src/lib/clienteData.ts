// Datos de EJEMPLO para el Portal de Cliente — features "Ofertas" y "Buscar
// Talleres". Todavía no hay Supabase conectado a este proyecto; esta data
// simula lo que después vendrá de la base de datos real, para poder diseñar
// y probar la experiencia completa desde ya. El SQL real de estas dos
// features (tablas, seguridad, funciones) ya está listo y guardado en
// supabase/migrations/0001_ofertas_buscar_talleres.sql, esperando a que se
// cree el proyecto de Supabase propio de Taller Aval (separado del de Neggo).

export type CategoriaTaller = "taller_carro" | "taller_moto" | "repuestos_carro" | "repuestos_moto";

export const CATEGORIA_LABELS: Record<CategoriaTaller, string> = {
  taller_carro: "Taller de carros",
  taller_moto: "Taller de motos",
  repuestos_carro: "Repuestos de carro",
  repuestos_moto: "Repuestos de moto",
};

export interface TallerVerificado {
  id: string;
  nombre: string;
  ciudad: string;
  categorias: CategoriaTaller[];
  especialistaElectricos: boolean; // exclusivamente eléctricos e híbridos
  afiliadoDesde: string; // ISO
  codigoPublico: string; // visible al cliente, ej. "TA-4F82A1"
  // Descripción corta que escribió el taller sobre su negocio, para que el
  // cliente lo identifique de un vistazo. Puede ser null si el taller
  // todavía no la completó (es obligatoria recién después de que el admin
  // lo aprueba, ver descripcionNegocio en tallerData.ts).
  descripcionNegocio: string | null;
}

export const TALLERES_VERIFICADOS_MOCK: TallerVerificado[] = [
  {
    id: "tv1",
    nombre: "Taller El Motor Feliz",
    ciudad: "Medellín",
    categorias: ["taller_carro"],
    especialistaElectricos: false,
    afiliadoDesde: "2026-06-02",
    codigoPublico: "TA-8A21F0",
    // Vacío a propósito — mismo taller que MI_TALLER_MOCK en tallerData.ts,
    // todavía no completó su descripción.
    descripcionNegocio: null,
  },
  {
    id: "tv2",
    nombre: "EV Taller Especializado",
    ciudad: "Envigado",
    categorias: ["taller_carro", "taller_moto"],
    especialistaElectricos: true,
    afiliadoDesde: "2026-05-14",
    codigoPublico: "TA-2C7B93",
    descripcionNegocio: "Especialistas en mantenimiento y diagnóstico de vehículos eléctricos e híbridos, con más de 8 años de experiencia.",
  },
  {
    id: "tv3",
    nombre: "Taller Bogotá Motos",
    ciudad: "Bogotá",
    categorias: ["taller_moto"],
    especialistaElectricos: false,
    afiliadoDesde: "2026-04-20",
    codigoPublico: "TA-5D19E4",
    descripcionNegocio: "Taller de motos con atención rápida: frenos, kits de arrastre y mantenimiento general el mismo día.",
  },
  {
    id: "tv4",
    nombre: "Repuestos Itagüí Motos",
    ciudad: "Itagüí",
    categorias: ["repuestos_moto"],
    especialistaElectricos: false,
    afiliadoDesde: "2026-03-11",
    codigoPublico: "TA-9F04B7",
    descripcionNegocio: "Repuestos originales y genéricos para moto, con asesoría para encontrar la pieza exacta que necesitás.",
  },
  {
    id: "tv5",
    nombre: "Híbridos y Eléctricos del Valle",
    ciudad: "Cali",
    categorias: ["taller_carro"],
    especialistaElectricos: true,
    afiliadoDesde: "2026-08-13",
    codigoPublico: "TA-3E68C2",
    descripcionNegocio: "Mantenimiento preventivo y correctivo para carros híbridos y eléctricos, con equipo certificado por las marcas.",
  },
  {
    id: "tv6",
    nombre: "Almacén Repuestos Sabaneta",
    ciudad: "Sabaneta",
    categorias: ["repuestos_carro"],
    especialistaElectricos: false,
    afiliadoDesde: "2026-08-12",
    codigoPublico: "TA-7B45D9",
    descripcionNegocio: "Repuestos de carro a buen precio, con envío rápido dentro del Valle de Aburrá.",
  },
  {
    id: "tv7",
    nombre: "MotoExpress Repuestos",
    ciudad: "Medellín",
    categorias: ["repuestos_moto", "taller_moto"],
    especialistaElectricos: false,
    afiliadoDesde: "2026-07-01",
    codigoPublico: "TA-1A93F6",
    descripcionNegocio: "Repuestos y accesorios para moto, con taller propio para instalación inmediata.",
  },
  {
    id: "tv8",
    nombre: "Cali Carros y Repuestos",
    ciudad: "Cali",
    categorias: ["taller_carro", "repuestos_carro"],
    especialistaElectricos: false,
    afiliadoDesde: "2026-07-28",
    codigoPublico: "TA-6C82A5",
    descripcionNegocio: "Taller y venta de repuestos para carro en un mismo lugar, con garantía por escrito en mano de obra.",
  },
];

/** Mismo orden que la búsqueda real (buscar_comercios_verificados en la
 * migración): coincidencia exacta primero, luego "empieza con", luego
 * "contiene", límite de 20 resultados. */
export function buscarTalleresVerificados(termino: string): TallerVerificado[] {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  const q = norm(termino);
  if (!q) return [];

  const qLower = termino.trim().toLowerCase();
  return TALLERES_VERIFICADOS_MOCK.filter((t) => norm(t.nombre).includes(q))
    .sort((a, b) => {
      const rank = (t: TallerVerificado) => {
        const n = t.nombre.toLowerCase();
        if (n === qLower) return 0;
        if (n.startsWith(qLower)) return 1;
        return 2;
      };
      const diff = rank(a) - rank(b);
      return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
    })
    .slice(0, 20);
}

// Código de verificación de 6 dígitos — en el proyecto real esto lo genera
// una función de Postgres (ver la migración) con una sal (salt) secreta que
// solo vive en el servidor. Acá, mientras no hay backend conectado, lo
// simulamos en el navegador solo para que la experiencia se vea y se pruebe
// completa; no tiene valor de seguridad real todavía.
const SAL_DEMO_SOLO_FRONTEND = "talleraval-demo-frontend";
export function generarCodigoVerificacion(id: string): string {
  const str = id + SAL_DEMO_SOLO_FRONTEND;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const code = ((Math.abs(hash) % 900000) + 100000).toString();
  return `${code.slice(0, 3)} ${code.slice(3, 6)}`;
}

export interface ContactoTaller {
  id: string;
  tallerId: string;
  tallerNombre: string;
  descripcion: string;
  nombre: string;
  telefono: string;
  whatsapp: string | null;
  status: "pendiente" | "atendido";
  codigoVerificacion: string;
  createdAt: string; // ISO
}

export interface OfertaCampana {
  id: string;
  tallerId: string;
  tallerNombre: string;
  titulo: string;
  descripcion: string;
  ciudades: string[];
  categorias: CategoriaTaller[];
  soloElectricosHibridos: boolean;
  // Espejo de multiplicadorPuntos/multiplicadorVigencia en tallerData.ts —
  // el cliente necesita ver el mismo incentivo que publicó el taller.
  multiplicadorPuntos?: 2 | 3;
  multiplicadorVigencia?: string;
}

export const OFERTAS_MOCK: OfertaCampana[] = [
  {
    id: "of1",
    tallerId: "tv1",
    tallerNombre: "Taller El Motor Feliz",
    titulo: "20% de descuento en cambio de aceite",
    descripcion: "Válido para carros a gasolina o diésel. Incluye revisión de filtros sin costo adicional.",
    ciudades: ["Medellín"],
    categorias: ["taller_carro"],
    soloElectricosHibridos: false,
    multiplicadorPuntos: 2,
    multiplicadorVigencia: "Este fin de semana (sáb-dom)",
  },
  {
    id: "of2",
    tallerId: "tv2",
    tallerNombre: "EV Taller Especializado",
    titulo: "Diagnóstico de batería gratis",
    descripcion: "Para carros y motos eléctricos o híbridos. Agenda tu cita y trae tu vehículo para una revisión completa del sistema eléctrico.",
    ciudades: ["Envigado", "Medellín"],
    categorias: ["taller_carro", "taller_moto"],
    soloElectricosHibridos: true,
  },
  {
    id: "of3",
    tallerId: "tv3",
    tallerNombre: "Taller Bogotá Motos",
    titulo: "Kit de frenos con instalación incluida",
    descripcion: "Precio especial en repuestos originales de frenos para moto, con instalación el mismo día.",
    ciudades: ["Bogotá"],
    categorias: ["taller_moto"],
    soloElectricosHibridos: false,
  },
  {
    id: "of4",
    tallerId: "tv4",
    tallerNombre: "Repuestos Itagüí Motos",
    titulo: "2x1 en filtros de aceite",
    descripcion: "Lleva dos filtros de aceite para moto por el precio de uno, disponible mientras haya inventario.",
    ciudades: ["Itagüí", "Medellín"],
    categorias: ["repuestos_moto"],
    soloElectricosHibridos: false,
  },
  {
    id: "of5",
    tallerId: "tv5",
    tallerNombre: "Híbridos y Eléctricos del Valle",
    titulo: "Mantenimiento preventivo híbrido -15%",
    descripcion: "Descuento en mantenimiento preventivo para carros híbridos, incluye revisión del sistema de frenado regenerativo.",
    ciudades: ["Cali"],
    categorias: ["taller_carro"],
    soloElectricosHibridos: true,
  },
  {
    id: "of6",
    tallerId: "tv6",
    tallerNombre: "Almacén Repuestos Sabaneta",
    titulo: "Envío gratis en compras desde $150.000",
    descripcion: "Válido para repuestos de carro con envío dentro del Valle de Aburrá.",
    ciudades: ["Sabaneta", "Envigado", "Medellín"],
    categorias: ["repuestos_carro"],
    soloElectricosHibridos: false,
  },
];
