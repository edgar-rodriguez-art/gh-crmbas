import { Aviso, Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import { ETIQUETA_ESTADO_EMAIL, ETIQUETA_PLANTILLA } from "@/lib/dominio";
import { fechaConHora } from "@/lib/formato";
import { exigirSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { EstadoEmail, NotificacionEmail, PlantillaEmail } from "@/lib/tipos";

export const metadata = { title: "Correo automatizado" };
export const dynamic = "force-dynamic";

const TONO: Record<EstadoEmail, "neutro" | "azul" | "verde" | "rojo" | "ambar"> = {
  pendiente: "ambar", enviado: "verde", error: "rojo", cancelado: "neutro",
};

export default async function PaginaCorreo() {
  await exigirSesion();
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("notificaciones_email")
    .select("*")
    .order("solicitado_en", { ascending: false })
    .limit(100);

  const correos = (data ?? []) as NotificacionEmail[];
  const pendientes = correos.filter((c) => c.estado === "pendiente").length;
  const conError = correos.filter((c) => c.estado === "error").length;

  return (
    <>
      <Encabezado
        titulo="Correo automatizado"
        descripcion="Cola de notificaciones que el flujo wf-crmbas de n8n entrega a través de Resend."
      />

      <div className="mb-6">
        <Aviso tono="azul" titulo="Cómo viaja cada correo">
          crmbas no habla con el proveedor de correo. Escribe la notificación en la base
          de datos y avisa al flujo <strong>wf-crmbas</strong> de n8n con una petición
          firmada (HMAC-SHA256). n8n compone el mensaje, lo entrega con Resend desde{" "}
          <strong>onboarding@resend.dev</strong> y devuelve el identificador del envío,
          que queda anotado aquí. Cambiar de proveedor no obliga a tocar la aplicación.
        </Aviso>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Etiqueta tono="ambar">{pendientes} pendiente(s)</Etiqueta>
        <Etiqueta tono={conError ? "rojo" : "verde"}>{conError} con error</Etiqueta>
        <Etiqueta>{correos.length} en el histórico reciente</Etiqueta>
      </div>

      <Tarjeta sinRelleno>
        {correos.length === 0 ? (
          <SinDatos mensaje="Todavía no se ha encolado ningún correo." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Solicitado</th>
                  <th>Plantilla</th>
                  <th>Destinatario</th>
                  <th>Asunto</th>
                  <th>Estado</th>
                  <th>Identificador del proveedor</th>
                </tr>
              </thead>
              <tbody>
                {correos.map((c) => (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap">{fechaConHora(c.solicitado_en)}</td>
                    <td>{ETIQUETA_PLANTILLA[c.plantilla as PlantillaEmail]}</td>
                    <td className="texto-suave">{c.destinatario}</td>
                    <td className="max-w-xs truncate">{c.asunto}</td>
                    <td>
                      <Etiqueta tono={TONO[c.estado]}>
                        {ETIQUETA_ESTADO_EMAIL[c.estado]}
                      </Etiqueta>
                      {c.error && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{c.error}</p>
                      )}
                    </td>
                    <td className="font-mono text-xs">{c.id_proveedor ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <p className="texto-suave mt-4 text-xs">
        Los envíos comerciales solo se encolan para contactos que han autorizado
        expresamente recibirlos, conforme al artículo 21 de la Ley 34/2002 (LSSI-CE).
      </p>
    </>
  );
}
