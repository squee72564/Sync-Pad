import * as permify from '@permify/permify-node';

export function createPermifyClient({
  endpoint,
  cert = null,
  pk = null,
  certChain = null,
  insecure = null,
}: permify.grpc.Config) {
  const client = permify.grpc.newClient({
    endpoint,
    cert,
    pk,
    certChain,
    insecure,
  });

  return client;
}
