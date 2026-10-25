-- HAPPA · Datos de prueba para la base de datos LOCAL (se cargan solos con `npx supabase db reset`)
--
-- Nunca se ejecuta en la oficial: `db push` solo sube las migraciones, no este archivo.
--
-- Usuarios (contraseña de todos: happa1234):
--   · ana@happa.test    → admin del "Piso de prueba"; aceptó las dos opciones de privacidad al registrarse
--   · bruno@happa.test  → miembro del piso; no aceptó ninguna de las dos al registrarse
--   · carla@happa.test  → miembro del piso (tiene un gasto pendiente de confirmar); usuaria "de antes":
--                          nunca se le preguntó por la privacidad
--   · dani@happa.test   → sin hogar (para probar crear un hogar o unirse con el código)
--   · eva@happa.test    → como si hubiera entrado con Google: nombre de Google y sin términos aceptados, así
--                          que al entrar va a "Antes de empezar" (/bienvenida). Tiene contraseña solo para
--                          poder probarlo en local sin configurar Google
--
-- Los datos se crean con las mismas funciones que usa la app, haciéndose pasar por cada persona
-- (como hace Supabase en cada petición): así se cumplen las mismas reglas y permisos. Si una migración
-- cambia una regla y esto deja de cumplirla, `db reset` fallará y lo verás enseguida.
-- Las fechas van respecto a hoy, para que los datos parezcan recientes en cada reset.

-- ═════════════ 1. Usuarios ═════════════
-- El trigger handle_new_user crea el perfil y guarda los consentimientos legales y las decisiones de
-- privacidad ("choices"), como en el registro.
-- Las versiones de "legal" y "choices" tienen que coincidir con src/features/legal/versions.ts.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('happa1234', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}',
  jsonb_build_object(
    'display_name', u.name, 'locale', 'es', 'timezone', 'Europe/Madrid',
    'legal', jsonb_build_object('terms', 'v1-2026-10-08', 'privacy', 'v1-2026-10-25b')
  ) || u.choices,
  now(), now(), '', '', '', ''
from (values
  ('00000000-0000-4000-8000-00000000000a'::uuid, 'ana@happa.test',   'Ana',
   '{"choices": {"marketing": true, "partners": true, "version": "v3"}}'::jsonb),
  ('00000000-0000-4000-8000-00000000000b'::uuid, 'bruno@happa.test', 'Bruno',
   '{"choices": {"marketing": false, "partners": false, "version": "v3"}}'::jsonb),
  ('00000000-0000-4000-8000-00000000000c'::uuid, 'carla@happa.test', 'Carla', '{}'::jsonb),
  ('00000000-0000-4000-8000-00000000000d'::uuid, 'dani@happa.test',  'Dani', '{}'::jsonb)
) as u (id, email, name, choices);

-- Eva: como llegan los datos de Google (full_name, sin "legal" ni "choices")
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-00000000000e', 'authenticated', 'authenticated',
  'eva@happa.test', extensions.crypt('happa1234', extensions.gen_salt('bf')), now(),
  '{"provider": "google", "providers": ["google", "email"]}',
  '{"full_name": "Eva Martín", "name": "Eva Martín"}',
  now(), now(), '', '', '', ''
);

-- Sin su "identidad" de correo, Supabase Auth no deja iniciar sesión con contraseña
insert into auth.identities (id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, 'email', id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       now(), now(), now()
from auth.users
where email like '%@happa.test';

-- ═════════════ 2. El piso y todo lo que hay en él ═════════════
-- Cada bloque "do" es lo que haría una persona en la app. Todo el seed va en UNA transacción, pero en la
-- app cada petición es una transacción aparte, y eso importa: los avisos de gastos se crean "al terminar"
-- (triggers deferrable) y toman como autor a quien sea auth.uid() en ese momento. Por eso cada bloque
-- acaba con "set constraints all immediate" (dispara ya esos avisos, con esta persona como autora),
-- vuelve a dejarlos para el final ("deferred") y quita el rol con "reset role".
--
-- Para "ser" alguien: se pone su id en request.jwt.claims (de ahí lo lee auth.uid()) y se cambia al rol
-- authenticated, así que RLS se aplica igual que en la app. Los ids que hagan falta (el hogar, un gasto)
-- se buscan antes, todavía como administrador.
--
-- Ids: Ana …0a · Bruno …0b · Carla …0c

-- ───────────── Ana crea el piso ─────────────
do $$
begin
  perform set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);
  set local role authenticated;
  perform public.create_household('Piso de prueba', 'student_flat', 4, '28004');
  set constraints all immediate;
  set constraints all deferred;
  reset role;
