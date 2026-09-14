import "server-only";

/**
 * Lectura de la configuración del entorno.
 *
 * Todas las credenciales se inyectan desde las variables de entorno del
 * proyecto de Vercel. El repositorio no contiene ningún secreto.
 */
function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Configúrala en Vercel → Settings → Environment Variables.`,
    );
  }
  return valor;
}

function opcional(nombre: string): string | undefined {
  return process.env[nombre] || undefined;
}

export const entorno = {
  get supabaseUrl() {
    return requerida("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return requerida("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  /**
   * Opcional a propósito: sin ella la aplicación funciona por completo salvo el
   * correo automatizado, que se desactiva de forma ordenada en lugar de romper
   * la operación de negocio que lo habría disparado.
   */
  get supabaseServiceRoleKey() {
    return opcional("SUPABASE_SERVICE_ROLE_KEY");
  },
  get n8nWebhookUrl() {
    return opcional("N8N_WEBHOOK_URL");
  },
  get n8nWebhookSecret() {
    return opcional("N8N_WEBHOOK_SECRET");
  },
  get crmWebhookSecret() {
    return opcional("CRM_WEBHOOK_SECRET");
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};
