// Mini CRM interno del Admin para gestionar talleres — ver
// 0019_crm_documentos_talleres.sql. Todo lo de acá es de uso EXCLUSIVO del
// admin (RLS solo permite is_platform_admin()); el taller nunca ve nada de
// esto, ni siquiera que existe.

export type EstadoDocumento = "pendiente" | "solicitado" | "recibido" | "aprobado" | "rechazado";
export type TipoDocumento = "rut" | "cedula_representante" | "camara_comercio" | "cuenta_bancaria" | "fotos_taller";

export interface DocumentoTaller {
  id: string;
  organization_id: string;
  tipo: TipoDocumento;
  estado: EstadoDocumento;
  notas: string | null;
  updated_at: string;
}

export interface NotaTaller {
  id: string;
  organization_id: string;
  autor_id: string;
  texto: string;
  created_at: string;
  // Se resuelve del lado del cliente cruzando con la tabla users — no viene
  // de la base directamente (ver TallerCrmModal.tsx).
  autor_nombre?: string | null;
}

interface DefinicionDocumento {
  tipo: TipoDocumento;
  label: string;
  descripcion: string;
  // Cuándo mostrar la etiqueta de condición junto al nombre — null = siempre
  // obligatorio, sin etiqueta.
  condicion: string | null;
}

// Mismo checklist ya documentado para el negocio (RUT, cédula, Cámara de
// Comercio si es empresa, cuenta bancaria cuando se conecte Puntos, fotos
// recomendadas) — ahora vive también acá, operativo dentro del panel.
export const DOCUMENTOS_TALLER: DefinicionDocumento[] = [
  {
    tipo: "rut",
    label: "RUT del taller",
    descripcion: "Registro Único Tributario ante la DIAN — confirma que el negocio existe formalmente.",
    condicion: null,
  },
  {
    tipo: "cedula_representante",
    label: "Cédula del propietario o representante legal",
    descripcion: "Foto o escaneo por ambos lados. Confirma quién es la persona real detrás del negocio.",
    condicion: null,
  },
  {
    tipo: "camara_comercio",
    label: "Certificado de Existencia y Representación Legal",
    descripcion: "Solo si el taller es una sociedad (no persona natural) — lo expide la Cámara de Comercio, vigencia no mayor a 30 días.",
    condicion: "Si es empresa",
  },
  {
    tipo: "cuenta_bancaria",
    label: "Datos de cuenta bancaria del negocio",
    descripcion: "Todavía no hace falta para cobrar comisión (Tallergo no cobra), pero sí hará falta para liquidar canjes cuando se conecte Puntos.",
    condicion: "Cuando aplique",
  },
  {
    tipo: "fotos_taller",
    label: "2-3 fotos reales del taller",
    descripcion: "No es un requisito legal — ayuda a que el taller se vea confiable en la plataforma desde el día uno.",
    condicion: "Recomendado",
  },
];

export const ESTADOS_DOCUMENTO: { value: EstadoDocumento; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "solicitado", label: "Solicitado" },
  { value: "recibido", label: "Recibido" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

// Estilos por estado — usados tanto en el select como en el badge de resumen
// del encabezado del panel.
export const ESTILO_ESTADO_DOCUMENTO: Record<EstadoDocumento, string> = {
  pendiente: "bg-slate-100 text-slate-600",
  solicitado: "bg-amber-100 text-amber-700",
  recibido: "bg-brand-500/10 text-brand-700",
  aprobado: "bg-emerald-100 text-emerald-700",
  rechazado: "bg-red-100 text-red-700",
};

function soloDigitos(v: string): string {
  return v.replace(/\D/g, "");
}

/**
 * Enlace de WhatsApp (wa.me) para pedirle al taller los documentos que
 * todavía le faltan — arma el mensaje solo con lo que sigue en 'pendiente' o
 * 'rechazado' (lo que ya está 'solicitado', 'recibido' o 'aprobado' no se
 * vuelve a pedir). Si no queda nada por pedir, devuelve null.
 */
export function enlaceWhatsappDocumentos(
  nombreTaller: string,
  celular: string | null,
  documentos: DocumentoTaller[]
): string | null {
  const faltantes = DOCUMENTOS_TALLER.filter((def) => {
    const doc = documentos.find((d) => d.tipo === def.tipo);
    const estado = doc?.estado ?? "pendiente";
    return estado === "pendiente" || estado === "rechazado";
  });
  if (faltantes.length === 0) return null;

  const lista = faltantes.map((d, i) => `${i + 1}. ${d.label}`).join("\n");
  const mensaje =
    `Hola, le escribo de Tallergo respecto a la afiliación de ${nombreTaller}. ` +
    `Para continuar con la aprobación, ¿nos podría compartir estos datos?\n\n${lista}\n\n` +
    `Puede enviarlos por acá mismo, en foto o PDF. ¡Gracias!`;

  const numero = celular ? soloDigitos(celular) : "";
  const numeroConIndicativo = numero && !numero.startsWith("57") && numero.length === 10 ? `57${numero}` : numero;
  const base = numeroConIndicativo ? `https://wa.me/${numeroConIndicativo}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(mensaje)}`;
}
