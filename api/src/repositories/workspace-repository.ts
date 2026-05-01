import { createWorkspaceRepository } from '@syncpad/db';
import { db } from '../db/client.js';

export const workspaceRepository = createWorkspaceRepository(db);
