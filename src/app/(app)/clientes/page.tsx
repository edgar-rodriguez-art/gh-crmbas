import Link from "next/link";

import { Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import { ETIQUETA_SEGMENTO, ETIQUETA_TIPO_CLIENTE } from "@/lib/dominio";
import { importe } from "@/lib/formato";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

interface FilaResumen {
  id: string;
  razon_social: string;
  nif: string;
  tipo_cliente: keyof typeof ETIQUETA_TIPO_CLIENTE;
  segmento: keyof typeof ETIQUETA_SEGMENTO;
  provincia: string | null;
  estado: "activo" | "inactivo" | "archivado";
  contactos: number;
  oportunidades: number;
  facturado_ganado: number;
  incidencias_abiertas: number;
}

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const perfil = await exigirSesion();
  const { q = "", estado = "activo" } = await searchParams;
  const supabase = await crearClienteServidor();

  let consulta = supabase.from("v_cuentas_resumen").select("*").order("razon_social");
  if (estado !== "todos") consulta = consulta.eq("estado", estado);
  if (q.trim()) consulta = consulta.or(`razon_social.ilike.%${q}%,nif.ilike.%${q}%`);

  const { data } = await consulta;
  const clientes = (data ?? []) as FilaResumen[];

  return (
    <>
      <Encabezado
        titulo="Clientes"
        descripcion="Empresas, autónomos y particulares registrados en el CRM."
        acciones={
          puedeEditar(perfil) && (
            <Link href="/clientes/nuevo" className="boton-primario">Nuevo cliente</Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label className="etiqueta-campo" htmlFor="q">Buscar</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Razón social o NIF"
            className="campo"
          />
        </div>
        <div>
          <label className="etiqueta-campo" htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={estado} className="campo">
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="archivado">Archivados</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        <button type="submit" className="boton-secundario">Filtrar</button>
      </form>

      <Tarjeta sinRelleno>
        {clientes.length === 0 ? (
          <SinDatos
            mensaje={
              q
                ? `Ningún cliente coincide con «${q}».`
                : "Todavía no hay clientes con ese estado."
            }
            accion={
              puedeEditar(perfil) && (
                <Link href="/clientes/nuevo" className="boton-primario">Crear el primero</Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>NIF</th>
                  <th>Tipo</th>
                  <th>Provincia</th>
                  <th className="text-right">Contactos</th>
                  <th className="text-right">Oportunidades</th>
                  <th className="text-right">Ganado</th>
                  <th>Servicio</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-marca-600 hover:underline dark:text-marca-300"
                      >
                        {c.razon_social}
                      </Link>
                      <p className="texto-suave text-xs">{ETIQUETA_SEGMENTO[c.segmento]}</p>
                    </td>
                    <td className="font-mono text-xs">{c.nif}</td>
                    <td>{ETIQUETA_TIPO_CLIENTE[c.tipo_cliente]}</td>
                    <td className="texto-suave">{c.provincia ?? "—"}</td>
                    <td className="text-right tabular-nums">{c.contactos}</td>
                    <td className="text-right tabular-nums">{c.oportunidades}</td>
                    <td className="text-right tabular-nums">{importe(c.facturado_ganado)}</td>
                    <td>
                      {c.incidencias_abiertas > 0 ? (
                        <Etiqueta tono="ambar">{c.incidencias_abiertas} abiertas</Etiqueta>
                      ) : (
                        <span className="texto-suave text-xs">Sin incidencias</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <p className="texto-suave mt-4 text-xs">
        {clientes.length} cliente(s). Los datos personales que aparecen en esta pantalla
        se tratan con la base jurídica declarada en cada ficha.
      </p>
    </>
  );
}
