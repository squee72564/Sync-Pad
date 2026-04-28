import { StatusCodes } from 'http-status-codes';

import { env } from '../lib/env.js';
import { AppError } from '../lib/error.js';
import type {
  OrganizationPermission,
  ResourceDescriptor,
  ResourceDescriptorMap,
  ResourceType,
  WorkspacePermission,
} from './permissions.js';
import { resourceDefinitions } from './permissions.js';

type TupleInput = {
  entity: { type: string; id: string };
  relation: string;
  subject: { type: string; id: string };
};

const buildUrl = (path: string) => new URL(path, env.PERMIFY_URL).toString();

const permifyRequest = async <TResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<TResponse> => {
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new AppError({
      cause: error,
      code: 'PERMIFY_UNAVAILABLE',
      message: 'Permify request failed',
      status: StatusCodes.SERVICE_UNAVAILABLE,
      userMessage: 'Authorization service is unavailable.',
    });
  }

  if (!response.ok) {
    throw new AppError({
      code: 'PERMIFY_UNAVAILABLE',
      details: {
        responseStatus: response.status,
      },
      message: `Permify returned ${response.status} for ${path}`,
      status: StatusCodes.SERVICE_UNAVAILABLE,
      userMessage: 'Authorization service is unavailable.',
    });
  }

  return (await response.json()) as TResponse;
};

const getResourceId = <TType extends ResourceType>(
  resource: ResourceDescriptorMap[TType],
) => {
  const idKey = resourceDefinitions[resource.type]
    .idKey as keyof ResourceDescriptorMap[TType];
  const id = resource[idKey];

  if (typeof id !== 'string') {
    throw new AppError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: `Invalid resource descriptor for ${resource.type}`,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return id;
};

const getResourceEntity = <TType extends ResourceType>(
  resource: ResourceDescriptorMap[TType],
) => {
  return {
    type: resource.type,
    id: getResourceId(resource),
  };
};

export const checkPermission = async (
  subjectId: string,
  resource: ResourceDescriptor,
  permission: OrganizationPermission | WorkspacePermission,
) => {
  const response = await permifyRequest<{
    can?: string | number | boolean;
  }>(`/v1/tenants/${env.PERMIFY_TENANT_ID}/permissions/check`, {
    tenantId: env.PERMIFY_TENANT_ID,
    metadata: {
      schemaVersion: env.PERMIFY_SCHEMA_VERSION,
    },
    entity: getResourceEntity(resource),
    permission,
    subject: {
      type: 'user',
      id: subjectId,
    },
  });

  return (
    response.can === true ||
    response.can === 1 ||
    response.can === 'RESULT_ALLOWED'
  );
};

export const writeTuples = async (tuples: TupleInput | TupleInput[]) => {
  await permifyRequest(
    `/v1/tenants/${env.PERMIFY_TENANT_ID}/relationships/write`,
    {
      tenantId: env.PERMIFY_TENANT_ID,
      metadata: {
        schemaVersion: env.PERMIFY_SCHEMA_VERSION,
      },
      tuples: Array.isArray(tuples) ? tuples : [tuples],
    },
  );
};

export const deleteTuples = async (tuples: TupleInput | TupleInput[]) => {
  await permifyRequest(
    `/v1/tenants/${env.PERMIFY_TENANT_ID}/relationships/delete`,
    {
      tenantId: env.PERMIFY_TENANT_ID,
      metadata: {
        schemaVersion: env.PERMIFY_SCHEMA_VERSION,
      },
      tuples: Array.isArray(tuples) ? tuples : [tuples],
    },
  );
};
