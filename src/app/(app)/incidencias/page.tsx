import Link from "next/link";

import { Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import {
  ETIQUETA_ESTADO_INCIDENCIA, ETIQUETA_PRIORIDAD, ETIQUETA_TIPO_INCIDENCIA,
} from "@/lib/dominio";
import { fechaConHora, tiempoRestante } from "@/lib/formato";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { EstadoIncidencia, PrioridadIncidencia, TipoIncidencia } from "@/lib/tipos";

export const metadata = { title: "Incidencias" };
export const dynamic = "force-dynamic";

const TONO_PRIORIDAD: Record<PrioridadIncidencia, "neutro" | "azul" | "ambar" | "rojo"> = {
  baja: "neutro", media: "azul", alta: "ambar", critica: "rojo",
};

export default async function PaginaIncidencias({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const perfil = await exigirSesion();
  const { estado = "abiertas" } = await searchParams;
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("incidencias")
    .select("*, cuentas(razon_social)")
    .order("fecha_limite_sla", { ascending: true, nullsFirst: false });

  if (estado === "abiertas") consulta = consulta.not("estado", "in", "(resuelta,cerrada)");
  else if (estado !== "todas") consulta = consulta.eq("estado", estado);

  const { data } = await consulta;
  const filas = (data ?? []) as Record<string, unknown>[];

  return (
    <>
      <Encabezado
        titulo="Incidencias y RMA"
        descripcion="Servicio técnico, garantías y devoluciones al fabricante."
        acciones={
          puedeEditar(perfil) && (
            <Link href="/incidencias/nueva" className="boton-primario">Nueva incidencia</Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="etiqueta-campo" htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={estado} className="campo">
            <option value="abiertas">Solo abiertas</option>
            <option value="todas">Todas</option>
            {Object.entries(ETIQUETA_ESTADO_INCIDENCIA).map(([v, e]) => (
              <option key={v} value={v}>{e}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="boton-secundario">Filtrar</button>
      </form>

      <Tarjeta sinRelleno>
        {filas.length === 0 ? (
          <SinDatos mensaje="No hay incidencias con ese filtro." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Garantía</th>
                  <th>Apertura</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((i) => {
                  const cerrada = ["resuelta", "cerrada"].includes(i.estado as string);
                  const vencido = !cerrada
                    && i.fecha_limite_sla
                    && new Date(i.fecha_limite_sla as string) < new Date();

                  return (
                    <tr key={String(i.id)}>
                      <td>
                        <Link
                          href={`/incidencias/${i.id}`}
                          className="font-mono text-xs text-marca-600 hover:underline dark:text-marca-300"
                        >
                          {String(i.referencia)}
                        </Link>
                      </td>
                      <td>{(i.cuentas as { razon_social?: string } | null)?.razon_social ?? "—"}</td>
                      <td>{ETIQUETA_TIPO_INCIDENCIA[i.tipo as TipoIncidencia]}</td>
                      <td>
                        <Etiqueta tono={TONO_PRIORIDAD[i.prioridad as PrioridadIncidencia]}>
                          {ETIQUETA_PRIORIDAD[i.prioridad as PrioridadIncidencia]}
                        </Etiqueta>
                      </td>
                      <td>{ETIQUETA_ESTADO_INCIDENCIA[i.estado as EstadoIncidencia]}</td>
                      <td>
                        {i.en_garantia
                          ? <Etiqueta tono="verde">Sí</Etiqueta>
                          : <span className="texto-suave text-xs">No</span>}
                      </td>
                      <td className="texto-suave whitespace-nowrap">
                        {fechaConHora(i.fecha_apertura as string)}
                      </td>
                      <td>
                        {cerrada ? (
                          <span className="texto-suave text-xs">Cerrada</span>
                        ) : (
                          <Etiqueta tono={vencido ? "rojo" : "ambar"}>
                            {tiempoRestante(i.fecha_limite_sla as string)}
                          </Etiqueta>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </>
  );
}
