"use client";

import { useFormStatus } from "react-dom";

import type { EstadoAccion } from "@/lib/acciones";

/** Botón de envío que se deshabilita mientras la acción está en vuelo. */
export function BotonEnviar({
  children = "Guardar",
  variante = "primario",
}: {
  children?: React.ReactNode;
  variante?: "primario" | "secundario";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={variante === "primario" ? "boton-primario" : "boton-secundario"}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}

/** Mensaje de resultado de una acción, anunciado a los lectores de pantalla. */
export function MensajeEstado({ estado }: { estado: EstadoAccion }) {
  if (!estado.error && !estado.exito) return null;

  const esError = Boolean(estado.error);

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-lg px-3 py-2 text-sm ${
        esError
          ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
          : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      }`}
    >
      {estado.error ?? estado.exito}
    </p>
  );
}

/** Campo de texto con etiqueta y texto de ayuda opcional. */
export function Campo({
  nombre,
  rotulo,
  tipo = "text",
  valor,
  requerido = false,
  ayuda,
  ...resto
}: {
  nombre: string;
  rotulo: string;
  tipo?: string;
  valor?: string | number | null;
  requerido?: boolean;
  ayuda?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="etiqueta-campo" htmlFor={nombre}>
        {rotulo}
        {requerido && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required={requerido}
        defaultValue={valor ?? ""}
        className="campo"
        aria-describedby={ayuda ? `${nombre}-ayuda` : undefined}
        {...resto}
      />
      {ayuda && (
        <p id={`${nombre}-ayuda`} className="texto-suave mt-1 text-xs">{ayuda}</p>
      )}
    </div>
  );
}

/** Desplegable a partir de una lista de pares valor/etiqueta. */
export function Seleccion({
  nombre,
  rotulo,
  opciones,
  valor,
  requerido = false,
  ayuda,
  vacio,
}: {
  nombre: string;
  rotulo: string;
  opciones: [string, string][];
  valor?: string | null;
  requerido?: boolean;
  ayuda?: string;
  vacio?: string;
}) {
  return (
    <div>
      <label className="etiqueta-campo" htmlFor={nombre}>
        {rotulo}
        {requerido && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={nombre}
        name={nombre}
        required={requerido}
        defaultValue={valor ?? ""}
        className="campo"
        aria-describedby={ayuda ? `${nombre}-ayuda` : undefined}
      >
        {vacio && <option value="">{vacio}</option>}
        {opciones.map(([v, etiqueta]) => (
          <option key={v} value={v}>{etiqueta}</option>
        ))}
      </select>
      {ayuda && (
        <p id={`${nombre}-ayuda`} className="texto-suave mt-1 text-xs">{ayuda}</p>
      )}
    </div>
  );
}

/** Área de texto multilínea. */
export function AreaTexto({
  nombre,
  rotulo,
  valor,
  filas = 3,
  requerido = false,
  ayuda,
}: {
  nombre: string;
  rotulo: string;
  valor?: string | null;
  filas?: number;
  requerido?: boolean;
  ayuda?: string;
}) {
  return (
    <div>
      <label className="etiqueta-campo" htmlFor={nombre}>
        {rotulo}
        {requerido && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={nombre}
        name={nombre}
        rows={filas}
        required={requerido}
        defaultValue={valor ?? ""}
        className="campo resize-y"
      />
      {ayuda && <p className="texto-suave mt-1 text-xs">{ayuda}</p>}
    </div>
  );
}

/** Casilla de verificación con su explicación al lado. */
export function Casilla({
  nombre,
  rotulo,
  marcada = false,
  ayuda,
}: {
  nombre: string;
  rotulo: string;
  marcada?: boolean;
  ayuda?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={nombre}
        name={nombre}
        type="checkbox"
        value="true"
        defaultChecked={marcada}
        className="mt-0.5 h-4 w-4 rounded accent-marca-600"
      />
      <div>
        <label htmlFor={nombre} className="text-sm">{rotulo}</label>
        {ayuda && <p className="texto-suave mt-0.5 text-xs">{ayuda}</p>}
      </div>
    </div>
  );
}
