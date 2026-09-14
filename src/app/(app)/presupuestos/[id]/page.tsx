import Link from "next/link";
import { notFound } from "next/navigation";

import { AccionesPresupuesto } from "@/components/acciones-presupuesto";
import { Dato, Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { ETIQUETA_ESTADO_PRESUPUESTO, ETIQUETA_REGIMEN_IVA } from "@/lib/dominio";
import { fecha, importe, porcentaje } from "@/lib/formato";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { LineaPresupuesto, Presupuesto, RegimenIva } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function PaginaPresupuesto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await exigirSesion();
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("presupuestos")
    .select("*, cuentas(id, razon_social, nif, regimen_iva)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const presupuesto = data as Presupuesto & {
    cuentas: { id: string; razon_social: string; nif: string; regimen_iva: RegimenIva } | null;
  };

  const { data: lineasData } = await supabase
    .from("lineas_presupuesto")
    .select("*")
    .eq("presupuesto_id", id)
    .order("orden");

  const lineas = (lineasData ?? []) as LineaPresupuesto[];

  return (
    <>
      <Encabezado
        titulo={`Presupuesto ${presupuesto.numero}`}
        descripcion={presupuesto.cuentas?.razon_social ?? "Sin cliente"}
        acciones={<Link href="/presupuestos" className="boton-secundario">Volver al listado</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta titulo="Detalle de la oferta" sinRelleno>
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Dto.</th>
                    <th className="text-right">IVA</th>
                    <th className="text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l) => (
                    <tr key={l.id}>
                      <td>{l.descripcion}</td>
                      <td className="text-right tabular-nums">{l.cantidad}</td>
                      <td className="text-right tabular-nums">{importe(l.precio_unitario)}</td>
                      <td className="text-right tabular-nums">{porcentaje(l.descuento_pct)}</td>
                      <td className="text-right tabular-nums">{porcentaje(l.tipo_iva)}</td>
                      <td className="text-right font-medium tabular-nums">{importe(l.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end px-5 py-4" style={{ borderTop: "1px solid var(--borde)" }}>
              <dl className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="texto-suave">Base imponible</dt>
                  <dd className="tabular-nums">{importe(presupuesto.base_imponible)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="texto-suave">Cuota de IVA</dt>
                  <dd className="tabular-nums">{importe(presupuesto.cuota_iva)}</dd>
                </div>
                {Number(presupuesto.cuota_recargo) > 0 && (
                  <div className="flex justify-between">
                    <dt className="texto-suave">Recargo de equivalencia</dt>
                    <dd className="tabular-nums">{importe(presupuesto.cuota_recargo)}</dd>
                  </div>
                )}
                <div
                  className="flex justify-between pt-2 text-base font-semibold"
                  style={{ borderTop: "1px solid var(--borde)" }}
                >
                  <dt>Total</dt>
                  <dd className="tabular-nums">{importe(presupuesto.total)}</dd>
                </div>
              </dl>
            </div>
          </Tarjeta>

          {presupuesto.condiciones && (
            <Tarjeta titulo="Condiciones">
              <p className="text-sm">{presupuesto.condiciones}</p>
            </Tarjeta>
          )}

          <Tarjeta
            titulo="Integridad del documento"
            descripcion="Encadenamiento de registros en la línea del Real Decreto 1007/2023."
          >
            {presupuesto.huella ? (
              <dl className="space-y-4">
                <Dato rotulo="Huella SHA-256 de este documento">
                  <code className="block break-all font-mono text-xs">{presupuesto.huella}</code>
                </Dato>
                <Dato rotulo="Huella del documento anterior de la serie">
                  <code className="block break-all font-mono text-xs">
                    {presupuesto.huella_anterior ?? "Es el primero de la serie"}
                  </code>
                </Dato>
              </dl>
            ) : (
              <p className="texto-suave text-sm">
                El documento aún es un borrador: la huella se calcula al emitirlo, cuando
                su contenido queda fijado.
              </p>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Estado">
            <dl className="space-y-4">
              <Dato rotulo="Situación">
                <Etiqueta tono={presupuesto.estado === "aceptado" ? "verde" : "azul"}>
                  {ETIQUETA_ESTADO_PRESUPUESTO[presupuesto.estado]}
                </Etiqueta>
              </Dato>
              <Dato rotulo="Serie y ejercicio">
                {presupuesto.serie}-{presupuesto.ejercicio} · n.º {presupuesto.correlativo}
              </Dato>
              <Dato rotulo="Fecha de emisión">{fecha(presupuesto.fecha_emision)}</Dato>
              <Dato rotulo="Válido hasta">{fecha(presupuesto.fecha_validez)}</Dato>
              <Dato rotulo="Régimen fiscal del cliente">
                {presupuesto.cuentas
                  ? ETIQUETA_REGIMEN_IVA[presupuesto.cuentas.regimen_iva]
                  : "—"}
              </Dato>
              <Dato rotulo="NIF del cliente">
                <span className="font-mono text-xs">{presupuesto.cuentas?.nif ?? "—"}</span>
              </Dato>
            </dl>
          </Tarjeta>

          {puedeEditar(perfil) && (
            <Tarjeta titulo="Acciones">
              <AccionesPresupuesto id={presupuesto.id} estado={presupuesto.estado} />
            </Tarjeta>
          )}
        </div>
      </div>
    </>
  );
}
