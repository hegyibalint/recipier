-- The existing Worker was renamed in place. Update new tokens for its MCP client
-- without changing the client registration, browser sessions, or stored data.
create or replace function public.mcp_access_token_hook(event jsonb)
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
