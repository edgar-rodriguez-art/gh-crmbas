import { PanelUsuario } from "@/components/panel-usuario";
import { Aviso, Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { ETIQUETA_ROL } from "@/lib/dominio";
import { fechaConHora } from "@/lib/formato";
import { exigirRol } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Perfil } from "@/lib/tipos";

export const metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

export default async function PaginaUsuarios() {
  const perfil = await exigirRol("admin");
  const supabase = await crearClienteServidor();

  const { data } = await supabase.from("perfiles").select("*").order("nombre");
  const usuarios = (data ?? []) as Perfil[];

  return (
    <>
      <Encabezado
        titulo="Usuarios y permisos"
        descripcion="El rol determina qué puede ver y modificar cada persona, tanto en la interfaz como en la base de datos."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Aviso tono="azul" titulo="Qué puede hacer cada rol">
          <ul className="mt-2 space-y-1 text-xs">
            <li><strong>Administración</strong>: todo, incluidos usuarios, catálogo, auditoría y resolución de solicitudes de derechos.</li>
            <li><strong>Comercial</strong>: clientes, contactos, oportunidades, presupuestos e incidencias.</li>
            <li><strong>Soporte técnico</strong>: incidencias, RMA y consulta del resto de módulos.</li>
            <li><strong>Solo lectura</strong>: consulta, sin capacidad de modificar nada.</li>
          </ul>
        </Aviso>
        <Aviso tono="ambar" titulo="Alta de nuevas personas">
          Las cuentas se crean desde el panel de Supabase (Autenticación → Usuarios).
          Toda cuenta nueva nace con rol <strong>Solo lectura</strong>: nadie puede
          concederse privilegios al registrarse.
        </Aviso>
      </div>

      <Tarjeta sinRelleno>
        <div className="overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acceso</th>
                <th>Último acceso</th>
                <th>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.nombre} {u.apellidos}</td>
                  <td className="texto-suave">{u.email}</td>
                  <td><Etiqueta tono="violeta">{ETIQUETA_ROL[u.rol]}</Etiqueta></td>
                  <td>
                    <Etiqueta tono={u.activo ? "verde" : "rojo"}>
                      {u.activo ? "Activo" : "Desactivado"}
                    </Etiqueta>
                  </td>
                  <td className="texto-suave">{fechaConHora(u.ultimo_acceso)}</td>
                  <td>
                    <PanelUsuario
                      id={u.id}
                      rol={u.rol}
                      activo={u.activo}
                      esUnoMismo={u.id === perfil.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </>
  );
}
