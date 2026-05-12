import type {
  DbClient,
  InvitableOrganizationRole,
  NewOrganization,
  OrganizationInvite,
  OrganizationInviteStatus,
  OrganizationMembershipStatus,
  OrganizationRepository,
  OrganizationRole,
  SearchableCursorPaginationInput,
  WorkspaceRepository,
} from '@syncpad/db';
import { CoreError, isDbError } from '@syncpad/errors';
import {
  type AccessGraphOperation,
  type AccessGraphSync,
  type OrganizationPermission,
  type PermissionChecker,
  type PermissionMapFor,
  type ResourceAccess,
  resources,
  subjects,
  toOrganizationMembershipTuple,
  toWorkspaceMembershipTuple,
} from '@syncpad/permify';
import { syncOrThrow } from '../utils/index.js';

export type OrganizationServiceDeps = {
  organizationRepo: OrganizationRepository;
  workspaceRepo: WorkspaceRepository;
  accessGraphSync: AccessGraphSync;
  permissionChecker: PermissionChecker;
  db: DbClient;
};

type ActorId = { actorUserId: string };
type OrganizationId = { organizationId: string };

type CreateOrganizationInput = {
  input: Pick<NewOrganization, 'name' | 'description'>;
} & ActorId;

type CreateOrganizationInviteInput = {
  input: {
    email: string;
    expiresAt: Date;
    organizationId: string;
    organizationRole: InvitableOrganizationRole;
    tokenHash: string;
  };
} & ActorId;

type UpdateOrganizationInput = {
  input: Partial<Pick<NewOrganization, 'name' | 'description'>>;
} & OrganizationId;

type UpsertOrganizationMembershipInput = {
  userId: string;
  input: {
    organizationRole?: OrganizationRole;
    status?: OrganizationMembershipStatus;
  };
} & Partial<ActorId> &
  OrganizationId;

