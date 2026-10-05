-- HAPPA · Migración 16: la ruleta del marrón
--
-- Cuando nadie quiere hacer algo, un adulto gira la ruleta con quienes entran y la base de datos elige
-- al azar (el móvil solo anima la rueda hasta ese resultado, así nadie puede trucarlo). Todos lo ven en
-- vivo y queda el historial.
--   · Giran los adultos del hogar (admin y miembros). Los menores entran si un adulto los incluye.
--   · Entran de 2 a 20 personas que vivan en el hogar (el casero no).
--   · A quien le toca le llega un aviso (salvo que sea quien gira). Va con los avisos de tareas.
--   · Como mucho 6 giros por minuto y persona, para no llenar de avisos a nadie.

-- ───────────── Aviso nuevo ─────────────
-- (Se usa dentro de funciones, que lo leen al ejecutarse: vale aunque se añada en esta misma migración)
alter type public.notification_type add value if not exists 'roulette_chosen';

-- ───────────── Tablas ─────────────
create table public.roulette_spins (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  -- El marrón ("Bajar la basura")
  title        text not null check (char_length(title) between 1 and 80),
  spun_by      uuid references public.profiles (id) on delete set null,
  chosen_id    uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default clock_timestamp()
);
create index roulette_spins_household_idx on public.roulette_spins (household_id, created_at desc);
create index roulette_spins_spun_by_idx on public.roulette_spins (spun_by, created_at desc);
create index roulette_spins_chosen_idx on public.roulette_spins (chosen_id);

-- Quiénes entraron en cada giro
create table public.roulette_participants (
  spin_id uuid not null references public.roulette_spins (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (spin_id, user_id)
);
create index roulette_participants_user_idx on public.roulette_participants (user_id);

-- Solo se leen (se escriben con spin_roulette). Las ven quienes viven en el hogar.
revoke all on public.roulette_spins, public.roulette_participants from anon, authenticated;
grant select on public.roulette_spins, public.roulette_participants to authenticated;
alter table public.roulette_spins enable row level security;
alter table public.roulette_participants enable row level security;

create policy "roulette_spins_select" on public.roulette_spins for select to authenticated
  using (public.is_household_resident(household_id));
create policy "roulette_participants_select" on public.roulette_participants for select to authenticated
  using (exists (select 1 from public.roulette_spins s
                 where s.id = spin_id and public.is_household_resident(s.household_id)));

-- ───────────── Girar ─────────────
create function public.spin_roulette(p_household uuid, p_title text, p_participants uuid[])
returns public.roulette_spins language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := (select auth.uid());
  v_title text := btrim(coalesce(p_title, ''), E' \t\r\n');
  v_people uuid[];
  v_spin  public.roulette_spins;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_adult(p_household) then raise exception 'Only adults can spin the roulette'; end if;
  if char_length(v_title) = 0 then raise exception 'Title is required'; end if;
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
  insert into public.roulette_spins (household_id, title, spun_by, chosen_id)
  values (p_household, v_title, uid, v_people[1 + floor(random() * cardinality(v_people))::integer])
  returning * into v_spin;
  insert into public.roulette_participants (spin_id, user_id)
  select v_spin.id, x from unnest(v_people) as x;

  perform public.notify(
    v_spin.chosen_id, p_household, 'roulette_chosen', uid, v_spin.id,
    jsonb_build_object('title', v_title, 'count', cardinality(v_people)),
    '/hogar/' || p_household || '/ruleta'
  );
  return v_spin;
end $$;

revoke execute on function public.spin_roulette(uuid, text, uuid[]) from public, anon;
grant execute on function public.spin_roulette(uuid, text, uuid[]) to authenticated;

-- ───────────── En vivo ─────────────
-- Cuando alguien gira, los demás ven la rueda girar hasta el mismo resultado
alter publication supabase_realtime add table public.roulette_spins;
