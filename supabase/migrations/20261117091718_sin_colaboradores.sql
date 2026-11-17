-- HAPPA · Migración 25: sin cesión a empresas colaboradoras y edad mínima de 16 años (textos legales v3)
--
-- Reglas:
--   · Ya no se ceden datos a empresas colaboradoras: la única decisión opcional de privacidad es recibir
--     novedades de HAPPA ('marketing'). Las filas antiguas de 'partners' se conservan como historial (prueba de
--     lo que cada persona decidió), pero quien lo tenía aceptado pasa a "no" con una fila nueva de origen
--     'system' (lo retiró HAPPA, no la persona). Si algún día vuelve a haber colaboradores, habrá que
--     preguntar de nuevo con un texto nuevo (ver las notas del PDF de los textos legales).
--   · Se borra la lista para colaboradores (private.partners_optin, migración 19): ya no hay a quién dársela.
--   · Edad mínima: 16 años (antes, mayoría de edad). La BD no guarda la edad: solo exige que se declare.

-- ═════════════ 1. Las decisiones que retira HAPPA ═════════════
alter table public.privacy_choices drop constraint privacy_choices_source_check;
alter table public.privacy_choices
  add constraint privacy_choices_source_check check (source in ('signup', 'settings', 'system'));

-- Quien tiene 'partners' aceptado ahora mismo (su última decisión es "sí") pasa a "no"
insert into public.privacy_choices (user_id, purpose, granted, text_version, source)
select l.user_id, 'partners', false, 'v4', 'system'
from (
  select distinct on (c.user_id) c.user_id, c.granted
  from public.privacy_choices c
  where c.purpose = 'partners'
  order by c.user_id, c.created_at desc, c.id desc
) l
where l.granted;

drop view if exists private.partners_optin;

-- ═════════════ 2. Al registrarse: solo la decisión de novedades ═════════════
-- Igual que en la migración 22, pero sin 'partners'
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_tz      text  := new.raw_user_meta_data ->> 'timezone';
  v_legal   jsonb := new.raw_user_meta_data -> 'legal';
  v_choices jsonb := new.raw_user_meta_data -> 'choices';
  v_doc     text;
  v_ver     text;
begin
  insert into public.profiles (id, display_name, locale, timezone)
  values (
    new.id,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ), 60),
    case when new.raw_user_meta_data ->> 'locale' in ('es', 'en')
         then new.raw_user_meta_data ->> 'locale' else 'es' end,
    case when v_tz is not null and public.is_valid_timezone(v_tz) then v_tz else 'Europe/Madrid' end
  );

  if jsonb_typeof(v_legal) = 'object' then
    for v_doc, v_ver in select key, value from jsonb_each_text(v_legal) loop
      if v_doc in ('terms', 'privacy') and char_length(coalesce(v_ver, '')) between 1 and 20 then
        insert into public.legal_consents (user_id, accepted_by, document, version)
        values (new.id, new.id, v_doc, v_ver)
        on conflict (user_id, document, version) do nothing;
      end if;
    end loop;
  end if;

  -- La decisión de novedades, también si es "no" (queda constancia de que se preguntó)
  v_ver := v_choices ->> 'version';
  if jsonb_typeof(v_choices) = 'object' and char_length(coalesce(v_ver, '')) between 1 and 20 then
    insert into public.privacy_choices (user_id, purpose, granted, text_version, source)
    values (new.id, 'marketing', coalesce(v_choices -> 'marketing' = 'true'::jsonb, false), v_ver, 'signup');
  end if;

  return new;
end $$;

-- ═════════════ 3. "Antes de empezar" (Google): sin 'partners' y con la edad de 16 ═════════════
-- Cambian los parámetros, así que hay que borrarla y crearla de nuevo (no vale create or replace)
drop function if exists public.complete_signup(text, text, text, text, boolean, boolean, boolean, text);

create function public.complete_signup(
  p_display_name    text,
  p_locale          text,
  p_terms           text,
  p_privacy         text,
  p_is_old_enough   boolean,
  p_marketing       boolean,
  p_choices         text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid    uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_display_name, ''));
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = uid and deleted_at is null and not is_minor) then
    raise exception 'Not authenticated';
  end if;
  if p_is_old_enough is distinct from true then raise exception 'You must be 16 or older'; end if;
  if char_length(v_name) not between 1 and 60 then raise exception 'Invalid name'; end if;
  if char_length(coalesce(p_terms, '')) not between 1 and 20
     or char_length(coalesce(p_privacy, '')) not between 1 and 20
     or char_length(coalesce(p_choices, '')) not between 1 and 20 then
    raise exception 'Invalid version';
  end if;

  update public.profiles
  set display_name = v_name,
      locale = case when p_locale in ('es', 'en') then p_locale else locale end
  where id = uid;

  insert into public.legal_consents (user_id, accepted_by, document, version) values
    (uid, uid, 'terms', p_terms),
    (uid, uid, 'privacy', p_privacy)
  on conflict (user_id, document, version) do nothing;

  -- La decisión de novedades, también si es "no", como en el registro
  insert into public.privacy_choices (user_id, purpose, granted, text_version, source)
  values (uid, 'marketing', coalesce(p_marketing, false), p_choices, 'signup');
end $$;

revoke execute on function public.complete_signup(text, text, text, text, boolean, boolean, text) from public, anon;
grant execute on function public.complete_signup(text, text, text, text, boolean, boolean, text) to authenticated;

-- ═════════════ 4. Perfil → Privacidad: solo novedades ═════════════
create or replace function public.set_privacy_choice(p_purpose text, p_granted boolean, p_version text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_minor boolean;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select is_minor into v_minor from public.profiles where id = uid and deleted_at is null;
  if not found then raise exception 'Not authenticated'; end if;
  if v_minor then raise exception 'Minor accounts cannot change this'; end if;
  if p_purpose is distinct from 'marketing' then raise exception 'Invalid choice'; end if;
  if p_granted is null then raise exception 'Invalid choice'; end if;
  if char_length(coalesce(p_version, '')) not between 1 and 20 then raise exception 'Invalid choice'; end if;

  insert into public.privacy_choices (user_id, purpose, granted, text_version, source)
  values (uid, p_purpose, p_granted, p_version, 'settings');
end $$;
