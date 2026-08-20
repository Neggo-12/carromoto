import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

/**
 * Pide tipo y número de documento la primera vez que un Cliente o un Taller
 * entra al portal — pedido explícito: "el sistema le debe pedir al cliente
 * tipo de documento y el documento, y al taller lo mismo... que el sistema
 * identifique que si ya se lo pidió y se guardó que no se lo vuelva a pedir
 * en un próximo ingreso". Por eso el gate es puramente derivado de
 * perfil.documentoTipo/documentoNumero (columnas users.documento_tipo/
 * documento_numero, ya existían en la base): si ya están guardados no
 * bloquea nada, sesión tras sesión.
 *
 * Se monta DENTRO de RequireAuth (y, para Taller, dentro de
 * RequireTallerAprobado) en App.tsx, para los dos portales.
 */

const TIPOS_DOCUMENTO = [
  { value: "CC", label: "Cédula de ciudadanía (CC)" },
  { value: "CE", label: "Cédula de extranjería (CE)" },
  { value: "TI", label: "Tarjeta de identidad (TI)" },
  { value: "PPT", label: "Permiso por Protección Temporal (PPT)" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "NIT", label: "NIT" },
];

export function RequireDocumento({ children }: { children: React.ReactNode }) {
  const { perfil, actualizarDocumento } = useAuth();
  const [tipo, setTipo] = useState("CC");
  const [numero, setNumero] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // RequireAuth ya garantiza sesión + perfil antes de llegar acá; si por
  // alguna razón perfil todavía no cargó, no mostramos el formulario vacío.
  if (!perfil) return null;
  if (perfil.documentoTipo && perfil.documentoNumero) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!numero.trim()) {
      setError("Ingresá tu número de documento.");
      return;
    }
    setEnviando(true);
    setError("");
    const { error: err } = await actualizarDocumento(tipo, numero.trim());
    setEnviando(false);
    if (err) setError(err);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
      <div className="w-full max-w-md rounded-[20px] border border-[#E4E7EC] bg-white p-7 shadow-2xl">
        <h2 className="text-[18px] font-black tracking-tight text-[#111827]">Necesitamos un dato más</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#667085]">
          Para continuar, contanos tu tipo y número de documento. Te lo pedimos una sola vez.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label htmlFor="rd-tipo" className="mb-1.5 block text-[12px] font-bold text-[#111827]">
              Tipo de documento
            </label>
            <select
              id="rd-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="h-[48px] w-full rounded-[12px] border border-[#D1D5DB] bg-white px-3.5 text-[14px] text-[#111827] focus:border-[#111827] focus:outline-none"
            >
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rd-numero" className="mb-1.5 block text-[12px] font-bold text-[#111827]">
              Número de documento
            </label>
            <input
              id="rd-numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Sin puntos ni espacios"
              className="h-[48px] w-full rounded-[12px] border border-[#D1D5DB] px-3.5 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#111827] focus:outline-none"
            />
          </div>

          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#111827] text-[14px] font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:opacity-60"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar y continuar
          </button>
        </form>
      </div>
    </div>
  );
}
