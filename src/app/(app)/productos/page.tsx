import { Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import { ETIQUETA_CATEGORIA } from "@/lib/dominio";
import { importe, porcentaje } from "@/lib/formato";
import { exigirSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { CategoriaProducto, Producto } from "@/lib/tipos";

export const metadata = { title: "Catálogo" };
export const dynamic = "force-dynamic";

export default async function PaginaProductos() {
  await exigirSesion();
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("productos")
    .select("*")
    .order("categoria")
    .order("marca");

  const productos = (data ?? []) as Producto[];

  return (
    <>
      <Encabezado
        titulo="Catálogo"
        descripcion="Equipamiento informático y servicios, con su garantía legal y su ecotasa RAEE."
      />

      <Tarjeta sinRelleno>
        {productos.length === 0 ? (
          <SinDatos mensaje="El catálogo está vacío." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-right">PVP</th>
                  <th className="text-right">IVA</th>
                  <th className="text-right">Margen</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Garantía</th>
                  <th className="text-right">Ecotasa</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const margen = p.precio_venta > 0
                    ? ((p.precio_venta - p.precio_coste) / p.precio_venta) * 100
                    : 0;
                  const bajoMinimo = p.stock <= p.stock_minimo;

                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.sku}</td>
                      <td>
                        <p className="font-medium">{p.marca} {p.modelo}</p>
                        {p.raee_categoria && (
                          <p className="texto-suave text-xs">{p.raee_categoria}</p>
                        )}
                      </td>
                      <td>{ETIQUETA_CATEGORIA[p.categoria as CategoriaProducto]}</td>
                      <td className="text-right tabular-nums">{importe(p.precio_venta)}</td>
                      <td className="text-right tabular-nums">{porcentaje(p.tipo_iva)}</td>
                      <td className="text-right tabular-nums">{margen.toFixed(1)} %</td>
                      <td className="text-right tabular-nums">
                        {bajoMinimo ? (
                          <Etiqueta tono="ambar">{p.stock} · bajo mínimo</Etiqueta>
                        ) : (
                          p.stock
                        )}
                      </td>
                      <td className="text-right tabular-nums">{p.garantia_meses} meses</td>
                      <td className="text-right tabular-nums">{importe(p.ecotasa)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <p className="texto-suave mt-4 text-xs">
        La garantía legal de conformidad de los bienes es de tres años desde la entrega
        (Real Decreto Legislativo 7/2021). La ecotasa corresponde a la gestión de residuos
        de aparatos eléctricos y electrónicos (Real Decreto 110/2015).
      </p>
    </>
  );
}
