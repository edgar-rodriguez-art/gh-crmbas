/** Formato de números, importes y fechas conforme a la convención de España. */

const LOCALE = "es-ES";
const ZONA = "Europe/Madrid";

const euros = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const fechaCorta = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: ZONA,
});

const fechaHora = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: ZONA,
});

export function importe(valor: number | string | null | undefined): string {
  return euros.format(Number(valor ?? 0));
}

export function fecha(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  return fechaCorta.format(typeof valor === "string" ? new Date(valor) : valor);
}

export function fechaConHora(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  return fechaHora.format(typeof valor === "string" ? new Date(valor) : valor);
}

export function porcentaje(valor: number | null | undefined): string {
  return `${Number(valor ?? 0).toLocaleString(LOCALE)} %`;
}

/** Diferencia legible hasta una fecha, útil para el margen de SLA. */
export function tiempoRestante(limite: string | null | undefined): string {
  if (!limite) return "—";
  const horas = (new Date(limite).getTime() - Date.now()) / 3_600_000;
  if (horas < 0) return `Vencido hace ${Math.abs(Math.round(horas))} h`;
  if (horas < 24) return `${Math.round(horas)} h restantes`;
  return `${Math.round(horas / 24)} días restantes`;
}

/** Presenta un teléfono español agrupando en bloques de tres cifras. */
export function telefono(valor: string | null | undefined): string {
  if (!valor) return "—";
  const limpio = valor.replace(/\s+/g, "");
  const nacional = limpio.replace(/^\+34/, "");
  if (!/^[0-9]{9}$/.test(nacional)) return valor;
  return `+34 ${nacional.slice(0, 3)} ${nacional.slice(3, 6)} ${nacional.slice(6)}`;
}
