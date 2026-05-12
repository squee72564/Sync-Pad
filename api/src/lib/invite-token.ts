import { createHash, randomBytes } from 'node:crypto';

export const createInviteToken = () => randomBytes(32).toString('base64url');

export const hashInviteToken = (token: string) =>
  createHash('sha256').update(token, 'utf8').digest('hex');
