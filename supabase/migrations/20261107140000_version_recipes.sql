alter table public.recipes
  add column version integer not null default 1 check (version > 0);

-- Callers can create recipes, but only the database can assign versions.
revoke insert on public.recipes from authenticated;
grant insert (id, user_id, document, created_at) on public.recipes to authenticated;

-- The current snapshot stays on recipes. Keep superseded snapshots private for
-- now; deleting a recipe also deletes its history.
create table public.recipe_revisions (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  version integer not null,
  document jsonb not null,
  primary key (recipe_id, version)
);
alter table public.recipe_revisions enable row level security;
revoke all on public.recipe_revisions from anon, authenticated;

create function public.archive_recipe_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.recipe_revisions (recipe_id, version, document)
  values (old.id, old.version, old.document);
  new.version := old.version + 1;
  return new;
end;
$$;

revoke all on function public.archive_recipe_revision() from public, anon, authenticated;
create trigger recipes_archive_revision
  before update of document on public.recipes
  for each row execute function public.archive_recipe_revision();

-- Direct updates stay forbidden. This RPC is restricted to the recipe owner
-- using the registered MCP OAuth client (the same client as the token hook).
create function public.update_recipe(recipe_id uuid, base_version integer, recipe jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  snapshot jsonb;
begin
  if auth.uid() is null
    or (auth.jwt()->>'client_id') is distinct from '00000000-0000-4000-8000-000000000002' then
    raise insufficient_privilege using message = 'MCP OAuth session required';
  end if;

  -- Postgres rechecks this predicate after waiting for a concurrent writer.
  update public.recipes as r
  set document = recipe
  where r.id = recipe_id and r.user_id = auth.uid() and r.version = base_version
  returning jsonb_build_object('recipe_id', r.id, 'version', r.version, 'recipe', r.document) into snapshot;
  if found then
    return snapshot;
  end if;

  if exists (select 1 from public.recipes where id = recipe_id and user_id = auth.uid()) then
    return jsonb_build_object('error', 'version_conflict');
  end if;
  return jsonb_build_object('error', 'recipe_not_found');
end;
$$;

revoke all on function public.update_recipe(uuid, integer, jsonb) from public, anon;
grant execute on function public.update_recipe(uuid, integer, jsonb) to authenticated;
