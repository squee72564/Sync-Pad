import { ApiError } from './errors';

type ApiErrorPayload = {
  code?: string;
  detail?: string;
  title?: string;
};

async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload = data as ApiErrorPayload | null;

    throw new ApiError({
      status: response.status,
      code: errorPayload?.code ?? 'REQUEST_FAILED',
      message:
        errorPayload?.detail ??
        errorPayload?.title ??
        `Request failed with status ${response.status}.`,
      details: data,
    });
  }

  return data as TResponse;
}

export function apiGet<TResponse>(path: string): Promise<TResponse> {
  return apiRequest<TResponse>(path);
}

export function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export function apiPatch<TResponse, TBody>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export function apiDelete<TResponse>(path: string): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: 'DELETE',
  });
}
