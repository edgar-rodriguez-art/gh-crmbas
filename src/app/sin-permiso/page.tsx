import Link from "next/link";

export const metadata = { title: "Sin permiso" };

export default function PaginaSinPermiso() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="superficie max-w-md rounded-xl p-8 text-center">
        <h1 className="text-lg font-semibold">No tienes permiso para esta pantalla</h1>
        <p className="texto-suave mt-2 text-sm">
          Tu rol no incluye el acceso a esta sección. Si crees que se trata de un
          error, ponte en contacto con la persona que administra el CRM.
        </p>
        <Link href="/" className="boton-primario mt-6">Volver al inicio</Link>
      </div>
    </main>
  );
}