end $$;

-- ───────────── Bruno y Carla entran con el código de invitación ─────────────
do $$
declare
  codigo text := (select invite_code from public.households where name = 'Piso de prueba');
begin
  perform set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000b", "role": "authenticated"}', true);
  set local role authenticated;
  perform public.join_household(codigo);
  set constraints all immediate;
  set constraints all deferred;
  reset role;
end $$;

do $$
declare
  codigo text := (select invite_code from public.households where name = 'Piso de prueba');
begin
  perform set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000c", "role": "authenticated"}', true);
  set local role authenticated;
  perform public.join_household(codigo);
  set constraints all immediate;
  set constraints all deferred;
  reset role;
end $$;

-- ───────────── Ana: compra, gastos, horario, tareas y chat ─────────────
do $$
declare
  ana   constant uuid := '00000000-0000-4000-8000-00000000000a';
  bruno constant uuid := '00000000-0000-4000-8000-00000000000b';
  carla constant uuid := '00000000-0000-4000-8000-00000000000c';
  -- Reparto a partes iguales entre los tres (formato que esperan las funciones de gastos)
  a_partes_iguales constant jsonb := jsonb_build_array(
    jsonb_build_object('user_id', ana), jsonb_build_object('user_id', bruno), jsonb_build_object('user_id', carla)
  );
  hogar uuid := (select id from public.households where name = 'Piso de prueba');
  chat  uuid := (select id from public.conversations where household_id = hogar and kind = 'tenants');
