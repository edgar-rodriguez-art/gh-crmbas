/**
 * Validación de identificadores oficiales españoles en el cliente.
 *
 * Replica exactamente las funciones de la base de datos (migración 0002) para
 * poder avisar en el formulario antes de enviar. La base de datos sigue siendo
 * la autoridad: estas comprobaciones son de comodidad, nunca de seguridad.
 */

const LETRAS_NIF = "TRWAGMYFPDXBNJZSQVHLCKE";
const LETRAS_CONTROL_CIF = "JABCDEFGHI";

function limpiar(valor: string): string {
  return valor.toUpperCase().replace(/[\s-]/g, "");
}

/** NIF de persona física y NIE (iniciales X, Y, Z equivalentes a 0, 1 y 2). */
export function nifPersonaValido(valor: string): boolean {
  const doc = limpiar(valor);
  if (!/^[0-9XYZ][0-9]{7}[A-Z]$/.test(doc)) return false;

  const inicial = doc[0];
  const cuerpo =
    (inicial === "X" ? "0" : inicial === "Y" ? "1" : inicial === "Z" ? "2" : inicial) +
    doc.slice(1, 8);

  return doc[8] === LETRAS_NIF[Number(cuerpo) % 23];
}

/** NIF de persona jurídica (antiguo CIF). */
export function nifEntidadValido(valor: string): boolean {
  const doc = limpiar(valor);
  if (!/^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/.test(doc)) return false;

  const clave = doc[0];
  const digitos = doc.slice(1, 8);
  let suma = 0;

  for (let i = 0; i < 7; i += 1) {
    const cifra = Number(digitos[i]);
    if (i % 2 === 0) {
      // Posiciones impares (1.ª, 3.ª, 5.ª, 7.ª): se duplican y se suman sus cifras.
      const doble = cifra * 2;
      suma += Math.floor(doble / 10) + (doble % 10);
    } else {
      suma += cifra;
    }
  }

  const control = (10 - (suma % 10)) % 10;
  const ultimo = doc[8];

  if ("ABEH".includes(clave)) return ultimo === String(control);
  if ("KPQRSNW".includes(clave)) return ultimo === LETRAS_CONTROL_CIF[control];
  return ultimo === String(control) || ultimo === LETRAS_CONTROL_CIF[control];
}

export function nifValido(valor: string): boolean {
  return nifPersonaValido(valor) || nifEntidadValido(valor);
}

/** IBAN según los dígitos de control mod-97 de la norma ISO 13616. */
export function ibanValido(valor: string): boolean {
  const iban = limpiar(valor);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false;

  const reordenado = iban.slice(4) + iban.slice(0, 4);
  const numerico = reordenado.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));

  let resto = 0;
  for (const cifra of numerico) {
    resto = (resto * 10 + Number(cifra)) % 97;
  }
  return resto === 1;
}

/** Código postal: cinco cifras cuyo prefijo es una provincia del INE. */
export function codigoPostalValido(valor: string): boolean {
  if (!/^[0-9]{5}$/.test(valor)) return false;
  const provincia = Number(valor.slice(0, 2));
  return provincia >= 1 && provincia <= 52;
}
