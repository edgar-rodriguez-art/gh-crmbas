-- =============================================================================
-- crmbas · 0005 · Funciones auxiliares y disparadores
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Contexto del usuario autenticado.
--
-- Son SECURITY DEFINER a propósito: las políticas RLS de `perfiles` necesitan
-- conocer el rol, y consultar la propia tabla desde su política provocaría una
-- recursión infinita. El `search_path` vacío evita el secuestro de nombres.
-- -----------------------------------------------------------------------------
create or replace function public.rol_actual()
returns rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol
    from public.perfiles p
   where p.id = (select auth.uid())
     and p.activo;
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.rol_actual() = 'admin', false);
$$;

create or replace function public.puede_editar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.rol_actual() in ('admin', 'comercial', 'soporte'), false);
$$;

revoke execute on function public.rol_actual()  from public, anon;
revoke execute on function public.es_admin()    from public, anon;
revoke execute on function public.puede_editar() from public, anon;
grant  execute on function public.rol_actual()  to authenticated;
grant  execute on function public.es_admin()    to authenticated;
grant  execute on function public.puede_editar() to authenticated;

-- -----------------------------------------------------------------------------
-- Alta automática del perfil al registrarse un usuario en Supabase Auth.
-- El primer usuario del sistema recibe el rol `admin`; el resto, `lectura`,
-- de forma que ningún alta pueda auto-concederse privilegios.
-- -----------------------------------------------------------------------------
create or replace function public.crear_perfil_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rol public.rol_usuario;
begin
  select case when count(*) = 0 then 'admin' else 'lectura' end
    into v_rol
    from public.perfiles;

  insert into public.perfiles (id, email, nombre, apellidos, rol)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'apellidos', ''),
    v_rol
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_para_usuario();

-- -----------------------------------------------------------------------------
-- Marca de última modificación.
-- -----------------------------------------------------------------------------
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Traza de auditoría. Registra el estado anterior y posterior de cada cambio.
-- -----------------------------------------------------------------------------
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro_id text;
  v_email       text;
begin
  v_registro_id := case tg_op
                     when 'DELETE' then (to_jsonb(old) ->> 'id')
                     else (to_jsonb(new) ->> 'id')
                   end;

  select p.email into v_email
    from public.perfiles p
   where p.id = (select auth.uid());

  insert into public.auditoria (
    tabla, operacion, registro_id, usuario_id, usuario_email,
    datos_anteriores, datos_nuevos
  )
  values (
    tg_table_name,
    tg_op::public.operacion_auditada,
    coalesce(v_registro_id, '(sin id)'),
    (select auth.uid()),
    v_email,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  return case tg_op when 'DELETE' then old else new end;
end;
$$;

-- -----------------------------------------------------------------------------
-- Referencias legibles y correlativas por ejercicio.
-- -----------------------------------------------------------------------------
create or replace function public.siguiente_referencia(p_prefijo text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ejercicio int := extract(year from now())::int;
  v_siguiente int;
begin
  -- El bloqueo consultivo serializa la numeración y evita huecos o duplicados.
  perform pg_advisory_xact_lock(hashtext(p_prefijo || v_ejercicio::text));

  execute format(
    'select coalesce(max(substring(referencia from ''[0-9]+$'')::int), 0) + 1
       from public.%I where referencia like $1',
    case p_prefijo when 'OPO' then 'oportunidades'
                   when 'INC' then 'incidencias'
                   when 'RGPD' then 'solicitudes_rgpd'
    end
  )
  into v_siguiente
  using p_prefijo || '-' || v_ejercicio || '-%';

  return format('%s-%s-%s', p_prefijo, v_ejercicio, lpad(v_siguiente::text, 5, '0'));
end;
$$;

create or replace function public.asignar_referencia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.referencia is null or new.referencia = '' then
    new.referencia := public.siguiente_referencia(tg_argv[0]);
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Numeración correlativa de presupuestos, sin huecos, por serie y ejercicio.
-- -----------------------------------------------------------------------------
create or replace function public.asignar_numero_presupuesto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- El bloqueo consultivo serializa la numeración dentro de la transacción.
  perform pg_advisory_xact_lock(hashtext(new.serie || new.ejercicio::text));

  select coalesce(max(correlativo), 0) + 1
    into new.correlativo
    from public.presupuestos
   where serie = new.serie and ejercicio = new.ejercicio;

  new.numero := format('%s-%s-%s', new.serie, new.ejercicio,
                       lpad(new.correlativo::text, 5, '0'));
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Sellado del presupuesto al emitirlo.
--
-- La huella se calcula cuando el documento deja de ser un borrador, que es el
-- momento en que su contenido queda fijado y se comunica al cliente. Encadena
-- la huella del anterior documento emitido de la misma serie, en la línea del
-- Real Decreto 1007/2023 (Veri*factu): alterar o eliminar un documento rompe la
-- cadena de todos los posteriores y el cambio queda en evidencia.
-- -----------------------------------------------------------------------------
create or replace function public.sellar_presupuesto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anterior text;
begin
  if old.estado <> 'borrador' or new.estado = 'borrador' or new.huella is not null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.serie || new.ejercicio::text));

  select huella into v_anterior
    from public.presupuestos
   where serie = new.serie
     and ejercicio = new.ejercicio
     and huella is not null
   order by correlativo desc
   limit 1;

  new.huella_anterior := v_anterior;
  new.huella := encode(
    sha256(convert_to(
      concat_ws('|', new.numero, new.fecha_emision::text, new.cuenta_id::text,
                new.base_imponible::text, new.cuota_iva::text,
                new.cuota_recargo::text, new.total::text,
                coalesce(v_anterior, '')),
      'UTF8')),
    'hex');

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Totales del presupuesto. Se recalculan a partir de las líneas y del régimen
-- de IVA de la cuenta, incluido el recargo de equivalencia cuando procede.
-- -----------------------------------------------------------------------------
create or replace function public.recalcular_presupuesto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_presupuesto uuid := coalesce(new.presupuesto_id, old.presupuesto_id);
  v_regimen     public.regimen_iva;
  v_base        numeric(12, 2) := 0;
  v_iva         numeric(12, 2) := 0;
  v_recargo     numeric(12, 2) := 0;
