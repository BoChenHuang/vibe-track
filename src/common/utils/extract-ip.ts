import type { Request } from 'express';

export function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  return (
    (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? req.ip ?? 'unknown'
  );
}
