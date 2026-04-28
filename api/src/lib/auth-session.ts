import type { AuthSession } from '../types/api.js';
import { auth } from './auth.js';

export const getAuthSession = async (
  request: Request,
): Promise<AuthSession | null> => {
  const response = await auth.api.getSession({ headers: request.headers });

  if (!response) {
    return null;
  }

  return response;
};
