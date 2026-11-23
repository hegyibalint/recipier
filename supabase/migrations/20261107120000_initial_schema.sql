-- Initial baseline: recipes, meal planning, and the MCP access-token hook.
-- Replaces the pre-baseline migration history; existing databases must be reset.

-- Keep the original v1 document intact; metadata and ownership live outside it.
create extension if not exists pg_jsonschema with schema extensions;

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document jsonb not null,
  created_at timestamptz not null default now(),
  constraint recipes_owner_id_key unique (user_id, id),
  -- Shape is enforced even for direct Data API writes. Reference/DAG checks live in the application.
  constraint recipes_document_v1 check (
    extensions.jsonb_matches_schema(
      $recipe_schema$
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:recipier:schema:recipe:1",
  "title": "Recipe",
  "description": "The agent-friendly format of a recipe.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "title",
    "subtitle",
    "description",
    "ingredients",
    "components"
  ],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "subtitle": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "yield": {
      "$ref": "#/$defs/yield"
    },
    "ingredients": {
      "description": "Recipe-wide ingredient definitions.",
      "type": "array",
      "uniqueItems": true,
      "items": {
        "$ref": "#/$defs/ingredient"
      }
    },
    "components": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/component"
      }
    }
  },
  "$defs": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$"
    },
    "yield": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "amount",
        "unit"
      ],
      "properties": {
        "amount": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "unit": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "ingredient": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "name"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/id"
        },
        "name": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "step": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "text"
      ],
      "properties": {
        "text": {
          "description": "Flowing instruction text using the Recipier template format.",
          "type": "string",
          "minLength": 1,
          "format": "recipier-template-v1"
        }
      }
    },
    "component": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "steps"
      ],
      "properties": {
        "id": {
          "description": "A stable identifier for this component within the recipe.",
          "$ref": "#/$defs/id"
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "yield": {
          "$ref": "#/$defs/yield"
        },
        "depends_on": {
          "description": "Component IDs that must be completed before this component.",
          "type": "array",
          "uniqueItems": true,
          "items": {
            "$ref": "#/$defs/id"
          }
        },
        "steps": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/step"
          }
        }
      }
    }
  }
}
$recipe_schema$::json,
      document
    )
  )
);

create index recipes_user_created_idx on public.recipes (user_id, created_at desc);
alter table public.recipes enable row level security;

create policy recipes_select_own on public.recipes
  for select to authenticated using ((select auth.uid()) = user_id);

create policy recipes_insert_own on public.recipes
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Browser deletion is allowed; direct document updates remain forbidden.
revoke all on public.recipes from anon, authenticated;
grant select, insert, delete on public.recipes to authenticated;

create policy recipes_delete_own_browser on public.recipes
  for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and (select auth.jwt()->>'client_id') is null
  );

-- Expose a narrow, atomic title edit, not general document update access.
-- SECURITY DEFINER requires explicit ownership and browser-token checks below.
create function public.rename_recipe(recipe_id uuid, new_title text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.jwt()->>'client_id' is not null then
    raise insufficient_privilege using message = 'Browser session required';
  end if;
  if new_title is null or new_title !~ '\S' then
    raise invalid_parameter_value using message = 'Title must not be blank';
  end if;

  update public.recipes
  set document = jsonb_set(document, '{title}', to_jsonb(btrim(new_title)))
  where id = recipe_id and user_id = auth.uid();
  return found;
end;
$$;

revoke all on function public.rename_recipe(uuid, text) from public, anon;
grant execute on function public.rename_recipe(uuid, text) to authenticated;

-- Mealtimes are local wall-clock preferences, not UTC events.
create table public.mealtimes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (name ~ '[^[:space:]]'),
  starts_at time not null,
  ends_at time not null,
  created_at timestamptz not null default now(),
  constraint mealtimes_window check (
    starts_at < ends_at and ends_at < time '24:00'
    and extract(second from starts_at) = 0
    and extract(second from ends_at) = 0
  ),
  -- Composite keys prevent entries referencing another owner's resources.
  constraint mealtimes_owner_id_key unique (user_id, id)
);

