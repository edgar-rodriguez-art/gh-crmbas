import Link from "next/link";

import { Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import { ETIQUETA_ETAPA } from "@/lib/dominio";
import { fecha, importe, porcentaje } from "@/lib/formato";
import { exigirSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { EtapaOportunidad, FilaEmbudo } from "@/lib/tipos";

export const metadata = { title: "Embudo" };
export const dynamic = "force-dynamic";

const ETAPAS_ABIERTAS: EtapaOportunidad[] = [
  "calificacion", "analisis", "propuesta", "negociacion",
];

export default async function PaginaEmbudo() {
  await exigirSesion();
  const supabase = await crearClienteServidor();

  const [embudoRes, oportunidadesRes] = await Promise.all([
    supabase.from("v_embudo").select("*"),
    supabase
      .from("oportunidades")
      .select("id, referencia, titulo, etapa, importe_estimado, probabilidad, fecha_cierre_prevista, cuentas(razon_social)")
      .not("etapa", "in", "(ganada,perdida)")
      .order("importe_estimado", { ascending: false }),
  ]);

  const resumen = (embudoRes.data ?? []) as FilaEmbudo[];
  const oportunidades = (oportunidadesRes.data ?? []) as Record<string, unknown>[];

  const totalEmbudo = resumen.reduce((suma, f) => suma + Number(f.importe_total), 0);
  const maximo = Math.max(...resumen.map((f) => Number(f.importe_total)), 1);

  return (
    <>
      <Encabezado
        titulo="Embudo comercial"
        descripcion="Distribución del importe abierto por etapa del ciclo de venta."
      />

      {resumen.length === 0 ? (
        <Tarjeta>
          <SinDatos
            mensaje="No hay oportunidades abiertas."
            accion={<Link href="/oportunidades/nueva" className="boton-primario">Crear una</Link>}
          />
        </Tarjeta>
      ) : (
        <>
          <Tarjeta
            titulo="Por etapa"
            descripcion={`${importe(totalEmbudo)} en total, sin ponderar.`}
          >
            <ul className="space-y-4">
              {ETAPAS_ABIERTAS.map((etapa) => {
                const fila = resumen.find((f) => f.etapa === etapa);
                const total = Number(fila?.importe_total ?? 0);
                const anchura = Math.round((total / maximo) * 100);

                return (
                  <li key={etapa}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{ETIQUETA_ETAPA[etapa]}</span>
                      <span className="texto-suave text-xs tabular-nums">
                        {fila?.operaciones ?? 0} oportunidad(es) · {importe(total)} ·
                        ponderado {importe(fila?.importe_ponderado ?? 0)}
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full"
                      style={{ background: "var(--borde)" }}
                      role="img"
                      aria-label={`${ETIQUETA_ETAPA[etapa]}: ${importe(total)}`}
                    >
                      <div
                        className="h-full rounded-full bg-marca-600 transition-all"
                        style={{ width: `${Math.max(anchura, total > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>

          <div className="mt-6">
            <Tarjeta titulo="Oportunidades abiertas, por importe" sinRelleno>
              <div className="overflow-x-auto">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Referencia</th>
                      <th>Oportunidad</th>
                      <th>Cliente</th>
                      <th>Etapa</th>
                      <th className="text-right">Importe</th>
                      <th className="text-right">Prob.</th>
                      <th>Cierre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oportunidades.map((o) => (
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
                          <Etiqueta tono="azul">
                            {ETIQUETA_ETAPA[o.etapa as EtapaOportunidad]}
                          </Etiqueta>
                        </td>
                        <td className="text-right tabular-nums">{importe(o.importe_estimado as number)}</td>
                        <td className="text-right tabular-nums">{porcentaje(o.probabilidad as number)}</td>
                        <td className="texto-suave">{fecha(o.fecha_cierre_prevista as string)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tarjeta>
          </div>
        </>
      )}
    </>
  );
}
