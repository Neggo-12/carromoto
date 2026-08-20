// Cliente de Supabase — proyecto PROPIO de Taller Aval (nunca el de Neggo ni
// el de Puntos Neggo). Las dos variables de entorno se leen de .env.local
// (ver .env.example); mientras no estén configuradas, la app sigue
// funcionando en modo demo con los datos de ejemplo de siempre — así una
// sesión de desarrollo sin esas variables no se rompe, pero login/registro
// reales no van a andar hasta que estén.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigurado = Boolean(url && anonKey);

if (!supabaseConfigurado) {
  // Aviso solo en consola — no bloquea el resto de la app (que hasta ahora
  // corre entera sobre datos de ejemplo).
  console.warn(
    "[Taller Aval] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no están configuradas — login y registro reales no van a funcionar hasta que se agreguen en .env.local (ver .env.example)."
  );
}

// Con valores vacíos, createClient igual construye un cliente (no lanza),
// simplemente cualquier llamada real va a fallar — por eso el resto de la
// app consulta `supabaseConfigurado` antes de depender de una respuesta real.
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-anon-key");
