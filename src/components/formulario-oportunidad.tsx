"use client";

import { useActionState } from "react";

import { AreaTexto, BotonEnviar, Campo, MensajeEstado, Seleccion } from "@/components/formulario";
import { crearOportunidad, type EstadoAccion } from "@/lib/acciones";
import { ETIQUETA_ETAPA, ETIQUETA_ORIGEN, PROBABILIDAD_POR_ETAPA } from "@/lib/dominio";
import type { EtapaOportunidad } from "@/lib/tipos";

const ESTADO_INICIAL: EstadoAccion = {};

// Ganada y perdida no se ofrecen al crear: una oportunidad nace abierta.
const ETAPAS_INICIALES: EtapaOportunidad[] = [
  "calificacion", "analisis", "propuesta", "negociacion",
];

export function FormularioOportunidad({
  cuentas,
  cuentaPreseleccionada,
}: {
  cuentas: { id: string; razon_social: string }[];
  cuentaPreseleccionada?: string;
}) {
  const [estado, enviar] = useActionState(crearOportunidad, ESTADO_INICIAL);

  return (
    <form action={enviar} className="space-y-5">
      <Seleccion
        nombre="cuenta_id"
        rotulo="Cliente"
        opciones={cuentas.map((c) => [c.id, c.razon_social] as [string, string])}
        valor={cuentaPreseleccionada}
        requerido
        vacio="Selecciona un cliente"
      />

      <Campo nombre="titulo" rotulo="Título de la oportunidad" requerido />
      <AreaTexto nombre="descripcion" rotulo="Descripción" filas={3} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion
          nombre="etapa"
          rotulo="Etapa"
          opciones={ETAPAS_INICIALES.map((e) => [e, ETIQUETA_ETAPA[e]] as [string, string])}
          valor="calificacion"
          requerido
        />
        <Seleccion
          nombre="origen"
          rotulo="Origen"
          opciones={Object.entries(ETIQUETA_ORIGEN)}
          valor="web"
          requerido
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          nombre="importe_estimado"
          rotulo="Importe estimado (€)"
          tipo="number"
          step="0.01"
          min="0"
          valor={0}
          requerido
        />
        <Campo
          nombre="probabilidad"
          rotulo="Probabilidad (%)"
          tipo="number"
          min="0"
          max="100"
          valor={PROBABILIDAD_POR_ETAPA.calificacion}
          requerido
        />
        <Campo nombre="fecha_cierre_prevista" rotulo="Cierre previsto" tipo="date" />
      </div>

      <MensajeEstado estado={estado} />
      <BotonEnviar>Crear oportunidad</BotonEnviar>
    </form>
  );
}
