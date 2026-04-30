# Syncpad

Syncpad is in early development.

Syncpad is an AI-native collaborative workspace for teams.

It combines structured project tracking, real-time collaborative documents, and organization-level knowledge into a single system where both humans and AI can operate over the same context.

## Quick start

```bash
cp .env.example .env
cp api/.env.example api/.env
cp api/.env.test.example api/.env.test
cp web/.env.example web/.env
cp embedding/.env.example embedding/.env
pnpm install
docker compose -f docker-compose.dev.yml up -d
pnpm infra:bootstrap:dev
pnpm dev
```

`pnpm infra:bootstrap:dev` applies the development database migrations and writes the Permify authorization schema from `infra/permify/schema.syncpad.perm`.

The Permify bootstrap prints a `PERMIFY_SCHEMA_VERSION=...` value. Add that value to `api/.env`, then restart `pnpm dev` so the API uses the schema version for authorization writes and checks.

For test infrastructure, run:

```bash
pnpm infra:bootstrap:test
```

## Overview

Syncpad is designed to unify how teams plan, document, and execute work.

Instead of separating tasks, documents, and knowledge across different tools, Syncpad brings them together into a shared workspace where everything is connected, searchable, and context-aware.

Teams can use Syncpad to:

* Plan and track work
* Collaborate on documents in real time
* Capture and organize team knowledge
* Assign ownership and track progress
* Interact with AI that understands their workspace

## Core Ideas

### Structured Collaboration

Syncpad combines the flexibility of document-based tools with the clarity of structured systems.

Work is organized into things such as:

* Organizations
* Workspaces
* Documents
* TDB

These elements are connected, allowing teams to move seamlessly between planning, writing, and execution.

### Real-Time Workspace

Syncpad supports real-time collaboration across shared workspaces.

Teams can edit, comment, and collaborate simultaneously, keeping work synchronized and up to date.

### Connected Knowledge

Workspaces within an organization are not isolated, they are part of a connected system.

This allows teams to:

* Link related work
* Maintain context across projects
* Build a shared knowledge base
* Navigate information without fragmentation

## AI-Native Design

AI is a native feature of Syncpad.

The system is designed so AI can understand and work with the same data that teams use every day.

This enables workflows such as:

* Asking questions about organizations, workspaces, or the information contained within
* Summarizing work and decisions
* Finding relevant information across the workspace
* Generating follow-up tasks
* Drafting updates and reports
* Identifying blockers and gaps

Over time, Syncpad aims to support AI agents that can take actions on behalf of users, such as creating, updating, and organizing information, all while respecting workspace context and permissions.

## Permissions and Access

Access controls in Syncpad is designed to be fine-grained and consistent, leveraging [Permify](https://github.com/permify/permify): an authorization service inspired by [Google Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).

Users and AI Agents have configurable roles and access controls, and are only able to interact with information that is allowed.

## Product Vision

Modern teams use separate tools for:

* Task tracking
* Documentation
* Knowledge management
* AI assistance

Syncpad brings these together into a single system.

The goal is to create a workspace where:

* Work is structured and trackable
* Knowledge is connected and accessible
* Collaboration happens in real time
* AI understands context and assists meaningfully
* Permissions are enforced consistently

## Positioning

Syncpad sits at the intersection of:

* Structured execution tools like Linear
* Flexible knowledge systems like Notion
* AI-powered assistants and agents

Rather than focusing on one of these areas, Syncpad is designed to unify them into a single, cohesive workspace.