create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null check (date between date '0001-01-01' and date '9999-12-31'),
  mealtime_id uuid not null,
  recipe_id uuid not null,
  multiplier double precision not null default 1
    check (multiplier > 0 and multiplier < 'Infinity'::double precision),
  created_at timestamptz not null default now(),
  -- Deleting a mealtime removes its assignments; referenced recipes cannot be
  -- deleted. Deleting an auth user still cascades all owned data.
  constraint meal_plan_entries_mealtime_owner_fkey foreign key (user_id, mealtime_id)
    references public.mealtimes (user_id, id) on delete cascade,
  constraint meal_plan_entries_recipe_owner_fkey foreign key (user_id, recipe_id)
    references public.recipes (user_id, id)
);

-- Multiple recipes (or repeated assignments) in one slot are intentional.
create index meal_plan_entries_user_date_idx on public.meal_plan_entries (user_id, date, id);
create index meal_plan_entries_mealtime_idx on public.meal_plan_entries (user_id, mealtime_id);
create index meal_plan_entries_recipe_idx on public.meal_plan_entries (user_id, recipe_id);

alter table public.mealtimes enable row level security;
alter table public.meal_plan_entries enable row level security;

create policy mealtimes_select_own on public.mealtimes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy mealtimes_insert_own_browser on public.mealtimes
  for insert to authenticated with check (
    (select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null
  );
create policy mealtimes_update_own_browser on public.mealtimes
  for update to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null)
  with check ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null);
create policy mealtimes_delete_own_browser on public.mealtimes
  for delete to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null);

create policy meal_plan_entries_select_own on public.meal_plan_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy meal_plan_entries_insert_own_browser on public.meal_plan_entries
  for insert to authenticated with check (
    (select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null
  );
create policy meal_plan_entries_update_own_browser on public.meal_plan_entries
  for update to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null)
  with check ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null);
create policy meal_plan_entries_delete_own_browser on public.meal_plan_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null);

revoke all on public.mealtimes, public.meal_plan_entries from anon, authenticated;
grant select, insert, update, delete on public.mealtimes, public.meal_plan_entries to authenticated;

-- Explicit bounds are shared by the planner and shopping-list extraction.
-- Returning the table type also lets PostgREST embed related recipe documents.
create function public.get_meal_plan("from" date, "to" date)
returns setof public.meal_plan_entries
language plpgsql stable security invoker
set search_path = ''
as $$
begin
  if "from" is null or "to" is null
    or "from" < date '0001-01-01' or "to" > date '9999-12-31'
    or "from" >= "to" then
    raise exception using errcode = '22023',
      message = 'Expected calendar dates with from < to (inclusive from, exclusive to).';
  end if;

  return query select entry.* from public.meal_plan_entries entry
    where entry.user_id = (select auth.uid())
      and entry.date >= "from" and entry.date < "to"
    order by entry.date, entry.id;
end;
$$;

revoke all on function public.get_meal_plan(date, date) from public, anon, authenticated;
grant execute on function public.get_meal_plan(date, date) to authenticated;

-- Single-client MCP audience policy. Keep the client ID and resource aligned
-- with MCP_CLIENT_ID and MCP_RESOURCE_URL; select this function in Auth Hooks.
create function public.mcp_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := event->'claims';
  oauth_client text := coalesce(event->>'client_id', event->'claims'->>'client_id');
begin
  if oauth_client = '00000000-0000-4000-8000-000000000002' then
    claims := jsonb_set(claims, '{aud}', to_jsonb('https://recipier.example/mcp'::text), true);
    claims := jsonb_set(claims, '{client_id}', to_jsonb(oauth_client), true);
  end if;
  return jsonb_build_object('claims', claims);
end;
$$;

-- Only Supabase Auth may invoke the hook, not Data API users.
grant usage on schema public to supabase_auth_admin;
revoke all on function public.mcp_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.mcp_access_token_hook(jsonb) to supabase_auth_admin;
