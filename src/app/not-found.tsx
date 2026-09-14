import Link from "next/link";

export const metadata = { title: "Página no encontrada" };

export default function NoEncontrado() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="superficie max-w-md rounded-xl p-8 text-center">
        <h1 className="text-lg font-semibold">No hemos encontrado esta página</h1>
        <p className="texto-suave mt-2 text-sm">
          Puede que el registro se haya archivado o que la dirección sea incorrecta.
        </p>
        <Link href="/" className="boton-primario mt-6">Volver al inicio</Link>
      </div>
    </main>
  );
}