begin
  select c.regimen_iva
    into v_regimen
    from public.presupuestos p
    join public.cuentas c on c.id = p.cuenta_id
   where p.id = v_presupuesto;

  select coalesce(sum(l.importe), 0),
         coalesce(sum(case when v_regimen in ('exento', 'intracomunitario',
                                              'inversion_sujeto_pasivo')
                           then 0
                           else round(l.importe * l.tipo_iva / 100, 2) end), 0),
         -- Recargo de equivalencia vigente: 5,2 % para el tipo general del 21 %,
         -- 1,4 % para el 10 % y 0,5 % para el 4 % (art. 161 de la Ley 37/1992).
         coalesce(sum(case when v_regimen = 'recargo_equivalencia'
                           then round(l.importe * case l.tipo_iva
                                                    when 21 then 5.2
                                                    when 10 then 1.4
                                                    when 4  then 0.5
                                                    else 0 end / 100, 2)
                           else 0 end), 0)
    into v_base, v_iva, v_recargo
    from public.lineas_presupuesto l
   where l.presupuesto_id = v_presupuesto;

  update public.presupuestos
     set base_imponible = v_base,
         cuota_iva      = v_iva,
         cuota_recargo  = v_recargo,
         total          = v_base + v_iva + v_recargo,
         actualizado_en = now()
   where id = v_presupuesto;

  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Vencimiento del acuerdo de nivel de servicio en incidencias.
-- -----------------------------------------------------------------------------
create or replace function public.calcular_sla()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fecha_limite_sla := new.fecha_apertura + make_interval(hours => new.sla_horas);

  if new.estado in ('resuelta', 'cerrada') and new.fecha_cierre is null then
    new.fecha_cierre := now();
  elsif new.estado not in ('resuelta', 'cerrada') then
    new.fecha_cierre := null;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Aplicación de los disparadores
-- -----------------------------------------------------------------------------
create trigger tocar_perfiles      before update on public.perfiles      for each row execute function public.tocar_actualizado_en();
create trigger tocar_cuentas       before update on public.cuentas       for each row execute function public.tocar_actualizado_en();
create trigger tocar_contactos     before update on public.contactos     for each row execute function public.tocar_actualizado_en();
create trigger tocar_productos     before update on public.productos     for each row execute function public.tocar_actualizado_en();
create trigger tocar_oportunidades before update on public.oportunidades for each row execute function public.tocar_actualizado_en();
create trigger tocar_presupuestos  before update on public.presupuestos  for each row execute function public.tocar_actualizado_en();
create trigger tocar_incidencias   before update on public.incidencias   for each row execute function public.tocar_actualizado_en();

create trigger referencia_oportunidad before insert on public.oportunidades
  for each row execute function public.asignar_referencia('OPO');
create trigger referencia_incidencia before insert on public.incidencias
  for each row execute function public.asignar_referencia('INC');
create trigger referencia_solicitud_rgpd before insert on public.solicitudes_rgpd
  for each row execute function public.asignar_referencia('RGPD');

create trigger numerar_presupuesto before insert on public.presupuestos
  for each row execute function public.asignar_numero_presupuesto();

create trigger sellar_presupuesto before update on public.presupuestos
  for each row execute function public.sellar_presupuesto();

create trigger recalcular_tras_linea after insert or update or delete on public.lineas_presupuesto
  for each row execute function public.recalcular_presupuesto();

create trigger sla_incidencia before insert or update on public.incidencias
  for each row execute function public.calcular_sla();

-- Auditoría sobre las tablas que contienen datos personales o económicos.
create trigger auditar_cuentas          after insert or update or delete on public.cuentas          for each row execute function public.registrar_auditoria();
create trigger auditar_contactos        after insert or update or delete on public.contactos        for each row execute function public.registrar_auditoria();
create trigger auditar_oportunidades    after insert or update or delete on public.oportunidades    for each row execute function public.registrar_auditoria();
create trigger auditar_presupuestos     after insert or update or delete on public.presupuestos     for each row execute function public.registrar_auditoria();
create trigger auditar_incidencias      after insert or update or delete on public.incidencias      for each row execute function public.registrar_auditoria();
create trigger auditar_perfiles         after insert or update or delete on public.perfiles         for each row execute function public.registrar_auditoria();
create trigger auditar_consentimientos  after insert or update or delete on public.consentimientos  for each row execute function public.registrar_auditoria();
create trigger auditar_solicitudes_rgpd after insert or update or delete on public.solicitudes_rgpd for each row execute function public.registrar_auditoria();
