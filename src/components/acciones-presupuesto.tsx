"use client";

import { useActionState } from "react";

import { BotonEnviar, MensajeEstado } from "@/components/formulario";
import {
  cambiarEstadoPresupuesto, emitirPresupuesto, type EstadoAccion,
} from "@/lib/acciones";
import type { EstadoPresupuesto } from "@/lib/tipos";

const ESTADO_INICIAL: EstadoAccion = {};

export function AccionesPresupuesto({
  id,
  estado,
}: {
  id: string;
  estado: EstadoPresupuesto;
}) {
  const [resultadoEmision, emitir] = useActionState(emitirPresupuesto, ESTADO_INICIAL);
  const [resultadoEstado, cambiar] = useActionState(cambiarEstadoPresupuesto, ESTADO_INICIAL);

  if (estado === "borrador") {
    return (
      <form action={emitir} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <p className="texto-suave text-sm">
          Al emitirlo se calcula su huella, se encadena con el anterior de la serie y
          el documento deja de ser modificable en sus importes.
        </p>
        <MensajeEstado estado={resultadoEmision} />
        <BotonEnviar>Emitir y enviar al cliente</BotonEnviar>
      </form>
    );
  }

  if (estado === "enviado") {
    return (
      <div className="space-y-3">
        <p className="texto-suave text-sm">Registra la respuesta del cliente.</p>
        <div className="flex flex-wrap gap-2">
          <form action={cambiar}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="estado" value="aceptado" />
            <BotonEnviar>Marcar aceptado</BotonEnviar>
          </form>
          <form action={cambiar}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="estado" value="rechazado" />
            <BotonEnviar variante="secundario">Marcar rechazado</BotonEnviar>
          </form>
        </div>
        <MensajeEstado estado={resultadoEstado} />
      </div>
    );
  }

  return (
    <p className="texto-suave text-sm">
      El presupuesto está cerrado. Su contenido se conserva como evidencia de la
      oferta comunicada al cliente y ya no admite cambios.
    </p>
  );
}
