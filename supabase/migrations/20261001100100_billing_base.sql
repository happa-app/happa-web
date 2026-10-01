-- HAPPA · Migración 2: base de facturación (Stripe). Queda lista aunque aún no se use.
-- Se crea con: npx supabase migration new billing_base

-- Relación usuario ↔ cliente de Stripe
create table public.billing_customers (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at         timestamptz not null default now()
);

-- Suscripciones (se sincronizan desde el webhook de Stripe, nunca desde el cliente)
create table public.subscriptions (
  id                   text primary key,               -- id de suscripción de Stripe
  user_id              uuid not null references public.profiles (id) on delete cascade,
  status               text not null,                  -- trialing, active, past_due, canceled…
  price_id             text not null,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.billing_customers enable row level security;
alter table public.subscriptions     enable row level security;

-- Cada usuario solo puede LEER lo suyo. No hay políticas de escritura:
-- únicamente el webhook de Stripe (service role, en el servidor) inserta o actualiza.
create policy "billing_customers_select_own" on public.billing_customers for select to authenticated
  using (user_id = (select auth.uid()));
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
