import type { NextRequest } from "next/server";
import { z } from "zod";

import { autenticarN8n, respuesta } from "@/lib/api-n8n";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const esquema = z.object({
  notificacion_id: z.string().uuid(),
  estado: z.enum(["enviado", "error"]),
  id_proveedor: z.string().nullish(),
  error: z.string().nullish(),
});

/**
 * POST /api/n8n/resultado
 *
 * n8n comunica el desenlace de cada entrega. El identificador que devuelve
 * Resend se conserva para poder rastrear el envío ante una reclamación.
 */
export async function POST(peticion: NextRequest) {
  const auth = await autenticarN8n(peticion);
  if (!auth.ok) return auth.respuesta;

  let cargaBruta: unknown;
  try {
    cargaBruta = JSON.parse(auth.cuerpo);
  } catch {
    return respuesta({ error: "El cuerpo no es JSON válido" }, 400);
  }

  const analisis = esquema.safeParse(cargaBruta);
  if (!analisis.success) {
    return respuesta({ error: "Faltan campos obligatorios o tienen un formato inesperado" }, 400);
  }

  const { notificacion_id, estado, id_proveedor, error } = analisis.data;
  const supabase = crearClienteAdmin();

  const { data: actual } = await supabase
    .from("notificaciones_email")
    .select("intentos")
    .eq("id", notificacion_id)
    .maybeSingle();

  if (!actual) return respuesta({ error: "La notificación no existe" }, 404);

  const { error: falloEscritura } = await supabase
    .from("notificaciones_email")
    .update({
      estado,
      id_proveedor: id_proveedor ?? null,
      // La restricción de la tabla exige un texto de error cuando el estado es
      // `error`, así que nunca se guarda un fallo sin explicación.
      error: estado === "error" ? (error ?? "Error no detallado por el flujo") : null,
      intentos: actual.intentos + 1,
      enviado_en: estado === "enviado" ? new Date().toISOString() : null,
    })
    .eq("id", notificacion_id);

  if (falloEscritura) return respuesta({ error: falloEscritura.message }, 500);

  return respuesta({ ok: true, notificacion_id, estado });
}
