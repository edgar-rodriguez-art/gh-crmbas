"use client";

import { useActionState } from "react";

import {
  AreaTexto, BotonEnviar, Campo, Casilla, MensajeEstado, Seleccion,
} from "@/components/formulario";
import { crearIncidencia, type EstadoAccion } from "@/lib/acciones";
import {
  ETIQUETA_PRIORIDAD, ETIQUETA_TIPO_INCIDENCIA,
} from "@/lib/dominio";

const ESTADO_INICIAL: EstadoAccion = {};

export function FormularioIncidencia({
  cuentas,
  productos,
}: {
  cuentas: { id: string; razon_social: string }[];
  productos: { id: string; sku: string; marca: string; modelo: string }[];
}) {
  const [estado, enviar] = useActionState(crearIncidencia, ESTADO_INICIAL);

  return (
    <form action={enviar} className="space-y-5">
      <Seleccion
        nombre="cuenta_id"
        rotulo="Cliente"
        opciones={cuentas.map((c) => [c.id, c.razon_social] as [string, string])}
        requerido
        vacio="Selecciona un cliente"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion
          nombre="producto_id"
          rotulo="Producto"
          opciones={productos.map((p) => [p.id, `${p.marca} ${p.modelo} (${p.sku})`] as [string, string])}
          vacio="Sin producto asociado"
        />
        <Campo nombre="numero_serie" rotulo="Número de serie" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Seleccion
          nombre="tipo"
          rotulo="Tipo"
          opciones={Object.entries(ETIQUETA_TIPO_INCIDENCIA)}
          valor="averia"
          requerido
        />
        <Seleccion
          nombre="prioridad"
          rotulo="Prioridad"
          opciones={Object.entries(ETIQUETA_PRIORIDAD)}
          valor="media"
          requerido
        />
        <Campo
          nombre="sla_horas"
          rotulo="SLA (horas)"
          tipo="number"
          min="1"
          valor={48}
          requerido
        />
      </div>

      <AreaTexto
        nombre="descripcion"
        rotulo="Descripción del problema"
        filas={4}
        requerido
        ayuda="Detalla los síntomas, el contexto y lo que ya se ha comprobado."
      />

      <Casilla
        nombre="en_garantia"
        rotulo="El equipo está dentro del periodo de garantía"
        ayuda="La garantía legal de conformidad es de tres años desde la entrega."
      />

      <MensajeEstado estado={estado} />
      <BotonEnviar>Abrir incidencia</BotonEnviar>
    </form>
  );
}
