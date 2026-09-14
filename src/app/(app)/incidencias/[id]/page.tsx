import Link from "next/link";
import { notFound } from "next/navigation";

import { PanelIncidencia } from "@/components/panel-incidencia";
import { Dato, Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import {
  ETIQUETA_ESTADO_INCIDENCIA, ETIQUETA_PRIORIDAD, ETIQUETA_TIPO_INCIDENCIA,
} from "@/lib/dominio";
import { fecha, fechaConHora, tiempoRestante } from "@/lib/formato";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Incidencia } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function PaginaIncidencia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await exigirSesion();
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("incidencias")
    .select(`*,
      cuentas(id, razon_social),
      contactos(nombre, apellidos, email),
      productos(sku, marca, modelo, garantia_meses)`)
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const incidencia = data as Incidencia & {
    cuentas: { id: string; razon_social: string } | null;
    contactos: { nombre: string; apellidos: string; email: string | null } | null;
    productos: { sku: string; marca: string; modelo: string; garantia_meses: number } | null;
  };

  const cerrada = ["resuelta", "cerrada"].includes(incidencia.estado);

  return (
    <>
      <Encabezado
        titulo={`Incidencia ${incidencia.referencia}`}
        descripcion={incidencia.cuentas?.razon_social ?? "Sin cliente"}
        acciones={<Link href="/incidencias" className="boton-secundario">Volver al listado</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta titulo="Descripción">
            <p className="text-sm whitespace-pre-line">{incidencia.descripcion}</p>
          </Tarjeta>

          {incidencia.resolucion && (
            <Tarjeta titulo="Resolución">
              <p className="text-sm whitespace-pre-line">{incidencia.resolucion}</p>
              {incidencia.fecha_cierre && (
                <p className="texto-suave mt-3 text-xs">
                  Cerrada el {fechaConHora(incidencia.fecha_cierre)}
                </p>
              )}
            </Tarjeta>
          )}

          <Tarjeta titulo="Equipo afectado">
            {incidencia.productos ? (
              <dl className="grid gap-5 sm:grid-cols-2">
                <Dato rotulo="Producto">
                  {incidencia.productos.marca} {incidencia.productos.modelo}
                </Dato>
                <Dato rotulo="SKU">
                  <span className="font-mono text-xs">{incidencia.productos.sku}</span>
                </Dato>
                <Dato rotulo="Número de serie">
                  <span className="font-mono text-xs">{incidencia.numero_serie ?? "—"}</span>
                </Dato>
                <Dato rotulo="Fecha de compra">{fecha(incidencia.fecha_compra)}</Dato>
                <Dato rotulo="Garantía del producto">
                  {incidencia.productos.garantia_meses} meses
                </Dato>
                <Dato rotulo="Cobertura">
                  <Etiqueta tono={incidencia.en_garantia ? "verde" : "neutro"}>
                    {incidencia.en_garantia ? "Dentro de garantía" : "Fuera de garantía"}
                  </Etiqueta>
                </Dato>
              </dl>
            ) : (
              <p className="texto-suave text-sm">
                No hay ningún producto del catálogo asociado a esta incidencia.
              </p>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Seguimiento">
            <dl className="space-y-4">
              <Dato rotulo="Estado">
                <Etiqueta tono={cerrada ? "verde" : "azul"}>
                  {ETIQUETA_ESTADO_INCIDENCIA[incidencia.estado]}
                </Etiqueta>
              </Dato>
              <Dato rotulo="Tipo">{ETIQUETA_TIPO_INCIDENCIA[incidencia.tipo]}</Dato>
              <Dato rotulo="Prioridad">{ETIQUETA_PRIORIDAD[incidencia.prioridad]}</Dato>
              <Dato rotulo="Apertura">{fechaConHora(incidencia.fecha_apertura)}</Dato>
              <Dato rotulo="Compromiso de servicio">
                {incidencia.sla_horas} horas
                {!cerrada && (
                  <span className="ml-2">
                    <Etiqueta
                      tono={
                        incidencia.fecha_limite_sla
                        && new Date(incidencia.fecha_limite_sla) < new Date()
                          ? "rojo"
                          : "ambar"
                      }
                    >
                      {tiempoRestante(incidencia.fecha_limite_sla)}
                    </Etiqueta>
                  </span>
                )}
              </Dato>
              <Dato rotulo="Contacto">
                {incidencia.contactos
                  ? `${incidencia.contactos.nombre} ${incidencia.contactos.apellidos}`
                  : "—"}
              </Dato>
            </dl>
          </Tarjeta>

          {puedeEditar(perfil) && (
            <Tarjeta titulo="Actualizar">
              <PanelIncidencia
                id={incidencia.id}
                estadoActual={incidencia.estado}
                resolucionActual={incidencia.resolucion}
              />
            </Tarjeta>
          )}
        </div>
      </div>
    </>
  );
}
