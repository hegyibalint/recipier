begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Compare complete claim sets so unrelated claims cannot silently disappear.
select is(
  public.mcp_access_token_hook(jsonb_build_object(
    'client_id', '00000000-0000-4000-8000-000000000002',
    'claims', '{"sub":"owner","aud":"authenticated","role":"authenticated","exp":2000000000,"custom":{"keep":true}}'::jsonb
  )),
  '{"claims":{"sub":"owner","aud":"https://recipier.example/mcp","role":"authenticated","exp":2000000000,"custom":{"keep":true},"client_id":"00000000-0000-4000-8000-000000000002"}}'::jsonb,
  'The configured OAuth client receives the Worker audience and retains other claims'
);

select is(
  public.mcp_access_token_hook('{"claims":{"aud":"authenticated","client_id":"00000000-0000-4000-8000-000000000002"}}'::jsonb),
  '{"claims":{"aud":"https://recipier.example/mcp","client_id":"00000000-0000-4000-8000-000000000002"}}'::jsonb,
  'The client ID can also come from the claims'
);

select is(
  public.mcp_access_token_hook('{"client_id":"00000000-0000-4000-8000-000000000002","claims":{"aud":"https://your-project.supabase.co/functions/v1/mcp"}}'::jsonb)->'claims'->>'aud',
  'https://recipier.example/mcp',
  'Issuance with an old audience replaces it rather than accepting both resources'
);

select is(
  public.mcp_access_token_hook('{"claims":{"sub":"owner","aud":"authenticated","role":"authenticated"}}'::jsonb),
  '{"claims":{"sub":"owner","aud":"authenticated","role":"authenticated"}}'::jsonb,
  'Browser-session claims remain unchanged'
);

select is(
  public.mcp_access_token_hook('{"client_id":"other-client","claims":{"aud":"other-resource","client_id":"other-client","custom":true}}'::jsonb),
  '{"claims":{"aud":"other-resource","client_id":"other-client","custom":true}}'::jsonb,
  'Other OAuth clients retain their audience and claims'
);

select is(
  public.mcp_access_token_hook('{"client_id":"other-client","claims":{"aud":"authenticated","client_id":"00000000-0000-4000-8000-000000000002"}}'::jsonb),
  '{"claims":{"aud":"authenticated","client_id":"00000000-0000-4000-8000-000000000002"}}'::jsonb,
  'The event client ID retains precedence over the claims fallback'
);

select ok(has_function_privilege('supabase_auth_admin', 'public.mcp_access_token_hook(jsonb)', 'EXECUTE'),
  'Supabase Auth can invoke the hook');
select ok(not has_function_privilege('anon', 'public.mcp_access_token_hook(jsonb)', 'EXECUTE'),
  'Anonymous users cannot invoke the hook');
select ok(not has_function_privilege('authenticated', 'public.mcp_access_token_hook(jsonb)', 'EXECUTE'),
  'Signed-in application users cannot invoke the hook');

-- The CLI test connection cannot SET ROLE to Supabase's managed Auth role.
-- Check schema access as well as EXECUTE without granting test-only membership.
select ok(has_schema_privilege('supabase_auth_admin', 'public', 'USAGE'),
  'Supabase Auth can resolve the hook in its schema');

select * from finish();
rollback;
