import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioActividad } from "@/components/formulario-actividad";
import { PanelEtapa } from "@/components/panel-etapa";
import { Dato, Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import {
  ETIQUETA_ESTADO_PRESUPUESTO, ETIQUETA_ETAPA, ETIQUETA_ORIGEN,
  ETIQUETA_TIPO_ACTIVIDAD,
} from "@/lib/dominio";
import { fecha, fechaConHora, importe, porcentaje } from "@/lib/formato";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Actividad, Oportunidad, Presupuesto } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function PaginaOportunidad({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await exigirSesion();
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("oportunidades")
    .select("*, cuentas(id, razon_social, nif), contactos(nombre, apellidos, email)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const oportunidad = data as Oportunidad & {
    cuentas: { id: string; razon_social: string; nif: string } | null;
    contactos: { nombre: string; apellidos: string; email: string | null } | null;
  };

  const [actividadesRes, presupuestosRes] = await Promise.all([
    supabase.from("actividades").select("*").eq("oportunidad_id", id).order("fecha", { ascending: false }),
    supabase.from("presupuestos").select("*").eq("oportunidad_id", id).order("correlativo"),
  ]);

  const actividades = (actividadesRes.data ?? []) as Actividad[];
  const presupuestos = (presupuestosRes.data ?? []) as Presupuesto[];
  const editable = puedeEditar(perfil);

  return (
    <>
      <Encabezado
        titulo={oportunidad.titulo}
        descripcion={`${oportunidad.referencia} · ${oportunidad.cuentas?.razon_social ?? "Sin cliente"}`}
        acciones={<Link href="/oportunidades" className="boton-secundario">Volver al listado</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta titulo="Datos de la operación">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Dato rotulo="Etapa">
                <Etiqueta tono="azul">{ETIQUETA_ETAPA[oportunidad.etapa]}</Etiqueta>
              </Dato>
              <Dato rotulo="Probabilidad">{porcentaje(oportunidad.probabilidad)}</Dato>
              <Dato rotulo="Importe estimado">{importe(oportunidad.importe_estimado)}</Dato>
              <Dato rotulo="Importe ponderado">
                {importe(oportunidad.importe_estimado * oportunidad.probabilidad / 100)}
              </Dato>
              <Dato rotulo="Origen">{ETIQUETA_ORIGEN[oportunidad.origen]}</Dato>
              <Dato rotulo="Cierre previsto">{fecha(oportunidad.fecha_cierre_prevista)}</Dato>
              <Dato rotulo="Contacto">
                {oportunidad.contactos
                  ? `${oportunidad.contactos.nombre} ${oportunidad.contactos.apellidos}`
                  : "—"}
              </Dato>
              <Dato rotulo="Cliente">
                {oportunidad.cuentas ? (
                  <Link
                    href={`/clientes/${oportunidad.cuentas.id}`}
                    className="text-marca-600 hover:underline dark:text-marca-300"
                  >
                    {oportunidad.cuentas.razon_social}
                  </Link>
                ) : "—"}
              </Dato>
            </dl>

            {oportunidad.descripcion && (
              <p className="mt-5 border-t pt-4 text-sm" style={{ borderColor: "var(--borde)" }}>
                {oportunidad.descripcion}
              </p>
            )}

            {oportunidad.motivo_perdida && (
              <p className="mt-4 rounded-lg bg-rose-500/12 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                <strong>Motivo de la pérdida:</strong> {oportunidad.motivo_perdida}
              </p>
            )}
          </Tarjeta>

          <Tarjeta titulo="Presupuestos asociados" sinRelleno>
            {presupuestos.length === 0 ? (
              <SinDatos mensaje="Aún no se ha emitido ningún presupuesto." />
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Estado</th>
                    <th>Emisión</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link
                          href={`/presupuestos/${p.id}`}
                          className="font-mono text-xs text-marca-600 hover:underline dark:text-marca-300"
                        >
                          {p.numero}
                        </Link>
                      </td>
                      <td>{ETIQUETA_ESTADO_PRESUPUESTO[p.estado]}</td>
                      <td className="texto-suave">{fecha(p.fecha_emision)}</td>
                      <td className="text-right tabular-nums">{importe(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>

          <Tarjeta titulo="Actividad" descripcion={`${actividades.length} registro(s)`} sinRelleno>
            {actividades.length === 0 ? (
              <SinDatos mensaje="Sin actividad registrada en esta oportunidad." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--borde)" }}>
                {actividades.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{a.asunto}</p>
                      <Etiqueta>{ETIQUETA_TIPO_ACTIVIDAD[a.tipo]}</Etiqueta>
                    </div>
                    <p className="texto-suave mt-1 text-xs">
                      {fechaConHora(a.fecha)}
                      {a.duracion_min ? ` · ${a.duracion_min} min` : ""}
                    </p>
                    {a.detalle && <p className="mt-2 text-sm">{a.detalle}</p>}
                    {a.resultado && (
                      <p className="texto-suave mt-1 text-xs">Resultado: {a.resultado}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-6">
          {editable && (
            <>
              <Tarjeta titulo="Avanzar la oportunidad">
                <PanelEtapa
                  id={oportunidad.id}
                  etapaActual={oportunidad.etapa}
                  probabilidadActual={oportunidad.probabilidad}
                  motivoActual={oportunidad.motivo_perdida}
                />
              </Tarjeta>

              <Tarjeta titulo="Registrar actividad">
                <FormularioActividad
                  cuentaId={oportunidad.cuenta_id}
                  oportunidadId={oportunidad.id}
                />
              </Tarjeta>
            </>
          )}
        </div>
      </div>
    </>
  );
}
