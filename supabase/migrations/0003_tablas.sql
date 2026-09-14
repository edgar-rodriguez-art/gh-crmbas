-- =============================================================================
-- crmbas · 0003 · Tablas del modelo de datos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- perfiles — extiende auth.users con el rol funcional dentro del CRM.
-- La contraseña, el segundo factor y la sesión los gestiona Supabase Auth.
-- -----------------------------------------------------------------------------
create table public.perfiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text        not null,
  nombre          text        not null,
  apellidos       text        not null default '',
  telefono        text,
  rol             rol_usuario not null default 'lectura',
  activo          boolean     not null default true,
  ultimo_acceso   timestamptz,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  constraint perfiles_nombre_no_vacio check (length(trim(nombre)) > 0)
);

create unique index perfiles_email_unico on public.perfiles (lower(email));

comment on table public.perfiles is
  'Usuarios del CRM. El rol determina el alcance de las políticas RLS.';

-- -----------------------------------------------------------------------------
-- cuentas — clientes y clientes potenciales (empresas, autónomos, particulares).
-- -----------------------------------------------------------------------------
create table public.cuentas (
  id                      uuid primary key default gen_random_uuid(),
  tipo_cliente            tipo_cliente     not null default 'empresa',
  razon_social            text             not null,
  nombre_comercial        text,
  nif                     text             not null,
  email                   text,
  telefono                text,
  sitio_web               text,
  direccion               text,
  codigo_postal           text,
  municipio               text,
  provincia               text,
  pais                    char(2)          not null default 'ES',
  segmento                segmento_cliente not null default 'pyme',
  regimen_iva             regimen_iva      not null default 'general',
  iban                    text,
  sector                  text,
  propietario_id          uuid             references public.perfiles (id) on delete set null,
  estado                  estado_registro  not null default 'activo',
  base_legal_tratamiento  base_legal       not null default 'contrato',
  fecha_ultima_actividad  timestamptz,
  notas                   text,
  creado_por              uuid             references public.perfiles (id) on delete set null,
  creado_en               timestamptz      not null default now(),
  actualizado_en          timestamptz      not null default now(),

  constraint cuentas_razon_social_no_vacia check (length(trim(razon_social)) > 0),
  constraint cuentas_nif_valido            check (public.es_nif_valido(nif)),
  constraint cuentas_cp_valido             check (codigo_postal is null
                                                  or pais <> 'ES'
                                                  or public.es_codigo_postal_valido(codigo_postal)),
  constraint cuentas_iban_valido           check (iban is null or public.es_iban_valido(iban)),
  constraint cuentas_pais_iso              check (pais ~ '^[A-Z]{2}$'),
  -- El recargo de equivalencia solo aplica a comerciantes minoristas personas
  -- físicas (art. 148 y 149 de la Ley 37/1992 del IVA).
  constraint cuentas_recargo_solo_personas_fisicas
    check (regimen_iva <> 'recargo_equivalencia'
           or tipo_cliente in ('autonomo', 'particular'))
);

create unique index cuentas_nif_unico on public.cuentas (upper(nif));

create index cuentas_propietario_idx  on public.cuentas (propietario_id);
create index cuentas_estado_idx       on public.cuentas (estado);
create index cuentas_busqueda_idx     on public.cuentas
  using gin (to_tsvector('spanish', razon_social || ' ' || coalesce(nombre_comercial, '') || ' ' || nif));

comment on table public.cuentas is
  'Clientes del CRM. El NIF se valida con el algoritmo oficial de la AEAT.';

-- -----------------------------------------------------------------------------
-- contactos — personas físicas vinculadas a una cuenta.
-- -----------------------------------------------------------------------------
create table public.contactos (
  id                       uuid primary key default gen_random_uuid(),
  cuenta_id                uuid        not null references public.cuentas (id) on delete cascade,
  nombre                   text        not null,
  apellidos                text        not null default '',
  cargo                    text,
  email                    text,
  telefono                 text,
  movil                    text,
  es_principal             boolean     not null default false,
  -- Artículo 21 de la Ley 34/2002 (LSSI-CE): las comunicaciones comerciales
  -- por vía electrónica exigen consentimiento previo o relación contractual.
  acepta_comunicaciones    boolean     not null default false,
  fecha_baja_comercial     timestamptz,
  estado                   estado_registro not null default 'activo',
  creado_en                timestamptz not null default now(),
  actualizado_en           timestamptz not null default now(),
  constraint contactos_nombre_no_vacio check (length(trim(nombre)) > 0)
);

create index contactos_cuenta_idx on public.contactos (cuenta_id);
create unique index contactos_principal_unico
  on public.contactos (cuenta_id) where es_principal;

comment on table public.contactos is
  'Personas de contacto. La baja comercial se respeta en todo envío automatizado.';

