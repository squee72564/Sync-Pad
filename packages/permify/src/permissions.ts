import {
  CheckResult,
  type Subject,
  type Tuple,
} from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';
import { isPermifyError, PermifyError } from '@syncpad/errors';
import type { PermifyInstance } from './client.js';
import {
  type OrganizationPermission,
  type ResourceDescriptor,
  type ResourceDescriptorMap,
  type ResourceType,
  resourceDefinitions,
  type WorkspacePermission,
} from './types.js';

const getResourceId = <TType extends ResourceType>(
  resource: ResourceDescriptorMap[TType],
) => {
  const idKey = resourceDefinitions[resource.type]
    .idKey as keyof ResourceDescriptorMap[TType];
  const id = resource[idKey];

  if (typeof id !== 'string') {
    throw new PermifyError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      details: { resourceType: resource.type },
      kind: 'invariant_violation',
      message: `Invalid resource descriptor for ${resource.type}`,
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

const toPermifyUnavailableError = (
  error: unknown,
  operation: string,
): PermifyError => {
  if (isPermifyError(error)) {
    return error;
  }

  return new PermifyError({
    cause: error,
    code: 'PERMIFY_UNAVAILABLE',
    kind: 'dependency_unavailable',
    message: 'Permify request failed',
    metadata: { operation },
    retryable: true,
    userMessage: 'Authorization service is unavailable.',
  });
};

export function createPermissionChecker(instance: PermifyInstance) {
  return {
    async checkPermission(
      subject: Subject,
      resource: ResourceDescriptor,
      permission: OrganizationPermission | WorkspacePermission,
      depth: number = 20,
      _instance: PermifyInstance = instance,
    ) {
      try {
        const response = await _instance.grpc.permission.check({
          tenantId: _instance.tenantId,
          metadata: {
            snapToken: '',
            depth,
            schemaVersion: _instance.schemaVersion,
          },
          entity: getResourceEntity(resource),
          permission,
          subject,
        });

        return response.can === CheckResult.CHECK_RESULT_ALLOWED;
      } catch (error) {
        throw toPermifyUnavailableError(error, 'checkPermission');
      }
    },

    async bulkCheckPermission(
      items: {
        subject: Subject;
        resource: ResourceDescriptor;
        permission: OrganizationPermission | WorkspacePermission;
      }[],
      depth: number = 20,
      _instance: PermifyInstance = instance,
    ) {
      try {
        for (const item of items) {
          getResourceEntity(item.resource);
        }

        const response = await _instance.grpc.permission.bulkCheck(
          {
            tenantId: _instance.tenantId,
            metadata: {
              snapToken: '',
              depth,
              schemaVersion: _instance.schemaVersion,
            },
            items: items,
          },
          {
            signal: undefined,
            onHeader: (_header) => {},
            onTrailer: (_trailer) => {},
          },
        );

        return response.results.map((result, i) => ({
          item_index: i,
          result: result.can === CheckResult.CHECK_RESULT_ALLOWED,
        }));
      } catch (error) {
        throw toPermifyUnavailableError(error, 'bulkCheckPermission');
      }
    },

    async writeTuples(
      tuples: Tuple | Tuple[],
      _instance: PermifyInstance = instance,
    ) {
      try {
        await _instance.grpc.data.write(
          {
            tenantId: _instance.tenantId,
            metadata: {
              schemaVersion: _instance.schemaVersion,
            },
            tuples: Array.isArray(tuples) ? tuples : [tuples],
          },
          {
            signal: undefined,
            onHeader: (_header) => {},
            onTrailer: (_trailer) => {},
          },
        );
      } catch (error) {
        throw toPermifyUnavailableError(error, 'writeTuples');
      }
    },

    async deleteTuples(
      tuples: Tuple | Tuple[],
      _instance: PermifyInstance = instance,
    ) {
      try {
        const tupleList = Array.isArray(tuples) ? tuples : [tuples];

        // TODO: We need to make sure this is safe
        const tupleDeletePromises = tupleList.map((tuple) =>
          _instance.grpc.data.delete(
            {
              tenantId: _instance.tenantId,
              tupleFilter: {
                entity: {
                  type: tuple.entity?.type,
                  ids: [tuple.entity?.id ?? ''],
                },
                relation: tuple.relation,
                subject: {
                  type: tuple.subject?.type,
                  ids: [tuple.subject?.id ?? ''],
                  relation: '',
                },
              },
            },
            {
              signal: undefined,
              onHeader: (_header) => {},
              onTrailer: (_trailer) => {},
            },
          ),
        );

        await Promise.all(tupleDeletePromises);
      } catch (error) {
        throw toPermifyUnavailableError(error, 'deleteTuples');
      }
    },
  };
}

export type PermissionChecker = ReturnType<typeof createPermissionChecker>;
