begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Fixtures are created as the database owner; assertions below impersonate
-- actual Data API roles, including the JWT claims used by auth.uid()/auth.jwt().
insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into public.recipes (id, user_id, document)
select recipe.id::uuid, recipe.owner::uuid,
  '{"title":"Soup","subtitle":"A simple soup","description":"A warm soup.","ingredients":[],"components":[{"id":"main","steps":[{"text":"Boil water."}]}]}'::jsonb
from (values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001')
) recipe(id, owner);
insert into public.mealtimes (id, user_id, name, starts_at, ends_at) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Dinner', '19:00', '20:00'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Lunch', '12:00', '13:00');
insert into public.meal_plan_entries (id, user_id, date, mealtime_id, recipe_id)
select entry.id::uuid, '00000000-0000-4000-8000-000000000001', entry.day::date,
  '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'
from (values
  ('30000000-0000-4000-8000-000000000001', '2026-11-08'),
  ('30000000-0000-4000-8000-000000000002', '2026-11-09'),
  ('30000000-0000-4000-8000-000000000003', '2026-11-10'),
  ('30000000-0000-4000-8000-000000000004', '2026-11-16')
) entry(id, day);
insert into public.meal_plan_entries (id, user_id, date, mealtime_id, recipe_id) values
  ('30000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', '2026-11-10',
   '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is((select count(*) from mealtimes), 1::bigint, 'Only own mealtimes are visible');
select is((select count(*) from meal_plan_entries), 4::bigint, 'Only own entries are visible');
select is((select count(*) from get_meal_plan('2026-11-09', '2026-11-16')), 2::bigint, 'Range is inclusive from, exclusive to, and owner-scoped');
select is((select min(date)::text from get_meal_plan('2026-11-09', '2026-11-16')), '2026-11-09', 'The start date is included');
select is((select count(*) from get_meal_plan('2026-11-16', '2026-11-17')), 1::bigint, 'Adjacent ranges include the boundary exactly once');
select is((select count(*) from get_meal_plan('2026-12-01', '2026-12-08')), 0::bigint, 'Empty ranges return no entries');
select throws_ok($$select * from get_meal_plan('2026-11-09', '2026-11-09')$$, '22023', null, 'Equal bounds are rejected');
select throws_ok($$select * from get_meal_plan('2026-11-16', '2026-11-09')$$, '22023', null, 'Reversed bounds are rejected');
select throws_ok($$select * from get_meal_plan(null, '2026-11-16')$$, '22023', null, 'Missing from is rejected');
select throws_ok($$select * from get_meal_plan('2026-11-09', null)$$, '22023', null, 'Missing to is rejected');
select throws_ok($$select * from get_meal_plan('-infinity', '2026-11-16')$$, '22023', null, 'Non-calendar from is rejected');
select throws_ok($$select * from get_meal_plan('2026-11-09', 'infinity')$$, '22023', null, 'Non-calendar to is rejected');

select lives_ok($$insert into mealtimes (id, name, starts_at, ends_at)
  values ('20000000-0000-4000-8000-000000000003', 'Breakfast', '08:00', '09:00')$$, 'Owners can create mealtimes');
select is((select user_id from mealtimes where id = '20000000-0000-4000-8000-000000000003'),
  '00000000-0000-4000-8000-000000000001'::uuid, 'Mealtime ownership defaults to the JWT user');
select lives_ok($$update mealtimes set name = 'Brunch', starts_at = '09:00', ends_at = '10:00'
  where id = '20000000-0000-4000-8000-000000000003'$$, 'Owners can update mealtimes');
select is((select name from mealtimes where id = '20000000-0000-4000-8000-000000000003'), 'Brunch', 'Mealtime update persists');
select lives_ok($$delete from mealtimes where id = '20000000-0000-4000-8000-000000000003'$$, 'Unused mealtimes can be deleted');
select is((select count(*) from mealtimes), 1::bigint, 'Deleted mealtime is gone');

select lives_ok($$insert into meal_plan_entries (id, date, mealtime_id, recipe_id)
  values ('30000000-0000-4000-8000-000000000006', '2026-11-10',
    '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003')$$, 'Another recipe can occupy the same date and mealtime');
select is((select count(distinct recipe_id) from meal_plan_entries where date = '2026-11-10'), 2::bigint, 'A slot supports multiple recipes');
select is((select multiplier from meal_plan_entries where id = '30000000-0000-4000-8000-000000000006'), 1::double precision, 'Multiplier defaults to one');
select is((select user_id from meal_plan_entries where id = '30000000-0000-4000-8000-000000000006'),
  '00000000-0000-4000-8000-000000000001'::uuid, 'Entry ownership defaults to the JWT user');
select lives_ok($$update meal_plan_entries set date = '2026-11-12', multiplier = 0.5
  where id = '30000000-0000-4000-8000-000000000006'$$, 'Owners can reschedule and scale entries');
select is((select multiplier from meal_plan_entries where id = '30000000-0000-4000-8000-000000000006'), 0.5::double precision, 'Fractional multipliers persist');
select lives_ok($$delete from meal_plan_entries where id = '30000000-0000-4000-8000-000000000006'$$, 'Owners can remove entries');
select is((select count(*) from meal_plan_entries), 4::bigint, 'Removed entry is gone');

select throws_ok($$insert into mealtimes (name, starts_at, ends_at) values (' ', '19:00', '20:00')$$, '23514', null, 'Blank names are rejected');
select throws_ok($$insert into mealtimes (name, starts_at, ends_at) values ('Dinner', '20:00', '19:00')$$, '23514', null, 'Reversed windows are rejected');
select throws_ok($$insert into mealtimes (name, starts_at, ends_at) values ('Dinner', '19:00', '19:00')$$, '23514', null, 'Empty windows are rejected');
select throws_ok($$insert into mealtimes (name, starts_at, ends_at) values ('Dinner', '19:00:01', '20:00')$$, '23514', null, 'Windows use minute precision');
select throws_ok($$insert into mealtimes (name, starts_at, ends_at) values ('Dinner', '19:00', '24:00')$$, '23514', null, 'Times stay within a calendar day');
select throws_ok($$update meal_plan_entries set multiplier = 0 where id = '30000000-0000-4000-8000-000000000002'$$, '23514', null, 'Zero multiplier is rejected');
select throws_ok($$update meal_plan_entries set multiplier = -1 where id = '30000000-0000-4000-8000-000000000002'$$, '23514', null, 'Negative multiplier is rejected');
select throws_ok($$update meal_plan_entries set multiplier = 'Infinity' where id = '30000000-0000-4000-8000-000000000002'$$, '23514', null, 'Infinite multiplier is rejected');
select throws_ok($$update meal_plan_entries set multiplier = 'NaN' where id = '30000000-0000-4000-8000-000000000002'$$, '23514', null, 'NaN multiplier is rejected');
select throws_ok($$update meal_plan_entries set date = 'infinity' where id = '30000000-0000-4000-8000-000000000002'$$, '23514', null, 'Entry dates must be calendar dates');

select throws_ok($$insert into mealtimes (user_id, name, starts_at, ends_at)
  values ('00000000-0000-4000-8000-000000000002', 'Forged', '19:00', '20:00')$$, '42501', null, 'Mealtime ownership cannot be forged');
select throws_ok($$insert into meal_plan_entries (user_id, date, mealtime_id, recipe_id)
  values ('00000000-0000-4000-8000-000000000002', '2026-11-10',
    '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002')$$, '42501', null, 'Entry ownership cannot be forged');
select throws_ok($$insert into meal_plan_entries (date, mealtime_id, recipe_id)
  values ('2026-11-10', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001')$$, '23503', null, 'Entries cannot reference another owner mealtime');
select throws_ok($$insert into meal_plan_entries (date, mealtime_id, recipe_id)
  values ('2026-11-10', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')$$, '23503', null, 'Entries cannot reference another owner recipe');
select throws_ok($$update meal_plan_entries set recipe_id = '10000000-0000-4000-8000-000000000002'
  where id = '30000000-0000-4000-8000-000000000002'$$, '23503', null, 'Recipe updates also enforce reference ownership');
select throws_ok($$update meal_plan_entries set mealtime_id = '20000000-0000-4000-8000-000000000002'
  where id = '30000000-0000-4000-8000-000000000002'$$, '23503', null, 'Mealtime updates also enforce reference ownership');
select throws_ok($$update mealtimes set user_id = '00000000-0000-4000-8000-000000000002'
  where id = '20000000-0000-4000-8000-000000000001'$$, '42501', null, 'Mealtime ownership cannot be transferred');
select throws_ok($$update meal_plan_entries set user_id = '00000000-0000-4000-8000-000000000002'
  where id = '30000000-0000-4000-8000-000000000002'$$, '42501', null, 'Entry ownership cannot be transferred');
with changed as (update mealtimes set name = 'Forbidden' where id = '20000000-0000-4000-8000-000000000002' returning *)
select is(count(*), 0::bigint, 'Another owner mealtime cannot be updated') from changed;
with changed as (delete from meal_plan_entries where id = '30000000-0000-4000-8000-000000000005' returning *)
select is(count(*), 0::bigint, 'Another owner entry cannot be removed') from changed;
select throws_ok($$delete from recipes where id = '10000000-0000-4000-8000-000000000001'$$, '23503', null, 'Referenced recipes cannot be deleted');

-- OAuth clients retain no planning-write capability.
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","client_id":"chatgpt"}';
select is((select count(*) from get_meal_plan('2026-11-09', '2026-11-16')), 2::bigint, 'Owner reads remain available under RLS');
select throws_ok($$insert into mealtimes (name, starts_at, ends_at) values ('Forbidden', '19:00', '20:00')$$, '42501', null, 'OAuth clients cannot create mealtimes');
select throws_ok($$insert into meal_plan_entries (date, mealtime_id, recipe_id)
  values ('2026-11-10', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001')$$, '42501', null, 'OAuth clients cannot create entries');
with changed as (update mealtimes set name = 'Forbidden' returning *)
select is(count(*), 0::bigint, 'OAuth clients cannot update mealtimes') from changed;
with changed as (delete from mealtimes returning *)
select is(count(*), 0::bigint, 'OAuth clients cannot delete mealtimes') from changed;
with changed as (update meal_plan_entries set multiplier = 2 returning *)
select is(count(*), 0::bigint, 'OAuth clients cannot update entries') from changed;
with changed as (delete from meal_plan_entries returning *)
select is(count(*), 0::bigint, 'OAuth clients cannot delete entries') from changed;

set local role anon;
set local request.jwt.claims = '{}';
select throws_ok($$select * from mealtimes$$, '42501', null, 'Anonymous users cannot read mealtimes');
select throws_ok($$select * from meal_plan_entries$$, '42501', null, 'Anonymous users cannot read entries');
select throws_ok($$select * from get_meal_plan('2026-11-09', '2026-11-16')$$, '42501', null, 'Anonymous users cannot invoke range queries');
select throws_ok($$insert into mealtimes (name, starts_at, ends_at) values ('Forbidden', '19:00', '20:00')$$, '42501', null, 'Anonymous users cannot write');

-- Browser deletion removes every assignment to the selected mealtime, including
-- past/future dates and repeated recipes, but preserves recipes and other slots.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
insert into mealtimes (id, name, starts_at, ends_at)
  values ('20000000-0000-4000-8000-000000000004', 'Breakfast', '08:00', '09:00');
insert into meal_plan_entries (id, date, mealtime_id, recipe_id) values
  ('30000000-0000-4000-8000-000000000007', '2026-11-10',
   '20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000008', '2026-11-10',
   '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003'),
  ('30000000-0000-4000-8000-000000000009', '2026-11-10',
   '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001');
with changed as (delete from mealtimes where id = '20000000-0000-4000-8000-000000000002' returning *)
select is(count(*), 0::bigint, 'Another owner mealtime cannot be deleted or trigger a cascade') from changed;
select lives_ok($$delete from mealtimes where id = '20000000-0000-4000-8000-000000000001'$$, 'Owners can delete a referenced mealtime');
select is((select count(*) from mealtimes where id = '20000000-0000-4000-8000-000000000001'), 0::bigint, 'Deleted mealtime is gone');
select is((select count(*) from meal_plan_entries where mealtime_id = '20000000-0000-4000-8000-000000000001'), 0::bigint, 'All assignments to the deleted mealtime cascade, regardless of date or recipe');
select is((select count(*) from meal_plan_entries), 1::bigint, 'Other mealtimes retain their assignments');
select is((select count(*) from recipes), 2::bigint, 'Cascading mealtime deletion keeps all recipes');

reset role;
select is((select count(*) from mealtimes where user_id = '00000000-0000-4000-8000-000000000002'), 1::bigint, 'Another owner mealtime is unchanged');
select is((select count(*) from meal_plan_entries where user_id = '00000000-0000-4000-8000-000000000002'), 1::bigint, 'Another owner assignments are unchanged');
select lives_ok($$delete from auth.users where id = '00000000-0000-4000-8000-000000000002'$$, 'Account deletion cascades owned resources without FK conflicts');
select is((select count(*) from meal_plan_entries where user_id = '00000000-0000-4000-8000-000000000002'), 0::bigint, 'Deleted account entries are removed');
select is((select count(*) from mealtimes where user_id = '00000000-0000-4000-8000-000000000002'), 0::bigint, 'Deleted account mealtimes are removed');
select * from finish();
rollback;
