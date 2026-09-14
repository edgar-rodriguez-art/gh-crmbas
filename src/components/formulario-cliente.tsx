"use client";

import { useActionState } from "react";

import { AreaTexto, BotonEnviar, Campo, MensajeEstado, Seleccion } from "@/components/formulario";
import { actualizarCuenta, crearCuenta, type EstadoAccion } from "@/lib/acciones";
import {
  ETIQUETA_BASE_LEGAL, ETIQUETA_REGIMEN_IVA, ETIQUETA_SEGMENTO,
  ETIQUETA_TIPO_CLIENTE, PROVINCIAS,
} from "@/lib/dominio";
import type { Cuenta } from "@/lib/tipos";

const ESTADO_INICIAL: EstadoAccion = {};

function pares(mapa: Record<string, string>): [string, string][] {
  return Object.entries(mapa);
}

export function FormularioCliente({ cuenta }: { cuenta?: Cuenta }) {
  const esEdicion = Boolean(cuenta);
  const [estado, enviar] = useActionState(
    esEdicion ? actualizarCuenta : crearCuenta,
    ESTADO_INICIAL,
  );

  return (
    <form action={enviar} className="space-y-8">
      {esEdicion && <input type="hidden" name="id" value={cuenta!.id} />}

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Identificación fiscal</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Seleccion
            nombre="tipo_cliente"
            rotulo="Tipo de cliente"
            opciones={pares(ETIQUETA_TIPO_CLIENTE)}
            valor={cuenta?.tipo_cliente ?? "empresa"}
            requerido
          />
          <Campo
            nombre="nif"
            rotulo="NIF, NIE o CIF"
            valor={cuenta?.nif}
            requerido
            maxLength={9}
            style={{ textTransform: "uppercase" }}
            ayuda="Se comprueba la letra de control con el algoritmo de la AEAT."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            nombre="razon_social"
            rotulo="Razón social o nombre completo"
            valor={cuenta?.razon_social}
            requerido
          />
          <Campo nombre="nombre_comercial" rotulo="Nombre comercial" valor={cuenta?.nombre_comercial} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Seleccion
            nombre="regimen_iva"
            rotulo="Régimen de IVA"
            opciones={pares(ETIQUETA_REGIMEN_IVA)}
            valor={cuenta?.regimen_iva ?? "general"}
            requerido
            ayuda="El recargo de equivalencia solo se aplica a autónomos y particulares."
          />
          <Seleccion
            nombre="segmento"
            rotulo="Segmento"
            opciones={pares(ETIQUETA_SEGMENTO)}
            valor={cuenta?.segmento ?? "pyme"}
            requerido
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Contacto y domicilio</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo nombre="email" rotulo="Correo electrónico" tipo="email" valor={cuenta?.email} />
          <Campo nombre="telefono" rotulo="Teléfono" tipo="tel" valor={cuenta?.telefono} />
        </div>
        <Campo nombre="sitio_web" rotulo="Sitio web" tipo="url" valor={cuenta?.sitio_web} />
        <Campo nombre="direccion" rotulo="Dirección" valor={cuenta?.direccion} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            nombre="codigo_postal"
            rotulo="Código postal"
            valor={cuenta?.codigo_postal}
            maxLength={5}
            inputMode="numeric"
            pattern="[0-9]{5}"
          />
          <Campo nombre="municipio" rotulo="Municipio" valor={cuenta?.municipio} />
          <Seleccion
            nombre="provincia"
            rotulo="Provincia"
            opciones={PROVINCIAS.map((p) => [p, p] as [string, string])}
            valor={cuenta?.provincia}
            vacio="Sin especificar"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            nombre="iban"
            rotulo="IBAN"
            valor={cuenta?.iban}
            ayuda="Se valida con los dígitos de control mod-97 de la norma ISO 13616."
          />
          <Campo nombre="sector" rotulo="Sector de actividad" valor={cuenta?.sector} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Protección de datos</legend>
        <Seleccion
          nombre="base_legal_tratamiento"
          rotulo="Base jurídica del tratamiento"
          opciones={pares(ETIQUETA_BASE_LEGAL)}
          valor={cuenta?.base_legal_tratamiento ?? "contrato"}
          requerido
          ayuda="Artículo 6.1 del RGPD. Queda reflejada en el registro de actividades de tratamiento."
        />
        <AreaTexto nombre="notas" rotulo="Notas internas" valor={cuenta?.notas} filas={3} />
      </fieldset>

      <MensajeEstado estado={estado} />

      <div className="flex gap-2">
        <BotonEnviar>{esEdicion ? "Guardar cambios" : "Crear cliente"}</BotonEnviar>
      </div>
    </form>
  );
}
