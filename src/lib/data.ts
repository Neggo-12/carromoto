// Datos compartidos entre Login/Registro — listas usadas por los
// buscadores desplegables (ciudad, barrio) y los selectores de servicios.
// Medellín primero porque es el mercado inicial (mismo foco que Neggo).

export const CIUDADES = [
  "Medellín",
  "Envigado",
  "Itagüí",
  "Sabaneta",
  "Bello",
  "La Estrella",
  "Caldas",
  "Rionegro",
  "Bogotá",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Pereira",
  "Manizales",
  "Armenia",
  "Cúcuta",
  "Santa Marta",
  "Ibagué",
  "Villavicencio",
];

// Barrios reales por ciudad — alimentan el buscador de barrio, que además
// permite escribir libremente si el barrio del usuario no aparece listado.
export const BARRIOS_POR_CIUDAD: Record<string, string[]> = {
  Medellín: [
    "El Poblado", "Laureles", "Belén", "La América", "Robledo", "Castilla",
    "Aranjuez", "Manrique", "San Javier", "Buenos Aires", "Villa Hermosa",
    "Guayabal", "Santa Cruz", "Popular", "Doce de Octubre", "El Estadio",
    "Conquistadores", "Calasanz", "Belén Rosales", "La Floresta", "Los Colores",
    "Suramericana", "Boston", "Prado", "Loma de los Bernal", "Simón Bolívar",
    "Alejandría", "Ciudad del Río", "Provenza", "Manila", "Patio Bonito",
    "El Velódromo", "Cristo Rey", "Naranjal", "Barrio Colombia", "Belén La Nubia",
    "Los Balsos",
  ],
  Envigado: [
    "Las Vegas", "El Portal", "San Marcos", "Pontevedra", "Jardines", "Villagrande",
    "Bosques de Zúñiga", "Los Naranjos", "La Mesa", "Centro", "Obrero", "Bucarest",
    "La Magnolia", "La Sebastiana", "Las Flores", "Uribe Ángel", "Alto de Misael",
    "Las Orquídeas", "El Salado", "La Mina", "San Rafael", "San José", "Las Antillas",
    "El Trianón", "Loma del Barro", "La Paz", "El Dorado", "Las Casitas", "Primavera",
    "Alcalá", "Loma de las Brujas", "La Pradera", "El Chocho", "Zúñiga", "Otraparte",
  ],
  Itagüí: [
    "Las Brisas", "San Javier", "Villa Lía", "19 de Abril", "San Gabriel", "San Antonio",
    "Triana", "Ditaires", "San Francisco", "Santa María No. 1", "Santa María No. 2",
    "La Esmeralda", "Simón Bolívar", "San Fernando", "Entre Colinas", "Las Acacias",
    "Las Américas", "El Tablazo", "Calatrava", "Loma Linda", "Terranova", "La Aldea",
    "Balcones de Sevilla", "Fátima", "El Rosario", "La Unión", "Suramérica", "Santa Ana",
    "San Isidro", "Centro", "Camparola", "San Pío X",
  ],
  Sabaneta: [
    "Aliadas del Sur", "Ancón Sur", "Betania", "Calle del Banco", "Calle Larga",
    "El Carmelo II", "Entreamigos", "Holanda", "La Barquereña", "La Florida",
    "Lagos de la Doctora", "Las Casitas", "Los Alcázares", "Los Arias",
    "Manuel Restrepo", "María Auxiliadora", "Nuestra Señora de los Dolores",
    "Paso Ancho", "Playas de María", "Prados de Sabaneta", "Promisión",
    "Restrepo Naranjo", "Sabaneta Real", "San Joaquín", "San Rafael", "Santa Ana",
    "Tres Esquinas", "Vegas de la Doctora", "Vegas de San José", "Villas del Carmen",
    "Virgen del Carmen",
  ],
  Bello: [
    "Los Sauces", "El Cafetal", "La Pradera", "La Esmeralda", "París", "Salvador Allende",
    "La Cabaña", "La Madera", "La Florida", "Gran Avenida", "San José Obrero",
    "San Simón", "Santa Ana", "Los Búcaros", "Suárez", "Puerto Bello", "Espíritu Santo",
    "Centro", "La Meseta", "El Rosario", "Andalucía", "El Cairo", "La Milagrosa",
    "Las Granjas", "Prado", "Altavista", "Hato Viejo", "El Porvenir", "Buenos Aires",
    "El Paraíso", "La Primavera", "Villa María", "Bellavista", "San Martín", "Fontidueño",
  ],
  "La Estrella": [
    "Ancón San Martín", "Villa Alicia", "Villa Mira", "Bellavista", "Camilo Torres",
    "Caquetá", "Centro", "Chile", "El Dorado", "El Pedrero", "Escobar", "Horizontes",
    "La Chinca", "La Ferrería", "La Ospina", "Las Brisas", "Monterrey", "Primavera",
    "Quebrada Grande", "San Agustín", "San Andrés", "San Cayetano", "San Vicente",
    "Zona Industrial",
  ],
  Caldas: [
    "Barrios Unidos", "La Pradera", "Aburrá Sur", "Barrio Nuevo", "Los Cerezos",
    "Cristo Rey", "Olaya Herrera", "La Docena", "La Inmaculada", "Felipe Echavarría No. 1",
    "Felipe Echavarría No. 2", "La Chuscala", "El Minuto", "La Planta", "Las Margaritas",
    "La Acuarela", "Centro", "Andalucía", "La Goretti", "El Socorro", "Juan XXIII",
    "Villa Capri", "La Buena Esperanza", "Fundadores", "Centenario", "Mandalay",
    "La Playita", "La Aguacatala", "Bellavista", "El Porvenir", "Primavera", "La Locería",
  ],
  Rionegro: [
    "Belchite", "Centro", "Alto del Medio", "El Hospital", "El Faro",
    "San Antonio de Pereira", "Gualanday", "Cuatro Esquinas", "Santa Ana",
    "El Porvenir", "Llano Grande", "Barro Blanco", "El Tablazo", "Yarumal",
    "Galicia", "Chipre", "Cabeceras de Llanogrande", "Fontibón",
  ],
  Bogotá: [
    "Usaquén", "Cedritos", "Santa Bárbara", "Chapinero", "Chicó Norte", "Rosales",
    "El Retiro", "Quinta Camacho", "La Candelaria", "Las Nieves", "Centro Internacional",
    "Teusaquillo", "Galerías", "La Soledad", "Barrios Unidos", "Suba", "Niza",
    "Colina Campestre", "Pinar de Suba", "La Carolina", "Engativá", "Garcés Navas",
    "Normandía", "Fontibón", "Hayuelos", "Modelia", "Kennedy", "Patio Bonito",
    "Timiza", "Puente Aranda", "Antonio Nariño", "Restrepo", "Tunjuelito", "Bosa",
    "San Cristóbal",
  ],
  Cali: [
    "Ciudad Jardín", "Club Campestre", "Normandía", "El Peñón", "La Flora", "Juanambú",
    "Versalles", "San Fernando", "Granada", "San Antonio", "Meléndez", "El Ingenio",
    "Pance", "Valle del Lili", "Tequendama", "San Vicente", "Cristales",
    "Prados del Norte", "La Buitrera", "El Bosque", "San Nicolás", "Chipichape",
    "Centro", "Terrón Colorado", "Siloé", "Petecuy", "Floralia", "Alfonso López",
    "El Guabal", "Ciudad 2000", "Miraflores", "Salomia", "San Pedro", "Santa Rita",
    "Ciudad Capri",
  ],
  Barranquilla: [
    "Alameda del Río", "Altos del Prado", "Villa Santos", "Altos de Riomar", "Miramar",
    "Ciudad Jardín", "Riomar", "El Prado", "Villa Campestre", "Boston", "La Castellana",
    "El Tabor", "Bellavista", "San Vicente", "Altamira", "Los Alpes", "Barranquillita",
    "La Pradera", "Nuevo Horizonte", "Villa Country", "Centro", "El Porvenir",
    "Ciudad Mallorquín", "Villa San Pedro", "Juan Mina",
  ],
  Cartagena: [
    "Bocagrande", "Castillogrande", "El Laguito", "Manga", "Getsemaní", "San Diego",
    "Centro", "Crespo", "Marbella", "Pie de la Popa", "Torices", "La Boquilla",
    "Alcibia", "Boston", "Chiquinquirá", "El Pozón", "Tesca", "Olaya Herrera",
    "El Bosque", "Buenos Aires", "El Country", "San Pedro", "Santa Mónica", "El Carmelo",
    "La Concepción", "Amberes", "Blas de Lezo", "Nelson Mandela", "San Francisco",
    "Bocachica", "La Matuna", "Daniel Lemaitre", "Almirante Colón", "Puerto Rey",
    "Tierra Baja",
  ],
  Bucaramanga: [
    "Cabecera del Llano", "García Rovira", "Centro", "Sotomayor", "Alarcón",
    "San Francisco", "Ciudadela Real de Minas", "La Concordia", "La Victoria",
    "Ricaurte", "Kennedy", "Álvarez", "Antonia Santos", "Girardot", "Terrazas",
    "Mutis", "Provenza", "Bolívar", "Nápoles", "Morrorico", "Chapinero", "Modelo",
    "Universidad", "Campo Hermoso", "Comuneros", "Prado", "Diamante", "Los Pinos",
    "Toledo Plata", "Nuevo Sotomayor",
  ],
  Pereira: [
    "Cuba", "Boston", "El Poblado", "El Jardín", "San Nicolás", "Centro", "Río Otún",
    "Universidad", "Villavicencio", "Villa Santana", "Ferrocarril", "Olímpica",
    "San Joaquín", "Villa del Café", "Perla del Otún", "Pinares", "Cerritos",
    "Los Álamos", "Galicia", "Los Alpes", "Circunvalar", "Avenida Sur", "San José Sur",
    "Maraya", "Ciudad Boquía", "Málaga", "Restrepo", "Bellavista", "La Divisa",
    "El Dorado", "Normandía", "Naranjito", "La Habana",
  ],
  Manizales: [
    "Chipre", "El Bosque", "San José", "La Enea", "Fátima", "Palermo", "Palogrande",
    "Milán", "La Francia", "Solferino", "Villapilar", "Cerro de Oro", "Tejares",
    "San Jorge", "La Argentina", "Versalles", "El Campín", "Sierra Morena",
    "Villahermosa", "Baja Suiza", "Alta Suiza", "El Cable", "La Camelia", "Niza",
    "Centro", "Santa Helena", "Los Laureles", "Campoamor", "San Joaquín",
    "Los Agustinos", "Las Américas", "Asís", "San Ignacio",
  ],
  Armenia: [
    "Centenario", "La Isabela", "El Prado", "Alfonso López", "Fundadores", "El Bosque",
    "San José", "Libertadores", "Granada", "La Castilla", "Pinares", "Cristales",
    "Gibraltar", "El Poblado", "Los Naranjos", "Santa Rita", "San Nicolás", "Corbones",
    "La Divisa", "Providencia", "Galán", "Salvador Allende", "Simón Bolívar", "Boyacá",
    "Obrero", "Berlín", "Kennedy", "Miraflores", "La Patria", "Modelo", "Las Américas",
    "La Nueva Cecilia",
  ],
  Cúcuta: [
    "Centro", "La Playa", "Caobos", "La Riviera", "Quinta Oriental", "San Isidro",
    "Santa Ana", "San Mateo", "Bogotá", "La Libertad", "Torcoroma", "San José",
    "Aniversario", "Alcalá", "Ciudad Jardín", "El Bosque", "Lleras Restrepo", "Sevilla",
    "Zona Industrial", "Aeropuerto", "El Salado", "Simón Bolívar", "Toledo Plata",
    "Panamericano", "Comuneros", "Chapinero", "La Florida", "Motilones", "Atalaya",
    "Antonia Santos", "Belén", "Camilo Torres", "Santander", "Gaitán", "Galán",
  ],
  "Santa Marta": [
    "Mamatoco", "Pescaíto", "El Rodadero", "Taganga", "Bello Horizonte", "Gaira",
    "Bavaria", "Centro", "El Prado", "El Pueblito", "Manzanares", "María Eugenia",
    "Corea", "Concepción", "El Parque", "El Líbano", "Bolivariana", "11 de Noviembre",
    "Doce de Octubre", "El Carmen", "El Socorro", "Las Colinas", "Las Palmeras",
    "Santa Cruz", "Santa Lucía", "Los Pinos", "Los Nogales", "Curinca", "Jardín",
  ],
  Ibagué: [
    "Centro", "La Pola", "Belén", "Santa Bárbara", "Ambalá", "Piedra Pintada", "Jordán",
    "El Salado", "Cádiz", "Boyacá", "Ricaurte", "Kennedy", "Las Ferias", "Boquerón",
    "Interlaken", "Combeima", "San Simón", "El Carmen", "Belalcázar", "Alfonso López",
    "Caracolí", "Vergel", "San Francisco", "Los Alpes", "La Floresta", "Picaleña",
    "Miraflores", "Restrepo", "Palermo", "Topacio", "Macarena", "América", "La Francia",
  ],
  Villavicencio: [
    "Barzal", "Popular", "Porfía", "San Isidro", "Camoa", "La Esperanza", "El Recuerdo",
    "Ciudad Salitre", "Centro", "Catumare", "Playa Rica", "Kirpas", "Nuevo Amanecer",
    "Villa del Río", "Los Centauros", "Santa Fe", "Guayabal", "Balatá", "Cataluña",
    "Bello Horizonte", "Dos Mil", "Villa María", "Simón Bolívar", "Macarena", "Caney",
    "La Vega", "Comuneros", "La Alborada", "Las Acacias", "Montecarlo", "La Rochela",
    "Villa Julia", "Jordán", "El Rodeo", "El Barzal Bajo",
  ],
};

