"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { crearClienteNavegador } from "@/lib/supabase/cliente";

/** Formulario de acceso contra Supabase Auth. */
export function FormularioAcceso() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  async function acceder(datos: FormData) {
    setError(null);
    const supabase = crearClienteNavegador();

    const { error: fallo } = await supabase.auth.signInWithPassword({
      email: String(datos.get("email") ?? "").trim(),
      password: String(datos.get("password") ?? ""),
    });

    if (fallo) {
      // No se distingue entre usuario inexistente y contraseña incorrecta:
      // revelarlo permitiría enumerar las cuentas del sistema.
      setError("Las credenciales no son correctas o la cuenta está desactivada.");
      return;
    }

    const siguiente = parametros.get("siguiente") ?? "/";
    iniciarTransicion(() => {
      router.replace(siguiente.startsWith("/") ? siguiente : "/");
      router.refresh();
    });
  }

  return (
    <form action={acceder} className="space-y-4">
      <div>
        <label className="etiqueta-campo" htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="nombre@empresa.es"
          className="campo"
        />
      </div>

      <div>
        <label className="etiqueta-campo" htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
          className="campo"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/12 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={pendiente} className="boton-primario w-full">
        {pendiente ? "Accediendo…" : "Acceder"}
      </button>
    </form>
  );
}
