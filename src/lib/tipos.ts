/** Tipos del dominio, alineados con los tipos enumerados de PostgreSQL. */

export type RolUsuario = "admin" | "comercial" | "soporte" | "lectura";
export type TipoCliente = "empresa" | "autonomo" | "particular";
export type SegmentoCliente =
  | "pyme" | "gran_cuenta" | "educacion" | "administracion_publica" | "particular";
export type RegimenIva =
  | "general" | "recargo_equivalencia" | "exento" | "intracomunitario" | "inversion_sujeto_pasivo";
export type EstadoRegistro = "activo" | "inactivo" | "archivado";
export type CategoriaProducto =
  | "portatil" | "sobremesa" | "servidor" | "monitor" | "componente"
  | "periferico" | "red" | "almacenamiento" | "software" | "servicio";
export type EtapaOportunidad =
  | "calificacion" | "analisis" | "propuesta" | "negociacion" | "ganada" | "perdida";
export type OrigenOportunidad =
  | "web" | "telefono" | "email" | "referencia" | "feria" | "campana" | "partner" | "licitacion";
export type EstadoPresupuesto = "borrador" | "enviado" | "aceptado" | "rechazado" | "caducado";
export type TipoActividad = "llamada" | "email" | "reunion" | "visita" | "demo" | "nota";
export type TipoIncidencia = "averia" | "garantia" | "rma" | "consulta" | "instalacion" | "mantenimiento";
export type PrioridadIncidencia = "baja" | "media" | "alta" | "critica";
export type EstadoIncidencia = "abierta" | "en_curso" | "esperando_cliente" | "resuelta" | "cerrada";
export type BaseLegal =
  | "consentimiento" | "contrato" | "obligacion_legal"
  | "interes_vital" | "mision_publica" | "interes_legitimo";
export type FinalidadConsentimiento =
  | "comercial" | "newsletter" | "soporte" | "perfilado" | "cesion_terceros";
export type TipoSolicitudRgpd =
  | "acceso" | "rectificacion" | "supresion" | "limitacion" | "portabilidad" | "oposicion";
export type EstadoSolicitudRgpd = "recibida" | "en_tramite" | "completada" | "denegada";
export type PlantillaEmail =
  | "bienvenida_cliente" | "presupuesto_enviado" | "oportunidad_ganada"
  | "incidencia_abierta" | "incidencia_resuelta" | "aviso_sla"
  | "resumen_diario" | "solicitud_rgpd_recibida";
export type EstadoEmail = "pendiente" | "enviado" | "error" | "cancelado";

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  ultimo_acceso: string | null;
}

export interface Cuenta {
  id: string;
  tipo_cliente: TipoCliente;
  razon_social: string;
  nombre_comercial: string | null;
  nif: string;
  email: string | null;
  telefono: string | null;
  sitio_web: string | null;
  direccion: string | null;
  codigo_postal: string | null;
  municipio: string | null;
  provincia: string | null;
  pais: string;
  segmento: SegmentoCliente;
  regimen_iva: RegimenIva;
  iban: string | null;
  sector: string | null;
  propietario_id: string | null;
  estado: EstadoRegistro;
  base_legal_tratamiento: BaseLegal;
  notas: string | null;
  creado_en: string;
}

export interface Contacto {
  id: string;
  cuenta_id: string;
  nombre: string;
  apellidos: string;
  cargo: string | null;
  email: string | null;
  telefono: string | null;
  movil: string | null;
  es_principal: boolean;
  acepta_comunicaciones: boolean;
  estado: EstadoRegistro;
}

export interface Producto {
  id: string;
  sku: string;
  ean13: string | null;
  categoria: CategoriaProducto;
  marca: string;
  modelo: string;
  descripcion: string | null;
  precio_coste: number;
  precio_venta: number;
  tipo_iva: number;
  stock: number;
  stock_minimo: number;
  garantia_meses: number;
  raee_categoria: string | null;
  ecotasa: number;
  activo: boolean;
}

