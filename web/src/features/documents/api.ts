import { apiGet, apiPost } from '#/lib/api/client';
import { type ListQuerySearch, toListQueryString } from '#/lib/api/list-query';
import type {
  CreateDocumentInput,
  CreateDocumentResponse,
  DocumentResponse,
  OrganizationWorkspaceDocumentsResponse,
} from './types';

type CreateDocumentVariables = {
  input: CreateDocumentInput;
  workspaceId: string;
  organizationId: string;
};

type GetDocumentVariables = {
  workspaceId: string;
  organizationId: string;
  documentId: string;
};

export function getWorkspaceDocuments(
  organizationId: string,
  workspaceId: string,
  search: ListQuerySearch,
) {
  return apiGet<OrganizationWorkspaceDocumentsResponse>(
    `/api/organizations/${organizationId}/workspaces/${workspaceId}/documents${toListQueryString(search)}`,
  );
}

export function getDocument({
  organizationId,
  workspaceId,
  documentId,
}: GetDocumentVariables) {
  return apiGet<DocumentResponse>(
    `/api/organizations/${organizationId}/workspaces/${workspaceId}/documents/${documentId}`,
  );
}

export function createDocument({
  input,
  organizationId,
  workspaceId,
}: CreateDocumentVariables) {
  return apiPost<CreateDocumentResponse, CreateDocumentInput>(
    `/api/organizations/${organizationId}/workspaces/${workspaceId}/documents`,
    input,
  );
}
