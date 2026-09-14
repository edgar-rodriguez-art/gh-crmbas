import { Suspense } from "react";
import Link from "next/link";

import { FormularioAcceso } from "./formulario-acceso";

export const metadata = { title: "Acceder" };

export default function PaginaAcceso() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-lg bg-marca-600 px-3 py-1.5 text-sm font-semibold text-white">
            crmbas
          </p>
          <h1 className="mt-5 text-lg font-semibold tracking-tight">Acceso al CRM</h1>
          <p className="texto-suave mt-1 text-sm">
            Gestión comercial de equipamiento informático
          </p>
        </div>

        <div className="superficie rounded-xl p-6">
          <Suspense fallback={<p className="texto-suave text-sm">Cargando…</p>}>
            <FormularioAcceso />
          </Suspense>
        </div>

        <p className="texto-suave mt-6 text-center text-xs leading-relaxed">
          El acceso queda registrado en la traza de auditoría.{" "}
          <Link href="/privacidad" className="underline">
            Información sobre el tratamiento de datos
          </Link>
        </p>
      </div>
    </main>
  );
}
