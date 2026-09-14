-- =============================================================================
-- crmbas · 0006 · Seguridad a nivel de fila
--
-- Principio aplicado: denegación por defecto. Se activa RLS en todas las tablas
-- y se conceden únicamente los permisos que cada rol necesita para su función
-- (ENS op.acc.4 «proceso de gestión de derechos de acceso»; ISO/IEC 27001 A.5.15).
--
-- El rol `anon` (usuario no autenticado) no recibe ningún permiso: la aplicación
-- exige sesión para todo acceso a datos.
-- =============================================================================

alter table public.perfiles             enable row level security;
alter table public.cuentas              enable row level security;
alter table public.contactos            enable row level security;
alter table public.productos            enable row level security;
alter table public.oportunidades        enable row level security;
alter table public.presupuestos         enable row level security;
alter table public.lineas_presupuesto   enable row level security;
alter table public.actividades          enable row level security;
alter table public.incidencias          enable row level security;
alter table public.tratamientos         enable row level security;
alter table public.consentimientos      enable row level security;
alter table public.solicitudes_rgpd     enable row level security;
alter table public.auditoria            enable row level security;
alter table public.notificaciones_email enable row level security;
alter table public.ajustes              enable row level security;

-- -----------------------------------------------------------------------------
-- Retirada de privilegios heredados
-- -----------------------------------------------------------------------------
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- La traza de auditoría nunca se modifica desde la aplicación.
revoke insert, update, delete on public.auditoria from authenticated;

-- -----------------------------------------------------------------------------
-- perfiles
-- -----------------------------------------------------------------------------
create policy perfiles_ver on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or public.rol_actual() is not null);

create policy perfiles_editar_propio on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and rol = public.rol_actual());

create policy perfiles_admin_insertar on public.perfiles
  for insert to authenticated with check (public.es_admin());

create policy perfiles_admin_editar on public.perfiles
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

create policy perfiles_admin_borrar on public.perfiles
  for delete to authenticated using (public.es_admin() and id <> (select auth.uid()));

-- -----------------------------------------------------------------------------
-- cuentas y contactos — visibles para todo el equipo, modificables por quien
-- las gestiona. La supresión queda reservada a administración.
-- -----------------------------------------------------------------------------
create policy cuentas_ver on public.cuentas
  for select to authenticated using (public.rol_actual() is not null);

create policy cuentas_crear on public.cuentas
  for insert to authenticated with check (public.puede_editar());

create policy cuentas_editar on public.cuentas
  for update to authenticated
  using (public.es_admin() or (public.puede_editar()
         and (propietario_id = (select auth.uid()) or propietario_id is null)))
  with check (public.puede_editar());

create policy cuentas_borrar on public.cuentas
  for delete to authenticated using (public.es_admin());

create policy contactos_ver on public.contactos
  for select to authenticated using (public.rol_actual() is not null);

create policy contactos_crear on public.contactos
  for insert to authenticated with check (public.puede_editar());

create policy contactos_editar on public.contactos
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());

create policy contactos_borrar on public.contactos
  for delete to authenticated using (public.es_admin());

-- -----------------------------------------------------------------------------
-- productos — catálogo compartido; solo administración fija precios.
-- -----------------------------------------------------------------------------
create policy productos_ver on public.productos
  for select to authenticated using (public.rol_actual() is not null);

create policy productos_gestionar_insertar on public.productos
  for insert to authenticated with check (public.es_admin());

create policy productos_gestionar_editar on public.productos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

create policy productos_gestionar_borrar on public.productos
  for delete to authenticated using (public.es_admin());

-- -----------------------------------------------------------------------------
-- oportunidades, presupuestos y líneas
-- -----------------------------------------------------------------------------
create policy oportunidades_ver on public.oportunidades
  for select to authenticated using (public.rol_actual() is not null);

create policy oportunidades_crear on public.oportunidades
  for insert to authenticated with check (public.puede_editar());

create policy oportunidades_editar on public.oportunidades
  for update to authenticated
  using (public.es_admin() or (public.puede_editar()
         and (propietario_id = (select auth.uid()) or propietario_id is null)))
  with check (public.puede_editar());

create policy oportunidades_borrar on public.oportunidades
  for delete to authenticated using (public.es_admin());

create policy presupuestos_ver on public.presupuestos
  for select to authenticated using (public.rol_actual() is not null);

