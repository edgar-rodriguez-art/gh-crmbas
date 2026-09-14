import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Middleware de sesión y cabeceras de seguridad.
 *
 * Hace dos cosas en cada petición: refresca la cookie de sesión de Supabase
 * (que caduca cada hora) y aplica las cabeceras de protección del navegador
 * exigidas por el Esquema Nacional de Seguridad (mp.s.2) y recomendadas por
 * ISO/IEC 27001 A.8.9 para la configuración segura de los servicios.
 */

const RUTAS_PUBLICAS = ["/entrar", "/auth", "/api/n8n", "/aviso-legal", "/privacidad"];

function aplicarCabeceras(respuesta: NextResponse): NextResponse {
  const cabeceras = respuesta.headers;

  // Solo se cargan recursos del propio origen y se habla con Supabase por TLS.
  cabeceras.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  );

  cabeceras.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  cabeceras.set("X-Content-Type-Options", "nosniff");
  cabeceras.set("X-Frame-Options", "DENY");
  cabeceras.set("Referrer-Policy", "strict-origin-when-cross-origin");
  cabeceras.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  cabeceras.set("Cross-Origin-Opener-Policy", "same-origin");
  cabeceras.set("Cross-Origin-Resource-Policy", "same-origin");
  // Evita que un proxy o el navegador guarde páginas con datos personales.
  cabeceras.set("Cache-Control", "no-store, max-age=0");

  return respuesta;
}

export async function middleware(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return peticion.cookies.getAll();
        },
        setAll(cookiesNuevas: { name: string; value: string; options: CookieOptions }[]) {
          for (const { name, value } of cookiesNuevas) {
            peticion.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request: peticion });
          for (const { name, value, options } of cookiesNuevas) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const ruta = peticion.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));

  if (!user && !esPublica) {
    const destino = peticion.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.searchParams.set("siguiente", ruta);
    return aplicarCabeceras(NextResponse.redirect(destino));
  }

  if (user && ruta === "/entrar") {
    const destino = peticion.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return aplicarCabeceras(NextResponse.redirect(destino));
  }

  return aplicarCabeceras(respuesta);
}

export const config = {
  matcher: [
    // Todo salvo los recursos estáticos y el favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
