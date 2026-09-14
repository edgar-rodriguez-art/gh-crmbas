import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Firma y verificación HMAC-SHA256 de los mensajes intercambiados con n8n.
 *
 * El mensaje firmado incluye la marca temporal, de modo que una petición
 * capturada no puede reproducirse indefinidamente (defensa frente a repetición).
 */

export const CABECERA_FIRMA = "x-crmbas-firma";
export const CABECERA_MARCA_TEMPORAL = "x-crmbas-marca-temporal";

/** Ventana admitida entre la firma y la recepción, en segundos. */
const TOLERANCIA_SEGUNDOS = 300;

export function firmar(cuerpo: string, marcaTemporal: string, secreto: string): string {
  return createHmac("sha256", secreto)
    .update(`${marcaTemporal}.${cuerpo}`)
    .digest("hex");
}

/** Comparación en tiempo constante: no revela en qué carácter difieren. */
export function igualSeguro(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export type ResultadoVerificacion =
  | { valido: true }
  | { valido: false; motivo: string };

export function verificarFirma(
  cuerpo: string,
  firma: string | null,
  marcaTemporal: string | null,
  secreto: string | undefined,
): ResultadoVerificacion {
  if (!secreto) {
    return { valido: false, motivo: "El servidor no tiene configurado el secreto compartido." };
  }
  if (!firma || !marcaTemporal) {
    return { valido: false, motivo: "Faltan las cabeceras de firma." };
  }

  const emitida = Number(marcaTemporal);
  if (!Number.isFinite(emitida)) {
    return { valido: false, motivo: "La marca temporal no es numérica." };
  }

  const desfase = Math.abs(Math.floor(Date.now() / 1000) - emitida);
  if (desfase > TOLERANCIA_SEGUNDOS) {
    return { valido: false, motivo: "La marca temporal está fuera de la ventana admitida." };
  }

  if (!igualSeguro(firma, firmar(cuerpo, marcaTemporal, secreto))) {
    return { valido: false, motivo: "La firma no coincide." };
  }

  return { valido: true };
}

/**
 * Comprueba una cabecera `Authorization: Bearer <secreto>`.
 *
 * Es el mecanismo que usa n8n para autenticarse ante crmbas. La firma HMAC
 * exige calcular un resumen en cada petición, algo que n8n Cloud no puede hacer
 * de forma fiable dentro de un flujo; en cambio, guarda el secreto en una
 * credencial cifrada y lo envía como cabecera, que nunca queda escrito en el
 * JSON del flujo. El secreto viaja siempre sobre TLS y se compara en tiempo
 * constante.
 */
export function verificarPortador(
  cabecera: string | null,
  secreto: string | undefined,
): boolean {
  if (!secreto || !cabecera) return false;

  const partes = cabecera.split(" ");
  if (partes.length !== 2 || partes[0].toLowerCase() !== "bearer") return false;

  return igualSeguro(partes[1], secreto);
}
