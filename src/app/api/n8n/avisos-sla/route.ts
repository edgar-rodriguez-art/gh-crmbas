import type { NextRequest } from "next/server";

import { autenticarN8n, respuesta } from "@/lib/api-n8n";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/n8n/avisos-sla
 *
 * Incidencias cuyo compromiso de servicio ha vencido o vence en las próximas
 * cuatro horas. El flujo avisa a la persona asignada antes de incumplirlo.
 */
export async function GET(peticion: NextRequest) {
  const auth = await autenticarN8n(peticion);
  if (!auth.ok) return auth.respuesta;

  const limite = new Date(Date.now() + 4 * 3_600_000).toISOString();
  const supabase = crearClienteAdmin();

  const { data, error } = await supabase
    .from("v_incidencias_sla")
    .select("*")
    .lte("fecha_limite_sla", limite)
    .order("fecha_limite_sla");

  if (error) return respuesta({ error: error.message }, 500);

  const incidencias = data ?? [];

  return respuesta({
    comprobado_en: new Date().toISOString(),
    total: incidencias.length,
    vencidas: incidencias.filter((i) => i.sla_vencido).length,
    incidencias,
  });
}
