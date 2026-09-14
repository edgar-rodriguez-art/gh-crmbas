-- =============================================================================
-- crmbas · 0008 · Datos de prueba (dos registros por tabla)
--
-- AVISO: las credenciales de este archivo son marcadores de posición para un
-- entorno de demostración. Cámbialas antes de cualquier uso real desde
-- Autenticación → Usuarios en el panel de Supabase.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Usuarios. El disparador `al_crear_usuario` crea el perfil correspondiente:
-- el primero recibe el rol `admin` y el segundo, `lectura`.
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000',
   'a1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'admin@crmbas.es',
   extensions.crypt('CambiarEnPrimerInicio!2026', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nombre":"Elena","apellidos":"Vidal Moreno"}'::jsonb,
   now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   'a2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'comercial@crmbas.es',
   extensions.crypt('CambiarEnPrimerInicio!2026', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nombre":"Rubén","apellidos":"Ferrer Lago"}'::jsonb,
   now(), now())
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at,
  created_at, updated_at
)
values
  (gen_random_uuid(), 'a1111111-1111-4111-8111-111111111111',
   'a1111111-1111-4111-8111-111111111111', 'email',
   '{"sub":"a1111111-1111-4111-8111-111111111111","email":"admin@crmbas.es","email_verified":true,"phone_verified":false}'::jsonb,
   now(), now(), now()),
  (gen_random_uuid(), 'a2222222-2222-4222-8222-222222222222',
   'a2222222-2222-4222-8222-222222222222', 'email',
   '{"sub":"a2222222-2222-4222-8222-222222222222","email":"comercial@crmbas.es","email_verified":true,"phone_verified":false}'::jsonb,
   now(), now(), now())
on conflict do nothing;

update public.perfiles
   set rol = 'comercial', telefono = '+34 911 234 568'
 where id = 'a2222222-2222-4222-8222-222222222222';

update public.perfiles
   set telefono = '+34 911 234 567'
 where id = 'a1111111-1111-4111-8111-111111111111';

-- -----------------------------------------------------------------------------
-- cuentas
-- -----------------------------------------------------------------------------
insert into public.cuentas (
  id, tipo_cliente, razon_social, nombre_comercial, nif, email, telefono,
  sitio_web, direccion, codigo_postal, municipio, provincia, segmento,
  regimen_iva, iban, sector, propietario_id, base_legal_tratamiento, notas
)
values
  ('c1111111-1111-4111-8111-111111111111', 'empresa',
   'Tecnología Ibérica Soluciones, S.L.', 'TISOL', 'B12345674',
   'compras@tisol.example', '+34 915 550 120', 'https://tisol.example',
   'Calle de Alcalá 145, 3.º B', '28013', 'Madrid', 'Madrid', 'pyme',
   'general', 'ES9121000418450200051332', 'Consultoría de ingeniería',
   'a2222222-2222-4222-8222-222222222222', 'contrato',
   'Renueva el parque informático cada cuatro años.'),
  ('c2222222-2222-4222-8222-222222222222', 'autonomo',
   'Ana Beltrán Ruiz', 'Informática Beltrán', '12345678Z',
   'ana@beltran.example', '+34 933 210 445', null,
   'Carrer de Sants 88, bajos', '08029', 'Barcelona', 'Barcelona', 'particular',
   'recargo_equivalencia', 'ES7921000813610123456789', 'Comercio minorista',
   'a2222222-2222-4222-8222-222222222222', 'contrato',
   'Minorista acogida al recargo de equivalencia.');

-- -----------------------------------------------------------------------------
-- contactos
-- -----------------------------------------------------------------------------
insert into public.contactos (
  id, cuenta_id, nombre, apellidos, cargo, email, telefono, movil,
  es_principal, acepta_comunicaciones
)
values
  ('d1111111-1111-4111-8111-111111111111',
   'c1111111-1111-4111-8111-111111111111',
   'Marta', 'Sanz Delgado', 'Directora de Sistemas',
   'marta.sanz@tisol.example', '+34 915 550 121', '+34 600 111 222', true, true),
  ('d2222222-2222-4222-8222-222222222222',
   'c2222222-2222-4222-8222-222222222222',
   'Ana', 'Beltrán Ruiz', 'Titular',
   'ana@beltran.example', '+34 933 210 445', '+34 600 333 444', true, false);

