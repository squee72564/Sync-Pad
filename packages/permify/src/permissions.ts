import {
  type AttributeFilter,
  CheckResult,
  type Subject,
  type Tuple,
  type TupleFilter,
} from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';
import { isPermifyError, PermifyError } from '@syncpad/errors';
import type { PermifyInstance } from './client.js';
import {
  type PermissionCheckItem,
  type PermissionFor,
  type ResourceDescriptorMap,
  type ResourceType,
  resourceDefinitions,
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

const toPermifyTimeoutError = (
  operation: string,
  timeoutMs: number,
): PermifyError =>
  new PermifyError({
    code: 'PERMIFY_TIMEOUT',
    kind: 'dependency_unavailable',
    message: 'Permify request timed out',
    metadata: { operation, timeoutMs },
    retryable: true,
    userMessage: 'Authorization service is unavailable.',
  });

const withPermifyTimeout = async <T>(
  operation: string,
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const abortController = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      abortController.abort();
      reject(toPermifyTimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([run(abortController.signal), timeoutPromise]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
};

const createGrpcCallOptions = (signal: AbortSignal) => ({
  signal,
  onHeader: (_header: unknown) => {},
  onTrailer: (_trailer: unknown) => {},
});

// Permify v1.6.9 validates attributeFilter on Data/Delete even for tuple-only
// deletes. Target a non-existent attribute so tuple cleanup requests stay valid
// without deleting real attribute data.
const noopAttributeFilter: AttributeFilter = {
  entity: {
    type: '__syncpad_noop_attribute_delete__',
    ids: ['__syncpad_noop_attribute_delete__'],
  },
  attributes: ['__syncpad_noop_attribute_delete__'],
};

const noopTupleFilter: TupleFilter = {
  entity: {
    type: '__syncpad_noop_tuple_delete__',
    ids: ['__syncpad_noop_tuple_delete__'],
  },
  relation: '__syncpad_noop_tuple_delete__',
  subject: {
    type: '__syncpad_noop_tuple_delete__',
    ids: ['__syncpad_noop_tuple_delete__'],
    relation: '',
  },
};

type DeleteDataInput =
  | {
      tupleFilter: TupleFilter;
      attributeFilter?: AttributeFilter;
    }
  | {
      tupleFilter?: TupleFilter;
      attributeFilter: AttributeFilter;
    };

export function createPermissionChecker(instance: PermifyInstance) {
  return {
    async checkPermission<TResource extends ResourceType>(
      subject: Subject,
      resource: ResourceDescriptorMap[TResource],
      permission: PermissionFor<TResource>,
      depth: number = 20,
      _instance: PermifyInstance = instance,
    ) {
      try {
        const response = await withPermifyTimeout(
          'checkPermission',
          _instance.requestTimeoutMs,
          (signal) =>
            _instance.grpc.permission.check(
              {
                tenantId: _instance.tenantId,
                metadata: {
                  snapToken: '',
                  depth,
                  schemaVersion: _instance.schemaVersion,
                },
                entity: getResourceEntity(resource),
                permission,
                subject,
              },
              createGrpcCallOptions(signal),
            ),
        );

        return response.can === CheckResult.CHECK_RESULT_ALLOWED;
      } catch (error) {
        throw toPermifyUnavailableError(error, 'checkPermission');
      }
    },

    async bulkCheckPermission(
      items: PermissionCheckItem[],
      depth: number = 20,
      _instance: PermifyInstance = instance,
    ) {
      try {
        const permifyItems = items.map((item) => ({
          entity: getResourceEntity(item.resource),
          permission: item.permission,
          subject: item.subject,
        }));

        const response = await withPermifyTimeout(
          'bulkCheckPermission',
          _instance.requestTimeoutMs,
          (signal) =>
            _instance.grpc.permission.bulkCheck(
              {
                tenantId: _instance.tenantId,
                metadata: {
                  snapToken: '',
                  depth,
                  schemaVersion: _instance.schemaVersion,
                },
                items: permifyItems,
              },
              createGrpcCallOptions(signal),
            ),
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
        await withPermifyTimeout(
          'writeTuples',
          _instance.requestTimeoutMs,
          (signal) =>
            _instance.grpc.data.write(
              {
                tenantId: _instance.tenantId,
                metadata: {
                  schemaVersion: _instance.schemaVersion,
                },
                tuples: Array.isArray(tuples) ? tuples : [tuples],
              },
              createGrpcCallOptions(signal),
            ),
        );
      } catch (error) {
        throw toPermifyUnavailableError(error, 'writeTuples');
      }
    },

    async deleteData(
      input: DeleteDataInput,
      _instance: PermifyInstance = instance,
    ) {
      try {
        await withPermifyTimeout(
          'deleteData',
          _instance.requestTimeoutMs,
          (signal) =>
            _instance.grpc.data.delete(
              {
                tenantId: _instance.tenantId,
                tupleFilter: input.tupleFilter ?? noopTupleFilter,
                attributeFilter: input.attributeFilter ?? noopAttributeFilter,
              },
              createGrpcCallOptions(signal),
            ),
        );
      } catch (error) {
        throw toPermifyUnavailableError(error, 'deleteData');
      }
    },

    async deleteAttributes(
      attributeFilter: AttributeFilter,
      _instance: PermifyInstance = instance,
    ) {
      try {
        await this.deleteData(
          {
            attributeFilter,
          },
          _instance,
        );
      } catch (error) {
        throw toPermifyUnavailableError(error, 'deleteAttributes');
      }
    },

    async deleteTuples(
      tuples: Tuple | Tuple[],
      _instance: PermifyInstance = instance,
    ) {
      try {
        const tupleList = Array.isArray(tuples) ? tuples : [tuples];

        const tupleDeletePromises = tupleList.map((tuple) =>
          this.deleteData(
            {
              tupleFilter: {
                entity: {
                  type: tuple.entity?.type ?? '',
                  ids: [tuple.entity?.id ?? ''],
                },
                relation: tuple.relation,
                subject: {
                  type: tuple.subject?.type ?? '',
                  ids: [tuple.subject?.id ?? ''],
                  relation: '',
                },
              },
            },
            _instance,
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