create policy presupuestos_crear on public.presupuestos
  for insert to authenticated with check (public.puede_editar());

-- Un presupuesto aceptado o rechazado ya no se retoca: queda como evidencia de
-- la oferta comunicada al cliente.
create policy presupuestos_editar on public.presupuestos
  for update to authenticated
  using (public.puede_editar() and estado in ('borrador', 'enviado'))
  with check (public.puede_editar());

create policy presupuestos_borrar on public.presupuestos
  for delete to authenticated using (public.es_admin() and estado = 'borrador');

create policy lineas_ver on public.lineas_presupuesto
  for select to authenticated using (public.rol_actual() is not null);

create policy lineas_gestionar_insertar on public.lineas_presupuesto
  for insert to authenticated with check (public.puede_editar());

create policy lineas_gestionar_editar on public.lineas_presupuesto
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());

create policy lineas_gestionar_borrar on public.lineas_presupuesto
  for delete to authenticated using (public.puede_editar());

-- -----------------------------------------------------------------------------
-- actividades — cada persona responde de lo que registra.
-- -----------------------------------------------------------------------------
create policy actividades_ver on public.actividades
  for select to authenticated using (public.rol_actual() is not null);

create policy actividades_crear on public.actividades
  for insert to authenticated
  with check (public.puede_editar() and usuario_id = (select auth.uid()));

create policy actividades_editar on public.actividades
  for update to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin())
  with check (usuario_id = (select auth.uid()) or public.es_admin());

create policy actividades_borrar on public.actividades
  for delete to authenticated using (public.es_admin());

-- -----------------------------------------------------------------------------
-- incidencias
-- -----------------------------------------------------------------------------
create policy incidencias_ver on public.incidencias
  for select to authenticated using (public.rol_actual() is not null);

create policy incidencias_crear on public.incidencias
  for insert to authenticated with check (public.puede_editar());

create policy incidencias_editar on public.incidencias
  for update to authenticated
  using (public.es_admin()
         or public.rol_actual() = 'soporte'
         or asignado_a = (select auth.uid()))
  with check (public.puede_editar());

create policy incidencias_borrar on public.incidencias
  for delete to authenticated using (public.es_admin());

-- -----------------------------------------------------------------------------
-- Cumplimiento: consultable por el equipo, gestionable por administración.
-- -----------------------------------------------------------------------------
create policy tratamientos_ver on public.tratamientos
  for select to authenticated using (public.rol_actual() is not null);

create policy tratamientos_admin_insertar on public.tratamientos
  for insert to authenticated with check (public.es_admin());
create policy tratamientos_admin_editar on public.tratamientos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy tratamientos_admin_borrar on public.tratamientos
  for delete to authenticated using (public.es_admin());

create policy consentimientos_ver on public.consentimientos
  for select to authenticated using (public.rol_actual() is not null);

create policy consentimientos_crear on public.consentimientos
  for insert to authenticated with check (public.puede_editar());

-- La evidencia de consentimiento no se reescribe: revocar es un UPDATE que solo
-- rellena la fecha de revocación, y eso lo hace administración.
create policy consentimientos_revocar on public.consentimientos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

create policy solicitudes_rgpd_ver on public.solicitudes_rgpd
  for select to authenticated using (public.rol_actual() is not null);

create policy solicitudes_rgpd_crear on public.solicitudes_rgpd
  for insert to authenticated with check (public.puede_editar());

create policy solicitudes_rgpd_tramitar on public.solicitudes_rgpd
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- auditoria — solo lectura y solo para administración.
-- -----------------------------------------------------------------------------
create policy auditoria_ver on public.auditoria
  for select to authenticated using (public.es_admin());

-- -----------------------------------------------------------------------------
-- notificaciones_email — la escritura la realiza el servidor de la aplicación
-- con la clave de servicio; los usuarios solo consultan el estado del envío.
-- -----------------------------------------------------------------------------
create policy notificaciones_ver on public.notificaciones_email
  for select to authenticated using (public.rol_actual() is not null);

-- -----------------------------------------------------------------------------
-- ajustes
-- -----------------------------------------------------------------------------
create policy ajustes_ver on public.ajustes
  for select to authenticated using (public.rol_actual() is not null);

create policy ajustes_admin_insertar on public.ajustes
  for insert to authenticated with check (public.es_admin());
create policy ajustes_admin_editar on public.ajustes
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
