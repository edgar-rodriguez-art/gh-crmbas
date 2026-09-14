import { z } from "zod";

import { codigoPostalValido, ibanValido, nifValido } from "@/lib/identificadores";

/** Esquemas de validación compartidos por los formularios y las acciones. */

/**
 * Campo de texto que puede quedarse vacío. Un formulario HTML envía la cadena
 * vacía, y la base de datos espera NULL: la normalización ocurre aquí, antes de
 * cualquier validación, para que `null` y `""` no sean dos casos distintos.
 */
const vacioANulo = (valor: unknown): unknown =>
  typeof valor === "string" && valor.trim() === "" ? null : (valor ?? null);

const textoOpcional = z.preprocess(vacioANulo, z.string().trim().nullable());

const emailOpcional = z.preprocess(
  vacioANulo,
  z.string().trim().email("El correo electrónico no tiene un formato válido.").nullable(),
);

export const esquemaCuenta = z.object({
  tipo_cliente: z.enum(["empresa", "autonomo", "particular"]),
  razon_social: z.string().trim().min(2, "Indica la razón social o el nombre completo."),
  nombre_comercial: textoOpcional,
  nif: z
    .string()
    .trim()
    .toUpperCase()
    .refine(nifValido, "El NIF, NIE o CIF no supera la letra de control."),
  email: emailOpcional,
  telefono: textoOpcional,
  sitio_web: textoOpcional,
  direccion: textoOpcional,
  codigo_postal: textoOpcional.refine(
    (v) => v === null || codigoPostalValido(v),
    "El código postal debe tener cinco cifras y corresponder a una provincia española.",
  ),
  municipio: textoOpcional,
  provincia: textoOpcional,
  segmento: z.enum(["pyme", "gran_cuenta", "educacion", "administracion_publica", "particular"]),
  regimen_iva: z.enum([
    "general", "recargo_equivalencia", "exento", "intracomunitario", "inversion_sujeto_pasivo",
  ]),
  iban: textoOpcional.refine(
    (v) => v === null || ibanValido(v),
    "El IBAN no supera los dígitos de control.",
  ),
  sector: textoOpcional,
  base_legal_tratamiento: z.enum([
    "consentimiento", "contrato", "obligacion_legal",
    "interes_vital", "mision_publica", "interes_legitimo",
  ]),
  notas: textoOpcional,
}).refine(
  (d) => d.regimen_iva !== "recargo_equivalencia" || d.tipo_cliente !== "empresa",
  {
    path: ["regimen_iva"],
    message: "El recargo de equivalencia solo se aplica a autónomos y particulares.",
  },
);

export const esquemaContacto = z.object({
  cuenta_id: z.string().uuid(),
  nombre: z.string().trim().min(2, "Indica el nombre."),
  apellidos: z.string().trim().default(""),
  cargo: textoOpcional,
  email: emailOpcional,
  telefono: textoOpcional,
  movil: textoOpcional,
  es_principal: z.coerce.boolean().default(false),
  acepta_comunicaciones: z.coerce.boolean().default(false),
});

export const esquemaOportunidad = z.object({
  cuenta_id: z.string().uuid("Selecciona un cliente."),
  contacto_id: z.string().uuid().nullable().catch(null),
  titulo: z.string().trim().min(3, "Describe la oportunidad."),
  descripcion: textoOpcional,
  etapa: z.enum(["calificacion", "analisis", "propuesta", "negociacion", "ganada", "perdida"]),
  origen: z.enum([
    "web", "telefono", "email", "referencia", "feria", "campana", "partner", "licitacion",
  ]),
  importe_estimado: z.coerce.number().min(0, "El importe no puede ser negativo."),
  probabilidad: z.coerce.number().int().min(0).max(100),
  fecha_cierre_prevista: textoOpcional,
});

export const esquemaIncidencia = z.object({
  cuenta_id: z.string().uuid("Selecciona un cliente."),
  contacto_id: z.string().uuid().nullable().catch(null),
  producto_id: z.string().uuid().nullable().catch(null),
  numero_serie: textoOpcional,
  tipo: z.enum(["averia", "garantia", "rma", "consulta", "instalacion", "mantenimiento"]),
  prioridad: z.enum(["baja", "media", "alta", "critica"]),
  descripcion: z.string().trim().min(10, "Describe la incidencia con algo más de detalle."),
  sla_horas: z.coerce.number().int().positive("El SLA debe ser de al menos una hora."),
  en_garantia: z.coerce.boolean().default(false),
});

export const esquemaActividad = z.object({
  tipo: z.enum(["llamada", "email", "reunion", "visita", "demo", "nota"]),
  asunto: z.string().trim().min(3, "Indica el asunto."),
  detalle: textoOpcional,
  cuenta_id: z.string().uuid().nullable().catch(null),
  oportunidad_id: z.string().uuid().nullable().catch(null),
  duracion_min: z.coerce.number().int().min(0).nullable().catch(null),
  resultado: textoOpcional,
});

export const esquemaSolicitudRgpd = z.object({
  tipo: z.enum(["acceso", "rectificacion", "supresion", "limitacion", "portabilidad", "oposicion"]),
  solicitante_email: z.string().trim().email("Indica un correo electrónico válido."),
  solicitante_nif: textoOpcional.refine(
    (v) => v === null || nifValido(v),
    "El documento de identidad no supera la letra de control.",
  ),
  cuenta_id: z.string().uuid().nullable().catch(null),
  descripcion: z.string().trim().min(10, "Describe la solicitud recibida."),
  identidad_verificada: z.coerce.boolean().default(false),
});

/** Convierte un FormData en el objeto plano que esperan los esquemas. */
export function desdeFormulario(datos: FormData): Record<string, unknown> {
  const objeto: Record<string, unknown> = {};
  for (const [clave, valor] of datos.entries()) {
    if (typeof valor === "string") {
      objeto[clave] = valor === "" ? null : valor;
    }
  }
  return objeto;
}

/** Primer mensaje de error de un resultado de zod, listo para mostrar. */
export function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Los datos enviados no son válidos.";
}
