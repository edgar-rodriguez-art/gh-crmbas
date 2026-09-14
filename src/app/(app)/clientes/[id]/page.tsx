import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioCliente } from "@/components/formulario-cliente";
import { FormularioContacto } from "@/components/formulario-contacto";
import { Dato, Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import {
  ETIQUETA_BASE_LEGAL, ETIQUETA_ETAPA, ETIQUETA_ESTADO_INCIDENCIA,
  ETIQUETA_FINALIDAD, ETIQUETA_REGIMEN_IVA, ETIQUETA_SEGMENTO, ETIQUETA_TIPO_CLIENTE,
} from "@/lib/dominio";
import { fecha, importe, telefono as formatoTelefono } from "@/lib/formato";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Consentimiento, Contacto, Cuenta, Incidencia, Oportunidad } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await exigirSesion();
  const supabase = await crearClienteServidor();

  const { data: cuenta } = await supabase.from("cuentas").select("*").eq("id", id).maybeSingle();
  if (!cuenta) notFound();
  const cliente = cuenta as Cuenta;

  const [contactosRes, oportunidadesRes, incidenciasRes, consentimientosRes] = await Promise.all([
    supabase.from("contactos").select("*").eq("cuenta_id", id).order("es_principal", { ascending: false }),
    supabase.from("oportunidades").select("*").eq("cuenta_id", id).order("creado_en", { ascending: false }),
    supabase.from("incidencias").select("*").eq("cuenta_id", id).order("fecha_apertura", { ascending: false }),
    supabase.from("consentimientos").select("*").eq("cuenta_id", id).order("fecha_otorgamiento", { ascending: false }),
  ]);

  const contactos = (contactosRes.data ?? []) as Contacto[];
  const oportunidades = (oportunidadesRes.data ?? []) as Oportunidad[];
  const incidencias = (incidenciasRes.data ?? []) as Incidencia[];
  const consentimientos = (consentimientosRes.data ?? []) as Consentimiento[];

  const editable = puedeEditar(perfil);

  return (
    <>
      <Encabezado
        titulo={cliente.razon_social}
        descripcion={`${ETIQUETA_TIPO_CLIENTE[cliente.tipo_cliente]} · ${cliente.nif} · ${ETIQUETA_SEGMENTO[cliente.segmento]}`}
        acciones={
          <>
            <Link href="/clientes" className="boton-secundario">Volver al listado</Link>
            {editable && (
              <Link href={`/oportunidades/nueva?cuenta=${cliente.id}`} className="boton-primario">
                Nueva oportunidad
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta titulo="Ficha del cliente">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Dato rotulo="Régimen de IVA">{ETIQUETA_REGIMEN_IVA[cliente.regimen_iva]}</Dato>
              <Dato rotulo="Estado">
                <Etiqueta tono={cliente.estado === "activo" ? "verde" : "neutro"}>
                  {cliente.estado}
                </Etiqueta>
              </Dato>
              <Dato rotulo="Correo electrónico">{cliente.email ?? "—"}</Dato>
              <Dato rotulo="Teléfono">{formatoTelefono(cliente.telefono)}</Dato>
              <Dato rotulo="Domicilio">
                {cliente.direccion
                  ? `${cliente.direccion}, ${cliente.codigo_postal ?? ""} ${cliente.municipio ?? ""} (${cliente.provincia ?? "—"})`
                  : "—"}
              </Dato>
              <Dato rotulo="IBAN">
                <span className="font-mono text-xs">{cliente.iban ?? "—"}</span>
              </Dato>
              <Dato rotulo="Base jurídica del tratamiento">
                {ETIQUETA_BASE_LEGAL[cliente.base_legal_tratamiento]}
              </Dato>
              <Dato rotulo="Alta en el CRM">{fecha(cliente.creado_en)}</Dato>
            </dl>
            {cliente.notas && (
              <p className="texto-suave mt-5 border-t pt-4 text-sm" style={{ borderColor: "var(--borde)" }}>
                {cliente.notas}
              </p>
            )}
          </Tarjeta>

          <Tarjeta
            titulo="Oportunidades"
            descripcion={`${oportunidades.length} registrada(s)`}
            sinRelleno
          >
            {oportunidades.length === 0 ? (
              <SinDatos mensaje="Este cliente todavía no tiene oportunidades." />
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Título</th>
                    <th>Etapa</th>
                    <th className="text-right">Importe</th>
                    <th>Cierre previsto</th>
                  </tr>
                </thead>
                <tbody>
                  {oportunidades.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          href={`/oportunidades/${o.id}`}
                          className="font-mono text-xs text-marca-600 hover:underline dark:text-marca-300"
                        >
                          {o.referencia}
                        </Link>
                      </td>
                      <td>{o.titulo}</td>
                      <td><Etiqueta tono="azul">{ETIQUETA_ETAPA[o.etapa]}</Etiqueta></td>
                      <td className="text-right tabular-nums">{importe(o.importe_estimado)}</td>
                      <td className="texto-suave">{fecha(o.fecha_cierre_prevista)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>

          <Tarjeta titulo="Incidencias y RMA" sinRelleno>
            {incidencias.length === 0 ? (
              <SinDatos mensaje="Sin incidencias registradas." />
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Garantía</th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link
                          href={`/incidencias/${i.id}`}
                          className="font-mono text-xs text-marca-600 hover:underline dark:text-marca-300"
                        >
                          {i.referencia}
                        </Link>
                      </td>
                      <td className="max-w-md truncate">{i.descripcion}</td>
                      <td>{ETIQUETA_ESTADO_INCIDENCIA[i.estado]}</td>
                      <td>
                        {i.en_garantia
                          ? <Etiqueta tono="verde">En garantía</Etiqueta>
                          : <span className="texto-suave text-xs">Fuera de garantía</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>

          {editable && (
            <Tarjeta titulo="Editar los datos del cliente">
              <FormularioCliente cuenta={cliente} />
            </Tarjeta>
          )}
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Contactos" sinRelleno>
            {contactos.length === 0 ? (
              <SinDatos mensaje="Sin personas de contacto." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--borde)" }}>
                {contactos.map((c) => (
                  <li key={c.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {c.nombre} {c.apellidos}
                        </p>
                        <p className="texto-suave truncate text-xs">{c.cargo ?? "—"}</p>
                      </div>
                      {c.es_principal && <Etiqueta tono="azul">Principal</Etiqueta>}
                    </div>
                    <p className="texto-suave mt-2 truncate text-xs">{c.email ?? "Sin correo"}</p>
                    <p className="texto-suave text-xs">{formatoTelefono(c.movil ?? c.telefono)}</p>
                    <p className="mt-2">
                      <Etiqueta tono={c.acepta_comunicaciones ? "verde" : "neutro"}>
                        {c.acepta_comunicaciones
                          ? "Acepta comunicaciones"
                          : "No acepta comunicaciones"}
                      </Etiqueta>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>

          {editable && (
            <Tarjeta titulo="Añadir contacto">
              <FormularioContacto cuentaId={cliente.id} />
            </Tarjeta>
          )}

          <Tarjeta
            titulo="Consentimientos"
            descripcion="Evidencia conservada conforme al artículo 7.1 del RGPD."
            sinRelleno
          >
            {consentimientos.length === 0 ? (
              <SinDatos mensaje="Sin consentimientos registrados." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--borde)" }}>
                {consentimientos.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{ETIQUETA_FINALIDAD[c.finalidad]}</span>
                      <Etiqueta tono={c.otorgado && !c.fecha_revocacion ? "verde" : "rojo"}>
                        {c.fecha_revocacion ? "Revocado" : c.otorgado ? "Otorgado" : "Denegado"}
                      </Etiqueta>
                    </div>
                    <p className="texto-suave mt-1 text-xs">
                      {fecha(c.fecha_otorgamiento)} · vía {c.canal}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
