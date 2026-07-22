import type { AiFormatAuthMode, AuthenticatedUser, Env } from '../types';

export function getAiFormatAuthMode(env: Env): AiFormatAuthMode {
  const raw = (env.AI_FORMAT_AUTH_MODE || 'secret').toLowerCase();
  return raw === 'secret' || raw === 'user' || raw === 'either' || raw === 'off' ? raw : 'secret';
}

export function isRoleAllowed(user: AuthenticatedUser | null, allowedRoles: string[]): boolean {
  return Boolean(user && allowedRoles.includes(user.role));
}
