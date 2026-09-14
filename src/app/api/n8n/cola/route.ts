import type { NextRequest } from "next/server";

import { autenticarN8n, respuesta } from "@/lib/api-n8n";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/n8n/cola
 *
 * Devuelve las notificaciones pendientes de envío. El flujo wf-crmbas la
 * consulta de forma periódica, de modo que un aviso perdido por un corte de red
 * se recupera en la siguiente pasada.
 */
export async function GET(peticion: NextRequest) {
  const auth = await autenticarN8n(peticion);
  if (!auth.ok) return auth.respuesta;

  const supabase = crearClienteAdmin();
  const { data, error } = await supabase
    .from("notificaciones_email")
    .select("id, plantilla, destinatario, remitente, asunto, cuerpo_texto, datos, intentos")
    .eq("estado", "pendiente")
    // Tres intentos fallidos bastan para dejar de reintentar de forma automática.
    .lt("intentos", 3)
    .order("solicitado_en")
    .limit(50);

  if (error) return respuesta({ error: error.message }, 500);

  return respuesta({ pendientes: data ?? [], total: data?.length ?? 0 });
}