-- -----------------------------------------------------------------------------
-- productos — catálogo de equipamiento informático y servicios.
-- -----------------------------------------------------------------------------
create table public.productos (
  id              uuid primary key default gen_random_uuid(),
  sku             text               not null unique,
  ean13           text,
  categoria       categoria_producto not null,
  marca           text               not null,
  modelo          text               not null,
  descripcion     text,
  precio_coste    numeric(12, 2)     not null default 0,
  precio_venta    numeric(12, 2)     not null,
  tipo_iva        numeric(5, 2)      not null default 21.00,
  stock           integer            not null default 0,
  stock_minimo    integer            not null default 0,
  -- Real Decreto Legislativo 7/2021: la garantía legal de conformidad de los
  -- bienes es de tres años desde la entrega.
  garantia_meses  integer            not null default 36,
  -- Real Decreto 110/2015 sobre residuos de aparatos eléctricos y electrónicos.
  raee_categoria  text,
  ecotasa         numeric(10, 2)     not null default 0,
  activo          boolean            not null default true,
  creado_en       timestamptz        not null default now(),
  actualizado_en  timestamptz        not null default now(),

  constraint productos_precios_no_negativos check (precio_coste >= 0 and precio_venta >= 0),
  constraint productos_iva_valido           check (tipo_iva in (0, 4, 10, 21)),
  constraint productos_stock_no_negativo    check (stock >= 0 and stock_minimo >= 0),
  constraint productos_garantia_minima      check (garantia_meses >= 36 or categoria in ('software', 'servicio')),
  constraint productos_ean13_formato        check (ean13 is null or ean13 ~ '^[0-9]{13}$')
);

create index productos_categoria_idx on public.productos (categoria) where activo;

comment on table public.productos is
  'Catálogo. Incluye ecotasa RAEE y garantía legal mínima de 36 meses.';

-- -----------------------------------------------------------------------------
-- oportunidades — embudo comercial.
-- -----------------------------------------------------------------------------
create table public.oportunidades (
  id                      uuid primary key default gen_random_uuid(),
  referencia              text               not null unique,
  cuenta_id               uuid               not null references public.cuentas (id) on delete cascade,
  contacto_id             uuid               references public.contactos (id) on delete set null,
  titulo                  text               not null,
  descripcion             text,
  etapa                   etapa_oportunidad  not null default 'calificacion',
  origen                  origen_oportunidad not null default 'web',
  importe_estimado        numeric(12, 2)     not null default 0,
  probabilidad            integer            not null default 10,
  fecha_cierre_prevista   date,
  fecha_cierre_real       date,
  motivo_perdida          text,
  propietario_id          uuid               references public.perfiles (id) on delete set null,
  creado_en               timestamptz        not null default now(),
  actualizado_en          timestamptz        not null default now(),

  constraint oportunidades_titulo_no_vacio  check (length(trim(titulo)) > 0),
  constraint oportunidades_importe_positivo check (importe_estimado >= 0),
  constraint oportunidades_probabilidad     check (probabilidad between 0 and 100),
  constraint oportunidades_motivo_perdida   check (etapa <> 'perdida' or motivo_perdida is not null)
);

create index oportunidades_cuenta_idx      on public.oportunidades (cuenta_id);
create index oportunidades_propietario_idx on public.oportunidades (propietario_id);
create index oportunidades_etapa_idx       on public.oportunidades (etapa);

-- -----------------------------------------------------------------------------
-- presupuestos — ofertas comerciales con numeración correlativa por serie.
-- -----------------------------------------------------------------------------
create table public.presupuestos (
  id                    uuid primary key default gen_random_uuid(),
  numero                text               not null unique,
  serie                 text               not null default 'PRE',
  ejercicio             integer            not null default extract(year from now())::int,
  correlativo           integer            not null,
  cuenta_id             uuid               not null references public.cuentas (id) on delete restrict,
  oportunidad_id        uuid               references public.oportunidades (id) on delete set null,
  propietario_id        uuid               references public.perfiles (id) on delete set null,
  fecha_emision         date               not null default current_date,
  fecha_validez         date               not null default (current_date + 30),
  estado                estado_presupuesto not null default 'borrador',
  base_imponible        numeric(12, 2)     not null default 0,
  cuota_iva             numeric(12, 2)     not null default 0,
  cuota_recargo         numeric(12, 2)     not null default 0,
  total                 numeric(12, 2)     not null default 0,
  moneda                char(3)            not null default 'EUR',
  condiciones           text,
  -- Encadenamiento de registros en la línea del Real Decreto 1007/2023
  -- (reglamento Veri*factu): cada documento referencia la huella del anterior.
  huella                text,
  huella_anterior       text,
  creado_en             timestamptz        not null default now(),
  actualizado_en        timestamptz        not null default now(),

  constraint presupuestos_validez     check (fecha_validez >= fecha_emision),
  constraint presupuestos_importes    check (base_imponible >= 0 and cuota_iva >= 0
                                             and cuota_recargo >= 0 and total >= 0),
  constraint presupuestos_moneda_iso  check (moneda ~ '^[A-Z]{3}$'),
  constraint presupuestos_correlativo unique (serie, ejercicio, correlativo)
);

