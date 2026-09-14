import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { entorno } from "@/lib/entorno";
import {
  CABECERA_FIRMA, CABECERA_MARCA_TEMPORAL, verificarFirma, verificarPortador,
} from "@/lib/seguridad";
import { hayClaveDeServicio } from "@/lib/supabase/admin";

/**
 * Autenticación de los puntos de entrada que consume n8n.
 *
 * No hay sesión de usuario: quien llama es una máquina. Se admiten dos pruebas
 * de identidad, ambas basadas en el mismo secreto compartido:
 *
 *   1. `Authorization: Bearer <secreto>`, que es lo que envía el flujo wf-crmbas
 *      desde una credencial cifrada de n8n.
 *   2. Una firma HMAC-SHA256 del cuerpo con su marca temporal, que añade
 *      integridad y protección frente a repetición para cualquier otro
 *      consumidor capaz de calcularla.
 *
 * Basta con superar una de las dos.
 */
export async function autenticarN8n(
  peticion: NextRequest,
): Promise<{ ok: true; cuerpo: string } | { ok: false; respuesta: NextResponse }> {
  const cuerpo = peticion.method === "GET" ? "" : await peticion.text();

  if (!hayClaveDeServicio()) {
    return {
      ok: false,
      respuesta: NextResponse.json(
        { error: "La integración con n8n no está configurada en este entorno." },
        { status: 503, headers: { "cache-control": "no-store" } },
      ),
    };
  }

  const secreto = entorno.crmWebhookSecret;

  const porPortador = verificarPortador(peticion.headers.get("authorization"), secreto);
  const porFirma = verificarFirma(
    cuerpo,
    peticion.headers.get(CABECERA_FIRMA),
    peticion.headers.get(CABECERA_MARCA_TEMPORAL),
    secreto,
  );

  if (!porPortador && !porFirma.valido) {
    return {
      ok: false,
      // No se detalla el motivo al llamante: eso ayudaría a afinar un ataque.
      // El motivo concreto queda en el registro del servidor.
      respuesta: NextResponse.json(
        { error: "No autorizado" },
        { status: 401, headers: { "cache-control": "no-store" } },
      ),
    };
  }

  return { ok: true, cuerpo };
}

export function respuesta(datos: unknown, estado = 200): NextResponse {
  return NextResponse.json(datos, {
    status: estado,
    headers: { "cache-control": "no-store" },
  });
}
