import Link from "next/link";

import { Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import { ETIQUETA_ESTADO_PRESUPUESTO } from "@/lib/dominio";
import { fecha, importe } from "@/lib/formato";
import { exigirSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { EstadoPresupuesto } from "@/lib/tipos";

export const metadata = { title: "Presupuestos" };
export const dynamic = "force-dynamic";

const TONO: Record<EstadoPresupuesto, "neutro" | "azul" | "verde" | "rojo" | "ambar"> = {
  borrador: "neutro", enviado: "azul", aceptado: "verde",
  rechazado: "rojo", caducado: "ambar",
};

export default async function PaginaPresupuestos() {
  await exigirSesion();
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("presupuestos")
    .select("*, cuentas(razon_social)")
    .order("ejercicio", { ascending: false })
    .order("correlativo", { ascending: false });

  const filas = (data ?? []) as Record<string, unknown>[];

  return (
    <>
      <Encabezado
        titulo="Presupuestos"
        descripcion="Numeración correlativa por serie y ejercicio, con huella encadenada al emitir."
      />

      <Tarjeta sinRelleno>
        {filas.length === 0 ? (
          <SinDatos mensaje="Todavía no hay presupuestos. Se crean desde la ficha de una oportunidad." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Emisión</th>
                  <th>Validez</th>
                  <th className="text-right">Base</th>
                  <th className="text-right">IVA</th>
                  <th className="text-right">Total</th>
                  <th>Sellado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => (
                  <tr key={String(p.id)}>
                    <td>
                      <Link
                        href={`/presupuestos/${p.id}`}
                        className="font-mono text-xs text-marca-600 hover:underline dark:text-marca-300"
                      >
                        {String(p.numero)}
                      </Link>
                    </td>
                    <td>{(p.cuentas as { razon_social?: string } | null)?.razon_social ?? "—"}</td>
                    <td>
                      <Etiqueta tono={TONO[p.estado as EstadoPresupuesto]}>
                        {ETIQUETA_ESTADO_PRESUPUESTO[p.estado as EstadoPresupuesto]}
                      </Etiqueta>
                    </td>
                    <td className="texto-suave">{fecha(p.fecha_emision as string)}</td>
                    <td className="texto-suave">{fecha(p.fecha_validez as string)}</td>
                    <td className="text-right tabular-nums">{importe(p.base_imponible as number)}</td>
                    <td className="text-right tabular-nums">{importe(p.cuota_iva as number)}</td>
                    <td className="text-right font-medium tabular-nums">{importe(p.total as number)}</td>
                    <td>
                      {p.huella
                        ? <Etiqueta tono="verde">Sí</Etiqueta>
                        : <span className="texto-suave text-xs">Borrador</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </>
  );
}
