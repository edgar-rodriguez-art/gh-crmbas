"use client";

import { useActionState, useState } from "react";

import { BotonEnviar, MensajeEstado } from "@/components/formulario";
import { cambiarEtapa, type EstadoAccion } from "@/lib/acciones";
import { ETAPAS, ETIQUETA_ETAPA, PROBABILIDAD_POR_ETAPA } from "@/lib/dominio";
import type { EtapaOportunidad } from "@/lib/tipos";

const ESTADO_INICIAL: EstadoAccion = {};

/** Cambio de etapa con la probabilidad sugerida y el motivo de pérdida. */
export function PanelEtapa({
  id,
  etapaActual,
  probabilidadActual,
  motivoActual,
}: {
  id: string;
  etapaActual: EtapaOportunidad;
  probabilidadActual: number;
  motivoActual: string | null;
}) {
  const [estado, enviar] = useActionState(cambiarEtapa, ESTADO_INICIAL);
  const [etapa, setEtapa] = useState<EtapaOportunidad>(etapaActual);
  const [probabilidad, setProbabilidad] = useState(probabilidadActual);

  function alCambiarEtapa(nueva: EtapaOportunidad) {
    setEtapa(nueva);
    // La probabilidad se propone a partir de la etapa, pero sigue siendo editable.
    setProbabilidad(PROBABILIDAD_POR_ETAPA[nueva]);
  }

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      <div>
        <label className="etiqueta-campo" htmlFor="etapa">Etapa</label>
        <select
          id="etapa"
          name="etapa"
          value={etapa}
          onChange={(e) => alCambiarEtapa(e.target.value as EtapaOportunidad)}
          className="campo"
        >
          {ETAPAS.map((e) => (
            <option key={e} value={e}>{ETIQUETA_ETAPA[e]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="etiqueta-campo" htmlFor="probabilidad">Probabilidad (%)</label>
        <input
          id="probabilidad"
          name="probabilidad"
          type="number"
          min={0}
          max={100}
          value={probabilidad}
          onChange={(e) => setProbabilidad(Number(e.target.value))}
          className="campo"
        />
      </div>

      {etapa === "perdida" && (
        <div>
          <label className="etiqueta-campo" htmlFor="motivo_perdida">Motivo de la pérdida</label>
          <textarea
            id="motivo_perdida"
            name="motivo_perdida"
            rows={2}
            required
            defaultValue={motivoActual ?? ""}
            className="campo resize-y"
          />
        </div>
      )}

      {etapa === "ganada" && (
        <p className="texto-suave text-xs">
          Al marcarla como ganada se encolará un correo de confirmación al contacto,
          siempre que tenga dirección registrada.
        </p>
      )}

      <MensajeEstado estado={estado} />
      <BotonEnviar>Actualizar etapa</BotonEnviar>
    </form>
  );
}
