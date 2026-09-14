import Link from "next/link";

import { Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import { ETAPAS, ETIQUETA_ETAPA, ETIQUETA_ORIGEN } from "@/lib/dominio";
import { fecha, importe, porcentaje } from "@/lib/formato";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Oportunidades" };
export const dynamic = "force-dynamic";

const TONO_ETAPA = {
  calificacion: "neutro", analisis: "azul", propuesta: "violeta",
  negociacion: "ambar", ganada: "verde", perdida: "rojo",
} as const;

export default async function PaginaOportunidades({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string }>;
}) {
  const perfil = await exigirSesion();
  const { etapa = "abiertas" } = await searchParams;
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("oportunidades")
    .select("*, cuentas(razon_social)")
    .order("fecha_cierre_prevista", { ascending: true, nullsFirst: false });

  if (etapa === "abiertas") consulta = consulta.not("etapa", "in", "(ganada,perdida)");
  else if (etapa !== "todas") consulta = consulta.eq("etapa", etapa);

  const { data } = await consulta;
  const filas = (data ?? []) as Record<string, unknown>[];

  return (
    <>
      <Encabezado
        titulo="Oportunidades"
        descripcion="Operaciones comerciales en curso y cerradas."
        acciones={
          puedeEditar(perfil) && (
            <Link href="/oportunidades/nueva" className="boton-primario">Nueva oportunidad</Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="etiqueta-campo" htmlFor="etapa">Etapa</label>
          <select id="etapa" name="etapa" defaultValue={etapa} className="campo">
            <option value="abiertas">Solo abiertas</option>
            <option value="todas">Todas</option>
            {ETAPAS.map((e) => (
              <option key={e} value={e}>{ETIQUETA_ETAPA[e]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="boton-secundario">Filtrar</button>
      </form>

      <Tarjeta sinRelleno>
        {filas.length === 0 ? (
          <SinDatos mensaje="No hay oportunidades con ese filtro." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Oportunidad</th>
                  <th>Cliente</th>
                  <th>Etapa</th>
                  <th>Origen</th>
                  <th className="text-right">Importe</th>
                  <th className="text-right">Prob.</th>
                  <th>Cierre</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((o) => {
                  const etapaFila = o.etapa as keyof typeof TONO_ETAPA;
                  return (
                    <tr key={String(o.id)}>
                      <td>
                        <Link
                          href={`/oportunidades/${o.id}`}
                          className="font-mono text-xs text-marca-600 hover:underline dark:text-marca-300"
                        >
                          {String(o.referencia)}
                        </Link>
                      </td>
                      <td className="max-w-xs truncate">{String(o.titulo)}</td>
                      <td className="texto-suave">
                        {(o.cuentas as { razon_social?: string } | null)?.razon_social ?? "—"}
                      </td>
                      <td>
                        <Etiqueta tono={TONO_ETAPA[etapaFila]}>
                          {ETIQUETA_ETAPA[etapaFila]}
                        </Etiqueta>
                      </td>
                      <td className="texto-suave text-xs">
                        {ETIQUETA_ORIGEN[o.origen as keyof typeof ETIQUETA_ORIGEN]}
                      </td>
                      <td className="text-right tabular-nums">{importe(o.importe_estimado as number)}</td>
                      <td className="text-right tabular-nums">{porcentaje(o.probabilidad as number)}</td>
                      <td className="texto-suave">{fecha(o.fecha_cierre_prevista as string)}</td>
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
