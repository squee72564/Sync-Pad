import {
  authSchema,
  coreSchema,
  type OrganizationRole,
  type User,
  type WorkspaceRole,
} from '@syncpad/db';
import {
  toOrganizationMembershipTuple,
  toWorkspaceMembershipTuple,
  toWorkspaceParentTuple,
} from '@syncpad/permify';
import { and, eq } from 'drizzle-orm';
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

type SeedAccountKey = 'primary' | 'mockCollaborator';

type SeedAccount = {
  key: SeedAccountKey;
  email: string;
  password: string;
  name: string;
  verifyPassword: boolean;
};

type SeedWorkspace = {
  id: string;
  name: string;
  description: string;
  color: string;
  memberships: Partial<Record<SeedAccountKey, WorkspaceRole>>;
};

type SeedOrganization = {
  id: string;
  name: string;
  description: string;
  memberships: Partial<Record<SeedAccountKey, OrganizationRole>>;
  workspaces: SeedWorkspace[];
};

const organizationRoles = coreSchema.organizationRoleEnum.enumValues;
const workspaceRoles = coreSchema.workspaceRoleEnum.enumValues;

const createSeedAccounts = (options: SeedOptions): SeedAccount[] => [
  {
    key: 'primary',
    email: options.email,
    password: options.password,
    name: options.name,
    verifyPassword: true,
  },
  {
    key: 'mockCollaborator',
    email: 'mock.collaborator@syncpad.local',
    password: 'SyncpadMock123!',
    name: 'Mock Collaborator',
    verifyPassword: false,
  },
];

