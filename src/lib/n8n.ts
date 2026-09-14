import "server-only";

import { entorno } from "@/lib/entorno";
import { crearClienteAdmin, hayClaveDeServicio } from "@/lib/supabase/admin";
import { CABECERA_FIRMA, CABECERA_MARCA_TEMPORAL, firmar } from "@/lib/seguridad";
import type { PlantillaEmail } from "@/lib/tipos";

/**
 * Integración con el flujo `wf-crmbas` de n8n.
 *
 * crmbas nunca habla directamente con Resend. Encola la notificación en la base
 * de datos y avisa a n8n, que es quien compone y entrega el correo. Así el
 * proveedor de correo puede cambiarse sin tocar la aplicación, y cada envío
 * queda registrado en `notificaciones_email` con su identificador de proveedor.
 */

export interface SolicitudCorreo {
  plantilla: PlantillaEmail;
  destinatario: string;
  asunto: string;
  cuerpoTexto: string;
  cuentaId?: string | null;
  contactoId?: string | null;
  oportunidadId?: string | null;
  incidenciaId?: string | null;
  presupuestoId?: string | null;
  datos?: Record<string, unknown>;
}

export interface ResultadoEncolado {
  ok: boolean;
  id?: string;
  avisoN8n: "entregado" | "sin_configurar" | "error";
  detalle?: string;
}

/**
 * Encola una notificación y notifica al flujo de n8n.
 *
 * El envío nunca hace fallar la operación de negocio que lo origina: si n8n no
 * responde, la fila queda en estado `pendiente` y el propio flujo la recogerá en
 * su próxima ejecución programada.
 */
export async function encolarCorreo(solicitud: SolicitudCorreo): Promise<ResultadoEncolado> {
  // El correo es accesorio a la operación de negocio: si el entorno no está
  // configurado para enviarlo, se anota y se sigue adelante.
  if (!hayClaveDeServicio()) {
    return {
      ok: false,
      avisoN8n: "sin_configurar",
      detalle: "SUPABASE_SERVICE_ROLE_KEY no está configurada.",
    };
  }

  const supabase = crearClienteAdmin();

  const { data, error } = await supabase
    .from("notificaciones_email")
    .insert({
      plantilla: solicitud.plantilla,
      destinatario: solicitud.destinatario,
      asunto: solicitud.asunto,
      cuerpo_texto: solicitud.cuerpoTexto,
      cuenta_id: solicitud.cuentaId ?? null,
      contacto_id: solicitud.contactoId ?? null,
      oportunidad_id: solicitud.oportunidadId ?? null,
      incidencia_id: solicitud.incidenciaId ?? null,
      presupuesto_id: solicitud.presupuestoId ?? null,
      datos: solicitud.datos ?? {},
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, avisoN8n: "error", detalle: error?.message };
  }

  const aviso = await avisarN8n({ evento: "correo.encolado", notificacion_id: data.id });
  return { ok: true, id: data.id, avisoN8n: aviso.estado, detalle: aviso.detalle };
}

/** Envía un evento firmado al webhook del flujo `wf-crmbas`. */
export async function avisarN8n(
  carga: Record<string, unknown>,
): Promise<{ estado: "entregado" | "sin_configurar" | "error"; detalle?: string }> {
  const url = entorno.n8nWebhookUrl;
  const secreto = entorno.n8nWebhookSecret;

  if (!url || !secreto) {
    return { estado: "sin_configurar" };
  }

  const cuerpo = JSON.stringify({ ...carga, origen: "crmbas", enviado_en: new Date().toISOString() });
  const marcaTemporal = String(Math.floor(Date.now() / 1000));

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // n8n valida el portador con una credencial de cabecera; la firma viaja
        // además para que cualquier otro consumidor pueda comprobar integridad
        // y frescura sin confiar solo en el secreto.
        authorization: `Bearer ${secreto}`,
        [CABECERA_FIRMA]: firmar(cuerpo, marcaTemporal, secreto),
        [CABECERA_MARCA_TEMPORAL]: marcaTemporal,
      },
      body: cuerpo,
      // El flujo de n8n responde en cuanto acepta el evento; no esperamos al envío.
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) {
      return { estado: "error", detalle: `n8n respondió ${respuesta.status}` };
    }
    return { estado: "entregado" };
  } catch (error) {
    return { estado: "error", detalle: error instanceof Error ? error.message : "fallo de red" };
  }
}
