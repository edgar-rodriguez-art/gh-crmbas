import Link from "next/link";

import { FormularioIncidencia } from "@/components/formulario-incidencia";
import { Encabezado, Tarjeta } from "@/components/ui";
import { exigirRol } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Nueva incidencia" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevaIncidencia() {
  await exigirRol("admin", "comercial", "soporte");
  const supabase = await crearClienteServidor();

  const [cuentasRes, productosRes] = await Promise.all([
    supabase.from("cuentas").select("id, razon_social").eq("estado", "activo").order("razon_social"),
    supabase.from("productos").select("id, sku, marca, modelo").eq("activo", true).order("marca"),
  ]);

  return (
    <>
      <Encabezado
        titulo="Nueva incidencia"
        descripcion="Alta de avería, garantía, RMA o servicio técnico."
        acciones={<Link href="/incidencias" className="boton-secundario">Cancelar</Link>}
      />
      <div className="max-w-2xl">
        <Tarjeta>
          <FormularioIncidencia
            cuentas={(cuentasRes.data ?? []) as { id: string; razon_social: string }[]}
            productos={(productosRes.data ?? []) as {
              id: string; sku: string; marca: string; modelo: string;
            }[]}
          />
        </Tarjeta>
      </div>
    </>
  );
}