-- -----------------------------------------------------------------------------
-- productos
-- -----------------------------------------------------------------------------
insert into public.productos (
  id, sku, ean13, categoria, marca, modelo, descripcion,
  precio_coste, precio_venta, tipo_iva, stock, stock_minimo,
  garantia_meses, raee_categoria, ecotasa
)
values
  ('e1111111-1111-4111-8111-111111111111', 'PORT-LAT5550-I7', '8412345000019',
   'portatil', 'Dell', 'Latitude 5550',
   'Portátil 15,6" Intel Core i7-1355U, 16 GB RAM, SSD NVMe 512 GB, Windows 11 Pro.',
   985.00, 1249.00, 21.00, 24, 6, 36,
   'Categoría 6 — Pequeños aparatos de informática y telecomunicaciones', 0.50),
  ('e2222222-2222-4222-8222-222222222222', 'SRV-PE-R360-32', '8412345000026',
   'servidor', 'Dell', 'PowerEdge R360',
   'Servidor en bastidor 1U, Xeon E-2456, 32 GB ECC, 2 × 960 GB SSD, fuente redundante.',
   2640.00, 3299.00, 21.00, 5, 2, 36,
   'Categoría 4 — Grandes aparatos', 3.00);

-- -----------------------------------------------------------------------------
-- oportunidades (la referencia la asigna el disparador)
-- -----------------------------------------------------------------------------
insert into public.oportunidades (
  id, cuenta_id, contacto_id, titulo, descripcion, etapa, origen,
  importe_estimado, probabilidad, fecha_cierre_prevista, propietario_id
)
values
  ('f1111111-1111-4111-8111-111111111111',
   'c1111111-1111-4111-8111-111111111111',
   'd1111111-1111-4111-8111-111111111111',
   'Renovación del parque de portátiles (40 equipos)',
   'Sustitución de portátiles con más de cuatro años, con retirada RAEE del material antiguo.',
   'propuesta', 'referencia', 47462.00, 60, current_date + 45,
   'a2222222-2222-4222-8222-222222222222'),
  ('f2222222-2222-4222-8222-222222222222',
   'c2222222-2222-4222-8222-222222222222',
   'd2222222-2222-4222-8222-222222222222',
   'Servidor de respaldo y migración de datos',
   'Dos servidores en alta disponibilidad más servicio de migración y formación.',
   'negociacion', 'telefono', 6598.00, 75, current_date + 20,
   'a2222222-2222-4222-8222-222222222222');

-- -----------------------------------------------------------------------------
-- presupuestos (el número y la huella los asigna el disparador)
-- -----------------------------------------------------------------------------
insert into public.presupuestos (
  id, cuenta_id, oportunidad_id, propietario_id, fecha_emision, fecha_validez,
  estado, condiciones
)
values
  ('b1111111-1111-4111-8111-111111111111',
   'c1111111-1111-4111-8111-111111111111',
   'f1111111-1111-4111-8111-111111111111',
   'a2222222-2222-4222-8222-222222222222',
   current_date, current_date + 30, 'borrador',
   'Entrega en 15 días laborables. Incluye retirada y tratamiento RAEE del equipamiento sustituido.'),
  ('b2222222-2222-4222-8222-222222222222',
   'c2222222-2222-4222-8222-222222222222',
   'f2222222-2222-4222-8222-222222222222',
   'a2222222-2222-4222-8222-222222222222',
   current_date, current_date + 15, 'borrador',
   'Instalación en las instalaciones del cliente. Recargo de equivalencia incluido.');

-- -----------------------------------------------------------------------------
-- lineas_presupuesto (los totales del presupuesto se recalculan solos)
-- -----------------------------------------------------------------------------
insert into public.lineas_presupuesto (
  id, presupuesto_id, producto_id, orden, descripcion,
  cantidad, precio_unitario, descuento_pct, tipo_iva
)
values
  ('aa111111-1111-4111-8111-111111111111',
   'b1111111-1111-4111-8111-111111111111',
   'e1111111-1111-4111-8111-111111111111', 1,
   'Dell Latitude 5550 · i7 / 16 GB / 512 GB — despliegue e imagen corporativa',
   40, 1249.00, 5.00, 21.00),
  ('aa222222-2222-4222-8222-222222222222',
   'b2222222-2222-4222-8222-222222222222',
   'e2222222-2222-4222-8222-222222222222', 1,
   'Dell PowerEdge R360 · configuración en alta disponibilidad',
   2, 3299.00, 0.00, 21.00);

-- -----------------------------------------------------------------------------
-- Emisión del primer presupuesto: al dejar de ser borrador, el disparador
-- `sellar_presupuesto` calcula su huella sobre unos totales ya consolidados.
-- -----------------------------------------------------------------------------
update public.presupuestos
   set estado = 'enviado'
 where id = 'b1111111-1111-4111-8111-111111111111';

