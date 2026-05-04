import { authSchema, coreSchema } from '@syncpad/db';
import {
  toOrganizationMembershipTuple,
  toWorkspaceMembershipTuple,
  toWorkspaceParentTuple,
} from '@syncpad/permify';
import { eq } from 'drizzle-orm';
import { env } from '../lib/env.js';
import { createApiDeps } from './deps.js';

const deps = createApiDeps(env);
const { auth, permissionChecker, db, pool } = deps;

type SeedOptions = {
  email: string;
  password: string;
  name: string;
  skipPermify: boolean;
};

type SeedWorkspace = {
  id: string;
  name: string;
  role: 'manager' | 'editor' | 'commenter' | 'viewer';
};

type SeedOrganization = {
  id: string;
  name: string;
  workspaces: SeedWorkspace[];
};

const defaultSeed: SeedOrganization[] = [
  {
    id: '7c5d70b1-497c-44c3-bc44-bb0c4271ac4c',
    name: 'SyncPad Demo',
    workspaces: [
      {
        id: 'aafa0ca7-a3c8-4adf-9e95-daa5e0fe3d54',
        name: 'Product Planning',
        role: 'manager',
      },
      {
        id: '16fb546f-bc02-4f81-bdb3-07d10dd5b3f5',
        name: 'Design Reviews',
        role: 'editor',
      },
      {
        id: 'd39d5f69-a2de-41d9-8780-99b78cb6e6d7',
        name: 'Research Notes',
        role: 'commenter',
      },
    ],
  },
  {
    id: '9f91c06a-73d9-4b0b-8e1f-85e612a3e70d',
    name: 'Acme Studio',
    workspaces: [
      {
        id: '1cfd83f0-63e8-473f-bf31-e8b5aa4df0cf',
        name: 'Client Portal',
        role: 'manager',
      },
      {
        id: '97f2dc1d-8a49-4ebe-9f3e-1a7dbb56ed59',
        name: 'Launch Room',
        role: 'viewer',
      },
    ],
  },
];

const usage = `Usage:
  pnpm db:seed:dev [--email user@example.com] [--password password] [--name "Dev User"] [--skip-permify]

Environment fallbacks:
  SEED_USER_EMAIL, SEED_USER_PASSWORD, SEED_USER_NAME
`;

const readFlagValue = (args: string[], flag: string) => {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];

  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
};

const parseOptions = (args: string[]): SeedOptions => {
  return {
    email:
      readFlagValue(args, '--email') ??
      process.env.SEED_USER_EMAIL ??
      'dev@syncpad.local',
    password:
      readFlagValue(args, '--password') ??
      process.env.SEED_USER_PASSWORD ??
      'SyncpadDev123!',
    name:
      readFlagValue(args, '--name') ??
      process.env.SEED_USER_NAME ??
      'SyncPad Dev',
    skipPermify: args.includes('--skip-permify'),
  };
};

const getUserByEmail = async (email: string) => {
  return db.query.user.findFirst({
    where: eq(authSchema.user.email, email),
  });
};

const ensureAuthUser = async (options: SeedOptions) => {
  const existing = await getUserByEmail(options.email);

  if (existing) {
    await auth.api.signInEmail({
      body: {
        email: options.email,
        password: options.password,
      },
    });

    return existing;
  }

  const created = await auth.api.signUpEmail({
    body: {
      email: options.email,
      password: options.password,
      name: options.name,
    },
  });

  return created.user;
};

const seedDomainData = async (userId: string) => {
  const now = new Date();

  return db.transaction(async (tx) => {
    const organizations = [];
    const organizationMemberships = [];
    const workspaces = [];
    const workspaceMemberships = [];

    for (const seedOrganization of defaultSeed) {
      const [createdOrganization] = await tx
        .insert(coreSchema.organization)
        .values({
          id: seedOrganization.id,
          name: seedOrganization.name,
        })
        .onConflictDoUpdate({
          target: coreSchema.organization.id,
          set: {
            name: seedOrganization.name,
            updatedAt: now,
          },
        })
        .returning();
      organizations.push(createdOrganization);

      const [createdOrganizationMembership] = await tx
        .insert(coreSchema.organizationMembership)
        .values({
          userId,
          organizationId: seedOrganization.id,
          organizationRole: 'owner',
          status: 'active',
          invitedBy: userId,
          joinedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            coreSchema.organizationMembership.userId,
            coreSchema.organizationMembership.organizationId,
          ],
          set: {
            organizationRole: 'owner',
            status: 'active',
            invitedBy: userId,
            joinedAt: now,
            updatedAt: now,
          },
        })
        .returning();
      organizationMemberships.push(createdOrganizationMembership);

      for (const seedWorkspace of seedOrganization.workspaces) {
        const [createdWorkspace] = await tx
          .insert(coreSchema.workspace)
          .values({
            id: seedWorkspace.id,
            name: seedWorkspace.name,
            organizationId: seedOrganization.id,
          })
          .onConflictDoUpdate({
            target: coreSchema.workspace.id,
            set: {
              name: seedWorkspace.name,
              organizationId: seedOrganization.id,
              updatedAt: now,
            },
          })
          .returning();
        workspaces.push(createdWorkspace);

        const [createdWorkspaceMembership] = await tx
          .insert(coreSchema.workspaceMembership)
          .values({
            userId,
            workspaceId: seedWorkspace.id,
            organizationId: seedOrganization.id,
            workspaceRole: seedWorkspace.role,
          })
          .onConflictDoUpdate({
            target: [
              coreSchema.workspaceMembership.userId,
              coreSchema.workspaceMembership.workspaceId,
            ],
            set: {
              organizationId: seedOrganization.id,
              workspaceRole: seedWorkspace.role,
              updatedAt: now,
            },
          })
          .returning();
        workspaceMemberships.push(createdWorkspaceMembership);
      }
    }

    return {
      organizations,
      organizationMemberships,
      workspaces,
      workspaceMemberships,
    };
  });
};

const syncPermifyTuples = async (
  seedData: Awaited<ReturnType<typeof seedDomainData>>,
) => {
  await permissionChecker.writeTuples([
    ...seedData.organizationMemberships.map(toOrganizationMembershipTuple),
    ...seedData.workspaces.map(toWorkspaceParentTuple),
    ...seedData.workspaceMemberships.map(toWorkspaceMembershipTuple),
  ]);
};

const runDevSeed = async (options: SeedOptions) => {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run dev seed against NODE_ENV=production');
  }

  const seededUser = await ensureAuthUser(options);
  const seedData = await seedDomainData(seededUser.id);

  if (!options.skipPermify) {
    await syncPermifyTuples(seedData);
  }

  console.log('seeded development data');
  console.log(`user: ${seededUser.email} (${seededUser.id})`);
  console.log(`organizations: ${seedData.organizations.length}`);
  console.log(`workspaces: ${seedData.workspaces.length}`);
  for (const seededWorkspace of seedData.workspaces) {
    console.log(
      `workspace: /organizations/${seededWorkspace.organizationId}/workspaces/${seededWorkspace.id}`,
    );
  }
  console.log(`permify: ${options.skipPermify ? 'skipped' : 'synced'}`);
};

export const runDevSeedCli = async (args = process.argv.slice(2)) => {
  try {
    if (args.includes('--help') || args.includes('-h')) {
      console.log(usage);
      return;
    }

    await runDevSeed(parseOptions(args));
  } finally {
    await pool.end();
  }
};

await runDevSeedCli();
