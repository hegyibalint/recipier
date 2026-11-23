begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into public.recipes (id, user_id, document)
select recipe.id::uuid, recipe.owner::uuid,
  '{"title":"Soup","subtitle":"A simple soup","description":"A warm soup.","ingredients":[],"components":[{"id":"main","steps":[{"text":"Boil water."}]}]}'::jsonb
from (values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002')
) recipe(id, owner);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(rename_recipe('10000000-0000-4000-8000-000000000001', '  New soup  '), true, 'Owner can rename');
select is((select document->>'title' from recipes where id = '10000000-0000-4000-8000-000000000001'), 'New soup', 'Trimmed title persists');
select is((select document - 'title' from recipes where id = '10000000-0000-4000-8000-000000000001'),
  '{"subtitle":"A simple soup","description":"A warm soup.","ingredients":[],"components":[{"id":"main","steps":[{"text":"Boil water."}]}]}'::jsonb, 'Other recipe content is preserved');
select is(rename_recipe('10000000-0000-4000-8000-000000000002', 'Forbidden'), false, 'Other owner recipe is unavailable');
select is(rename_recipe('10000000-0000-4000-8000-000000000003', 'Missing'), false, 'Missing recipe is unavailable');
select throws_ok($$select rename_recipe('10000000-0000-4000-8000-000000000001', '   ')$$, '22023', null, 'Blank title rejected');
select throws_ok($$select rename_recipe('10000000-0000-4000-8000-000000000001', null)$$, '22023', null, 'Null title rejected');
select throws_ok($$update recipes set document = jsonb_set(document, '{title}', '"Bypass"')$$, '42501', null, 'Direct document updates remain forbidden');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","client_id":"chatgpt"}';
select throws_ok($$select rename_recipe('10000000-0000-4000-8000-000000000001', 'Forbidden')$$, '42501', null, 'OAuth clients cannot rename');
set local request.jwt.claims = '{"role":"authenticated"}';
select throws_ok($$select rename_recipe('10000000-0000-4000-8000-000000000001', 'Forbidden')$$, '42501', null, 'Missing user rejected');
set local role anon;
select throws_ok($$select public.rename_recipe('10000000-0000-4000-8000-000000000001', 'Forbidden')$$, '42501', null, 'Anonymous callers cannot rename');

reset role;
select is((select document->>'title' from recipes where id = '10000000-0000-4000-8000-000000000002'), 'Soup', 'Other owner recipe remains unchanged');
select * from finish();
rollback;
