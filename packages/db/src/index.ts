export { createDbClientAndPool, type DbClient, type DbPool } from './client.js';
export { type DbErrorContext, toDbError, withDbError } from './errors.js';
export type {
  CursorPaginationInput,
  PageInfo,
  PaginatedResult,
  SearchableCursorPaginationInput,
  SearchInput,
} from './pagination.js';
export {
  createDocumentRepository,
  createOrganizationRepository,
  createWorkspaceRepository,
  type DocumentRepository,
  type OrganizationRepository,
  type WorkspaceRepository,
} from './repositories/index.js';
export * as authSchema from './schema/auth-schema.js';
export * as coreSchema from './schema/core.js';
export * as relationsSchema from './schema/relations.js';
export type * from './types.js';
