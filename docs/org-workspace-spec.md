# Org and Workspace Product Spec

## Status

Draft for conceptual planning.

This document defines the product shape of `user`, `organization`, and `workspace` in Syncpad. It is intentionally scoped to these three concepts and their relationships. It does not define the data models for documents, tickets, timelines, AI jobs, or other child objects yet.

## Goal

Establish a durable foundation for:

- account onboarding
- team membership
- access boundaries
- collaboration boundaries
- future authorization modeling in Permify
- future AI context boundaries

The aim is to make `organization` and `workspace` concrete enough that later product and data-model decisions can build on them without reinterpreting what they mean.

## Decision Summary

Syncpad should keep both `organization` and `workspace`.

They are separate because they solve different problems:

- `organization` is the top-level administrative and trust boundary
- `workspace` is the focused collaboration and visibility boundary

If these two concepts are collapsed into one, Syncpad loses an important distinction:

- who belongs to the company or account at all
- which subset of people should work together in a specific context

That distinction matters for permissions, search, navigation, AI context, and future enterprise controls.

## Definitions

### User

A `user` is a person identity in Syncpad.

A user:

- signs in personally
- may belong to one or more organizations over time
- may belong to zero or more workspaces inside an organization
- acts through roles and relationships, not through global product-wide power

The user account is personal. The org and workspace are collaborative contexts the user enters.

### Organization

An `organization` is the top-level container for people, governance, and all workspaces.

It is the boundary for:

- membership in the account
- ownership and administration
- billing and plan controls
- security and identity policy
- AI policy defaults
- the list of workspaces that exist under the account

Conceptually, the organization answers:

- who is part of this company, team, or account?
- who can administer the account?
- what workspaces exist here?
- what global rules apply across all workspaces?

### Workspace

A `workspace` is a scoped working environment inside an organization.

It is the boundary for:

- focused collaboration
- localized membership and visibility
- content scope
- day-to-day navigation
- AI context and AI action scope

Conceptually, the workspace answers:

- which people are collaborating in this area?
- what information belongs together here?
- what should members of this area see by default?
- what local rules differ from the organization default?

## Why The Split Exists

The split is justified only if workspaces are real collaboration and access contexts, not just folders.

The split is useful for Syncpad because the product is meant to combine:

- structured execution
- collaborative knowledge
- AI operating over shared context

That combination benefits from two scopes:

- a broad company or account scope
- a narrower work-context scope

Without this split, one of two problems appears:

1. Everything in the company becomes visible in one flat space, which weakens privacy and focus.
2. Projects become overloaded and are forced to act like security boundaries, knowledge boundaries, and AI boundaries at the same time.

Projects are too narrow to replace workspaces cleanly. A project is a unit of work. A workspace is an environment where many projects, documents, and conversations live together.

## Product Principles

### 1. Org membership and workspace membership are not the same

Being in an organization should not imply access to every workspace.

Some workspaces may be broadly available to the organization. Others may be restricted.

### 2. Every workspace belongs to exactly one organization

There is no standalone workspace.

A workspace cannot exist without a parent organization.

### 3. Workspaces are meaningful operating contexts

A workspace must influence:

- what content a user sees
- what AI can read and act on
- which people are collaborating together
- which navigation and discovery surfaces are relevant

If a workspace does not affect these things, it is not a real entity and should not exist.

### 4. The organization is the policy root

Organization-level settings should define defaults.

Workspaces may narrow those defaults. They should not casually bypass them.

### 5. The model should support future enterprise controls without forcing them into the MVP

The first version does not need SCIM, SSO, domain verification, guest governance, or advanced compliance features.

But the shape of `organization` should leave room for them.

## Organization Spec

### Purpose

The organization is the top-level account container.

It exists so Syncpad can group:

- members
- admins
- workspaces
- global defaults
- future billing and security controls

### What an Organization Owns

At the product level, an organization owns:

- its member directory
- its administrative roles
- its invitations at org scope
- its set of workspaces
- its global settings
- its future billing and plan state
- its future audit and governance scope

### Organization Responsibilities

The organization should be responsible for:

- admitting people into the account
- designating owners and admins
- creating and archiving workspaces
- setting global defaults that workspaces inherit
- serving as the top-level boundary for enterprise administration

### Organization Roles

For the initial product shape, the essential org roles are:

- `owner`
- `admin`
- `member`

Optional future roles:

- `guest`
- `bot`
- `billing_admin`
- `security_admin`

Recommendation:

For the first product pass, only `owner`, `admin`, and `member` should shape the UX heavily. `guest` and `bot` can remain reserved concepts until their user experience is clear.

### Organization Invariants

These should be treated as product invariants:

