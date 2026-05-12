# Syncpad

Syncpad is in early development.

Syncpad is an AI-native collaborative workspace for teams.

It combines structured project tracking, real-time collaborative documents, and organization-level knowledge into a single system where both humans and AI can operate over the same context.

## Development Quick start

```bash
# Copy example environment variables, then change to your own values
cp .env.example .env
cp api/.env.example api/.env
cp api/.env.test.example api/.env.test
cp web/.env.example web/.env
cp embedding/.env.example embedding/.env

# Install dependencies
pnpm install

# Start docker compose
docker compose -f docker-compose.dev.yml up -d

# Bootstrap database and permify
pnpm infra:bootstrap:dev

# Optionally seed with user and mock data
pnpm db:seed:dev --email `EMAIL` --password `PASSWORD` --name `NAME` # Seed database with user and mock values if desired

# Run services
pnpm dev
```

`pnpm infra:bootstrap:dev` applies the development database migrations and writes the Permify authorization schema from `infra/permify/schema.syncpad.perm`.

The Permify bootstrap prints a `PERMIFY_SCHEMA_VERSION=...` value. Add that value to `api/.env`, then restart `pnpm dev` so the API uses the schema version for authorization writes and checks.

To boostrap test infrastructure and run tests make sure to do:

```bash
pnpm infra:bootstrap:test
```

## Production Setup

This repository includes a production Docker Compose file, a shared application
image, scoped production environment examples, and production bootstrap scripts.

For a fuller deployment outline, see [Production deployment](./docs/production-deployment.md).

Copy the production examples and fill in real values for your environment:

```bash
cp .env.prod.example .env.prod
cp api/.env.prod.example api/.env.prod
cp websocket/.env.prod.example websocket/.env.prod
cp embedding/.env.prod.example embedding/.env.prod
```

`.env.prod` is used by Compose for Postgres and Permify settings. The
service-scoped files are injected only into their matching processes.

Use the same `BETTER_AUTH_SECRET` in both `api/.env.prod` and
`websocket/.env.prod`. Set `BETTER_AUTH_URL` to the public origin where the app
is served.

Build the shared application image:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml build
```

Start Postgres and Permify:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d postgres permify
```

Apply database migrations and write the Permify authorization schema. The
production scripts use the environment injected into the container by Compose:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm api pnpm infra:bootstrap:prod
```

The Permify bootstrap prints a `PERMIFY_SCHEMA_VERSION=...` value. Set that
value in both `api/.env.prod` and `websocket/.env.prod`, then start the app
services:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d api websocket
```

Build the static Vite app into `deploy/web-dist`:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile build run --rm web-build
```

The embedding service is currently optional and is behind the `workers` profile:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile workers up -d embedding
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
