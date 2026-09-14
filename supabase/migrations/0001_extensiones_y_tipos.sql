-- =============================================================================
-- crmbas · 0001 · Extensiones, dominios y tipos enumerados
-- CRM para distribución y servicios informáticos · Mercado: España
-- =============================================================================

-- gen_random_uuid() y sha256() forman parte del núcleo de PostgreSQL 13+,
-- por lo que no se requiere ninguna extensión adicional.

-- -----------------------------------------------------------------------------
-- Tipos enumerados del dominio
-- -----------------------------------------------------------------------------

create type rol_usuario as enum ('admin', 'comercial', 'soporte', 'lectura');

create type tipo_cliente as enum ('empresa', 'autonomo', 'particular');

create type segmento_cliente as enum (
  'pyme', 'gran_cuenta', 'educacion', 'administracion_publica', 'particular'
);

-- Regímenes de IVA aplicables en el territorio de aplicación del impuesto (TAI).
create type regimen_iva as enum (
  'general',                 -- Régimen general, 21 % en material informático
  'recargo_equivalencia',    -- Minoristas personas físicas (art. 148 LIVA)
  'exento',                  -- Operación exenta (art. 20 LIVA)
  'intracomunitario',        -- Entrega intracomunitaria exenta (art. 25 LIVA)
  'inversion_sujeto_pasivo'  -- ISP en portátiles/consolas > 10.000 € (art. 84.Uno.2.g LIVA)
);

create type estado_registro as enum ('activo', 'inactivo', 'archivado');

create type categoria_producto as enum (
  'portatil', 'sobremesa', 'servidor', 'monitor', 'componente',
  'periferico', 'red', 'almacenamiento', 'software', 'servicio'
);

create type etapa_oportunidad as enum (
  'calificacion', 'analisis', 'propuesta', 'negociacion', 'ganada', 'perdida'
);

create type origen_oportunidad as enum (
  'web', 'telefono', 'email', 'referencia', 'feria', 'campana', 'partner', 'licitacion'
);

create type estado_presupuesto as enum (
  'borrador', 'enviado', 'aceptado', 'rechazado', 'caducado'
);

create type tipo_actividad as enum (
  'llamada', 'email', 'reunion', 'visita', 'demo', 'nota'
);

create type tipo_incidencia as enum (
  'averia', 'garantia', 'rma', 'consulta', 'instalacion', 'mantenimiento'
);

create type prioridad_incidencia as enum ('baja', 'media', 'alta', 'critica');

create type estado_incidencia as enum (
  'abierta', 'en_curso', 'esperando_cliente', 'resuelta', 'cerrada'
);

-- RGPD art. 6.1: bases jurídicas del tratamiento.
create type base_legal as enum (
  'consentimiento',    -- art. 6.1.a
  'contrato',          -- art. 6.1.b
  'obligacion_legal',  -- art. 6.1.c
  'interes_vital',     -- art. 6.1.d
  'mision_publica',    -- art. 6.1.e
  'interes_legitimo'   -- art. 6.1.f
);

create type finalidad_consentimiento as enum (
  'comercial', 'newsletter', 'soporte', 'perfilado', 'cesion_terceros'
);

-- RGPD arts. 15-22: derechos de las personas interesadas.
create type tipo_solicitud_rgpd as enum (
  'acceso',         -- art. 15
  'rectificacion',  -- art. 16
  'supresion',      -- art. 17
  'limitacion',     -- art. 18
  'portabilidad',   -- art. 20
  'oposicion'       -- art. 21
);

create type estado_solicitud_rgpd as enum (
  'recibida', 'en_tramite', 'completada', 'denegada'
);

create type plantilla_email as enum (
  'bienvenida_cliente',
  'presupuesto_enviado',
  'oportunidad_ganada',
  'incidencia_abierta',
  'incidencia_resuelta',
  'aviso_sla',
  'resumen_diario',
  'solicitud_rgpd_recibida'
);

create type estado_email as enum ('pendiente', 'enviado', 'error', 'cancelado');

create type operacion_auditada as enum ('INSERT', 'UPDATE', 'DELETE');