export interface Oportunidad {
  id: string;
  referencia: string;
  cuenta_id: string;
  contacto_id: string | null;
  titulo: string;
  descripcion: string | null;
  etapa: EtapaOportunidad;
  origen: OrigenOportunidad;
  importe_estimado: number;
  probabilidad: number;
  fecha_cierre_prevista: string | null;
  fecha_cierre_real: string | null;
  motivo_perdida: string | null;
  propietario_id: string | null;
  creado_en: string;
}

export interface Presupuesto {
  id: string;
  numero: string;
  serie: string;
  ejercicio: number;
  correlativo: number;
  cuenta_id: string;
  oportunidad_id: string | null;
  fecha_emision: string;
  fecha_validez: string;
  estado: EstadoPresupuesto;
  base_imponible: number;
  cuota_iva: number;
  cuota_recargo: number;
  total: number;
  moneda: string;
  condiciones: string | null;
  huella: string | null;
  huella_anterior: string | null;
}

export interface LineaPresupuesto {
  id: string;
  presupuesto_id: string;
  producto_id: string | null;
  orden: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  tipo_iva: number;
  importe: number;
}

export interface Actividad {
  id: string;
  tipo: TipoActividad;
  asunto: string;
  detalle: string | null;
  cuenta_id: string | null;
  oportunidad_id: string | null;
  usuario_id: string | null;
  fecha: string;
  duracion_min: number | null;
  resultado: string | null;
}

export interface Incidencia {
  id: string;
  referencia: string;
  cuenta_id: string;
  contacto_id: string | null;
  producto_id: string | null;
  numero_serie: string | null;
  tipo: TipoIncidencia;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  en_garantia: boolean;
  fecha_compra: string | null;
  descripcion: string;
  resolucion: string | null;
  sla_horas: number;
  fecha_apertura: string;
  fecha_limite_sla: string | null;
  fecha_cierre: string | null;
  asignado_a: string | null;
}

export interface SolicitudRgpd {
  id: string;
  referencia: string;
  tipo: TipoSolicitudRgpd;
  estado: EstadoSolicitudRgpd;
  solicitante_email: string;
  solicitante_nif: string | null;
  cuenta_id: string | null;
  descripcion: string;
  identidad_verificada: boolean;
  fecha_solicitud: string;
  fecha_limite: string;
  fecha_resolucion: string | null;
  resolucion: string | null;
}

export interface Consentimiento {
  id: string;
  cuenta_id: string | null;
  contacto_id: string | null;
  finalidad: FinalidadConsentimiento;
  base_legal: BaseLegal;
  otorgado: boolean;
  canal: string;
  texto_informado: string;
  fecha_otorgamiento: string;
  fecha_revocacion: string | null;
}

export interface Tratamiento {
  id: string;
  codigo: string;
  nombre: string;
  finalidad: string;
  base_legal: BaseLegal;
  categorias_interesados: string[];
  categorias_datos: string[];
  destinatarios: string[];
  transferencias_internacionales: string | null;
  plazo_conservacion: string;
  medidas_seguridad: string;
}

export interface RegistroAuditoria {
  id: number;
  tabla: string;
  operacion: "INSERT" | "UPDATE" | "DELETE";
  registro_id: string;
  usuario_email: string | null;
  ocurrido_en: string;
}

export interface NotificacionEmail {
  id: string;
  plantilla: PlantillaEmail;
  destinatario: string;
  remitente: string;
  asunto: string;
  estado: EstadoEmail;
  id_proveedor: string | null;
  intentos: number;
  error: string | null;
  solicitado_en: string;
  enviado_en: string | null;
}

export interface Kpis {
  cuentas_activas: number;
  contactos_activos: number;
  oportunidades_abiertas: number;
  embudo_importe: number;
  ganado_ejercicio: number;
  incidencias_abiertas: number;
  incidencias_sla_vencido: number;
  solicitudes_rgpd_pendientes: number;
}

export interface FilaEmbudo {
  etapa: EtapaOportunidad;
  operaciones: number;
  importe_total: number;
  importe_ponderado: number;
}
