-- HAPPA · Migración 22: entrar con Google (y, más adelante, con otros proveedores)
--
-- Reglas:
--   · Quien entra con Google no pasa por el formulario de registro, así que no ha aceptado los términos ni
--     la privacidad, ni ha dicho si es mayor de edad. Hasta que lo haga en la pantalla "Antes de empezar"
--     (/bienvenida), la app no le deja usarla: needs_signup_completion() dice si le falta.
--   · complete_signup guarda lo mismo que el registro normal (migraciones 4 y 19): el nombre, el idioma,
--     los documentos aceptados con su versión y las dos decisiones opcionales de privacidad.
--   · El perfil coge el nombre que da Google (full_name / name) si no viene display_name.

-- ═════════════ 1. Al registrarse: el nombre de Google ═════════════
-- Igual que en la migración 19, pero el nombre también puede venir de Google (full_name o name).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_tz      text  := new.raw_user_meta_data ->> 'timezone';
  v_legal   jsonb := new.raw_user_meta_data -> 'legal';
  v_choices jsonb := new.raw_user_meta_data -> 'choices';
  v_doc     text;
  v_ver     text;
  v_purpose text;
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

  v_ver := v_choices ->> 'version';
  if jsonb_typeof(v_choices) = 'object' and char_length(coalesce(v_ver, '')) between 1 and 20 then
    foreach v_purpose in array array['marketing', 'partners'] loop
      insert into public.privacy_choices (user_id, purpose, granted, text_version, source)
      values (new.id, v_purpose, coalesce(v_choices -> v_purpose = 'true'::jsonb, false), v_ver, 'signup');
    end loop;
  end if;

  return new;
end $$;

-- ═════════════ 2. ¿Le falta terminar el registro? ═════════════
-- true si quien pregunta no ha aceptado nunca los términos (entró con Google y aún no pasó por /bienvenida).
-- Los menores no: sus términos los acepta el adulto que los gestiona.
create function public.needs_signup_completion() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.deleted_at is null and not p.is_minor)
     and not exists (select 1 from public.legal_consents c
                     where c.user_id = (select auth.uid()) and c.document = 'terms');
$$;

-- ═════════════ 3. Terminar el registro ═════════════
create function public.complete_signup(
  p_display_name  text,
  p_locale        text,
  p_terms         text,
  p_privacy       text,
  p_is_adult      boolean,
  p_marketing     boolean,
  p_partners      boolean,
  p_choices       text
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
  if p_is_adult is distinct from true then raise exception 'You must be an adult'; end if;
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

  -- Las dos decisiones, también si son "no" (queda constancia de que se preguntó), como en el registro
  insert into public.privacy_choices (user_id, purpose, granted, text_version, source) values
    (uid, 'marketing', coalesce(p_marketing, false), p_choices, 'signup'),
    (uid, 'partners', coalesce(p_partners, false), p_choices, 'signup');
end $$;

-- ═════════════ 4. Permisos de ejecución ═════════════
revoke execute on function public.needs_signup_completion() from public, anon;
revoke execute on function public.complete_signup(text, text, text, text, boolean, boolean, boolean, text) from public, anon;
grant execute on function public.needs_signup_completion() to authenticated;
grant execute on function public.complete_signup(text, text, text, text, boolean, boolean, boolean, text) to authenticated;
