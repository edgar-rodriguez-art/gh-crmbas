import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { entorno } from "@/lib/entorno";

/**
 * Cliente de Supabase ligado a la sesión del usuario.
 *
 * Usa siempre la clave pública: cada consulta viaja con el JWT de la persona
 * autenticada, de modo que las políticas RLS de la base de datos son quienes
 * deciden qué filas se devuelven.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(entorno.supabaseUrl, entorno.supabaseAnonKey, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesNuevas: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacen.set(name, value, options);
          }
        } catch {
          // Los componentes de servidor no pueden escribir cookies; el refresco
          // de sesión lo realiza el middleware.
        }
      },
    },
  });
}
