-- =============================================================================
-- crmbas · 0004 · Tablas de cumplimiento normativo
--
-- Reglamento (UE) 2016/679 (RGPD), Ley Orgánica 3/2018 (LOPDGDD),
-- Real Decreto 311/2022 (Esquema Nacional de Seguridad) y UNE-EN ISO/IEC 27001.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- tratamientos — registro de actividades de tratamiento (RGPD art. 30).
-- Documento que la organización debe poder exhibir ante la AEPD.
-- -----------------------------------------------------------------------------
create table public.tratamientos (
  id                          uuid primary key default gen_random_uuid(),
  codigo                      text        not null unique,
  nombre                      text        not null,
  finalidad                   text        not null,
  base_legal                  base_legal  not null,
  categorias_interesados      text[]      not null default '{}',
  categorias_datos            text[]      not null default '{}',
  destinatarios               text[]      not null default '{}',
  transferencias_internacionales text,
  plazo_conservacion          text        not null,
  medidas_seguridad           text        not null,
  responsable                 text        not null default 'crmbas',
  actualizado_en              timestamptz not null default now(),

  constraint tratamientos_nombre_no_vacio check (length(trim(nombre)) > 0)
);

comment on table public.tratamientos is
  'Registro de actividades de tratamiento exigido por el artículo 30 del RGPD.';

-- -----------------------------------------------------------------------------
-- consentimientos — prueba del consentimiento (RGPD art. 7.1).
-- Se conserva la evidencia y la marca temporal de otorgamiento y revocación.
-- -----------------------------------------------------------------------------
create table public.consentimientos (
  id                 uuid primary key default gen_random_uuid(),
  cuenta_id          uuid                     references public.cuentas (id) on delete cascade,
  contacto_id        uuid                     references public.contactos (id) on delete cascade,
  finalidad          finalidad_consentimiento not null,
  base_legal         base_legal               not null default 'consentimiento',
  otorgado           boolean                  not null default true,
  canal              text                     not null default 'formulario_web',
  texto_informado    text                     not null,
  evidencia          jsonb                    not null default '{}'::jsonb,
  ip_origen          inet,
  fecha_otorgamiento timestamptz              not null default now(),
  fecha_revocacion   timestamptz,
  registrado_por     uuid                     references public.perfiles (id) on delete set null,

  constraint consentimientos_tiene_interesado
    check (cuenta_id is not null or contacto_id is not null),
  constraint consentimientos_revocacion_coherente
    check (fecha_revocacion is null or fecha_revocacion >= fecha_otorgamiento),
  constraint consentimientos_texto_no_vacio check (length(trim(texto_informado)) > 0)
);

create index consentimientos_contacto_idx on public.consentimientos (contacto_id);
create index consentimientos_cuenta_idx   on public.consentimientos (cuenta_id);

comment on table public.consentimientos is
  'Evidencia del consentimiento y de su revocación, con finalidad granular.';

-- -----------------------------------------------------------------------------
-- solicitudes_rgpd — ejercicio de derechos (RGPD arts. 15 a 22).
-- El plazo de respuesta es de un mes desde la recepción (art. 12.3).
-- -----------------------------------------------------------------------------
create table public.solicitudes_rgpd (
  id                uuid primary key default gen_random_uuid(),
  referencia        text                  not null unique,
  tipo              tipo_solicitud_rgpd   not null,
  estado            estado_solicitud_rgpd not null default 'recibida',
  solicitante_email text                  not null,
  solicitante_nif   text,
  cuenta_id         uuid                  references public.cuentas (id) on delete set null,
  contacto_id       uuid                  references public.contactos (id) on delete set null,
  descripcion       text                  not null,
  identidad_verificada boolean            not null default false,
  fecha_solicitud   date                  not null default current_date,
  fecha_limite      date                  generated always as (fecha_solicitud + 30) stored,
  fecha_resolucion  date,
  resolucion        text,
  gestor_id         uuid                  references public.perfiles (id) on delete set null,
  creado_en         timestamptz           not null default now(),

  constraint solicitudes_rgpd_nif_valido
    check (solicitante_nif is null or public.es_nif_valido(solicitante_nif)),
  constraint solicitudes_rgpd_resolucion_coherente
    check (estado not in ('completada', 'denegada')
           or (fecha_resolucion is not null and resolucion is not null))
);

create index solicitudes_rgpd_estado_idx on public.solicitudes_rgpd (estado, fecha_limite);

comment on table public.solicitudes_rgpd is
  'Derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición.';

-- -----------------------------------------------------------------------------
-- auditoria — traza inmutable de cambios (ENS op.exp.8, ISO/IEC 27001 A.8.15).
-- Se escribe por disparador y ningún rol de aplicación puede modificarla.
-- -----------------------------------------------------------------------------
create table public.auditoria (
  id               bigint generated always as identity primary key,
  tabla            text               not null,
  operacion        operacion_auditada not null,
  registro_id      text               not null,
  usuario_id       uuid,
  usuario_email    text,
  datos_anteriores jsonb,
  datos_nuevos     jsonb,
  ocurrido_en      timestamptz        not null default now()
);

create index auditoria_tabla_idx    on public.auditoria (tabla, ocurrido_en desc);
create index auditoria_registro_idx on public.auditoria (registro_id);
create index auditoria_usuario_idx  on public.auditoria (usuario_id, ocurrido_en desc);

comment on table public.auditoria is
  'Registro de actividad de solo anexado. Solo lectura para los roles del CRM.';

-- -----------------------------------------------------------------------------
-- notificaciones_email — cola y traza de los correos delegados en n8n → Resend.
-- -----------------------------------------------------------------------------
create table public.notificaciones_email (
  id             uuid primary key default gen_random_uuid(),
  plantilla      plantilla_email not null,
  destinatario   text            not null,
  remitente      text            not null default 'onboarding@resend.dev',
  asunto         text            not null,
  cuerpo_texto   text            not null,
  estado         estado_email    not null default 'pendiente',
  proveedor      text            not null default 'resend',
  id_proveedor   text,
  cuenta_id      uuid            references public.cuentas (id) on delete set null,
  contacto_id    uuid            references public.contactos (id) on delete set null,
  oportunidad_id uuid            references public.oportunidades (id) on delete set null,
  incidencia_id  uuid            references public.incidencias (id) on delete set null,
  presupuesto_id uuid            references public.presupuestos (id) on delete set null,
  datos          jsonb           not null default '{}'::jsonb,
  intentos       integer         not null default 0,
  error          text,
  solicitado_en  timestamptz     not null default now(),
  enviado_en     timestamptz,

  constraint notificaciones_email_destinatario
    check (destinatario ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint notificaciones_email_intentos check (intentos >= 0),
  constraint notificaciones_email_error_coherente
    check (estado <> 'error' or error is not null)
);

create index notificaciones_email_estado_idx on public.notificaciones_email (estado, solicitado_en);

comment on table public.notificaciones_email is
  'Cola de correo. crmbas nunca habla con Resend: delega el envío en n8n.';

-- -----------------------------------------------------------------------------
-- ajustes — parámetros de la organización y políticas de conservación.
-- -----------------------------------------------------------------------------
create table public.ajustes (
  clave          text primary key,
  valor          jsonb       not null,
  descripcion    text        not null,
  actualizado_por uuid       references public.perfiles (id) on delete set null,
  actualizado_en timestamptz not null default now()
);

comment on table public.ajustes is
  'Configuración de la instancia, incluidos los plazos de conservación de datos.';
