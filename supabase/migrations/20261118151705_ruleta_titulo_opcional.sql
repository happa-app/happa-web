-- HAPPA · Migración 30: la ruleta vuelve a poder decir qué toca (opcional)
--
-- La migración 17 quitó el título obligatorio. Vuelve, pero OPCIONAL: si no se escribe nada se gira igual.
-- Sirve para saber en el historial y en el aviso de qué era cada tirada ("Bajar la basura").
-- Todo lo demás (quién gira, quién entra, el azar, el límite de 6 por minuto, en vivo) sigue igual que en la 17.

-- ───────────── El texto, opcional ─────────────
alter table public.roulette_spins
  add column title text check (title is null or char_length(title) between 1 and 80);

-- ───────────── Girar ─────────────
-- Cambia la firma (nuevo parámetro al final, con valor por defecto): se borra la de la migración 17
drop function public.spin_roulette(uuid, uuid[]);

create function public.spin_roulette(p_household uuid, p_participants uuid[], p_title text default null)
returns public.roulette_spins language plpgsql security definer set search_path = '' as $$
declare
  uid      uuid := (select auth.uid());
  v_people uuid[];
  -- Sin espacios a los lados; vacío = sin título
  v_title  text := nullif(btrim(coalesce(p_title, ''), E' \t\r\n'), '');
  v_spin   public.roulette_spins;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adults can spin the roulette'; end if;
  if char_length(v_title) > 80 then raise exception 'Title is too long'; end if;

  -- Sin repetidos ni vacíos
  select coalesce(array_agg(distinct x), '{}') into v_people
  from unnest(coalesce(p_participants, '{}')) as x where x is not null;
  if cardinality(v_people) < 2 then raise exception 'At least two people'; end if;
  if cardinality(v_people) > 20 then raise exception 'Too many people'; end if;
  -- Todos viven en el hogar (adultos o menores; el casero no)
  if exists (
    select 1 from unnest(v_people) as x
    where not exists (
      select 1 from public.household_members m
      where m.household_id = p_household and m.user_id = x and m.left_at is null
        and m.role in ('admin', 'member', 'minor')
    )
  ) then
    raise exception 'Someone does not live here';
  end if;

  -- Uno detrás de otro para la misma persona (si no, varios giros a la vez se saltarían el límite)
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('roulette:' || uid::text, 0));
  if (select count(*) from public.roulette_spins
      where spun_by = uid and created_at > clock_timestamp() - interval '1 minute') >= 6 then
    raise exception 'Too many spins';
  end if;

  -- El azar: uno de los que entran, todos con las mismas posibilidades
  insert into public.roulette_spins (household_id, spun_by, chosen_id, title)
  values (p_household, uid, v_people[1 + floor(random() * cardinality(v_people))::integer], v_title)
  returning * into v_spin;
  insert into public.roulette_participants (spin_id, user_id)
  select v_spin.id, x from unnest(v_people) as x;

  -- El aviso lleva el título solo si lo hay (jsonb_strip_nulls quita "title": null)
  perform public.notify(
    v_spin.chosen_id, p_household, 'roulette_chosen', uid, v_spin.id,
    jsonb_strip_nulls(jsonb_build_object('count', cardinality(v_people), 'title', v_title)),
    '/hogar/' || p_household || '/ruleta'
  );
  return v_spin;
end $$;

revoke execute on function public.spin_roulette(uuid, uuid[], text) from public, anon;
grant execute on function public.spin_roulette(uuid, uuid[], text) to authenticated;
