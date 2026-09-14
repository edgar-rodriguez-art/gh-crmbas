import Link from "next/link";

import { Encabezado, Etiqueta, Kpi, SinDatos, Tarjeta } from "@/components/ui";
import { ETIQUETA_ETAPA, ETIQUETA_PRIORIDAD, ETIQUETA_TIPO_ACTIVIDAD } from "@/lib/dominio";
import { fecha, fechaConHora, importe, tiempoRestante } from "@/lib/formato";
import { exigirSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { FilaEmbudo, Kpis } from "@/lib/tipos";

export const metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

export default async function PaginaInicio() {
  const perfil = await exigirSesion();
  const supabase = await crearClienteServidor();

  const [kpisRes, embudoRes, slaRes, actividadRes] = await Promise.all([
    supabase.from("v_kpis").select("*").single(),
    supabase.from("v_embudo").select("*"),
    supabase.from("v_incidencias_sla").select("*").order("fecha_limite_sla").limit(5),
    supabase
      .from("actividades")
      .select("id, tipo, asunto, fecha, cuentas(razon_social)")
      .order("fecha", { ascending: false })
      .limit(5),
  ]);

  const kpis = (kpisRes.data ?? null) as Kpis | null;
  const embudo = (embudoRes.data ?? []) as FilaEmbudo[];

  return (
    <>
      <Encabezado
        titulo={`Hola, ${perfil.nombre}`}
        descripcion="Resumen de la actividad comercial y del servicio técnico."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Embudo abierto"
          valor={importe(kpis?.embudo_importe)}
          detalle={`${kpis?.oportunidades_abiertas ?? 0} oportunidades`}
          tono="azul"
        />
        <Kpi
          rotulo="Ganado este ejercicio"
          valor={importe(kpis?.ganado_ejercicio)}
          detalle="Cerrado en el año en curso"
          tono="verde"
        />
        <Kpi
          rotulo="Clientes activos"
          valor={String(kpis?.cuentas_activas ?? 0)}
          detalle={`${kpis?.contactos_activos ?? 0} contactos`}
        />
        <Kpi
          rotulo="Incidencias abiertas"
          valor={String(kpis?.incidencias_abiertas ?? 0)}
          detalle={
            kpis?.incidencias_sla_vencido
              ? `${kpis.incidencias_sla_vencido} con SLA vencido`
              : "SLA al día"
          }
          tono={kpis?.incidencias_sla_vencido ? "rojo" : "verde"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tarjeta
            titulo="Embudo por etapa"
            descripcion="Importe total e importe ponderado por la probabilidad de cierre."
            acciones={
              <Link href="/embudo" className="boton-secundario text-xs">Ver embudo</Link>
            }
            sinRelleno
          >
            {embudo.length === 0 ? (
              <SinDatos mensaje="Todavía no hay oportunidades abiertas." />
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th className="text-right">Operaciones</th>
                    <th className="text-right">Importe</th>
                    <th className="text-right">Ponderado</th>
                  </tr>
                </thead>
                <tbody>
                  {embudo.map((fila) => (
                    <tr key={fila.etapa}>
                      <td>{ETIQUETA_ETAPA[fila.etapa]}</td>
                      <td className="text-right tabular-nums">{fila.operaciones}</td>
                      <td className="text-right tabular-nums">{importe(fila.importe_total)}</td>
                      <td className="text-right tabular-nums">{importe(fila.importe_ponderado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>
        </div>

        <Tarjeta
          titulo="Incidencias por vencer"
          descripcion="Ordenadas por margen de SLA restante."
          sinRelleno
        >
          {(slaRes.data ?? []).length === 0 ? (
            <SinDatos mensaje="No hay incidencias abiertas." />
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--borde)" }}>
              {(slaRes.data ?? []).map((inc: Record<string, unknown>) => (
                <li key={String(inc.id)} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/incidencias/${inc.id}`}
                      className="text-sm font-medium text-marca-600 hover:underline dark:text-marca-300"
                    >
                      {String(inc.referencia)}
                    </Link>
                    <Etiqueta tono={inc.sla_vencido ? "rojo" : "ambar"}>
                      {tiempoRestante(inc.fecha_limite_sla as string)}
                    </Etiqueta>
                  </div>
                  <p className="texto-suave mt-1 truncate text-xs">
                    {String(inc.razon_social)} ·{" "}
                    {ETIQUETA_PRIORIDAD[inc.prioridad as keyof typeof ETIQUETA_PRIORIDAD]}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <div className="mt-6">
        <Tarjeta titulo="Última actividad registrada" sinRelleno>
          {(actividadRes.data ?? []).length === 0 ? (
            <SinDatos mensaje="Aún no se ha registrado actividad." />
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Asunto</th>
                  <th>Cliente</th>
                </tr>
              </thead>
              <tbody>
                {(actividadRes.data ?? []).map((act: Record<string, unknown>) => (
                  <tr key={String(act.id)}>
                    <td className="whitespace-nowrap">{fechaConHora(act.fecha as string)}</td>
                    <td>
                      <Etiqueta>
                        {ETIQUETA_TIPO_ACTIVIDAD[act.tipo as keyof typeof ETIQUETA_TIPO_ACTIVIDAD]}
                      </Etiqueta>
                    </td>
                    <td>{String(act.asunto)}</td>
                    <td className="texto-suave">
                      {(act.cuentas as { razon_social?: string } | null)?.razon_social ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tarjeta>
      </div>

      {kpis && kpis.solicitudes_rgpd_pendientes > 0 && (
        <div className="mt-6">
          <Tarjeta titulo="Protección de datos">
            <p className="text-sm">
              Hay <strong>{kpis.solicitudes_rgpd_pendientes}</strong> solicitud(es) de
              derechos pendientes de resolver. El plazo legal de respuesta es de un mes
              desde su recepción (artículo 12.3 del RGPD).
            </p>
            <Link href="/cumplimiento" className="boton-primario mt-4">
              Ir a protección de datos
            </Link>
          </Tarjeta>
        </div>
      )}

      <p className="texto-suave mt-6 text-xs">
        Datos actualizados a {fecha(new Date())}.
      </p>
    </>
  );
}
