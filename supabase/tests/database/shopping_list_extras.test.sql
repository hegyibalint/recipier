begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into shopping_list_extras (user_id, name) values
  ('00000000-0000-4000-8000-000000000002', 'Lemons');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok($$insert into shopping_list_extras (name, original_name, quantities)
  values ('Ice', '氷', '[{"amount":2,"unit":"bags"},{"amount":500,"unit":"g"}]')$$, 'Browser user can add a structured item');
select is((select array_agg(name) from shopping_list_extras), array['Ice'], 'Only own items are visible');
select lives_ok($$update shopping_list_extras set description = 'For drinks', quantities = '[{"amount":2,"unit":null}]'$$,
  'Browser user can update their own fields');
select is((select description from shopping_list_extras), 'For drinks', 'Edited description persists');
select throws_ok($$update shopping_list_extras set user_id = '00000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'Ownership cannot be edited');
select throws_ok($$insert into shopping_list_extras (user_id, name)
  values ('00000000-0000-4000-8000-000000000002', 'Forged')$$, '42501', null, 'Cannot add another owner’s item');
select throws_ok($$insert into shopping_list_extras (name) values (' ')$$, '23514', null, 'Blank names are rejected');
select throws_ok($$update shopping_list_extras set quantities = '[{"amount":0,"unit":"bags"}]'$$,
  '23514', null, 'Nonpositive quantities are rejected');
with removed as (delete from shopping_list_extras returning name)
select is((select array_agg(name) from removed), array['Ice'], 'Only own items can be removed');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select description from shopping_list_extras where name = 'Lemons'), null::text, 'Other owner’s item was not edited');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","client_id":"test-client"}';
select is((select array_agg(name) from shopping_list_extras), array['Lemons'], 'MCP client can read only own items');
select lives_ok($$insert into shopping_list_extras (name) values ('Chips')$$, 'MCP client can add own items');
with updated as (update shopping_list_extras set name = 'Water' returning id)
select is((select count(*) from updated), 0::bigint, 'MCP client cannot update extras');
with removed as (delete from shopping_list_extras where name = 'Chips' returning name)
select is((select array_agg(name) from removed), array['Chips'], 'MCP client can remove own items');

select * from finish();
rollback;
