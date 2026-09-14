import type { NextRequest } from "next/server";

import { autenticarN8n, respuesta } from "@/lib/api-n8n";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/n8n/resumen-diario
 *
 * Datos del resumen que el flujo envía cada mañana al equipo: indicadores,
 * oportunidades que cierran esta semana y solicitudes de derechos por vencer.
 */
export async function GET(peticion: NextRequest) {
  const auth = await autenticarN8n(peticion);
  if (!auth.ok) return auth.respuesta;

  const supabase = crearClienteAdmin();
  const hoy = new Date();
  const dentroDeUnaSemana = new Date(hoy.getTime() + 7 * 86_400_000)
    .toISOString().slice(0, 10);

  const [kpis, cierres, rgpd, equipo] = await Promise.all([
    supabase.from("v_kpis").select("*").single(),
    supabase
      .from("oportunidades")
      .select("referencia, titulo, importe_estimado, fecha_cierre_prevista, cuentas(razon_social)")
      .not("etapa", "in", "(ganada,perdida)")
      .lte("fecha_cierre_prevista", dentroDeUnaSemana)
      .order("fecha_cierre_prevista"),
    supabase
      .from("solicitudes_rgpd")
      .select("referencia, tipo, fecha_limite")
      .in("estado", ["recibida", "en_tramite"])
      .order("fecha_limite"),
    supabase.from("perfiles").select("email, nombre").eq("activo", true).in("rol", ["admin", "comercial"]),
  ]);

  return respuesta({
    generado_en: hoy.toISOString(),
    indicadores: kpis.data ?? null,
    cierres_proximos: cierres.data ?? [],
    solicitudes_rgpd_pendientes: rgpd.data ?? [],
    destinatarios: equipo.data ?? [],
  });
}
