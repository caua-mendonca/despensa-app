-- =============================================================================
-- ValidaJá — schema inicial (Supabase / PostgreSQL)
-- Execute no Supabase: Dashboard → SQL Editor → New query → cole e clique em Run.
-- =============================================================================

create table if not exists public.pantry_items (
  id               uuid primary key,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 2 and 80),
  category         text not null check (category in (
                     'produce', 'dairy', 'meat', 'grains', 'bakery',
                     'canned', 'frozen', 'beverages', 'cleaning', 'other')),
  storage_location text not null check (storage_location in ('pantry', 'fridge', 'freezer')),
  quantity         numeric(10, 2) not null check (quantity > 0),
  unit             text not null check (unit in ('un', 'kg', 'g', 'l', 'ml', 'pct')),
  expiration_date  date not null,
  notes            text check (notes is null or char_length(notes) <= 300),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

comment on table public.pantry_items is 'Itens da despensa de cada usuário (sincronizados do SQLite do app).';
comment on column public.pantry_items.deleted_at is 'Exclusão lógica — permite sincronizar remoções entre aparelhos.';

-- Índice usado pelo pull incremental (user_id + updated_at > cursor).
create index if not exists pantry_items_user_updated_idx
  on public.pantry_items (user_id, updated_at);

-- -----------------------------------------------------------------------------
-- updated_at controlado pelo servidor: serve de cursor confiável para o pull,
-- independente do relógio de cada aparelho.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists pantry_items_set_updated_at on public.pantry_items;
create trigger pantry_items_set_updated_at
  before insert or update on public.pantry_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security: cada usuário só enxerga e altera os próprios itens.
-- Não há policy de DELETE: remoções são lógicas (deleted_at).
-- -----------------------------------------------------------------------------
alter table public.pantry_items enable row level security;

drop policy if exists "Usuário lê os próprios itens" on public.pantry_items;
create policy "Usuário lê os próprios itens"
  on public.pantry_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuário cria os próprios itens" on public.pantry_items;
create policy "Usuário cria os próprios itens"
  on public.pantry_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuário atualiza os próprios itens" on public.pantry_items;
create policy "Usuário atualiza os próprios itens"
  on public.pantry_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