- an organization must always have at least one owner
- a workspace cannot outlive its organization
- only organization-level admins or owners should create workspaces by default
- organization membership is the superset from which workspace membership is drawn
- a user removed from an organization loses access to all workspaces in that organization

### Organization UX Implications

The organization should appear in the product as:

- the account or team the user is currently working inside
- the place where top-level people, settings, and workspace management live
- the parent context for all workspace switching

The organization should not be overloaded as the day-to-day place where all work happens. That is the workspace’s job.

## Workspace Spec

### Purpose

A workspace is a focused operational area inside an organization.

It should correspond to a real slice of collaboration, such as:

- a department
- a functional team
- a product area
- a business unit
- a confidential operating group

Examples:

- `General`
- `Engineering`
- `Design`
- `Product`
- `Leadership`
- `Customer Success`

### What a Workspace Owns

At the product level, a workspace owns:

- its member set or access scope
- its local visibility mode
- its local settings
- its content root
- its future documents, tickets, timelines, and AI context

### Workspace Responsibilities

The workspace should be responsible for:

- concentrating related work into one visible area
- controlling local collaboration boundaries
- acting as the default scope for content browsing and creation
- defining which users and AI agents can operate over the content inside it

### Workspace Roles

For the initial product shape, the essential workspace roles are:

- `owner`
- `admin`
- `member`

Optional future roles:

- `guest`
- `bot`
- `viewer`

Recommendation:

Avoid introducing too many workspace roles in the first version. Too much early role granularity usually creates confusion before the content model is mature.

### Workspace Access Modes

Each workspace should have a discoverability and join model.

Recommended modes:

- `open`: visible to all org members, joinable by all org members
- `request`: visible to all org members, join requires approval
- `invite_only`: visible to org members, access requires invitation
- `hidden`: not discoverable by ordinary org members, access requires explicit addition

This gives the product a clean path for both open internal collaboration and restricted areas.

### Workspace Invariants

These should be treated as product invariants:

- every workspace belongs to exactly one organization
- every workspace must have at least one owner or admin-equivalent steward
- workspace membership may be narrower than org membership
- workspace policy may be stricter than org defaults, but should not casually override org-level restrictions
- a workspace is not a temporary project by default; it is an operating area that can hold many projects and documents

### Workspace UX Implications

The workspace should be where a user spends most of their time.

A workspace should likely determine:

- the default sidebar context
- the default search scope
- the default creation target for future objects
- the default AI context
- the visible set of documents, tickets, and timelines

## Onboarding and Account Creation Flow

### Fresh Account Paths

A newly created user should typically enter Syncpad in one of two ways:

1. They create a new organization.
2. They accept an invitation into an existing organization.

Those are the real top-level states.

### Path A: Self-Serve Creator

Recommended flow:

1. User creates an account.
2. User creates an organization.
3. Syncpad automatically creates one default workspace.
4. User lands inside that default workspace.

Recommendation:

Create a default workspace automatically.

Why:

- users sign up to do work, not to configure hierarchy
- the product needs an immediate place for documents, tasks, and AI context to live
- creating an org with no workspace adds friction without giving much value early on

The default workspace should not be permanently special. It should just be the initial operating area.

### Path B: Invited User

Recommended flow:

1. User receives an invite to an organization, optionally with one or more workspace assignments.
2. User accepts the invite.
3. If the user has one obvious workspace, land them there.
4. If the user has multiple workspaces, land them in the most relevant one or a workspace chooser.

### Default Workspace Recommendation

For the first organization, Syncpad should create one default workspace automatically.

Suggested naming patterns:

- same as org name
- `General`
- `HQ`

This should be configurable later, but the product should not force a blank state after organization creation.

## Membership Model

### Organization Membership

Organization membership means:

- the user belongs to the account
- the user can appear in the organization directory
- the user may be eligible for workspace access based on workspace policy

It does not necessarily mean:

- the user can access every workspace
- the user can see every document or project

### Workspace Membership

Workspace membership means:

- the user is part of that collaboration area
- the user can see the workspace in normal navigation
- the user can participate in work scoped to that workspace, according to role

Workspace membership should usually be a subset of organization membership.

### Leaving and Removal

Conceptually:

- removing a user from the organization removes access to all descendant workspaces
- removing a user from one workspace should not remove them from the organization
- some default workspaces may be mandatory for some users later, but this should not be assumed in the MVP

## Relationship Model

The core relationship graph is:

- a `user` can belong to an `organization`
- a `user` can hold a role in an `organization`
- a `workspace` belongs to an `organization`
- a `user` can belong to a `workspace`
- a `user` can hold a role in a `workspace`

This creates two levels of relationship:

- top-level account relationship
- local collaboration relationship

That is the minimum useful graph for Syncpad.

## Permify Conceptual Planning

