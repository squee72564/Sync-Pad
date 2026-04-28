# Permify Tuple Sync Mapping

This document maps database events to the Permify relationship tuples that should be written or deleted.

## Core Rules

- Only `organization_membership.status = active` should produce organization role tuples.
- `invited` and `suspended` organization memberships should not grant normal access tuples.
- `workspace_membership` rows should always produce workspace role tuples because the database already enforces org-consistent membership.
- Org `manage` in Permify is a governance override, not implicit workspace membership.
- Keep a reconciliation path that can rebuild Permify tuples from database state if the auth graph ever drifts.

## Tuple Sync Table

| DB event | Condition | Permify tuple writes | Permify tuple deletes |
| --- | --- | --- | --- |
| `organization` created | always | none by default | none |
| `organization_membership` inserted | `status = active`, role = `owner` | `organization:<orgId>#owner@user:<userId>` | none |
| `organization_membership` inserted | `status = active`, role = `admin` | `organization:<orgId>#admin@user:<userId>` | none |
| `organization_membership` inserted | `status = active`, role = `member` | `organization:<orgId>#member@user:<userId>` | none |
| `organization_membership` inserted | `status = active`, role = `guest` | `organization:<orgId>#guest@user:<userId>` | none |
| `organization_membership` inserted | `status = invited` or `suspended` | none | none |
| `organization_membership` updated | role changed, still `active` | write new org-role tuple | delete old org-role tuple |
| `organization_membership` updated | `active -> invited` | none | delete current org-role tuple |
| `organization_membership` updated | `active -> suspended` | none | delete current org-role tuple |
| `organization_membership` updated | `invited/suspended -> active` | write tuple for current role | none |
| `organization_membership` deleted | always | none | delete current org-role tuple |
| `workspace` created | always | `workspace:<workspaceId>#parent@organization:<orgId>` | none |
| `workspace` updated | `organization_id` changes, if ever allowed | write new parent tuple | delete old parent tuple |
| `workspace` deleted | always | none | delete `workspace#parent` tuple and any workspace role tuples if not already cleaned by the delete flow |
| `workspace_membership` inserted | role = `manager` | `workspace:<workspaceId>#manager@user:<userId>` | none |
| `workspace_membership` inserted | role = `editor` | `workspace:<workspaceId>#editor@user:<userId>` | none |
| `workspace_membership` inserted | role = `commenter` | `workspace:<workspaceId>#commenter@user:<userId>` | none |
| `workspace_membership` inserted | role = `viewer` | `workspace:<workspaceId>#viewer@user:<userId>` | none |
| `workspace_membership` updated | role changed | write new workspace-role tuple | delete old workspace-role tuple |
| `workspace_membership` deleted | always | none | delete current workspace-role tuple |