export function createOrganizationService(deps: OrganizationServiceDeps) {
  const {
    organizationRepo,
    workspaceRepo,
    accessGraphSync,
    permissionChecker,
    db,
  } = deps;

  const buildWorkspaceMembershipDeleteOperations = (
    memberships: Awaited<
      ReturnType<WorkspaceRepository['listMembershipsByOrganizationAndUser']>
    >,
  ): AccessGraphOperation[] =>
    memberships.map((membership) => ({
      type: 'delete',
      tuples: toWorkspaceMembershipTuple(membership),
    }));

  const throwInvitationInvalidStatus = ({
    action,
    organizationId,
    status,
  }: {
    action: 'accept' | 'decline' | 'revoke';
    organizationId: string;
    status: OrganizationInviteStatus;
  }) => {
    throw new CoreError({
      code: 'ORGANIZATION_INVITATION_INVALID_STATUS',
      expose: true,
      kind: 'invariant_violation',
      message: `Attempted to ${action} organization invite in ${organizationId} but status was ${status}`,
      userMessage: 'Organization invite status invalid.',
    });
  };

  const throwInvitationExpired = (organizationId: string) => {
    throw new CoreError({
      code: 'ORGANIZATION_INVITATION_EXPIRED',
      expose: true,
      kind: 'validation',
      message: `Attempted to accept or decline expired organization invite in ${organizationId}.`,
      userMessage: 'Organization invite has expired.',
    });
  };

  const throwInvitationTransitionFailed = (
    action: 'accept' | 'decline' | 'revoke',
    organizationId: string,
  ) => {
    throw new CoreError({
      code: 'ORGANIZATION_INVITATION_TRANSITION_FAILED',
      expose: true,
      kind: 'conflict',
      message: `Organization invite in ${organizationId} could not be ${action}ed because it changed state.`,
      userMessage:
        'Organization invite changed state. Please refresh and try again.',
    });
  };

  const throwInvitationSentMarkFailed = (organizationId: string) => {
    throw new CoreError({
      code: 'ORGANIZATION_INVITATION_TRANSITION_FAILED',
      expose: true,
      kind: 'conflict',
      message: `Organization invite in ${organizationId} could not be marked sent because it changed state.`,
      userMessage:
        'Organization invite changed state. Please refresh and try again.',
    });
  };

  const throwInvitationTokenRotationFailed = (organizationId: string) => {
    throw new CoreError({
      code: 'ORGANIZATION_INVITATION_TRANSITION_FAILED',
      expose: true,
      kind: 'conflict',
      message: `Organization invite in ${organizationId} could not rotate token because it changed state.`,
      userMessage:
        'Organization invite changed state. Please refresh and try again.',
    });
  };

  const throwDuplicatePendingInvite = (
    organizationId: string,
    email: string,
  ) => {
    throw new CoreError({
      code: 'ORGANIZATION_INVITATION_ALREADY_PENDING',
      expose: true,
      kind: 'conflict',
      message: `Organization invite for ${email} in ${organizationId} is already pending.`,
      userMessage: 'Organization invite is already pending.',
    });
  };

  const normalizeOrganizationInvitationExpiry = async (
    organizationInvite: OrganizationInvite,
    tx: Parameters<
      OrganizationRepository['getOrganizationInvitationByToken']
    >[1],
  ) => {
    if (
      organizationInvite.status !== 'pending' ||
      organizationInvite.expiresAt > new Date()
    ) {
      return organizationInvite;
    }

    return (
      (await organizationRepo.expireOrganizationInvitation(
        {
          organizationId: organizationInvite.organizationId,
          tokenHash: organizationInvite.tokenHash,
        },
        tx,
      )) ?? organizationInvite
    );
  };

  return {
    async getOrganizationAccess({
      actorUserId,
      organizationId,
      permissions,
    }: {
      actorUserId: string;
      organizationId: string;
      permissions: OrganizationPermission[];
    }): Promise<ResourceAccess<'organization'>> {
      const subject = subjects.user(actorUserId);
      const resource = resources.organization(organizationId);

      const results = await permissionChecker.bulkCheckPermission(
        permissions.map((permission) => ({
          subject,
          resource,
          permission,
        })),
      );

      const access: PermissionMapFor<'organization'> = {
        read: false,
        manage: false,
        invite: false,
        create_workspace: false,
        run_ai: false,
      };

      for (const result of results) {
        const permission = permissions[result.item_index];

        if (!permission) {
          continue;
        }

        access[permission] = result.result;
      }

      return {
        permissions: access,
      };
    },

    findById(organizationId: string) {
      return organizationRepo.findById(organizationId);
    },

    listOrganizationsForUser(userId: string) {
      return organizationRepo.listOrganizationsForUser(userId);
    },

    listOrganizationsForUserPage(
      input: { actorUserId: string } & SearchableCursorPaginationInput,
    ) {
      return organizationRepo.listOrganizationsForUserPage({
        userId: input.actorUserId,
        q: input.q,
        pagination: input.pagination,
      });
    },

    listMemberships(organizationId: string) {
      return organizationRepo.listMemberships(organizationId);
    },

    listMembershipsWithUserProfiles(organizationId: string) {
      return organizationRepo.listMembershipsWithUserProfiles(organizationId);
    },

    createOrganization({ actorUserId, input }: CreateOrganizationInput) {
      return db.transaction(async (tx) => {
        const createdOrganization = await organizationRepo.insertOrganization(
          {
            id: crypto.randomUUID(),
            name: input.name,
            description: input.description,
          },
          tx,
        );

        const ownerMembership = await organizationRepo.insertMembership(
          {
            userId: actorUserId,
            organizationId: createdOrganization.id,
            organizationRole: 'owner',
            status: 'active',
            joinedAt: new Date(),
          },
          tx,
        );

        await syncOrThrow(accessGraphSync, {
          type: 'write',
          tuples: toOrganizationMembershipTuple(ownerMembership),
        });

        return createdOrganization;
      });
    },

    updateOrganization({ organizationId, input }: UpdateOrganizationInput) {
      return organizationRepo.updateOrganization(organizationId, input);
    },

    addMember({
      organizationId,
      userId,
      input,
    }: UpsertOrganizationMembershipInput) {
      return db.transaction(async (tx) => {
        const status = input.status ?? 'active';
        const membership = await organizationRepo.insertMembership(
          {
            userId,
            organizationId,
            organizationRole: input.organizationRole ?? 'member',
            status,
            joinedAt: status === 'active' ? new Date() : null,
          },
          tx,
        );

        if (membership.status === 'active') {
          await syncOrThrow(accessGraphSync, {
            type: 'write',
            tuples: toOrganizationMembershipTuple(membership),
          });
        }

        return membership;
      });
    },

    updateMember({
      organizationId,
      userId,
      input,
    }: Omit<UpsertOrganizationMembershipInput, 'actorUserId'>) {
      return db.transaction(async (tx) => {
        const existing = await organizationRepo.findMembership(
          organizationId,
          userId,
          tx,
        );

        if (!existing) {
          throw new CoreError({
            code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization membership for ${userId} in ${organizationId} was not found`,
            userMessage: 'Organization membership not found.',
          });
        }

        const nextJoinedAt =
          input.status === 'active'
            ? (existing.joinedAt ?? new Date())
            : input.status
              ? null
              : undefined;

        const updated = await organizationRepo.updateMembership(
          organizationId,
          userId,
          {
            organizationRole: input.organizationRole,
            status: input.status,
            joinedAt: nextJoinedAt,
          },
          tx,
        );

        if (!updated) {
          throw new CoreError({
            code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization membership for ${userId} in ${organizationId} disappeared during update`,
            userMessage: 'Organization membership not found.',
          });
        }

        const shouldRevokeWorkspaceMemberships =
          input.status !== undefined &&
          input.status !== 'active' &&
          existing.status === 'active';
        const existingWorkspaceMemberships = shouldRevokeWorkspaceMemberships
          ? await workspaceRepo.listMembershipsByOrganizationAndUser(
              organizationId,
              userId,
              tx,
            )
          : [];

        const operations: AccessGraphOperation[] = [];

        if (existing.status === 'active') {
          operations.push({
            type: 'delete',
            tuples: toOrganizationMembershipTuple(existing),
          });
        }

        if (updated.status === 'active') {
          operations.push({
            type: 'write',
            tuples: toOrganizationMembershipTuple(updated),
          });
        }

        if (shouldRevokeWorkspaceMemberships) {
          await workspaceRepo.deleteMembershipsByOrganizationAndUser(
            organizationId,
            userId,
            tx,
          );
          operations.push(
            ...buildWorkspaceMembershipDeleteOperations(
              existingWorkspaceMemberships,
            ),
          );
        }

        if (operations.length > 0) {
          await syncOrThrow(accessGraphSync, operations);
        }

        return updated;
      });
    },

    deleteMember(organizationId: string, userId: string) {
      return db.transaction(async (tx) => {
        const existingWorkspaceMemberships =
          await workspaceRepo.listMembershipsByOrganizationAndUser(
            organizationId,
            userId,
            tx,
          );
        const deleted = await organizationRepo.deleteMembership(
          organizationId,
          userId,
          tx,
        );

        const operations: AccessGraphOperation[] = [];

        if (deleted?.status === 'active') {
          operations.push({
            type: 'delete',
            tuples: toOrganizationMembershipTuple(deleted),
          });
        }

        operations.push(
          ...buildWorkspaceMembershipDeleteOperations(
            existingWorkspaceMemberships,
          ),
        );

        if (operations.length > 0) {
          await syncOrThrow(accessGraphSync, operations);
        }

        return deleted;
      });
    },

    async createOrganizationInvitation({
      input,
      actorUserId,
    }: CreateOrganizationInviteInput) {
      return db.transaction(async (tx) => {
        const invitedUser = await organizationRepo.findUserByEmail(
          input.email,
          tx,
        );

        if (invitedUser) {
          const existingMembership = await organizationRepo.findMembership(
            input.organizationId,
            invitedUser.id,
            tx,
          );

          if (existingMembership?.status === 'active') {
            throw new CoreError({
              code: 'ORGANIZATION_MEMBER_ALREADY_EXISTS',
              expose: true,
              kind: 'conflict',
              message: `User ${invitedUser.id} is already an active member of organization ${input.organizationId}.`,
              userMessage: 'User is already an active organization member.',
            });
          }
        }

        const createdOrganizationInvite = await organizationRepo
          .createOrganizationInvitation(
            {
              id: crypto.randomUUID(),
              email: input.email,
              expiresAt: input.expiresAt,
              organizationId: input.organizationId,
              organizationRole: input.organizationRole,
              tokenHash: input.tokenHash,
              invitedBy: actorUserId,
            },
            tx,
          )
          .catch((error: unknown) => {
            if (
              isDbError(error) &&
              error.code === 'DATABASE_UNIQUE_CONSTRAINT_VIOLATION' &&
              error.metadata?.constraint ===
                'organization_invite_pending_email_unique'
            ) {
              throwDuplicatePendingInvite(input.organizationId, input.email);
            }

            throw error;
          });

        return createdOrganizationInvite;
      });
    },

    async getOrganizationInvitationById(input: {
      organizationInviteId: string;
      organizationId: string;
    }) {
      return db.transaction(async (tx) => {
        const organizationInvite =
          await organizationRepo.getOrganizationInvitationById(
            {
              organizationId: input.organizationId,
              organizationInviteId: input.organizationInviteId,
            },
            tx,
          );

        if (!organizationInvite) {
          throw new CoreError({
            code: 'ORGANIZATION_INVITATION_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization invite in ${input.organizationId} not found.`,
            userMessage: 'Organization invite not found.',
          });
        }

        return normalizeOrganizationInvitationExpiry(organizationInvite, tx);
      });
    },

    async getOrganizationInvitationByToken(input: {
      tokenHash: string;
      organizationId: string;
    }) {
      return db.transaction(async (tx) => {
        const organizationInvite =
          await organizationRepo.getOrganizationInvitationByToken(
            {
              organizationId: input.organizationId,
              tokenHash: input.tokenHash,
            },
            tx,
          );

        if (!organizationInvite) {
          throw new CoreError({
            code: 'ORGANIZATION_INVITATION_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization invite in ${input.organizationId} not found.`,
            userMessage: 'Organization invite not found.',
          });
        }

        return normalizeOrganizationInvitationExpiry(organizationInvite, tx);
      });
    },

    async getOrganizationInvitationForUserById(input: {
      organizationInviteId: string;
      userEmail: string;
    }) {
      return db.transaction(async (tx) => {
        const organizationInvite =
          await organizationRepo.getOrganizationInvitationForUserById(
            input,
            tx,
          );

        if (!organizationInvite) {
          throw new CoreError({
            code: 'ORGANIZATION_INVITATION_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization invite ${input.organizationInviteId} for user not found.`,
            userMessage: 'Organization invite not found.',
          });
        }

        return normalizeOrganizationInvitationExpiry(organizationInvite, tx);
      });
    },

    async markOrganizationInvitationSent(input: {
      tokenHash: string;
      organizationId: string;
      sentAt: Date;
    }) {
      return db.transaction(async (tx) => {
        const organizationInvite =
          await organizationRepo.markOrganizationInvitationSent(input, tx);

        if (!organizationInvite) {
          throwInvitationSentMarkFailed(input.organizationId);
        }

        return organizationInvite;
      });
    },

    async rotateOrganizationInvitationToken(input: {
      organizationInviteId: string;
      organizationId: string;
      tokenHash: string;
      sentAt: Date;
    }) {
      return db.transaction(async (tx) => {
        const organizationInvite =
          await organizationRepo.rotateOrganizationInvitationToken(input, tx);

        if (!organizationInvite) {
          throwInvitationTokenRotationFailed(input.organizationId);
        }

        return organizationInvite;
      });
    },

    async rotateOrganizationInvitationTokenForOpen(input: {
      organizationInviteId: string;
      organizationId: string;
      tokenHash: string;
      rotatedAt: Date;
    }) {
      return db.transaction(async (tx) => {
        const organizationInvite =
          await organizationRepo.rotateOrganizationInvitationTokenForOpen(
            input,
            tx,
          );

        if (!organizationInvite) {
          throwInvitationTokenRotationFailed(input.organizationId);
        }

        return organizationInvite;
      });
    },

    async acceptOrganizationInvitation(input: {
      tokenHash: string;
      actorUserId: string;
      actorEmail: string;
      organizationId: string;
    }) {
      return db.transaction(async (tx) => {
        const loadedOrganizationInvite =
          await organizationRepo.getOrganizationInvitationByToken(input, tx);

        if (!loadedOrganizationInvite) {
          throw new CoreError({
            code: 'ORGANIZATION_INVITATION_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization invite in ${input.organizationId} not found.`,
            userMessage: 'Organization invite not found.',
          });
        }

        const organizationInvite = await normalizeOrganizationInvitationExpiry(
          loadedOrganizationInvite,
          tx,
        );

        if (organizationInvite.status === 'expired') {
          throwInvitationExpired(input.organizationId);
        }

        if (organizationInvite.status !== 'pending') {
          throwInvitationInvalidStatus({
            action: 'accept',
            organizationId: input.organizationId,
            status: organizationInvite.status,
          });
        }

        if (
          organizationInvite.email !== input.actorEmail.trim().toLowerCase()
        ) {
          throw new CoreError({
            code: 'ORGANIZATION_INVITATION_EMAIL_MISMATCH',
            expose: true,
            kind: 'forbidden',
            message: `User ${input.actorUserId} attempted to accept organization invite for ${organizationInvite.email}.`,
            userMessage:
              'Organization invite was sent to a different email address.',
          });
        }

        const existingMembership = await organizationRepo.findMembership(
          input.organizationId,
          input.actorUserId,
          tx,
        );

        if (existingMembership?.status === 'active') {
          throw new CoreError({
            code: 'ORGANIZATION_MEMBER_ALREADY_EXISTS',
            expose: true,
            kind: 'conflict',
            message: `User ${input.actorUserId} is already an active member of organization ${input.organizationId}.`,
            userMessage: 'User is already an active organization member.',
          });
        }

        const acceptedInvite =
          await organizationRepo.acceptOrganizationInvitation(input, tx);

        if (!acceptedInvite) {
          throwInvitationTransitionFailed('accept', input.organizationId);
        }

        const membership = existingMembership
          ? await organizationRepo.updateMembership(
              input.organizationId,
              input.actorUserId,
              {
                organizationRole: acceptedInvite.organizationRole,
                status: 'active',
                joinedAt: new Date(),
              },
              tx,
            )
          : await organizationRepo.insertMembership(
              {
                userId: input.actorUserId,
                organizationId: input.organizationId,
                organizationRole: acceptedInvite.organizationRole,
                status: 'active',
                joinedAt: new Date(),
              },
              tx,
            );

        if (!membership) {
          throw new CoreError({
            code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization membership for ${input.actorUserId} in ${input.organizationId} disappeared during invite acceptance`,
            userMessage: 'Organization membership not found.',
          });
        }

        await syncOrThrow(accessGraphSync, {
          type: 'write',
          tuples: toOrganizationMembershipTuple(membership),
        });

        return { organizationInvite: acceptedInvite, membership };
      });
    },

    async declineOrganizationInvitation(input: {
      tokenHash: string;
      organizationId: string;
    }) {
      return db.transaction(async (tx) => {
        const loadedOrganizationInvite =
          await organizationRepo.getOrganizationInvitationByToken(input, tx);

        if (!loadedOrganizationInvite) {
          throw new CoreError({
            code: 'ORGANIZATION_INVITATION_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization invite in ${input.organizationId} not found.`,
            userMessage: 'Organization invite not found.',
          });
        }

        const organizationInvite = await normalizeOrganizationInvitationExpiry(
          loadedOrganizationInvite,
          tx,
        );

        if (organizationInvite.status === 'expired') {
          throwInvitationExpired(input.organizationId);
        }

        if (organizationInvite.status !== 'pending') {
          throwInvitationInvalidStatus({
            action: 'decline',
            organizationId: input.organizationId,
            status: organizationInvite.status,
          });
        }

        const declinedInvite =
          await organizationRepo.declineOrganizationInvitation(input, tx);

        if (!declinedInvite) {
          throwInvitationTransitionFailed('decline', input.organizationId);
        }

        return declinedInvite;
      });
    },

    async revokeOrganizationInvitation(input: {
      tokenHash: string;
      organizationId: string;
    }) {
      return db.transaction(async (tx) => {
        const loadedOrganizationInvite =
          await organizationRepo.getOrganizationInvitationByToken(input, tx);

        if (!loadedOrganizationInvite) {
          throw new CoreError({
            code: 'ORGANIZATION_INVITATION_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization invite in ${input.organizationId} not found.`,
            userMessage: 'Organization invite not found.',
          });
        }

        const organizationInvite = await normalizeOrganizationInvitationExpiry(
          loadedOrganizationInvite,
          tx,
        );

        if (organizationInvite.status !== 'pending') {
          throwInvitationInvalidStatus({
            action: 'revoke',
            organizationId: input.organizationId,
            status: organizationInvite.status,
          });
        }

        const revokedInvitation =
          await organizationRepo.revokeOrganizationInvitation(input, tx);

        if (!revokedInvitation) {
          throwInvitationTransitionFailed('revoke', input.organizationId);
        }

        return revokedInvitation;
      });
    },

    async listOrganizationInvitesForOrganizationPage(
      input: {
        organizationId: string;
        status?: OrganizationInviteStatus | undefined;
      } & SearchableCursorPaginationInput,
    ) {
      return db.transaction(async (tx) => {
        await organizationRepo.expirePendingOrganizationInvitationsForOrganization(
          { organizationId: input.organizationId },
          tx,
        );

        return organizationRepo.listOrganizationInvitesForOrganizationPage(
          input,
          tx,
        );
      });
    },

    async listOrganizationInvitesForUserPage(
      input: {
        userEmail: string;
        status?: OrganizationInviteStatus | undefined;
      } & SearchableCursorPaginationInput,
    ) {
      return db.transaction(async (tx) => {
        await organizationRepo.expirePendingOrganizationInvitationsForUser(
          { userEmail: input.userEmail },
          tx,
        );

        return organizationRepo.listOrganizationInvitesForUserPage(input, tx);
      });
    },
  };
}
export type OrganizationService = ReturnType<typeof createOrganizationService>;
