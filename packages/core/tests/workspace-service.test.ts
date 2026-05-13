import type { Document, Workspace, WorkspaceMembership } from '@syncpad/db';
import { describe, expect, it, vi } from 'vitest';

import { createWorkspaceService } from '../src/services/workspace-service.js';

const now = new Date('2026-01-02T03:04:05.000Z');
const tx = { tx: true };

const workspace: Workspace = {
  id: 'workspace_1',
  organizationId: 'organization_1',
  name: 'Product',
  description: 'Roadmap workspace',
  color: '#808080FF',
  createdAt: now,
  updatedAt: now,
};

const membership: WorkspaceMembership = {
  userId: 'user_1',
  workspaceId: workspace.id,
  organizationId: workspace.organizationId,
  workspaceRole: 'manager',
  createdAt: now,
  updatedAt: now,
};

const activeDocument: Document = {
  id: 'document_1',
  workspaceId: workspace.id,
  title: 'Launch plan',
  color: '#00FF00FF',
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const softDeletedDocument: Document = {
  id: 'document_2',
  workspaceId: workspace.id,
  title: 'Archived notes',
  color: '#FF0000FF',
  createdAt: now,
  updatedAt: now,
  deletedAt: now,
};

function createSubject() {
  const accessGraphSync = {
    apply: vi.fn().mockResolvedValue(undefined),
  };
  const documentRepo = {
    listByWorkspace: vi
      .fn()
      .mockResolvedValue([activeDocument, softDeletedDocument]),
  };
  const workspaceRepo = {
    findById: vi.fn().mockResolvedValue(workspace),
    listMemberships: vi.fn().mockResolvedValue([membership]),
    deleteWorkspace: vi.fn().mockResolvedValue(workspace),
    updateWorkspace: vi.fn().mockResolvedValue(workspace),
  };
  const service = createWorkspaceService({
    accessGraphSync,
    db: {
      transaction: vi.fn((callback) => callback(tx)),
    } as never,
    documentRepo: documentRepo as never,
    organizationRepo: {} as never,
    permissionChecker: {} as never,
    workspaceRepo: workspaceRepo as never,
  });

  return {
    accessGraphSync,
    documentRepo,
    service,
    workspaceRepo,
  };
}

describe('workspaceService', () => {
  it('deletes document, workspace, and membership tuples when deleting a workspace', async () => {
    const { accessGraphSync, documentRepo, service, workspaceRepo } =
      createSubject();

    await expect(service.deleteWorkspace(workspace.id)).resolves.toEqual(
      workspace,
    );

    expect(documentRepo.listByWorkspace).toHaveBeenCalledWith(
      workspace.id,
      { includeDeleted: true },
      tx,
    );
    expect(accessGraphSync.apply).toHaveBeenCalledWith([
      {
        type: 'delete',
        tuples: {
          entity: { type: 'document', id: activeDocument.id },
          relation: 'parent',
          subject: { type: 'workspace', id: workspace.id, relation: '' },
        },
      },
      {
        type: 'delete',
        tuples: {
          entity: { type: 'document', id: softDeletedDocument.id },
          relation: 'parent',
          subject: { type: 'workspace', id: workspace.id, relation: '' },
        },
      },
      {
        type: 'delete',
        tuples: {
          entity: { type: 'workspace', id: workspace.id },
          relation: 'parent',
          subject: {
            type: 'organization',
            id: workspace.organizationId,
            relation: '',
          },
        },
      },
      {
        type: 'delete',
        tuples: {
          entity: { type: 'workspace', id: workspace.id },
          relation: membership.workspaceRole,
          subject: { type: 'user', id: membership.userId, relation: '' },
        },
      },
    ]);
    expect(workspaceRepo.deleteWorkspace).toHaveBeenCalledWith(
      workspace.id,
      tx,
    );
  });

  it('does not sync access graph tuples when updating workspace details', async () => {
    const { accessGraphSync, service, workspaceRepo } = createSubject();

    await expect(
      service.updateWorkspace({
        workspaceId: workspace.id,
        data: {
          color: '#000000FF',
          description: 'Updated',
          name: 'Updated product',
        },
      }),
    ).resolves.toEqual(workspace);

    expect(workspaceRepo.updateWorkspace).toHaveBeenCalledWith(workspace.id, {
      color: '#000000FF',
      description: 'Updated',
      name: 'Updated product',
    });
    expect(accessGraphSync.apply).not.toHaveBeenCalled();
  });
});
