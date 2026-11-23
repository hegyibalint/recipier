export function mcpConfig() {
  return {
    ...apiConfig(),
    clientId: import.meta.env.MCP_CLIENT_ID,
    resourceUrl: import.meta.env.MCP_RESOURCE_URL,
  };
}

export function apiConfig() {
  return {
    supabaseUrl: import.meta.env.SUPABASE_URL,
    publishableKey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
    userId: import.meta.env.DEMO_USER_ID,
  };
}
