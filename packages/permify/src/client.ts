import * as permify from '@permify/permify-node';

type OptionalPermifyGrpcConfig = Omit<
  permify.grpc.Config,
  'cert' | 'pk' | 'certChain' | 'insecure'
> &
  Partial<Pick<permify.grpc.Config, 'cert' | 'pk' | 'certChain' | 'insecure'>>;

export type PermifyConfig = OptionalPermifyGrpcConfig & {
  schemaVersion: string;
  tenantId: string;
};

export function createPermifyClient({
  endpoint,
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
    schemaVersion,
    tenantId,
    grpc: client,
  };
}

export type PermifyInstance = ReturnType<typeof createPermifyClient>;
export type PermifyClient = PermifyInstance['grpc'];
