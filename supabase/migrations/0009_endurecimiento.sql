-- =============================================================================
-- crmbas · 0009 · Endurecimiento de la superficie expuesta
--
-- PostgREST publica como endpoint `/rest/v1/rpc/<función>` toda función del
-- esquema `public` con permiso EXECUTE. Ese permiso se concede por defecto al
-- pseudo-rol PUBLIC, del que heredan `anon` y `authenticated`, así que revocar
-- solo a `anon` no basta: hay que revocar a PUBLIC.
--
-- Las funciones de disparador no necesitan EXECUTE para dispararse: PostgreSQL
-- comprueba ese permiso al crear el disparador, no al ejecutarlo.
-- =============================================================================

revoke execute on function public.crear_perfil_para_usuario()  from public, anon, authenticated;
revoke execute on function public.tocar_actualizado_en()        from public, anon, authenticated;
revoke execute on function public.registrar_auditoria()         from public, anon, authenticated;
revoke execute on function public.asignar_referencia()          from public, anon, authenticated;
revoke execute on function public.siguiente_referencia(text)    from public, anon, authenticated;
revoke execute on function public.asignar_numero_presupuesto()  from public, anon, authenticated;
revoke execute on function public.sellar_presupuesto()          from public, anon, authenticated;
revoke execute on function public.recalcular_presupuesto()      from public, anon, authenticated;
revoke execute on function public.calcular_sla()                from public, anon, authenticated;

-- Los validadores son funciones puras y sin efectos, pero tampoco tienen por qué
-- ser accesibles sin sesión.
revoke execute on function public.es_nif_persona_valido(text)   from public, anon;
revoke execute on function public.es_nif_entidad_valido(text)   from public, anon;
revoke execute on function public.es_nif_valido(text)           from public, anon;
revoke execute on function public.es_iban_valido(text)          from public, anon;
revoke execute on function public.es_codigo_postal_valido(text) from public, anon;

grant execute on function public.es_nif_valido(text)            to authenticated;
grant execute on function public.es_iban_valido(text)           to authenticated;
grant execute on function public.es_codigo_postal_valido(text)  to authenticated;

-- `rol_actual`, `es_admin` y `puede_editar` sí permanecen accesibles para las
-- sesiones iniciadas: las políticas RLS las evalúan con los permisos de quien
-- consulta, de modo que sin EXECUTE ninguna consulta devolvería filas. Exponerlas
-- no filtra nada, porque cada una responde únicamente sobre quien la llama.
revoke execute on function public.rol_actual()   from public, anon;
revoke execute on function public.es_admin()     from public, anon;
revoke execute on function public.puede_editar() from public, anon;

-- Ninguna función futura del esquema quedará expuesta por omisión.
alter default privileges in schema public revoke execute on functions from public;