// Barrios de Medellín — se mantiene por compatibilidad; usar
// BARRIOS_POR_CIUDAD[ciudad] con fallback a esta lista.
export const BARRIOS_MEDELLIN = BARRIOS_POR_CIUDAD["Medellín"];

export interface ServicioOption {
  value: string;
  label: string;
}

export const SERVICIOS_CARRO: ServicioOption[] = [
  { value: "mecanica_general", label: "Mecánica general" },
  { value: "latoneria_pintura", label: "Latonería y pintura" },
  { value: "frenos", label: "Frenos" },
  { value: "suspension", label: "Suspensión" },
  { value: "electrico_diagnostico", label: "Eléctrico / diagnóstico" },
  { value: "aire_acondicionado", label: "Aire acondicionado" },
  { value: "llantas_alineacion", label: "Llantas y alineación" },
  { value: "cambio_aceite", label: "Cambio de aceite y filtros" },
];

export const SERVICIOS_MOTO: ServicioOption[] = [
  { value: "mecanica_mantenimiento", label: "Mecánica y mantenimiento" },
  { value: "frenos_moto", label: "Frenos" },
  { value: "suspension_moto", label: "Suspensión" },
  { value: "electrico_diagnostico_moto", label: "Eléctrico / diagnóstico" },
  { value: "llantas_moto", label: "Llantas" },
  { value: "cambio_aceite_moto", label: "Cambio de aceite y filtros" },
];

