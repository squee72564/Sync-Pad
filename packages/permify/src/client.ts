import * as permify from '@permify/permify-node';

type OptionalPermifyGrpcConfig = Omit<
  permify.grpc.Config,
  'cert' | 'pk' | 'certChain' | 'insecure'
> &
  Partial<Pick<permify.grpc.Config, 'cert' | 'pk' | 'certChain' | 'insecure'>>;

export type PermifyConfig = OptionalPermifyGrpcConfig & {
  requestTimeoutMs?: number;
  schemaVersion: string;
  tenantId: string;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;

export function createPermifyClient({
  endpoint,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  schemaVersion,
  tenantId,
  cert = null,
  pk = null,
  certChain = null,
  insecure = null,
}: PermifyConfig) {
  const client = permify.grpc.newClient({
    endpoint,
    cert,
    pk,
    certChain,
    insecure,
  });

  return {
    requestTimeoutMs,
    schemaVersion,
    tenantId,
    grpc: client,
  };
}

export type PermifyInstance = ReturnType<typeof createPermifyClient>;
export type PermifyClient = PermifyInstance['grpc'];
