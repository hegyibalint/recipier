create table public.shopping_list_extras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null check (char_length(text) <= 200 and text ~ '[^[:space:]]'
    and strpos(text, chr(10)) = 0 and strpos(text, chr(13)) = 0),
  created_at timestamptz not null default now()
);

create index shopping_list_extras_owner_order_idx
  on public.shopping_list_extras (user_id, created_at, id);

alter table public.shopping_list_extras enable row level security;
revoke all on public.shopping_list_extras from anon, authenticated;
grant select, insert, delete on public.shopping_list_extras to authenticated;

-- Extras belong to the browser shopping list, not recipe or MCP results.
create policy shopping_list_extras_select_own on public.shopping_list_extras
  for select to authenticated using (
    (select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null
  );
create policy shopping_list_extras_insert_own on public.shopping_list_extras
  for insert to authenticated with check (
    (select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null
  );
create policy shopping_list_extras_delete_own on public.shopping_list_extras
  for delete to authenticated using (
    (select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null
  );
