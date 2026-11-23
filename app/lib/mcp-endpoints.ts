const metadataPath = '/.well-known/oauth-protected-resource/mcp';

export function mcpEndpoints(config: { supabaseUrl: string; resourceUrl: string }) {
  const project = new URL(config.supabaseUrl);
  if (project.protocol !== 'https:' || project.origin !== config.supabaseUrl) {
    throw new Error('SUPABASE_URL must be an HTTPS project origin.');
  }
  const resource = new URL(config.resourceUrl);
  if (resource.protocol !== 'https:' || config.resourceUrl !== resource.origin + '/mcp') {
    throw new Error('MCP_RESOURCE_URL must be an HTTPS application URL ending in /mcp.');
  }
  return {
    resource: config.resourceUrl,
    issuer: project.origin + '/auth/v1',
    frontend: resource.origin,
    metadata: resource.origin + metadataPath,
  };
}
