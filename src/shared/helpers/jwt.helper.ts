import { Request } from 'express';

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;

  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token ? token : null;
}
