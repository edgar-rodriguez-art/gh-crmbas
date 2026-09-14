"use client";

import { useActionState } from "react";

import { BotonEnviar, Campo, Casilla, MensajeEstado } from "@/components/formulario";
import { crearContacto, type EstadoAccion } from "@/lib/acciones";

const ESTADO_INICIAL: EstadoAccion = {};

export function FormularioContacto({ cuentaId }: { cuentaId: string }) {
  const [estado, enviar] = useActionState(crearContacto, ESTADO_INICIAL);

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="cuenta_id" value={cuentaId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo nombre="nombre" rotulo="Nombre" requerido />
        <Campo nombre="apellidos" rotulo="Apellidos" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo nombre="cargo" rotulo="Cargo" />
        <Campo nombre="email" rotulo="Correo electrónico" tipo="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo nombre="telefono" rotulo="Teléfono" tipo="tel" />
        <Campo nombre="movil" rotulo="Móvil" tipo="tel" />
      </div>

      <Casilla nombre="es_principal" rotulo="Es el contacto principal del cliente" />
      <Casilla
        nombre="acepta_comunicaciones"
        rotulo="Autoriza recibir comunicaciones comerciales"
        ayuda="Sin esta autorización no se le enviará ninguna comunicación comercial electrónica (art. 21 de la Ley 34/2002)."
      />

      <MensajeEstado estado={estado} />
      <BotonEnviar>Añadir contacto</BotonEnviar>
    </form>
  );
}
