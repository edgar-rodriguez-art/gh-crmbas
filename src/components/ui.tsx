import Link from "next/link";
import type { ReactNode } from "react";

/** Piezas visuales compartidas por todas las pantallas. */

export function Tarjeta({
  titulo,
  descripcion,
  acciones,
  children,
  sinRelleno = false,
}: {
  titulo?: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
  sinRelleno?: boolean;
}) {
  return (
    <section className="superficie overflow-hidden rounded-xl">
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid var(--borde)" }}>
          <div>
            {titulo && <h2 className="text-sm font-semibold">{titulo}</h2>}
            {descripcion && <p className="texto-suave mt-0.5 text-xs">{descripcion}</p>}
          </div>
          {acciones && <div className="flex items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className={sinRelleno ? "" : "p-5"}>{children}</div>
    </section>
  );
}

const TONOS = {
  neutro: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  azul: "bg-marca-500/12 text-marca-700 dark:text-marca-300",
  verde: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  ambar: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  rojo: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  violeta: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
} as const;

export type Tono = keyof typeof TONOS;

export function Etiqueta({ children, tono = "neutro" }: { children: ReactNode; tono?: Tono }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TONOS[tono]}`}>
      {children}
    </span>
  );
}

export function Kpi({
  rotulo,
  valor,
  detalle,
  tono = "neutro",
}: {
  rotulo: string;
  valor: string;
  detalle?: string;
  tono?: Tono;
}) {
  return (
    <div className="superficie rounded-xl p-5">
      <p className="texto-suave text-xs font-medium uppercase tracking-wide">{rotulo}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{valor}</p>
      {detalle && (
        <p className="mt-2">
          <Etiqueta tono={tono}>{detalle}</Etiqueta>
        </p>
      )}
    </div>
  );
}

export function Encabezado({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="texto-suave mt-1 text-sm">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

export function SinDatos({ mensaje, accion }: { mensaje: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="texto-suave text-sm">{mensaje}</p>
      {accion}
    </div>
  );
}

export function Aviso({
  tono = "azul",
  titulo,
  children,
}: {
  tono?: Tono;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${TONOS[tono]}`}>
      <p className="font-semibold">{titulo}</p>
      {children && <div className="mt-1 opacity-90">{children}</div>}
    </div>
  );
}

export function Dato({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="texto-suave text-xs font-medium uppercase tracking-wide">{rotulo}</dt>
      <dd className="mt-1 text-sm">{children ?? "—"}</dd>
    </div>
  );
}

export function EnlaceFila({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-marca-600 hover:underline dark:text-marca-300">
      {children}
    </Link>
  );
}
