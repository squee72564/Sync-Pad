import { type ErrorKind, isSyncpadError } from '@syncpad/errors';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export type AppEnv = 'development' | 'test' | 'production';

export type ApiErrorDetails = Record<string, unknown>;
export type ApiErrorMetadata = Record<string, unknown>;

export type ApiErrorOptions = {
  cause?: unknown;
  code: string;
  details?: ApiErrorDetails;
  expose?: boolean;
  metadata?: ApiErrorMetadata;
  message: string;
  requestId?: string;
  status: ContentfulStatusCode;
  tags?: string[];
  timestamp?: string;
  title?: string;
  type?: string;
  userMessage?: string;
};

export type ProblemDetails = {
  code: string;
  detail?: string;
  details?: ApiErrorDetails;
  instance?: string;
  requestId?: string;
  status: ContentfulStatusCode;
  title: string;
  type: string;
};

const normalizeCodeForType = (code: string) =>
  code
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-');

const getDefaultTitle = (status: ContentfulStatusCode) => {
  try {
    return getReasonPhrase(status);
  } catch {
    return 'Unknown Error';
  }
};

const getDefaultType = (code: string) =>
  `urn:syncpad:error:${normalizeCodeForType(code)}`;

const getDefaultPublicDetail = (status: ContentfulStatusCode) => {
  if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return 'An unexpected error occurred.';
  }

  return 'The request could not be completed.';
};

export class ApiError extends Error {
  readonly code: string;
  readonly details?: ApiErrorDetails;
  readonly expose?: boolean;
  readonly metadata?: ApiErrorMetadata;
  readonly requestId?: string;
  readonly status: ContentfulStatusCode;
  readonly tags: string[];
  readonly timestamp: string;
  readonly title: string;
  readonly type: string;
  readonly userMessage?: string;

  constructor(options: ApiErrorOptions) {
    const {
      cause,
      code,
      details,
      expose,
      metadata,
      message,
      requestId,
      status,
      tags,
      timestamp,
      title,
      type,
      userMessage,
    } = options;

    super(message, cause === undefined ? undefined : { cause });

    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.details = details;
    this.expose = expose;
    this.metadata = metadata;
    this.requestId = requestId;
    this.tags = tags ?? [];
    this.timestamp = timestamp ?? new Date().toISOString();
    this.title = title ?? getDefaultTitle(status);
    this.type = type ?? getDefaultType(code);
    this.userMessage = userMessage;

    Error.captureStackTrace?.(this, new.target);
  }

  shouldExpose(env: AppEnv): boolean {
    if (this.expose !== undefined) {
      return this.expose;
    }

    return env !== 'production';
  }

  toProblem(
    env: AppEnv,
    options?: { instance?: string; requestId?: string },
  ): ProblemDetails {
    const shouldExpose = this.shouldExpose(env);
    const detail = shouldExpose
      ? (this.userMessage ?? this.message)
      : (this.userMessage ?? getDefaultPublicDetail(this.status));

    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail,
      code: this.code,
      details: shouldExpose ? this.details : undefined,
      instance: options?.instance ?? this.requestId,
      requestId: options?.requestId ?? this.requestId,
    };
  }

  toLogObject() {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      title: this.title,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      metadata: this.metadata,
      tags: this.tags,
      requestId: this.requestId,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.cause,
    };
  }
}

export const isApiError = (value: unknown): value is ApiError =>
  value instanceof ApiError;

const syncpadStatusByKind: Record<ErrorKind, ContentfulStatusCode> = {
  conflict: StatusCodes.CONFLICT,
  dependency_unavailable: StatusCodes.SERVICE_UNAVAILABLE,
  forbidden: StatusCodes.FORBIDDEN,
  invariant_violation: StatusCodes.INTERNAL_SERVER_ERROR,
  not_found: StatusCodes.NOT_FOUND,
  unauthorized: StatusCodes.UNAUTHORIZED,
  validation: StatusCodes.BAD_REQUEST,
};

export const toApiError = (
  value: unknown,
  fallback?: Partial<Omit<ApiErrorOptions, 'message'>>,
) => {
  if (isApiError(value)) {
    return value;
  }

  if (isSyncpadError(value)) {
    return new ApiError({
      cause: value.cause ?? value,
      code: value.code,
      details: value.details,
      expose: value.expose,
      metadata: value.metadata,
      message: value.message,
      status: fallback?.status ?? syncpadStatusByKind[value.kind],
      tags: value.tags,
      userMessage: value.userMessage,
    });
  }

  const fallbackStatus = fallback?.status ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const fallbackCode = fallback?.code ?? 'INTERNAL_ERROR';

  if (value instanceof Error) {
    return new ApiError({
      cause: value,
      code: fallbackCode,
      details: fallback?.details,
      expose: fallback?.expose,
      metadata: fallback?.metadata,
      message: value.message,
      requestId: fallback?.requestId,
      status: fallbackStatus,
      tags: fallback?.tags,
      timestamp: fallback?.timestamp,
      title: fallback?.title,
      type: fallback?.type,
      userMessage: fallback?.userMessage,
    });
  }

  return new ApiError({
    code: fallbackCode,
    details: fallback?.details,
    expose: fallback?.expose,
    metadata: {
      thrownValue: value,
      ...(fallback?.metadata ?? {}),
    },
    message: 'Non-error value thrown',
    requestId: fallback?.requestId,
    status: fallbackStatus,
    tags: fallback?.tags,
    timestamp: fallback?.timestamp,
    title: fallback?.title,
    type: fallback?.type,
    userMessage: fallback?.userMessage,
  });
};
