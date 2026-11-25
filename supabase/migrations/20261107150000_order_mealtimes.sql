alter table public.mealtimes add column position integer;

-- Preserve the previous API ordering, including its tie-breaker.
with ordered as (
  select id, row_number() over (partition by user_id order by starts_at, id) as position
  from public.mealtimes
)
update public.mealtimes as meal set position = ordered.position
from ordered where meal.id = ordered.id;

alter table public.mealtimes
  alter column position set not null,
  add constraint mealtimes_position_positive check (position > 0),
  add constraint mealtimes_owner_position_key unique (user_id, position) deferrable,
  drop column starts_at,
  drop column ends_at;

create function public.append_mealtime() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('mealtimes:' || new.user_id::text, 0));
  select coalesce(max(position), 0) + 1 into new.position
  from public.mealtimes where user_id = new.user_id;
  return new;
end;
$$;
revoke all on function public.append_mealtime() from public, anon, authenticated;

create trigger mealtimes_append before insert on public.mealtimes
for each row execute function public.append_mealtime();

create function public.reorder_mealtimes(mealtime_ids uuid[]) returns void
language plpgsql set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  changed integer;
begin
  if owner_id is null or (auth.jwt()->>'client_id') is not null then
    raise insufficient_privilege;
  end if;

  -- Serialize with appends and other reorders. Reject a stale row set rather
  -- than applying a partial reorder; raising also rolls back the update.
  perform pg_advisory_xact_lock(hashtextextended('mealtimes:' || owner_id::text, 0));
  if mealtime_ids is null or cardinality(mealtime_ids) <> (
    select count(*) from public.mealtimes where user_id = owner_id
  ) or cardinality(mealtime_ids) <> (
    select count(*) from public.mealtimes where user_id = owner_id and id = any(mealtime_ids)
  ) then
    raise sqlstate 'PT409' using message = 'The meal time list has changed.';
  end if;

  update public.mealtimes as meal set position = ordering.position
  from unnest(mealtime_ids) with ordinality as ordering(id, position)
  where meal.user_id = owner_id and meal.id = ordering.id;
  get diagnostics changed = row_count;
  if changed <> cardinality(mealtime_ids) then
    raise sqlstate 'PT409' using message = 'The meal time list has changed.';
  end if;
end;
$$;
revoke all on function public.reorder_mealtimes(uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_mealtimes(uuid[]) to authenticated;