create index presupuestos_cuenta_idx on public.presupuestos (cuenta_id);
create index presupuestos_estado_idx on public.presupuestos (estado);

comment on table public.presupuestos is
  'Ofertas con numeración correlativa sin huecos y huella encadenada por serie.';

-- -----------------------------------------------------------------------------
-- lineas_presupuesto — detalle de cada oferta.
-- -----------------------------------------------------------------------------
create table public.lineas_presupuesto (
  id               uuid primary key default gen_random_uuid(),
  presupuesto_id   uuid           not null references public.presupuestos (id) on delete cascade,
  producto_id      uuid           references public.productos (id) on delete restrict,
  orden            integer        not null default 1,
  descripcion      text           not null,
  cantidad         numeric(10, 2) not null default 1,
  precio_unitario  numeric(12, 2) not null,
  descuento_pct    numeric(5, 2)  not null default 0,
  tipo_iva         numeric(5, 2)  not null default 21.00,
  importe          numeric(12, 2) generated always as
    (round(cantidad * precio_unitario * (1 - descuento_pct / 100), 2)) stored,

  constraint lineas_cantidad_positiva check (cantidad > 0),
  constraint lineas_precio_positivo   check (precio_unitario >= 0),
  constraint lineas_descuento_valido  check (descuento_pct between 0 and 100),
  constraint lineas_iva_valido        check (tipo_iva in (0, 4, 10, 21))
);

create index lineas_presupuesto_idx on public.lineas_presupuesto (presupuesto_id);

-- -----------------------------------------------------------------------------
-- actividades — traza de la interacción comercial.
-- -----------------------------------------------------------------------------
create table public.actividades (
  id              uuid primary key default gen_random_uuid(),
  tipo            tipo_actividad not null,
  asunto          text           not null,
  detalle         text,
  cuenta_id       uuid           references public.cuentas (id) on delete cascade,
  contacto_id     uuid           references public.contactos (id) on delete set null,
  oportunidad_id  uuid           references public.oportunidades (id) on delete cascade,
  usuario_id      uuid           references public.perfiles (id) on delete set null,
  fecha           timestamptz    not null default now(),
  duracion_min    integer,
  resultado       text,
  creado_en       timestamptz    not null default now(),

  constraint actividades_asunto_no_vacio check (length(trim(asunto)) > 0),
  constraint actividades_duracion        check (duracion_min is null or duracion_min >= 0),
  constraint actividades_tiene_relacion  check (cuenta_id is not null or oportunidad_id is not null)
);

create index actividades_cuenta_idx      on public.actividades (cuenta_id, fecha desc);
create index actividades_oportunidad_idx on public.actividades (oportunidad_id, fecha desc);

-- -----------------------------------------------------------------------------
-- incidencias — soporte técnico, garantías y RMA.
-- -----------------------------------------------------------------------------
create table public.incidencias (
  id               uuid primary key default gen_random_uuid(),
  referencia       text                 not null unique,
  cuenta_id        uuid                 not null references public.cuentas (id) on delete cascade,
  contacto_id      uuid                 references public.contactos (id) on delete set null,
  producto_id      uuid                 references public.productos (id) on delete set null,
  numero_serie     text,
  tipo             tipo_incidencia      not null default 'averia',
  prioridad        prioridad_incidencia not null default 'media',
  estado           estado_incidencia    not null default 'abierta',
  en_garantia      boolean              not null default false,
  fecha_compra     date,
  descripcion      text                 not null,
  resolucion       text,
  sla_horas        integer              not null default 48,
  fecha_apertura   timestamptz          not null default now(),
  fecha_limite_sla timestamptz,
  fecha_cierre     timestamptz,
  asignado_a       uuid                 references public.perfiles (id) on delete set null,
  creado_en        timestamptz          not null default now(),
  actualizado_en   timestamptz          not null default now(),

  constraint incidencias_descripcion_no_vacia check (length(trim(descripcion)) > 0),
  constraint incidencias_sla_positivo         check (sla_horas > 0),
  constraint incidencias_resolucion_al_cerrar
    check (estado not in ('resuelta', 'cerrada') or resolucion is not null)
);

create index incidencias_cuenta_idx    on public.incidencias (cuenta_id);
create index incidencias_estado_idx    on public.incidencias (estado);
create index incidencias_asignado_idx  on public.incidencias (asignado_a);

comment on table public.incidencias is
  'Soporte y RMA. El vencimiento del SLA se calcula al abrir o reprogramar.';
