-- HAPPA · Migración 4: guardar el consentimiento legal en el momento del registro
--
-- El formulario de registro manda en los metadatos qué versión de los términos
-- y de la privacidad aceptó la persona: { "legal": { "terms": "v", "privacy": "v" } }.
-- Este disparador los guarda en legal_consents a la vez que crea el perfil,
-- con la fecha del servidor. Si no vienen, no guarda nada.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_tz    text  := new.raw_user_meta_data ->> 'timezone';
  v_legal jsonb := new.raw_user_meta_data -> 'legal';
  v_doc   text;
  v_ver   text;
begin
  insert into public.profiles (id, display_name, locale, timezone)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 60),
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

  return new;
end $$;
