-- Keep existing free-text entries as names; don't guess quantities from text.
alter table public.shopping_list_extras rename column text to name;
alter table public.shopping_list_extras
  add column original_name text check (char_length(original_name) <= 200 and original_name ~ '[^[:space:]]'
    and strpos(original_name, chr(10)) = 0 and strpos(original_name, chr(13)) = 0),
  add column description text check (char_length(description) <= 500 and description ~ '[^[:space:]]'),
  add column quantities jsonb not null default '[]'::jsonb check (
    extensions.jsonb_matches_schema(
      $schema${
        "type": "array",
        "maxItems": 20,
        "items": {
          "type": "object",
          "required": ["amount", "unit"],
          "additionalProperties": false,
          "properties": {
            "amount": {"type": "number", "exclusiveMinimum": 0, "maximum": 1.7976931348623157e308},
            "unit": {"anyOf": [
              {"type": "string", "maxLength": 80, "pattern": "\\S", "not": {"pattern": "[\\r\\n]"}},
              {"type": "null"}
            ]}
          }
        }
      }$schema$::json,
      quantities
    )
  );

-- Both verified browser and MCP sessions may list, add and remove their own rows.
alter policy shopping_list_extras_select_own on public.shopping_list_extras
  using ((select auth.uid()) = user_id);
alter policy shopping_list_extras_insert_own on public.shopping_list_extras
  with check ((select auth.uid()) = user_id);
alter policy shopping_list_extras_delete_own on public.shopping_list_extras
  using ((select auth.uid()) = user_id);

grant update (name, original_name, description, quantities) on public.shopping_list_extras to authenticated;
create policy shopping_list_extras_update_own_browser on public.shopping_list_extras
  for update to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null)
  with check ((select auth.uid()) = user_id and (select auth.jwt()->>'client_id') is null);
