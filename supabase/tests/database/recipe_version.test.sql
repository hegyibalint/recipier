begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

set local test.recipe = '{"title":"Soup","subtitle":"A simple soup","description":"A warm soup.","ingredients":[],"components":[{"id":"main","steps":[{"text":"Boil water."}]}]}';
insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into recipes (id, user_id, document) values
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', current_setting('test.recipe')::jsonb);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","client_id":"00000000-0000-4000-8000-000000000002"}';
insert into recipes (id, document) values
  ('10000000-0000-4000-8000-000000000001', current_setting('test.recipe')::jsonb);
select is((select version from recipes where id = '10000000-0000-4000-8000-000000000001'), 1, 'New recipes start at version 1');
select throws_ok($$insert into recipes (document, version) values (current_setting('test.recipe')::jsonb, 99)$$,
  '42501', null, 'Callers cannot pick a starting version');
select throws_ok($$update recipes set version = 2$$, '42501', null, 'Callers cannot change the version directly');
select throws_ok($$select * from recipe_revisions$$, '42501', null, 'History is private');

select is(update_recipe('10000000-0000-4000-8000-000000000001', 2, current_setting('test.recipe')::jsonb),
  '{"error":"version_conflict"}'::jsonb, 'A future version is rejected without leaking the current version');
select is(update_recipe('10000000-0000-4000-8000-000000000001', 1,
    current_setting('test.recipe')::jsonb || '{"description":"A richer soup."}'::jsonb),
  jsonb_build_object('recipe_id', '10000000-0000-4000-8000-000000000001', 'version', 2,
    'recipe', current_setting('test.recipe')::jsonb || '{"description":"A richer soup."}'::jsonb),
  'Matching base saves and returns the complete version 2 snapshot');
select is(update_recipe('10000000-0000-4000-8000-000000000001', 1, current_setting('test.recipe')::jsonb),
  '{"error":"version_conflict"}'::jsonb, 'A second writer with the same base cannot overwrite the first');
select is(update_recipe('10000000-0000-4000-8000-000000000002', 1, current_setting('test.recipe')::jsonb),
  '{"error":"recipe_not_found"}'::jsonb, 'Another owner’s recipe looks unavailable');
select throws_ok($$select update_recipe('10000000-0000-4000-8000-000000000001', 2, '{}'::jsonb)$$,
  '23514', null, 'Invalid documents fail the database constraint');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","client_id":"other-client"}';
select throws_ok($$select update_recipe('10000000-0000-4000-8000-000000000001', 2, current_setting('test.recipe')::jsonb)$$,
  '42501', null, 'Other OAuth clients cannot use the RPC');
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$select update_recipe('10000000-0000-4000-8000-000000000001', 2, current_setting('test.recipe')::jsonb)$$,
  '42501', null, 'Browser tokens cannot use the RPC');
select ok(rename_recipe('10000000-0000-4000-8000-000000000001', 'Red lentil soup'), 'Browser rename still works');
select is((select version from recipes where id = '10000000-0000-4000-8000-000000000001'), 3,
  'Browser rename advances the version, invalidating the agent’s previous snapshot');

reset role;
select results_eq(
  $$select version, document from recipe_revisions where recipe_id = '10000000-0000-4000-8000-000000000001' order by version$$,
  $$values (1, current_setting('test.recipe')::jsonb),
    (2, current_setting('test.recipe')::jsonb || '{"description":"A richer soup."}'::jsonb)$$,
  'Only accepted edits archive their previous snapshots');
delete from recipes where id = '10000000-0000-4000-8000-000000000001';
select is_empty('select * from recipe_revisions', 'Recipe deletion removes the associated history');

select * from finish();
rollback;
