import type {
  CategoriaProducto, EstadoIncidencia, EstadoPresupuesto, EstadoRegistro,
  EstadoSolicitudRgpd, EtapaOportunidad, BaseLegal, OrigenOportunidad,
  PrioridadIncidencia, RegimenIva, RolUsuario, SegmentoCliente,
  TipoActividad, TipoCliente, TipoIncidencia, TipoSolicitudRgpd,
  FinalidadConsentimiento, EstadoEmail, PlantillaEmail,
} from "@/lib/tipos";

/** Etiquetas visibles para cada valor de los tipos enumerados. */

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  admin: "Administración",
  comercial: "Comercial",
  soporte: "Soporte técnico",
  lectura: "Solo lectura",
};

export const ETIQUETA_TIPO_CLIENTE: Record<TipoCliente, string> = {
  empresa: "Empresa",
  autonomo: "Autónomo",
  particular: "Particular",
};

export const ETIQUETA_SEGMENTO: Record<SegmentoCliente, string> = {
  pyme: "Pyme",
  gran_cuenta: "Gran cuenta",
  educacion: "Educación",
  administracion_publica: "Administración pública",
  particular: "Particular",
};

export const ETIQUETA_REGIMEN_IVA: Record<RegimenIva, string> = {
  general: "Régimen general (21 %)",
  recargo_equivalencia: "Recargo de equivalencia",
  exento: "Exento",
  intracomunitario: "Entrega intracomunitaria",
  inversion_sujeto_pasivo: "Inversión del sujeto pasivo",
};

export const ETIQUETA_ESTADO: Record<EstadoRegistro, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  archivado: "Archivado",
};

export const ETIQUETA_CATEGORIA: Record<CategoriaProducto, string> = {
  portatil: "Portátil",
  sobremesa: "Sobremesa",
  servidor: "Servidor",
  monitor: "Monitor",
  componente: "Componente",
  periferico: "Periférico",
  red: "Redes",
  almacenamiento: "Almacenamiento",
  software: "Software",
  servicio: "Servicio",
};

export const ETAPAS: EtapaOportunidad[] = [
  "calificacion", "analisis", "propuesta", "negociacion", "ganada", "perdida",
];

export const ETIQUETA_ETAPA: Record<EtapaOportunidad, string> = {
  calificacion: "Calificación",
  analisis: "Análisis de necesidades",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganada: "Ganada",
  perdida: "Perdida",
};

/** Probabilidad orientativa que se propone al mover una oportunidad de etapa. */
export const PROBABILIDAD_POR_ETAPA: Record<EtapaOportunidad, number> = {
  calificacion: 10,
  analisis: 30,
  propuesta: 60,
  negociacion: 80,
  ganada: 100,
  perdida: 0,
};

export const ETIQUETA_ORIGEN: Record<OrigenOportunidad, string> = {
  web: "Web",
  telefono: "Teléfono",
  email: "Correo electrónico",
  referencia: "Referencia",
  feria: "Feria",
  campana: "Campaña",
  partner: "Partner",
  licitacion: "Licitación pública",
};

export const ETIQUETA_ESTADO_PRESUPUESTO: Record<EstadoPresupuesto, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
  caducado: "Caducado",
};

export const ETIQUETA_TIPO_ACTIVIDAD: Record<TipoActividad, string> = {
  llamada: "Llamada",
  email: "Correo",
  reunion: "Reunión",
  visita: "Visita",
  demo: "Demostración",
  nota: "Nota",
};

export const ETIQUETA_TIPO_INCIDENCIA: Record<TipoIncidencia, string> = {
  averia: "Avería",
  garantia: "Garantía",
  rma: "RMA",
  consulta: "Consulta",
  instalacion: "Instalación",
  mantenimiento: "Mantenimiento",
};

export const ETIQUETA_PRIORIDAD: Record<PrioridadIncidencia, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const ETIQUETA_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = {
  abierta: "Abierta",
  en_curso: "En curso",
  esperando_cliente: "Esperando al cliente",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

export const ETIQUETA_BASE_LEGAL: Record<BaseLegal, string> = {
  consentimiento: "Consentimiento (art. 6.1.a)",
  contrato: "Ejecución de contrato (art. 6.1.b)",
  obligacion_legal: "Obligación legal (art. 6.1.c)",
  interes_vital: "Interés vital (art. 6.1.d)",
  mision_publica: "Misión de interés público (art. 6.1.e)",
  interes_legitimo: "Interés legítimo (art. 6.1.f)",
};

export const ETIQUETA_FINALIDAD: Record<FinalidadConsentimiento, string> = {
  comercial: "Comunicaciones comerciales",
  newsletter: "Boletín de novedades",
  soporte: "Soporte y postventa",
  perfilado: "Elaboración de perfiles",
  cesion_terceros: "Cesión a terceros",
};

export const ETIQUETA_TIPO_RGPD: Record<TipoSolicitudRgpd, string> = {
  acceso: "Acceso (art. 15)",
  rectificacion: "Rectificación (art. 16)",
  supresion: "Supresión (art. 17)",
  limitacion: "Limitación (art. 18)",
  portabilidad: "Portabilidad (art. 20)",
  oposicion: "Oposición (art. 21)",
};

export const ETIQUETA_ESTADO_RGPD: Record<EstadoSolicitudRgpd, string> = {
  recibida: "Recibida",
  en_tramite: "En trámite",
  completada: "Completada",
  denegada: "Denegada",
};

export const ETIQUETA_ESTADO_EMAIL: Record<EstadoEmail, string> = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  error: "Error",
  cancelado: "Cancelado",
};

export const ETIQUETA_PLANTILLA: Record<PlantillaEmail, string> = {
  bienvenida_cliente: "Bienvenida a cliente",
  presupuesto_enviado: "Presupuesto enviado",
  oportunidad_ganada: "Oportunidad ganada",
  incidencia_abierta: "Incidencia abierta",
  incidencia_resuelta: "Incidencia resuelta",
  aviso_sla: "Aviso de SLA",
  resumen_diario: "Resumen diario",
  solicitud_rgpd_recibida: "Solicitud RGPD recibida",
};

/** Provincias del INE, usadas en los formularios de dirección. */
export const PROVINCIAS = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
  "Castellón", "Ceuta", "Ciudad Real", "Córdoba", "Cuenca", "Girona",
  "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Jaén",
  "La Coruña", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid",
  "Málaga", "Melilla", "Murcia", "Navarra", "Ourense", "Palencia",
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla",
  "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
  "Vizcaya", "Zamora", "Zaragoza",
] as const;
