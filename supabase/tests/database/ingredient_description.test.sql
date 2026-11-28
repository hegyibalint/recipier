begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

insert into auth.users (id) values ('00000000-0000-4000-8000-000000000001');
insert into public.recipes (id, user_id, document) values (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '{"title":"Chilled tofu","subtitle":"A cold starter","description":"A tofu starter.","ingredients":[{"id":"tofu","name":"Tofu"}],"components":[{"id":"main","steps":[{"text":"Drain the tofu."}]}]}'
);

select lives_ok(
  $$update recipes set document = jsonb_set(document, '{ingredients,0,description}', '"Soft tofu"') where id = '10000000-0000-4000-8000-000000000001'$$,
  'A recipe can specify an ingredient description'
);
select throws_ok(
  $$update recipes set document = jsonb_set(document, '{ingredients,0,description}', '"   "') where id = '10000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'A blank description fails the document constraint'
);
select throws_ok(
  $$update recipes set document = jsonb_set(document, '{ingredients,0,description}', '42') where id = '10000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'A numeric description fails the document constraint'
);

select * from finish();
rollback;