begin
  perform set_config('request.jwt.claims', json_build_object('sub', ana, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.shopping_items (household_id, name, quantity) values
    (hogar, 'Leche', 2),
    (hogar, 'Pan', 1),
    (hogar, 'Huevos', 12);
  -- Su lista personal (solo la ve ella)
  insert into public.shopping_items (owner_id, name, quantity) values (ana, 'Cargador del móvil', 1);

  -- Bruno y Carla lo confirman más abajo
  perform public.create_expense(
    hogar, 'Compra del súper', 4560, current_date - 5, 'equal',
    jsonb_build_array(jsonb_build_object('user_id', ana, 'amount_cents', 4560)),
    a_partes_iguales
  );

  -- Internet: gasto fijo mensual, empezado hace unas semanas para que ya tenga algún cargo
  perform public.create_recurring_expense(
    hogar, 'Internet (fibra)', 3000, 'monthly', current_date - 40, ana, 'equal', a_partes_iguales
  );

  perform public.add_schedule_blocks(hogar, array[1, 2, 3, 4, 5], '09:00', '14:00', 'class', 'Facultad');

  -- Tareas (la BD no deja empezarlas antes de hoy, y "hoy" es el de la zona horaria del hogar: con
  -- current_date, que va en UTC, entre las 0:00 y las 2:00 de Madrid sería "ayer" y fallaría)
  perform public.create_chore(
    hogar, 'Fregar los platos', 2, 'daily', 1, null, (now() at time zone 'Europe/Madrid')::date, 'rotation', array[ana, bruno, carla]
  );
  perform public.create_chore(
    hogar, 'Sacar la basura', 1, 'weekly', 1, array[1, 3, 5], (now() at time zone 'Europe/Madrid')::date, 'fixed', array[bruno]
  );
  perform public.create_chore(
    hogar, 'Limpiar el baño', 3, 'weekly', 1, array[6], (now() at time zone 'Europe/Madrid')::date, 'rotation', array[carla, ana]
  );

  perform public.send_message(chat, '¡Bienvenidos al piso! 🏠');
  -- Una votación (Bruno vota más abajo)
  perform public.create_poll(chat, '¿Qué cenamos el viernes?', array['Pizza', 'Sushi', 'Tacos'], false, false);
  set constraints all immediate;
  set constraints all deferred;
  reset role;
end $$;

-- ───────────── Bruno: confirma el súper, paga la bombona, horario, ausencia y compra ─────────────
do $$
declare
  ana   constant uuid := '00000000-0000-4000-8000-00000000000a';
  bruno constant uuid := '00000000-0000-4000-8000-00000000000b';
  carla constant uuid := '00000000-0000-4000-8000-00000000000c';
  a_partes_iguales constant jsonb := jsonb_build_array(
    jsonb_build_object('user_id', ana), jsonb_build_object('user_id', bruno), jsonb_build_object('user_id', carla)
  );
  hogar uuid := (select id from public.households where name = 'Piso de prueba');
  chat  uuid := (select id from public.conversations where household_id = hogar and kind = 'tenants');
  super public.expenses := (select e from public.expenses e where e.household_id = hogar and e.description = 'Compra del súper');
begin
  perform set_config('request.jwt.claims', json_build_object('sub', bruno, 'role', 'authenticated')::text, true);
  set local role authenticated;

  perform public.confirm_expense(super.id, super.version);

  -- Ana lo confirma más abajo; Carla no, para que tenga algo pendiente
  perform public.create_expense(
    hogar, 'Bombona de butano', 3600, current_date - 1, 'equal',
    jsonb_build_array(jsonb_build_object('user_id', bruno, 'amount_cents', 3600)),
    a_partes_iguales
  );

  perform public.add_schedule_blocks(hogar, array[1, 2, 3, 4, 5], '08:00', '16:00', 'work', 'Trabajo');
  perform public.save_absence(hogar, current_date + 7, current_date + 10, 'Viaje a casa');

  -- Bruno ha comprado el pan
  update public.shopping_items set checked_at = now() where household_id = hogar and name = 'Pan';

  perform public.send_message(chat, '¡Gracias! Esta semana me toca la basura.');
  perform public.vote_poll(
    (select message_id from public.polls where conversation_id = chat),
    array[(select o.id from public.poll_options o join public.polls p on p.message_id = o.poll_id
           where p.conversation_id = chat and o.label = 'Pizza')]
  );
  set constraints all immediate;
  set constraints all deferred;
  reset role;
end $$;

-- ───────────── Ana confirma la bombona ─────────────
do $$
declare
  bombona public.expenses := (select e from public.expenses e where e.description = 'Bombona de butano');
begin
  perform set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);
  set local role authenticated;
  perform public.confirm_expense(bombona.id, bombona.version);
  set constraints all immediate;
  set constraints all deferred;
  reset role;
end $$;

-- ───────────── Carla: confirma el súper (la bombona la deja pendiente), horario, compra y ruleta ─────────────
do $$
declare
  hogar uuid := (select id from public.households where name = 'Piso de prueba');
  chat  uuid := (select id from public.conversations where household_id = hogar and kind = 'tenants');
  super public.expenses := (select e from public.expenses e where e.household_id = hogar and e.description = 'Compra del súper');
begin
  perform set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000c", "role": "authenticated"}', true);
  set local role authenticated;

  perform public.confirm_expense(super.id, super.version);
  perform public.add_schedule_blocks(hogar, array[2, 4], '16:00', '20:00', 'class', 'Inglés');

  insert into public.shopping_items (household_id, name, quantity) values
    (hogar, 'Detergente', 1),
    (hogar, 'Papel de cocina', 2);

  perform public.send_message(chat, 'He apuntado el detergente en la compra.');
  perform public.spin_roulette(
    hogar,
    array['00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000b',
          '00000000-0000-4000-8000-00000000000c']::uuid[]
  );
  set constraints all immediate;
  set constraints all deferred;
  reset role;
end $$;
