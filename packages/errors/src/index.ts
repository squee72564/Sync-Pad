export type ErrorKind =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'unauthorized'
  | 'forbidden'
  | 'dependency_unavailable'
  | 'invariant_violation';

export type ErrorDetails = Record<string, unknown>;
export type ErrorMetadata = Record<string, unknown>;
export type ErrorDomain = 'core' | 'db' | 'permify' | 'unknown';

export type SyncpadErrorOptions = {
  cause?: unknown;
  code: string;
  details?: ErrorDetails;
  domain?: ErrorDomain;
  expose?: boolean;
  kind: ErrorKind;
  message: string;
  metadata?: ErrorMetadata;
  retryable?: boolean;
  tags?: string[];
  userMessage?: string;
};

export class SyncpadError extends Error {
  readonly code: string;
  readonly details?: ErrorDetails;
  readonly domain: ErrorDomain;
  readonly expose?: boolean;
  readonly kind: ErrorKind;
  readonly metadata?: ErrorMetadata;
  readonly retryable: boolean;
  readonly tags: string[];
  readonly userMessage?: string;

  constructor(options: SyncpadErrorOptions) {
    super(
      options.message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );

    this.name = new.target.name;
    this.code = options.code;
    this.details = options.details;
    this.domain = options.domain ?? 'unknown';
    this.expose = options.expose;
    this.kind = options.kind;
    this.metadata = options.metadata;
    this.retryable = options.retryable ?? false;
    this.tags = options.tags ?? [];
    this.userMessage = options.userMessage;

    Error.captureStackTrace?.(this, new.target);
  }
}

export class CoreError extends SyncpadError {
  constructor(options: Omit<SyncpadErrorOptions, 'domain'>) {
    super({ ...options, domain: 'core' });
  }
}

export class DbError extends SyncpadError {
  constructor(options: Omit<SyncpadErrorOptions, 'domain'>) {
    super({ ...options, domain: 'db' });
  }
}

export class PermifyError extends SyncpadError {
  constructor(options: Omit<SyncpadErrorOptions, 'domain'>) {
    super({ ...options, domain: 'permify' });
  }
}

export const isSyncpadError = (value: unknown): value is SyncpadError =>
  value instanceof SyncpadError;

export const isCoreError = (value: unknown): value is CoreError =>
  value instanceof CoreError;

export const isDbError = (value: unknown): value is DbError =>
  value instanceof DbError;

export const isPermifyError = (value: unknown): value is PermifyError =>
  value instanceof PermifyError;

export const toSyncpadError = (
  value: unknown,
  fallback: Omit<SyncpadErrorOptions, 'message'> & {
    message?: string;
  },
) => {
  if (isSyncpadError(value)) {
    return value;
  }

  if (value instanceof Error) {
    return new SyncpadError({
      ...fallback,
      cause: fallback.cause ?? value,
      message: fallback.message ?? value.message,
    });
  }

  return new SyncpadError({
    ...fallback,
    message: fallback.message ?? 'Non-error value thrown',
    metadata: {
      thrownValue: value,
      ...(fallback.metadata ?? {}),
    },
  });
};
