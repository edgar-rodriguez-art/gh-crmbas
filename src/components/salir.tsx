"use client";

import { useRouter } from "next/navigation";

import { crearClienteNavegador } from "@/lib/supabase/cliente";

export function BotonSalir() {
  const router = useRouter();

  async function salir() {
    await crearClienteNavegador().auth.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <button type="button" onClick={salir} className="boton-secundario text-xs">
      Cerrar sesión
    </button>
  );
}
