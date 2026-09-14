import Link from "next/link";

import { FormularioOportunidad } from "@/components/formulario-oportunidad";
import { Encabezado, Tarjeta } from "@/components/ui";
import { exigirRol } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Nueva oportunidad" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevaOportunidad({
  searchParams,
}: {
  searchParams: Promise<{ cuenta?: string }>;
}) {
  await exigirRol("admin", "comercial", "soporte");
  const { cuenta } = await searchParams;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("cuentas")
    .select("id, razon_social")
    .eq("estado", "activo")
    .order("razon_social");

  return (
    <>
      <Encabezado
        titulo="Nueva oportunidad"
        descripcion="Registra una operación comercial en el embudo."
        acciones={<Link href="/oportunidades" className="boton-secundario">Cancelar</Link>}
      />
      <div className="max-w-2xl">
        <Tarjeta>
          <FormularioOportunidad
            cuentas={(data ?? []) as { id: string; razon_social: string }[]}
            cuentaPreseleccionada={cuenta}
          />
        </Tarjeta>
      </div>
    </>
  );
}
