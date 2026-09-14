"use client";

import { useActionState, useState } from "react";

import { BotonEnviar, MensajeEstado } from "@/components/formulario";
import { actualizarIncidencia, type EstadoAccion } from "@/lib/acciones";
import { ETIQUETA_ESTADO_INCIDENCIA } from "@/lib/dominio";
import type { EstadoIncidencia } from "@/lib/tipos";

const ESTADO_INICIAL: EstadoAccion = {};

export function PanelIncidencia({
  id,
  estadoActual,
  resolucionActual,
}: {
  id: string;
  estadoActual: EstadoIncidencia;
  resolucionActual: string | null;
}) {
  const [resultado, enviar] = useActionState(actualizarIncidencia, ESTADO_INICIAL);
  const [estado, setEstado] = useState<EstadoIncidencia>(estadoActual);

  const exigeResolucion = estado === "resuelta" || estado === "cerrada";

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      <div>
        <label className="etiqueta-campo" htmlFor="estado">Estado</label>
        <select
          id="estado"
          name="estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoIncidencia)}
          className="campo"
        >
          {Object.entries(ETIQUETA_ESTADO_INCIDENCIA).map(([v, etiqueta]) => (
            <option key={v} value={v}>{etiqueta}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="etiqueta-campo" htmlFor="resolucion">
          Resolución{exigeResolucion && <span aria-hidden="true"> *</span>}
        </label>
        <textarea
          id="resolucion"
          name="resolucion"
          rows={4}
          required={exigeResolucion}
          defaultValue={resolucionActual ?? ""}
          className="campo resize-y"
        />
        {exigeResolucion && (
          <p className="texto-suave mt-1 text-xs">
            Una incidencia no puede cerrarse sin dejar constancia de cómo se resolvió.
          </p>
        )}
      </div>

      <MensajeEstado estado={resultado} />
      <BotonEnviar>Actualizar incidencia</BotonEnviar>
    </form>
  );
}