### Role of Permify

Permify should model authorization relationships and permission checks.

It should not replace the product’s core data model.

The application database remains the source of truth for:

- the existence of users
- the existence of organizations
- the existence of workspaces
- metadata like names, slugs, timestamps, settings, and billing state

Permify should be the source of truth for answers like:

- can this user view this workspace?
- can this user manage this organization?
- can this user invite another user into this workspace?
- can this AI actor run in this workspace?

### Conceptual Entity Set

For the current planning scope, the minimum useful Permify entity set is:

- `user`
- `organization`
- `workspace`

That matches the current stage of product design and avoids premature modeling.

### Recommended Conceptual Relations

At the organization level:

- `owner`
- `admin`
- `member`

At the workspace level:

- `parent -> organization`
- `owner`
- `admin`
- `member`

Optional later relations:

- `guest`
- `bot`

### Recommended Conceptual Permissions

At the organization level, the important conceptual permissions are:

- `manage_org`
- `invite_to_org`
- `create_workspace`
- `view_org`

At the workspace level, the important conceptual permissions are:

- `view_workspace`
- `manage_workspace`
- `invite_to_workspace`
- `join_workspace`
- `work_in_workspace`
- `run_ai_in_workspace`

These names do not need to be final. They exist to force clarity about behavior.

### Inheritance Model

The recommended conceptual inheritance is:

- organization-level authority can flow downward into workspaces for management and governance actions
- workspace-level membership does not automatically flow upward into organization-level authority

Examples:

- an org owner should be able to manage any workspace in that org
- a workspace member should not automatically gain org admin powers
- a workspace can inherit some management permissions from its parent org

### Access Semantics

Recommended semantics:

- `view_workspace` may come from explicit workspace membership, or from an org-wide access mode if the workspace is open
- `manage_workspace` should come from workspace-level admins or owners and also org-level owners or admins
- `create_workspace` should come from org-level owners or admins, not ordinary org members by default

This is an important adjustment from the earlier rough bootstrap schema direction: workspace creation should be treated as an org administration capability unless the product explicitly chooses a looser model.

### Tuple Examples

Conceptually, Permify relationships would look like:

- `organization:acme#owner@user:alice`
- `organization:acme#member@user:bob`
- `workspace:engineering#parent@organization:acme`
- `workspace:engineering#admin@user:alice`
- `workspace:engineering#member@user:bob`

This gives Syncpad a clean graph:

- who belongs to the account
- which workspace belongs to which org
- who has local authority inside each workspace

### Recommended Guardrails For The First Permify Model

- do not model child entities yet
- do not overfit roles before the UX is proven
- do not rely on guest or bot behavior before those product concepts are clear
- do not make workspace membership implicit unless the workspace access mode requires it
- do not let authorization modeling redefine the product ontology

The product model should lead. Permify should encode it.

## Open Decisions

These decisions are still intentionally open:

- should users be able to belong to multiple organizations in the first release, or only later?
- should every org member automatically be added to one default workspace?
- should workspace admins exist separately from workspace owners in the first version?
- should external guests exist at org scope, workspace scope, or only later?
- should bots be modeled as users with a special role, or as a separate actor type later?

None of these block the current conceptual split.

## Recommended MVP Position

For the first product pass:

- keep `user`, `organization`, and `workspace`
- create a default workspace when a new org is created
- use `owner`, `admin`, and `member` as the primary roles
- treat organization admins or owners as the default workspace creators
- allow workspaces to have explicit access modes
- make workspace the main day-to-day context in the UX

This is enough structure to support future tickets, documents, timelines, and AI without prematurely modeling all of them now.

## Sources and Reference Points

The conceptual direction in this spec is informed by patterns used in mature products:

- Slack Enterprise Grid separates organization-level governance from workspace-level collaboration and access modes: https://slack.com/resources/why-use-slack/slack-enterprise-grid and https://slack.com/help/articles/115001915507-Manage-workspace-access-in-an-Enterprise-organisation
- Notion distinguishes organization owners, workspace roles, and teamspace-style scoped collaboration: https://www.notion.com/help/whos-who-in-a-workspace and https://www.notion.com/help/intro-to-teamspaces
- Atlassian uses organization as a centralized administrative container above product/site scopes: https://support.atlassian.com/organization-administration/docs/what-is-an-atlassian-organization/ and https://support.atlassian.com/statuspage/docs/understand-atlassian-sites-and-organizations/
- Asana’s distinction between organization access and workspace access is another useful reference point: https://help.asana.com/s/article/permissions-overview
- Permify’s modeling guidance supports parent-child entities, role relations, and inherited permissions in a ReBAC structure: https://docs.permify.co/getting-started/modeling and https://docs.permify.co/getting-started/examples/notion
