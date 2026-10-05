-- HAPPA · Migración 17: la ruleta, sin escribir qué toca
--
-- Se gira eligiendo solo quién entra: el texto del marrón ("Bajar la basura") no servía de nada.
-- Se quita la columna y spin_roulette deja de pedirlo. Todo lo demás (quién gira, quién entra, el azar,
-- el aviso, el límite de 6 por minuto, en vivo) sigue igual que en la migración 16.

-- ───────────── Fuera el texto ─────────────
-- Primero la función (devuelve una fila de la tabla), luego la columna
drop function public.spin_roulette(uuid, text, uuid[]);
alter table public.roulette_spins drop column title;

-- ───────────── Girar ─────────────
create function public.spin_roulette(p_household uuid, p_participants uuid[])
returns public.roulette_spins language plpgsql security definer set search_path = '' as $$
declare
  uid      uuid := (select auth.uid());
  v_people uuid[];
  v_spin   public.roulette_spins;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adults can spin the roulette'; end if;

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
  insert into public.roulette_spins (household_id, spun_by, chosen_id)
  values (p_household, uid, v_people[1 + floor(random() * cardinality(v_people))::integer])
  returning * into v_spin;
  insert into public.roulette_participants (spin_id, user_id)
  select v_spin.id, x from unnest(v_people) as x;

  perform public.notify(
    v_spin.chosen_id, p_household, 'roulette_chosen', uid, v_spin.id,
    jsonb_build_object('count', cardinality(v_people)),
    '/hogar/' || p_household || '/ruleta'
  );
  return v_spin;
end $$;

revoke execute on function public.spin_roulette(uuid, uuid[]) from public, anon;
grant execute on function public.spin_roulette(uuid, uuid[]) to authenticated;
