import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'public', path), 'utf8')) as Record<string, unknown>;
}

describe('MCP OAuth discovery assets', () => {
  it('publishes RFC discovery metadata for the path-based issuer', () => {
    const authorizationServer = readJson('.well-known/oauth-authorization-server/api');
    const openId = readJson('.well-known/openid-configuration/api');
    const protectedResource = readJson('.well-known/oauth-protected-resource/api/mcp');

    expect(authorizationServer).toMatchObject({
      issuer: 'https://goals.keycasey.com/api',
      authorization_endpoint: 'https://goals.keycasey.com/api/oauth/authorize',
      token_endpoint: 'https://goals.keycasey.com/api/oauth/token',
      code_challenge_methods_supported: ['S256'],
    });
    expect(openId).toMatchObject({
      issuer: authorizationServer.issuer,
      authorization_endpoint: authorizationServer.authorization_endpoint,
      token_endpoint: authorizationServer.token_endpoint,
    });
    expect(protectedResource).toEqual({
      resource: 'https://goals.keycasey.com/api/mcp',
      authorization_servers: ['https://goals.keycasey.com/api'],
      scopes_supported: ['goals:read', 'goals:write'],
      bearer_methods_supported: ['header'],
      resource_documentation: 'https://goals.keycasey.com/api/oauth/docs',
    });
  });
});