const permissionMatrixSeed: SeedOrganization[] = [
  {
    id: '7c5d70b1-497c-44c3-bc44-bb0c4271ac4c',
    name: 'Primary Owner - Admin Collaborator',
    description:
      'Primary owns this org. Mock collaborator is org admin, so workspace govern should override explicit low workspace roles.',
    memberships: {
      primary: 'owner',
      mockCollaborator: 'admin',
    },
    workspaces: [
      {
        id: 'aafa0ca7-a3c8-4adf-9e95-daa5e0fe3d54',
        name: 'Admin Override Viewer',
        description:
          'Mock has explicit viewer membership, but org admin should still allow manage, write, invite, and document management through parent.manage.',
        color: '#2563EBFF',
        memberships: {
          primary: 'manager',
          mockCollaborator: 'viewer',
        },
      },
      {
        id: '16fb546f-bc02-4f81-bdb3-07d10dd5b3f5',
        name: 'Admin No Workspace Role',
        description:
          'Mock has no workspace membership. Org admin should still see and manage this workspace through organization-level govern.',
        color: '#059669FF',
        memberships: {
          primary: 'manager',
        },
      },
    ],
  },
  {
    id: '9f91c06a-73d9-4b0b-8e1f-85e612a3e70d',
    name: 'Primary Owner - Guest Collaborator',
    description:
      'Primary owns this org. Mock collaborator is an org guest with read access to the org, but workspace access depends on explicit workspace membership.',
    memberships: {
      primary: 'owner',
      mockCollaborator: 'guest',
    },
    workspaces: [
      {
        id: 'd39d5f69-a2de-41d9-8780-99b78cb6e6d7',
        name: 'Guest Workspace Viewer',
        description:
          'Mock is org guest and workspace viewer: should read workspace and documents, but cannot comment, write, invite, or manage.',
        color: '#7C3AEDFF',
        memberships: {
          primary: 'manager',
          mockCollaborator: 'viewer',
        },
      },
      {
        id: '1cfd83f0-63e8-473f-bf31-e8b5aa4df0cf',
        name: 'Guest Workspace Commenter',
        description:
          'Mock is org guest and workspace commenter: should read and comment, but cannot write documents or manage workspace settings.',
        color: '#EA580CFF',
        memberships: {
          primary: 'manager',
          mockCollaborator: 'commenter',
        },
      },
      {
        id: '97f2dc1d-8a49-4ebe-9f3e-1a7dbb56ed59',
        name: 'Guest No Workspace Role',
        description:
          'Mock can read the org as guest, but has no workspace membership here. This workspace should not be listed or readable for mock.',
        color: '#DC2626FF',
        memberships: {
          primary: 'manager',
        },
      },
    ],
  },
  {
    id: '91a5a58b-9201-40ca-843d-c2e1c5368435',
    name: 'Mock Owner - Primary Admin',
    description:
      'Mock collaborator owns this org. Primary user is org admin and should govern every workspace, including workspaces without explicit membership.',
    memberships: {
      primary: 'admin',
      mockCollaborator: 'owner',
    },
    workspaces: [
      {
        id: '62f08a3a-5f7d-4f33-9f23-3a41a1fbf3b1',
        name: 'Primary Admin Viewer Override',
        description:
          'Primary has explicit viewer membership, but org admin should allow manage, write, invite, and document management through parent.manage.',
        color: '#0891B2FF',
        memberships: {
          primary: 'viewer',
          mockCollaborator: 'manager',
        },
      },
      {
        id: '83a548df-7e26-4c0e-8b73-0fc5859950c5',
        name: 'Primary Admin No Workspace Role',
        description:
          'Primary has no workspace membership. Org admin should still see and manage this workspace through organization-level govern.',
        color: '#4F46E5FF',
        memberships: {
          mockCollaborator: 'manager',
        },
      },
    ],
  },
  {
    id: 'd8cd1ce7-52fe-4323-a948-688807208982',
    name: 'Mock Owner - Primary Member',
    description:
      'Mock collaborator owns this org. Primary user is a normal org member, so org read and run_ai are allowed but workspace power comes from explicit workspace role.',
    memberships: {
      primary: 'member',
      mockCollaborator: 'owner',
    },
    workspaces: [
      {
        id: '350d2422-f59d-420a-9ed7-bb2ff03820f9',
        name: 'Primary Workspace Editor',
        description:
          'Primary is org member and workspace editor: should read, comment, write documents, and run AI, but cannot manage workspace settings or members.',
        color: '#16A34AFF',
        memberships: {
          primary: 'editor',
          mockCollaborator: 'manager',
        },
      },
      {
        id: 'b47ec98d-7a93-48ff-aa3c-0aebc6f1a0ef',
        name: 'Primary Workspace Viewer',
        description:
          'Primary is org member and workspace viewer: should read workspace and documents, but cannot comment, write, invite, or manage.',
        color: '#64748BFF',
        memberships: {
          primary: 'viewer',
          mockCollaborator: 'manager',
        },
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

const ensureAuthUser = async (account: SeedAccount) => {
  const existing = await getUserByEmail(account.email);

  if (existing) {
    if (account.verifyPassword) {
      await auth.api.signInEmail({
        body: {
          email: account.email,
          password: account.password,
        },
      });
    }

    return existing;
  }

  const created = await auth.api.signUpEmail({
    body: {
      email: account.email,
      password: account.password,
      name: account.name,
    },
  });

  return created.user;
};

const getSeedUserId = (
  seedUsers: Record<SeedAccountKey, User>,
  key: SeedAccountKey,
) => seedUsers[key].id;

const seedDomainData = async (seedUsers: Record<SeedAccountKey, User>) => {
  const now = new Date();
  const seedUserKeys = Object.keys(seedUsers) as SeedAccountKey[];

  return db.transaction(async (tx) => {
    const organizations = [];
    const organizationMemberships = [];
    const workspaces = [];
    const workspaceMemberships = [];

    for (const seedOrganization of permissionMatrixSeed) {
      const [createdOrganization] = await tx
        .insert(coreSchema.organization)
        .values({
          id: seedOrganization.id,
          name: seedOrganization.name,
          description: seedOrganization.description,
        })
        .onConflictDoUpdate({
          target: coreSchema.organization.id,
          set: {
            name: seedOrganization.name,
            description: seedOrganization.description,
            updatedAt: now,
          },
        })
        .returning();
      organizations.push(createdOrganization);

      for (const [seedUserKey, organizationRole] of Object.entries(
        seedOrganization.memberships,
      ) as [SeedAccountKey, OrganizationRole][]) {
        const userId = getSeedUserId(seedUsers, seedUserKey);
        const [createdOrganizationMembership] = await tx
          .insert(coreSchema.organizationMembership)
          .values({
            userId,
            organizationId: seedOrganization.id,
            organizationRole,
            status: 'active',
            joinedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              coreSchema.organizationMembership.userId,
              coreSchema.organizationMembership.organizationId,
            ],
            set: {
              organizationRole,
              status: 'active',
              joinedAt: now,
              updatedAt: now,
            },
          })
          .returning();
        organizationMemberships.push(createdOrganizationMembership);
      }

      for (const seedWorkspace of seedOrganization.workspaces) {
        const [createdWorkspace] = await tx
          .insert(coreSchema.workspace)
          .values({
            id: seedWorkspace.id,
            name: seedWorkspace.name,
            description: seedWorkspace.description,
            color: seedWorkspace.color,
            organizationId: seedOrganization.id,
          })
          .onConflictDoUpdate({
            target: coreSchema.workspace.id,
            set: {
              name: seedWorkspace.name,
              description: seedWorkspace.description,
              color: seedWorkspace.color,
              organizationId: seedOrganization.id,
              updatedAt: now,
            },
          })
          .returning();
        workspaces.push(createdWorkspace);

        for (const seedUserKey of seedUserKeys) {
          const userId = getSeedUserId(seedUsers, seedUserKey);
          const workspaceRole = seedWorkspace.memberships[seedUserKey];

          if (!workspaceRole) {
            await tx
              .delete(coreSchema.workspaceMembership)
              .where(
                and(
                  eq(coreSchema.workspaceMembership.userId, userId),
                  eq(
                    coreSchema.workspaceMembership.workspaceId,
                    seedWorkspace.id,
                  ),
                ),
              );
            continue;
          }

          const [createdWorkspaceMembership] = await tx
            .insert(coreSchema.workspaceMembership)
            .values({
              userId,
              workspaceId: seedWorkspace.id,
              organizationId: seedOrganization.id,
              workspaceRole,
            })
            .onConflictDoUpdate({
              target: [
                coreSchema.workspaceMembership.userId,
                coreSchema.workspaceMembership.workspaceId,
              ],
              set: {
                organizationId: seedOrganization.id,
                workspaceRole,
                updatedAt: now,
              },
            })
            .returning();
          workspaceMemberships.push(createdWorkspaceMembership);
        }
      }
    }

    return {
      seedUsers,
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
  const seedUserIds = Object.values(seedData.seedUsers).map((user) => user.id);

  await permissionChecker.deleteTuples([
    ...seedData.organizations.flatMap((organization) =>
      seedUserIds.flatMap((userId) =>
        organizationRoles.map((organizationRole) =>
          toOrganizationMembershipTuple({
            organizationId: organization.id,
            organizationRole,
            userId,
          } as Parameters<typeof toOrganizationMembershipTuple>[0]),
        ),
      ),
    ),
    ...seedData.workspaces.flatMap((workspace) =>
      seedUserIds.flatMap((userId) =>
        workspaceRoles.map((workspaceRole) =>
          toWorkspaceMembershipTuple({
            organizationId: workspace.organizationId,
            workspaceId: workspace.id,
            workspaceRole,
            userId,
          } as Parameters<typeof toWorkspaceMembershipTuple>[0]),
        ),
      ),
    ),
  ]);

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

  const seedAccounts = createSeedAccounts(options);
  const primaryAccount = seedAccounts.find(
    (account) => account.key === 'primary',
  );
  const mockAccount = seedAccounts.find(
    (account) => account.key === 'mockCollaborator',
  );

  if (
    primaryAccount?.email.toLowerCase() === mockAccount?.email.toLowerCase()
  ) {
    throw new Error(
      `Seed user email must be different from ${mockAccount?.email}`,
    );
  }

  const seedUsers = Object.fromEntries(
    await Promise.all(
      seedAccounts.map(async (account) => [
        account.key,
        await ensureAuthUser(account),
      ]),
    ),
  ) as Record<SeedAccountKey, User>;
  const seedData = await seedDomainData(seedUsers);

  if (!options.skipPermify) {
    await syncPermifyTuples(seedData);
  }

  console.log('seeded development data');
  for (const account of seedAccounts) {
    const user = seedUsers[account.key];
    console.log(`user: ${user.email} (${user.id})`);
  }
  if (mockAccount) {
    console.log(`mock password: ${mockAccount.password}`);
  }
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
