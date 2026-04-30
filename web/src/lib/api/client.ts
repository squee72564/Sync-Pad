import { ApiError } from './errors';

type ApiErrorPayload = {
  code?: string;
  detail?: string;
  title?: string;
};

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      accept: 'application/json',
    },
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