-- -----------------------------------------------------------------------------
-- actividades
-- -----------------------------------------------------------------------------
insert into public.actividades (
  id, tipo, asunto, detalle, cuenta_id, contacto_id, oportunidad_id,
  usuario_id, fecha, duracion_min, resultado
)
values
  ('ab111111-1111-4111-8111-111111111111', 'reunion',
   'Presentación de la propuesta de renovación',
   'Revisión del inventario actual y calendario de sustitución por plantas.',
   'c1111111-1111-4111-8111-111111111111',
   'd1111111-1111-4111-8111-111111111111',
   'f1111111-1111-4111-8111-111111111111',
   'a2222222-2222-4222-8222-222222222222',
   now() - interval '3 days', 60,
   'Solicitan añadir la retirada RAEE al presupuesto.'),
  ('ab222222-2222-4222-8222-222222222222', 'llamada',
   'Seguimiento del presupuesto de servidores',
   'Se aclara el tratamiento del recargo de equivalencia en la oferta.',
   'c2222222-2222-4222-8222-222222222222',
   'd2222222-2222-4222-8222-222222222222',
   'f2222222-2222-4222-8222-222222222222',
   'a1111111-1111-4111-8111-111111111111',
   now() - interval '1 day', 15,
   'Pendiente de confirmar la fecha de instalación.');

-- -----------------------------------------------------------------------------
-- incidencias (la referencia y el vencimiento del SLA los calcula el disparador)
-- -----------------------------------------------------------------------------
insert into public.incidencias (
  id, cuenta_id, contacto_id, producto_id, numero_serie, tipo, prioridad,
  estado, en_garantia, fecha_compra, descripcion, sla_horas, asignado_a
)
values
  ('ac111111-1111-4111-8111-111111111111',
   'c1111111-1111-4111-8111-111111111111',
   'd1111111-1111-4111-8111-111111111111',
   'e1111111-1111-4111-8111-111111111111', 'SN-LAT5550-004821',
   'garantia', 'alta', 'abierta', true, current_date - 200,
   'El equipo no arranca tras la última actualización de firmware. Se tramita RMA con el fabricante.',
   24, 'a1111111-1111-4111-8111-111111111111'),
  ('ac222222-2222-4222-8222-222222222222',
   'c2222222-2222-4222-8222-222222222222',
   'd2222222-2222-4222-8222-222222222222',
   'e2222222-2222-4222-8222-222222222222', 'SN-R360-000117',
   'instalacion', 'media', 'en_curso', false, current_date - 10,
   'Montaje en bastidor, configuración RAID 1 y migración del servidor de archivos.',
   72, 'a1111111-1111-4111-8111-111111111111');

-- -----------------------------------------------------------------------------
-- tratamientos — registro de actividades de tratamiento (RGPD art. 30)
-- -----------------------------------------------------------------------------
insert into public.tratamientos (
  id, codigo, nombre, finalidad, base_legal, categorias_interesados,
  categorias_datos, destinatarios, transferencias_internacionales,
  plazo_conservacion, medidas_seguridad
)
values
  ('ad111111-1111-4111-8111-111111111111', 'TRAT-001',
   'Gestión de clientes y oportunidades comerciales',
   'Gestión de la relación contractual, elaboración de ofertas y prestación del servicio postventa.',
   'contrato',
   array['Clientes', 'Personas de contacto de clientes'],
   array['Identificativos', 'Datos de contacto profesional', 'Datos económicos y de facturación'],
   array['Proveedor de alojamiento (Supabase, región UE)', 'Asesoría fiscal'],
   'No se realizan transferencias internacionales: los datos residen en la región eu-west-3 (París).',
   'Seis años desde la última operación, conforme al artículo 30 del Código de Comercio.',
   'Cifrado en tránsito y en reposo, control de acceso por roles, registro de auditoría y copias de seguridad diarias.'),
  ('ad222222-2222-4222-8222-222222222222', 'TRAT-002',
   'Comunicaciones comerciales electrónicas',
   'Envío de información sobre productos y servicios de equipamiento informático.',
   'consentimiento',
   array['Personas de contacto que han prestado su consentimiento'],
   array['Identificativos', 'Correo electrónico'],
   array['Proveedor de automatización (n8n)', 'Proveedor de correo transaccional (Resend)'],
   'Encargados del tratamiento con garantías contractuales conforme al artículo 28 del RGPD.',
   'Hasta la revocación del consentimiento y tres años más a efectos probatorios.',
   'Consentimiento registrado con marca temporal y evidencia, baja en un solo paso en cada comunicación.');

