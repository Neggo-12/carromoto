import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Clock, Users, ShieldCheck, ArrowRight, Zap, Loader2 } from "lucide-react";
import { StatTile } from "@/components/admin/StatTile";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { supabase } from "@/lib/supabaseClient";

type EstadoAprobacion = "pendiente" | "aprobado" | "rechazado";

interface OrgResumen {
  id: string;
  name: string;
  status: EstadoAprobacion;
  has_trust_seal: boolean;
  ciudad: string | null;
  metadata: { barrio?: string; especialista_electricos?: boolean } | null;
}

interface EncargadoInfo {
  nombre: string | null;
}

export default function AdminOverview() {
  const [cargando, setCargando] = useState(true);
  const [talleres, setTalleres] = useState<OrgResumen[]>([]);
  const [encargados, setEncargados] = useState<Record<string, EncargadoInfo>>({});
  const [clientesCount, setClientesCount] = useState(0);
  const [ofertasActivasCount, setOfertasActivasCount] = useState(0);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      const [{ data: orgs }, { count: clientes }, { count: ofertas }] = await Promise.all([
        supabase.from("organizations").select("id, name, status, has_trust_seal, ciudad, metadata").order("created_at", { ascending: false }),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("rol", "Cliente"),
        supabase.from("campanas").select("id", { count: "exact", head: true }).eq("estado", "activa"),
      ]);
      if (!activo) return;
      setTalleres((orgs ?? []) as OrgResumen[]);
      setClientesCount(clientes ?? 0);
      setOfertasActivasCount(ofertas ?? 0);

      const pendientesIds = (orgs ?? []).filter((o) => o.status === "pendiente").map((o) => o.id);
      if (pendientesIds.length > 0) {
        const { data: memberships } = await supabase
          .from("memberships")
          .select("organization_id, users(nombre)")
          .in("organization_id", pendientesIds);
        const map: Record<string, EncargadoInfo> = {};
        for (const m of memberships ?? []) {
          const u = (m as unknown as { users: { nombre: string | null } | null }).users;
          if (u && !map[m.organization_id as string]) map[m.organization_id as string] = { nombre: u.nombre };
        }
        if (activo) setEncargados(map);
      }
      setCargando(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const aprobados = talleres.filter((t) => t.status === "aprobado");
  const pendientes = talleres.filter((t) => t.status === "pendiente");
  const conSello = talleres.filter((t) => t.has_trust_seal);
  const especialistasElectricos = talleres.filter((t) => t.metadata?.especialista_electricos);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Resumen</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Talleres aprobados" value={String(aprobados.length)} icon={Store} accent="emerald" hint={`${talleres.length} registrados en total`} />
        <StatTile label="Pendientes de aprobación" value={String(pendientes.length)} icon={Clock} accent="amber" hint="Requieren tu revisión" />
        <StatTile label="Clientes registrados" value={String(clientesCount)} icon={Users} accent="brand" />
        <StatTile label="Con Sello de Confianza activo" value={String(conSello.length)} icon={ShieldCheck} accent="slate" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Especialistas en eléctricos/híbridos" value={String(especialistasElectricos.length)} icon={Zap} accent="emerald" />
        <StatTile label="Ofertas activas" value={String(ofertasActivasCount)} icon={Store} accent="brand" />
      </div>

      {pendientes.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900">Talleres esperando tu aprobación</h2>
            <Link to="/admin/talleres" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {pendientes.map((t) => (
              <div key={t.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    {[encargados[t.id]?.nombre, t.ciudad, t.metadata?.barrio].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge estado={t.status} />
                  <Link
                    to="/admin/talleres"
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
