import "server-only";

import { createClient } from "@supabase/supabase-js";

import { entorno } from "@/lib/entorno";

/**
 * Cliente con clave de servicio. Ignora RLS, así que su uso queda restringido a
 * dos casos: la gestión de usuarios por parte de administración y la escritura
 * de la cola de correo desde los puntos de entrada del servidor.
 *
 * Nunca debe importarse desde un componente de cliente.
 */
export function crearClienteAdmin() {
  const clave = entorno.supabaseServiceRoleKey;
  if (!clave) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. Configúrala en Vercel para habilitar el correo automatizado.",
    );
  }

  return createClient(entorno.supabaseUrl, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Indica si la clave de servicio está disponible en este entorno. */
export function hayClaveDeServicio(): boolean {
  return Boolean(entorno.supabaseServiceRoleKey);
}
