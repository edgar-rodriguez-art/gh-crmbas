-- =============================================================================
-- crmbas · 0007 · Vistas de explotación
--
-- Todas se declaran con security_invoker: la vista se evalúa con los permisos
-- de quien consulta, de modo que las políticas RLS siguen aplicándose y una
-- vista no se convierte en una puerta trasera a los datos.
-- =============================================================================

create view public.v_embudo with (security_invoker = true) as
  select o.etapa,
         count(*)                                          as operaciones,
         coalesce(sum(o.importe_estimado), 0)              as importe_total,
         coalesce(sum(o.importe_estimado * o.probabilidad / 100.0), 0)::numeric(12, 2)
                                                           as importe_ponderado
    from public.oportunidades o
   where o.etapa not in ('ganada', 'perdida')
   group by o.etapa;

comment on view public.v_embudo is 'Embudo comercial abierto, por etapa.';

create view public.v_kpis with (security_invoker = true) as
  select (select count(*) from public.cuentas where estado = 'activo')          as cuentas_activas,
         (select count(*) from public.contactos where estado = 'activo')        as contactos_activos,
         (select count(*) from public.oportunidades
           where etapa not in ('ganada', 'perdida'))                            as oportunidades_abiertas,
         (select coalesce(sum(importe_estimado), 0) from public.oportunidades
           where etapa not in ('ganada', 'perdida'))                            as embudo_importe,
         (select coalesce(sum(importe_estimado), 0) from public.oportunidades
           where etapa = 'ganada'
             and date_trunc('year', coalesce(fecha_cierre_real, current_date))
                 = date_trunc('year', current_date))                            as ganado_ejercicio,
         (select count(*) from public.incidencias
           where estado not in ('resuelta', 'cerrada'))                         as incidencias_abiertas,
         (select count(*) from public.incidencias
           where estado not in ('resuelta', 'cerrada')
             and fecha_limite_sla < now())                                      as incidencias_sla_vencido,
         (select count(*) from public.solicitudes_rgpd
           where estado in ('recibida', 'en_tramite'))                          as solicitudes_rgpd_pendientes;

comment on view public.v_kpis is 'Indicadores de la pantalla de inicio.';

create view public.v_incidencias_sla with (security_invoker = true) as
  select i.id,
         i.referencia,
         i.estado,
         i.prioridad,
         i.fecha_apertura,
         i.fecha_limite_sla,
         c.razon_social,
         p.nombre || ' ' || p.apellidos                as asignado,
         (i.fecha_limite_sla < now())                  as sla_vencido,
         round(extract(epoch from (i.fecha_limite_sla - now())) / 3600.0, 1)
                                                       as horas_restantes
    from public.incidencias i
    join public.cuentas c   on c.id = i.cuenta_id
    left join public.perfiles p on p.id = i.asignado_a
   where i.estado not in ('resuelta', 'cerrada');

comment on view public.v_incidencias_sla is
  'Incidencias abiertas con el margen restante hasta el vencimiento del SLA.';

create view public.v_cuentas_resumen with (security_invoker = true) as
  select c.id,
         c.razon_social,
         c.nif,
         c.tipo_cliente,
         c.segmento,
         c.provincia,
         c.estado,
         p.nombre || ' ' || p.apellidos                                     as propietario,
         (select count(*) from public.contactos ct
           where ct.cuenta_id = c.id and ct.estado = 'activo')              as contactos,
         (select count(*) from public.oportunidades o where o.cuenta_id = c.id) as oportunidades,
         (select coalesce(sum(o.importe_estimado), 0) from public.oportunidades o
           where o.cuenta_id = c.id and o.etapa = 'ganada')                 as facturado_ganado,
         (select count(*) from public.incidencias i
           where i.cuenta_id = c.id and i.estado not in ('resuelta', 'cerrada')) as incidencias_abiertas
    from public.cuentas c
    left join public.perfiles p on p.id = c.propietario_id;

comment on view public.v_cuentas_resumen is 'Ficha resumida de cliente para el listado.';

grant select on public.v_embudo, public.v_kpis,
                public.v_incidencias_sla, public.v_cuentas_resumen
  to authenticated;
