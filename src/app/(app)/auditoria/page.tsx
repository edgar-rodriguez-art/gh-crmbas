import { Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import { fechaConHora } from "@/lib/formato";
import { exigirRol } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { RegistroAuditoria } from "@/lib/tipos";

export const metadata = { title: "Auditoría" };
export const dynamic = "force-dynamic";

const TONO_OPERACION = {
  INSERT: "verde", UPDATE: "azul", DELETE: "rojo",
} as const;

export default async function PaginaAuditoria({
  searchParams,
}: {
  searchParams: Promise<{ tabla?: string }>;
}) {
  await exigirRol("admin");
  const { tabla = "todas" } = await searchParams;
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("auditoria")
    .select("id, tabla, operacion, registro_id, usuario_email, ocurrido_en")
    .order("ocurrido_en", { ascending: false })
    .limit(200);

  if (tabla !== "todas") consulta = consulta.eq("tabla", tabla);

  const { data } = await consulta;
  const registros = (data ?? []) as RegistroAuditoria[];

  const TABLAS = [
    "cuentas", "contactos", "oportunidades", "presupuestos",
    "incidencias", "perfiles", "consentimientos", "solicitudes_rgpd",
  ];

  return (
    <>
      <Encabezado
        titulo="Traza de auditoría"
        descripcion="Registro de solo anexado. Ningún rol de la aplicación puede modificarlo ni borrarlo."
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="etiqueta-campo" htmlFor="tabla">Tabla</label>
          <select id="tabla" name="tabla" defaultValue={tabla} className="campo">
            <option value="todas">Todas</option>
            {TABLAS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="boton-secundario">Filtrar</button>
      </form>

      <Tarjeta sinRelleno>
        {registros.length === 0 ? (
          <SinDatos mensaje="No hay eventos registrados con ese filtro." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Momento</th>
                  <th>Tabla</th>
                  <th>Operación</th>
                  <th>Registro</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{fechaConHora(r.ocurrido_en)}</td>
                    <td className="font-mono text-xs">{r.tabla}</td>
                    <td>
                      <Etiqueta tono={TONO_OPERACION[r.operacion]}>{r.operacion}</Etiqueta>
                    </td>
                    <td className="font-mono text-xs">{r.registro_id.slice(0, 8)}…</td>
                    <td className="texto-suave">
                      {r.usuario_email ?? "sistema (migración o proceso automático)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <p className="texto-suave mt-4 text-xs">
        Se muestran los 200 eventos más recientes. La traza conserva el estado anterior y
        posterior de cada cambio en formato JSON, consultable en la base de datos.
      </p>
    </>
  );
}
