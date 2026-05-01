import { createOrganizationRepository } from '@syncpad/db';
import { db } from '../db/client.js';

export const organizationRepository = createOrganizationRepository(db);
