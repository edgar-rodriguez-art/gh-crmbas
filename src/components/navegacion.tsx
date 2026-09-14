"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { RolUsuario } from "@/lib/tipos";

interface Entrada {
  href: string;
  rotulo: string;
  icono: string;
  roles?: RolUsuario[];
}

/** Rutas del menú lateral, agrupadas por bloque funcional. */
const BLOQUES: { titulo: string; entradas: Entrada[] }[] = [
  {
    titulo: "Actividad",
    entradas: [
      { href: "/", rotulo: "Inicio", icono: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" },
      { href: "/embudo", rotulo: "Embudo", icono: "M3 5h18M6 12h12M10 19h4" },
    ],
  },
  {
    titulo: "Comercial",
    entradas: [
      { href: "/clientes", rotulo: "Clientes", icono: "M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
      { href: "/oportunidades", rotulo: "Oportunidades", icono: "M3 17l6-6 4 4 8-8M15 7h6v6" },
      { href: "/presupuestos", rotulo: "Presupuestos", icono: "M7 3h10l3 3v15H4V6l3-3ZM8 11h8M8 15h5" },
      { href: "/productos", rotulo: "Catálogo", icono: "M4 7l8-4 8 4v10l-8 4-8-4V7ZM4 7l8 4 8-4M12 11v10" },
    ],
  },
  {
    titulo: "Servicio",
    entradas: [
      { href: "/incidencias", rotulo: "Incidencias y RMA", icono: "M12 9v4m0 4h.01M10.3 3.9 2.6 17.1A1.6 1.6 0 0 0 4 19.5h16a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" },
    ],
  },
  {
    titulo: "Cumplimiento",
    entradas: [
      { href: "/cumplimiento", rotulo: "Protección de datos", icono: "M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6l8-3Z" },
      { href: "/auditoria", rotulo: "Auditoría", icono: "M4 4h16v4H4zM4 12h16v8H4zM8 16h8", roles: ["admin"] },
      { href: "/correo", rotulo: "Correo automatizado", icono: "M3 6h18v12H3zM3 7l9 6 9-6" },
    ],
  },
  {
    titulo: "Administración",
    entradas: [
      { href: "/usuarios", rotulo: "Usuarios", icono: "M17 19a4 4 0 0 0-8 0M13 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 13a2.5 2.5 0 1 0 0-5", roles: ["admin"] },
      { href: "/ajustes", rotulo: "Ajustes", icono: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 12h2m12 0h2M12 4v2m0 12v2", roles: ["admin"] },
    ],
  },
];

export function Navegacion({ rol }: { rol: RolUsuario }) {
  const ruta = usePathname();

  return (
    <nav className="space-y-6" aria-label="Secciones del CRM">
      {BLOQUES.map((bloque) => {
        const visibles = bloque.entradas.filter((e) => !e.roles || e.roles.includes(rol));
        if (visibles.length === 0) return null;

        return (
          <div key={bloque.titulo}>
            <p className="texto-suave mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider">
              {bloque.titulo}
            </p>
            <ul className="space-y-0.5">
              {visibles.map((entrada) => {
                const activa =
                  entrada.href === "/" ? ruta === "/" : ruta.startsWith(entrada.href);

                return (
                  <li key={entrada.href}>
                    <Link
                      href={entrada.href}
                      aria-current={activa ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                        activa
                          ? "bg-marca-600 font-medium text-white"
                          : "hover:bg-marca-500/10"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none"
                           stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                           strokeLinejoin="round" aria-hidden="true">
                        <path d={entrada.icono} />
                      </svg>
                      {entrada.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
