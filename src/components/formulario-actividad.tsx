"use client";

import { useActionState } from "react";

import { AreaTexto, BotonEnviar, Campo, MensajeEstado, Seleccion } from "@/components/formulario";
import { registrarActividad, type EstadoAccion } from "@/lib/acciones";
import { ETIQUETA_TIPO_ACTIVIDAD } from "@/lib/dominio";

const ESTADO_INICIAL: EstadoAccion = {};

export function FormularioActividad({
  cuentaId,
  oportunidadId,
}: {
  cuentaId?: string;
  oportunidadId?: string;
}) {
  const [estado, enviar] = useActionState(registrarActividad, ESTADO_INICIAL);

  return (
    <form action={enviar} className="space-y-4">
      {cuentaId && <input type="hidden" name="cuenta_id" value={cuentaId} />}
      {oportunidadId && <input type="hidden" name="oportunidad_id" value={oportunidadId} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion
          nombre="tipo"
          rotulo="Tipo"
          opciones={Object.entries(ETIQUETA_TIPO_ACTIVIDAD)}
          valor="llamada"
          requerido
        />
        <Campo nombre="duracion_min" rotulo="Duración (minutos)" tipo="number" min="0" />
      </div>

      <Campo nombre="asunto" rotulo="Asunto" requerido />
      <AreaTexto nombre="detalle" rotulo="Detalle" filas={3} />
      <Campo nombre="resultado" rotulo="Resultado o próximo paso" />

      <MensajeEstado estado={estado} />
      <BotonEnviar>Registrar actividad</BotonEnviar>
    </form>
  );
}