-- -----------------------------------------------------------------------------
-- consentimientos
-- -----------------------------------------------------------------------------
insert into public.consentimientos (
  id, cuenta_id, contacto_id, finalidad, base_legal, otorgado, canal,
  texto_informado, evidencia, ip_origen, fecha_otorgamiento, registrado_por
)
values
  ('ae111111-1111-4111-8111-111111111111',
   'c1111111-1111-4111-8111-111111111111',
   'd1111111-1111-4111-8111-111111111111',
   'comercial', 'consentimiento', true, 'formulario_web',
   'Autorizo el envío de información comercial sobre equipamiento informático y servicios asociados.',
   '{"formulario":"alta-cliente","version":"2026-01","casilla_marcada":true}'::jsonb,
   '192.0.2.24', now() - interval '90 days',
   'a1111111-1111-4111-8111-111111111111'),
  ('ae222222-2222-4222-8222-222222222222',
   'c2222222-2222-4222-8222-222222222222',
   'd2222222-2222-4222-8222-222222222222',
   'newsletter', 'consentimiento', false, 'telefono',
   'No autoriza el envío del boletín periódico de novedades de producto.',
   '{"canal":"llamada","registrado_por":"comercial","casilla_marcada":false}'::jsonb,
   '192.0.2.77', now() - interval '30 days',
   'a2222222-2222-4222-8222-222222222222');

-- -----------------------------------------------------------------------------
-- solicitudes_rgpd (la referencia la asigna el disparador)
-- -----------------------------------------------------------------------------
insert into public.solicitudes_rgpd (
  id, tipo, estado, solicitante_email, solicitante_nif, cuenta_id, contacto_id,
  descripcion, identidad_verificada, fecha_solicitud, fecha_resolucion,
  resolucion, gestor_id
)
values
  ('af111111-1111-4111-8111-111111111111', 'acceso', 'en_tramite',
   'marta.sanz@tisol.example', null,
   'c1111111-1111-4111-8111-111111111111',
   'd1111111-1111-4111-8111-111111111111',
   'Solicita copia de los datos personales que constan en el CRM y su origen.',
   true, current_date - 5, null, null,
   'a1111111-1111-4111-8111-111111111111'),
  ('af222222-2222-4222-8222-222222222222', 'oposicion', 'completada',
   'ana@beltran.example', '12345678Z',
   'c2222222-2222-4222-8222-222222222222',
   'd2222222-2222-4222-8222-222222222222',
   'Se opone a recibir comunicaciones comerciales por correo electrónico.',
   true, current_date - 20, current_date - 18,
   'Baja aplicada en el boletín y registrada la revocación del consentimiento.',
   'a1111111-1111-4111-8111-111111111111');

-- -----------------------------------------------------------------------------
-- notificaciones_email
-- -----------------------------------------------------------------------------
insert into public.notificaciones_email (
  id, plantilla, destinatario, asunto, cuerpo_texto, estado, id_proveedor,
  cuenta_id, contacto_id, oportunidad_id, incidencia_id, presupuesto_id, datos,
  intentos, enviado_en
)
values
  ('ba111111-1111-4111-8111-111111111111', 'presupuesto_enviado',
   'marta.sanz@tisol.example',
   'Presupuesto de renovación del parque de portátiles',
   'Hola Marta: te adjuntamos el presupuesto de renovación. Queda a tu disposición durante 30 días.',
   'enviado', 're_demo_0001',
   'c1111111-1111-4111-8111-111111111111',
   'd1111111-1111-4111-8111-111111111111',
   'f1111111-1111-4111-8111-111111111111', null,
   'b1111111-1111-4111-8111-111111111111',
   '{"flujo":"wf-crmbas","origen":"crmbas"}'::jsonb, 1, now() - interval '2 hours'),
  ('ba222222-2222-4222-8222-222222222222', 'incidencia_abierta',
   'ana@beltran.example',
   'Hemos abierto tu incidencia de instalación',
   'Hola Ana: hemos registrado la incidencia y te informaremos del avance de la instalación.',
   'pendiente', null,
   'c2222222-2222-4222-8222-222222222222',
   'd2222222-2222-4222-8222-222222222222',
   null, 'ac222222-2222-4222-8222-222222222222', null,
   '{"flujo":"wf-crmbas","origen":"crmbas"}'::jsonb, 0, null);

-- -----------------------------------------------------------------------------
-- ajustes
-- -----------------------------------------------------------------------------
insert into public.ajustes (clave, valor, descripcion) values
  ('organizacion',
   '{"nombre":"crmbas","pais":"ES","moneda":"EUR","zona_horaria":"Europe/Madrid","idioma":"es-ES","tipo_iva_general":21}'::jsonb,
   'Parámetros generales de la instancia y del mercado en el que opera.'),
  ('conservacion_datos',
   '{"clientes_anios":6,"oportunidades_perdidas_anios":3,"consentimientos_anios":3,"auditoria_anios":2,"base":"Art. 30 del Código de Comercio y principio de limitación del plazo de conservación (RGPD art. 5.1.e)"}'::jsonb,
   'Plazos de conservación aplicados a la supresión periódica de datos.');
