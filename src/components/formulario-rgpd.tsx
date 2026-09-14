"use client";

import { useActionState } from "react";

import {
  AreaTexto, BotonEnviar, Campo, Casilla, MensajeEstado, Seleccion,
} from "@/components/formulario";
import { registrarSolicitudRgpd, resolverSolicitudRgpd, type EstadoAccion } from "@/lib/acciones";
import { ETIQUETA_ESTADO_RGPD, ETIQUETA_TIPO_RGPD } from "@/lib/dominio";

const ESTADO_INICIAL: EstadoAccion = {};

export function FormularioSolicitudRgpd({
  cuentas,
}: {
  cuentas: { id: string; razon_social: string }[];
}) {
  const [estado, enviar] = useActionState(registrarSolicitudRgpd, ESTADO_INICIAL);

  return (
    <form action={enviar} className="space-y-4">
      <Seleccion
        nombre="tipo"
        rotulo="Derecho ejercido"
        opciones={Object.entries(ETIQUETA_TIPO_RGPD)}
        valor="acceso"
        requerido
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          nombre="solicitante_email"
          rotulo="Correo de la persona solicitante"
          tipo="email"
          requerido
        />
        <Campo
          nombre="solicitante_nif"
          rotulo="Documento de identidad"
          maxLength={9}
          ayuda="Opcional. Sirve para acreditar la identidad."
        />
      </div>

      <Seleccion
        nombre="cuenta_id"
        rotulo="Cliente relacionado"
        opciones={cuentas.map((c) => [c.id, c.razon_social] as [string, string])}
        vacio="Sin cliente asociado"
      />

      <AreaTexto nombre="descripcion" rotulo="Contenido de la solicitud" filas={3} requerido />

      <Casilla
        nombre="identidad_verificada"
        rotulo="Se ha verificado la identidad de la persona solicitante"
        ayuda="Si hay dudas razonables sobre la identidad, el responsable puede solicitar información adicional (art. 12.6 del RGPD)."
      />

      <MensajeEstado estado={estado} />
      <BotonEnviar>Registrar solicitud</BotonEnviar>
    </form>
  );
}

export function PanelResolucionRgpd({ id }: { id: string }) {
  const [estado, enviar] = useActionState(resolverSolicitudRgpd, ESTADO_INICIAL);

  return (
    <form action={enviar} className="mt-3 space-y-3">
      <input type="hidden" name="id" value={id} />
      <Seleccion
        nombre="estado"
        rotulo="Nuevo estado"
        opciones={Object.entries(ETIQUETA_ESTADO_RGPD)}
        valor="en_tramite"
      />
      <AreaTexto nombre="resolucion" rotulo="Resolución adoptada" filas={2} />
      <MensajeEstado estado={estado} />
      <BotonEnviar variante="secundario">Guardar</BotonEnviar>
    </form>
  );
}
