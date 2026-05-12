export type AuthRedirectSearch = {
  redirect?: string;
};

export function parseAuthRedirectSearch(
  search: Record<string, unknown>,
): AuthRedirectSearch {
  return {
    redirect: toSafeRedirect(search.redirect),
  };
}

export function toSafeRedirect(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return undefined;
  }

  return trimmed;
}
