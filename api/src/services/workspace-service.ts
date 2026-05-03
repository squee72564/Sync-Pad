import { createWorkspaceService as createCoreWorkspaceService } from '@syncpad/core';
import type { OrganizationRepository, WorkspaceRepository } from '@syncpad/db';
import type { AccessGraphSync, PermissionChecker } from '@syncpad/permify';
import {
  accessGraphSync as permifyAccessGraphSync,
  permissionChecker,
} from '../authz/permify-client.js';
import { db } from '../db/client.js';
import { organizationRepository } from '../repositories/organization-repository.js';
import { workspaceRepository } from '../repositories/workspace-repository.js';

export const createWorkspaceService = (dependencies?: {
  accessGraphSync?: AccessGraphSync;
  organizationRepo?: OrganizationRepository;
  permissionChecker?: PermissionChecker;
  workspaceRepo?: WorkspaceRepository;
}) =>
  createCoreWorkspaceService({
    accessGraphSync: dependencies?.accessGraphSync ?? permifyAccessGraphSync,
    db,
    organizationRepo: dependencies?.organizationRepo ?? organizationRepository,
    permissionChecker: dependencies?.permissionChecker ?? permissionChecker,
    workspaceRepo: dependencies?.workspaceRepo ?? workspaceRepository,
  });

export const workspaceService = createWorkspaceService();
