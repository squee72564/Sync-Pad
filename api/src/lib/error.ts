export type AppEnv = 'development' | 'test' | 'production';

export type AppErrorDetails = Record<string, unknown>;
export type AppErrorMetadata = Record<string, unknown>;

export type AppErrorOptions = {
  cause?: unknown;
  code: string;
  details?: AppErrorDetails;
  expose?: boolean;
  metadata?: AppErrorMetadata;
  message: string;
  requestId?: string;
  status: number;
  tags?: string[];
  timestamp?: string;
  title?: string;
  type?: string;
  userMessage?: string;
};

export type ProblemDetails = {
  code: string;
  detail?: string;
  details?: AppErrorDetails;
  instance?: string;
  status: number;
  title: string;
  type: string;
};

const DEFAULT_STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

const normalizeCodeForType = (code: string) =>
  code
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-');

const getDefaultTitle = (status: number, code: string) =>
  DEFAULT_STATUS_TITLES[status] ?? code.replaceAll('_', ' ');

const getDefaultType = (code: string) =>
  `urn:syncpad:error:${normalizeCodeForType(code)}`;

const getDefaultPublicDetail = (status: number) => {
  if (status >= 500) {
    return 'An unexpected error occurred.';
  }

  return 'The request could not be completed.';
};

export class AppError extends Error {
  readonly code: string;
  readonly details?: AppErrorDetails;
  readonly expose?: boolean;
  readonly metadata?: AppErrorMetadata;
  readonly requestId?: string;
  readonly status: number;
  readonly tags: string[];
  readonly timestamp: string;
  readonly title: string;
  readonly type: string;
  readonly userMessage?: string;

  constructor(options: AppErrorOptions) {
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
    this.title = title ?? getDefaultTitle(status, code);
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

  toProblem(env: AppEnv, options?: { instance?: string }): ProblemDetails {
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

export const isAppError = (value: unknown): value is AppError =>
  value instanceof AppError;

export const toAppError = (
  value: unknown,
  fallback?: Partial<Omit<AppErrorOptions, 'message'>>,
) => {
  if (isAppError(value)) {
    return value;
  }

  const fallbackStatus = fallback?.status ?? 500;
  const fallbackCode = fallback?.code ?? 'INTERNAL_ERROR';

  if (value instanceof Error) {
    return new AppError({
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

  return new AppError({
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
