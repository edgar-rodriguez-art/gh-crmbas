import Link from "next/link";

import { Navegacion } from "@/components/navegacion";
import { BotonSalir } from "@/components/salir";
import { ETIQUETA_ROL } from "@/lib/dominio";
import { exigirSesion } from "@/lib/sesion";

export default async function LayoutAplicacion({ children }: { children: React.ReactNode }) {
  const perfil = await exigirSesion();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside
        className="superficie shrink-0 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:overflow-y-auto"
        style={{ borderTop: 0, borderLeft: 0, borderBottom: 0 }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="rounded-lg bg-marca-600 px-2.5 py-1 text-sm font-bold text-white">cb</span>
            <span className="text-sm font-semibold tracking-tight">crmbas</span>
          </Link>
        </div>

        <div className="px-2 pb-6">
          <Navegacion rol={perfil.rol} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="superficie sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-3"
          style={{ borderTop: 0, borderRight: 0, borderLeft: 0 }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {perfil.nombre} {perfil.apellidos}
            </p>
            <p className="texto-suave truncate text-xs">
              {ETIQUETA_ROL[perfil.rol]} · {perfil.email}
            </p>
          </div>
          <BotonSalir />
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        <footer className="texto-suave px-6 py-6 text-xs">
          crmbas · Datos alojados en la Unión Europea (eu-west-3, París) ·{" "}
          <Link href="/privacidad" className="underline">Información de privacidad</Link> ·{" "}
          <Link href="/aviso-legal" className="underline">Aviso legal</Link>
        </footer>
      </div>
    </div>
  );
}
