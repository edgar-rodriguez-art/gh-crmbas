"use client";

import { useActionState } from "react";

import { BotonEnviar, MensajeEstado } from "@/components/formulario";
import { cambiarActivacionUsuario, cambiarRol, type EstadoAccion } from "@/lib/acciones";
import { ETIQUETA_ROL } from "@/lib/dominio";
import type { RolUsuario } from "@/lib/tipos";

const ESTADO_INICIAL: EstadoAccion = {};

export function PanelUsuario({
  id,
  rol,
  activo,
  esUnoMismo,
}: {
  id: string;
  rol: RolUsuario;
  activo: boolean;
  esUnoMismo: boolean;
}) {
  const [resultadoRol, guardarRol] = useActionState(cambiarRol, ESTADO_INICIAL);
  const [resultadoActivo, cambiarActivo] = useActionState(cambiarActivacionUsuario, ESTADO_INICIAL);

  if (esUnoMismo) {
    return (
      <p className="texto-suave text-xs">
        Es tu propia cuenta: para cambiar su rol o desactivarla debe hacerlo otra
        persona con permisos de administración.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <form action={guardarRol} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`rol-${id}`}>Rol</label>
        <select id={`rol-${id}`} name="rol" defaultValue={rol} className="campo w-auto">
          {Object.entries(ETIQUETA_ROL).map(([v, etiqueta]) => (
            <option key={v} value={v}>{etiqueta}</option>
          ))}
        </select>
        <BotonEnviar variante="secundario">Cambiar rol</BotonEnviar>
      </form>

      <form action={cambiarActivo}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="activo" value={activo ? "false" : "true"} />
        <BotonEnviar variante="secundario">
          {activo ? "Desactivar acceso" : "Reactivar acceso"}
        </BotonEnviar>
      </form>

      <MensajeEstado estado={resultadoRol} />
      <MensajeEstado estado={resultadoActivo} />
    </div>
  );
}
