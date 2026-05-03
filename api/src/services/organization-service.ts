import { createOrganizationService as createCoreOrganizationService } from '@syncpad/core';
import type { OrganizationRepository, WorkspaceRepository } from '@syncpad/db';
import type { AccessGraphSync } from '@syncpad/permify';
import { accessGraphSync as permifyAccessGraphSync } from '../authz/permify-client.js';
import { db } from '../db/client.js';
import { organizationRepository } from '../repositories/organization-repository.js';
import { workspaceRepository } from '../repositories/workspace-repository.js';

export const createOrganizationService = (dependencies?: {
  accessGraphSync?: AccessGraphSync;
  organizationRepo?: OrganizationRepository;
  workspaceRepo?: WorkspaceRepository;
}) =>
  createCoreOrganizationService({
    accessGraphSync: dependencies?.accessGraphSync ?? permifyAccessGraphSync,
    db,
    organizationRepo: dependencies?.organizationRepo ?? organizationRepository,
    workspaceRepo: dependencies?.workspaceRepo ?? workspaceRepository,
  });

export const organizationService = createOrganizationService();