// Tipo de motorización — usado en Registro Cliente y Registro Taller cada vez
// que preguntamos por carro/moto eléctrico, para no dejar afuera los híbridos.
export type Motorizacion = "combustion" | "electrico" | "hibrido";

export interface MotorizacionOption {
  value: Motorizacion;
  label: string;
  description?: string;
}

export const OPCIONES_MOTORIZACION: MotorizacionOption[] = [
  { value: "combustion", label: "Combustión", description: "Motor a gasolina o diésel" },
  { value: "electrico", label: "Eléctrico", description: "100% a batería" },
  { value: "hibrido", label: "Híbrido", description: "Combina combustión y eléctrico" },
];

export const REPUESTOS_CARRO: ServicioOption[] = [
  { value: "frenos_repuesto", label: "Frenos" },
  { value: "suspension_direccion", label: "Suspensión y dirección" },
  { value: "motor_transmision", label: "Motor y transmisión" },
  { value: "electrico_bateria", label: "Eléctrico y batería" },
  { value: "carroceria_latoneria", label: "Carrocería y latonería" },
  { value: "llantas_rines", label: "Llantas y rines" },
  { value: "filtros_lubricantes", label: "Filtros y lubricantes" },
  { value: "aire_acondicionado_repuesto", label: "Aire acondicionado" },
  { value: "iluminacion", label: "Iluminación" },
  { value: "accesorios_carro", label: "Accesorios" },
];

export const REPUESTOS_MOTO: ServicioOption[] = [
  { value: "frenos_repuesto_moto", label: "Frenos" },
  { value: "suspension_moto_repuesto", label: "Suspensión" },
  { value: "motor_moto_repuesto", label: "Motor" },
  { value: "electrico_bateria_moto", label: "Eléctrico y batería" },
  { value: "llantas_moto_repuesto", label: "Llantas" },
  { value: "filtros_aceites_moto", label: "Filtros y aceites" },
  { value: "escapes", label: "Escapes" },
  { value: "accesorios_moto", label: "Accesorios" },
];

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;
