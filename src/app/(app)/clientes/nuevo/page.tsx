import Link from "next/link";

import { FormularioCliente } from "@/components/formulario-cliente";
import { Encabezado, Tarjeta } from "@/components/ui";
import { exigirRol } from "@/lib/sesion";

export const metadata = { title: "Nuevo cliente" };

export default async function PaginaNuevoCliente() {
  await exigirRol("admin", "comercial", "soporte");

  return (
    <>
      <Encabezado
        titulo="Nuevo cliente"
        descripcion="Alta de empresa, autónomo o particular."
        acciones={<Link href="/clientes" className="boton-secundario">Cancelar</Link>}
      />
      <div className="max-w-3xl">
        <Tarjeta>
          <FormularioCliente />
        </Tarjeta>
      </div>
    </>
  );
}
