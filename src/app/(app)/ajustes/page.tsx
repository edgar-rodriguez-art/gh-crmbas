import { Aviso, Dato, Encabezado, Tarjeta } from "@/components/ui";
import { fechaConHora } from "@/lib/formato";
import { exigirRol } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

interface Ajuste {
  clave: string;
  valor: Record<string, unknown>;
  descripcion: string;
  actualizado_en: string;
}

export default async function PaginaAjustes() {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();

  const { data } = await supabase.from("ajustes").select("*").order("clave");
  const ajustes = (data ?? []) as Ajuste[];

  const variables = [
    ["NEXT_PUBLIC_SUPABASE_URL", "Dirección del proyecto de Supabase.", "Pública"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Clave pública. Toda consulta que la usa pasa por RLS.", "Pública"],
    ["SUPABASE_SERVICE_ROLE_KEY", "Clave de servicio. Ignora RLS: solo se usa en el servidor.", "Secreta"],
    ["N8N_WEBHOOK_URL", "Punto de entrada del flujo wf-crmbas.", "Secreta"],
    ["N8N_WEBHOOK_SECRET", "Secreto con el que crmbas firma lo que envía a n8n.", "Secreta"],
    ["CRM_WEBHOOK_SECRET", "Secreto con el que n8n firma lo que devuelve a crmbas.", "Secreta"],
    ["NEXT_PUBLIC_APP_URL", "Dirección pública de la aplicación.", "Pública"],
  ];

  return (
    <>
      <Encabezado
        titulo="Ajustes"
        descripcion="Parámetros de la instancia y configuración de las integraciones."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {ajustes.map((a) => (
          <Tarjeta key={a.clave} titulo={a.clave} descripcion={a.descripcion}>
            <dl className="space-y-3">
              {Object.entries(a.valor).map(([clave, valor]) => (
                <Dato key={clave} rotulo={clave.replace(/_/g, " ")}>
                  {String(valor)}
                </Dato>
              ))}
            </dl>
            <p className="texto-suave mt-4 text-xs">
              Actualizado el {fechaConHora(a.actualizado_en)}
            </p>
          </Tarjeta>
        ))}
      </div>

      <div className="mt-6">
        <Tarjeta
          titulo="Variables de entorno"
          descripcion="Se configuran en Vercel → Settings → Environment Variables. El repositorio no contiene ningún secreto."
          sinRelleno
        >
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Para qué sirve</th>
                  <th>Naturaleza</th>
                </tr>
              </thead>
              <tbody>
                {variables.map(([nombre, proposito, naturaleza]) => (
                  <tr key={nombre}>
                    <td className="font-mono text-xs">{nombre}</td>
                    <td>{proposito}</td>
                    <td className="texto-suave">{naturaleza}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </div>

      <div className="mt-6">
        <Aviso tono="ambar" titulo="Revisión periódica recomendada">
          Rota los secretos compartidos con n8n al menos una vez al año y siempre que
          alguien con acceso deje la organización. Revisa también las alertas de
          seguridad del panel de Supabase después de cada cambio de esquema.
        </Aviso>
      </div>
    </>
  );
}
