-- =============================================================================
-- crmbas · 0002 · Validaciones de identificadores oficiales españoles
--
-- Interoperabilidad y conectividad: los identificadores se normalizan y validan
-- en la propia base de datos, de forma que cualquier sistema que consuma la API
-- (Facturae, PEPPOL, ERP, pasarelas de facturación) recibe datos ya conformes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NIF de persona física: 8 dígitos + letra de control (mod 23).
-- NIE: inicial X/Y/Z equivalente a 0/1/2 + 7 dígitos + letra.
-- Referencia: Real Decreto 1065/2007, art. 18 y disposiciones de la AEAT.
-- -----------------------------------------------------------------------------
create or replace function public.es_nif_persona_valido(p_doc text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_doc   text := upper(regexp_replace(coalesce(p_doc, ''), '[\s-]', '', 'g'));
  v_letras constant text := 'TRWAGMYFPDXBNJZSQVHLCKE';
  v_cuerpo text;
begin
  if v_doc !~ '^[0-9XYZ][0-9]{7}[A-Z]$' then
    return false;
  end if;

  v_cuerpo := case left(v_doc, 1)
                when 'X' then '0'
                when 'Y' then '1'
                when 'Z' then '2'
                else left(v_doc, 1)
              end || substring(v_doc from 2 for 7);

  -- El desplazamiento de substring debe ser integer: con search_path vacío no
  -- hay conversión implícita desde bigint.
  return right(v_doc, 1)
       = substring(v_letras from ((v_cuerpo::bigint % 23) + 1)::int for 1);
end;
$$;

-- -----------------------------------------------------------------------------
-- NIF de persona jurídica (antiguo CIF): letra + 7 dígitos + control.
-- El control es numérico para A, B, E, H; alfabético para K, P, Q, R, S, N, W;
-- y admite ambas formas para el resto de claves.
-- -----------------------------------------------------------------------------
create or replace function public.es_nif_entidad_valido(p_doc text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_doc     text := upper(regexp_replace(coalesce(p_doc, ''), '[\s-]', '', 'g'));
  v_clave   text;
  v_digitos text;
  v_suma    int := 0;
  v_par     int;
  v_i       int;
  v_control int;
  v_ult     text;
begin
  if v_doc !~ '^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$' then
    return false;
  end if;

  v_clave   := left(v_doc, 1);
  v_digitos := substring(v_doc from 2 for 7);
  v_ult     := right(v_doc, 1);

  -- Posiciones impares (1.ª, 3.ª, 5.ª, 7.ª): se duplican y se suman sus cifras.
  -- Posiciones pares (2.ª, 4.ª, 6.ª): se suman tal cual.
  for v_i in 1..7 loop
    if v_i % 2 = 1 then
      v_par  := substring(v_digitos from v_i for 1)::int * 2;
      v_suma := v_suma + (v_par / 10) + (v_par % 10);
    else
      v_suma := v_suma + substring(v_digitos from v_i for 1)::int;
    end if;
  end loop;

  v_control := (10 - (v_suma % 10)) % 10;

  if v_clave in ('A', 'B', 'E', 'H') then
    return v_ult = v_control::text;
  elsif v_clave in ('K', 'P', 'Q', 'R', 'S', 'N', 'W') then
    return v_ult = substring('JABCDEFGHI' from v_control + 1 for 1);
  else
    return v_ult = v_control::text
        or v_ult = substring('JABCDEFGHI' from v_control + 1 for 1);
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Validador único usado por las restricciones CHECK de las tablas.
-- -----------------------------------------------------------------------------
create or replace function public.es_nif_valido(p_doc text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select public.es_nif_persona_valido(p_doc)
      or public.es_nif_entidad_valido(p_doc);
$$;

-- -----------------------------------------------------------------------------
-- IBAN: validación estructural y dígitos de control mod-97 (ISO 13616 / UNE-EN).
-- El resto se calcula por tramos para evitar desbordamiento de enteros.
-- -----------------------------------------------------------------------------
create or replace function public.es_iban_valido(p_iban text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_iban   text := upper(regexp_replace(coalesce(p_iban, ''), '[\s-]', '', 'g'));
  v_reord  text;
  v_num    text := '';
  v_ch     text;
  v_i      int;
  v_resto  bigint := 0;
begin
  if v_iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$' then
    return false;
  end if;

  -- Los cuatro primeros caracteres pasan al final y cada letra se sustituye
  -- por su posición en el alfabeto más nueve (A = 10 ... Z = 35).
  v_reord := substring(v_iban from 5) || left(v_iban, 4);

  for v_i in 1..length(v_reord) loop
    v_ch := substring(v_reord from v_i for 1);
    v_num := v_num || case
               when v_ch ~ '[0-9]' then v_ch
               else (ascii(v_ch) - 55)::text
             end;
  end loop;

  for v_i in 1..length(v_num) loop
    v_resto := (v_resto * 10 + substring(v_num from v_i for 1)::int) % 97;
  end loop;

  return v_resto = 1;
end;
$$;

-- -----------------------------------------------------------------------------
-- Código postal español: cinco dígitos cuyos dos primeros son el código de
-- provincia del INE (01 Álava … 52 Melilla).
-- -----------------------------------------------------------------------------
create or replace function public.es_codigo_postal_valido(p_cp text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_cp, '') ~ '^[0-9]{5}$'
     and left(p_cp, 2)::int between 1 and 52;
$$;

comment on function public.es_nif_valido is
  'Valida NIF, NIE y NIF de entidad según los algoritmos oficiales de la AEAT.';
comment on function public.es_iban_valido is
  'Valida un IBAN mediante los dígitos de control mod-97 definidos en ISO 13616.';
comment on function public.es_codigo_postal_valido is
  'Valida un código postal español contra el rango de provincias del INE.';
