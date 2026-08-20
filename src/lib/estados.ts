// Estado de aprobación de un taller/almacén — mismo valor que la columna
// organizations.status en la base real (ver supabase/migrations/
// 0000_base_schema.sql). Vive en su propio archivo porque lo usan
// StatusBadge (Admin) y EstadoBadge (Taller) por igual, y ya no hay un
// módulo de datos de ejemplo del que colgarlo.
export type EstadoAprobacion = "pendiente" | "aprobado" | "rechazado";
