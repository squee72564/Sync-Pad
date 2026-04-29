# Syncpad

Syncpad is an AI-native collaborative workspace for teams.

It combines structured project tracking, real-time collaborative documents, and organization-level knowledge into a single system where both humans and AI can operate over the same context.

## Overview

Syncpad is designed to unify how teams plan, document, and execute work.

Instead of separating tasks, documents, and knowledge across different tools, Syncpad brings them together into a shared workspace where everything is connected, searchable, and context-aware.

Teams can use Syncpad to:

* Plan and track work (tasks, projects, timelines)
* Collaborate on documents in real time
* Capture and organize team knowledge
* Assign ownership and track progress
* Interact with AI that understands their workspace

## Core Ideas

### Structured Collaboration

Syncpad combines the flexibility of document-based tools with the clarity of structured systems.

Work is organized into things such as:

* Organizations
* Tasks and assignments
* Documents and notes
* Timelines and milestones

These elements are connected, allowing teams to move seamlessly between planning, writing, and execution.

### Real-Time Workspace

Syncpad supports real-time collaboration across documents and shared workspaces.

Teams can edit, comment, and collaborate simultaneously, keeping work synchronized and up to date.

### Connected Knowledge

Documents, tasks, and projects are not isolated—they are part of a connected system.

This allows teams to:

* Link related work
* Maintain context across projects
* Build a shared knowledge base
* Navigate information without fragmentation

## AI-Native Design

AI is a core part of Syncpad, not an add-on.

The system is designed so AI can understand and work with the same data that teams use every day.

This enables workflows such as:

* Asking questions about projects, tasks, or documents
* Summarizing work and decisions
* Finding relevant information across the workspace
* Generating follow-up tasks from notes
* Drafting updates and reports
* Identifying blockers and gaps

Over time, Syncpad aims to support AI agents that can take actions on behalf of users, such as creating tasks, updating progress, and organizing information—while respecting workspace context and permissions.

## Organizations and Teams

Syncpad is built around organizations.

Organizations provide a shared space for:

* Members and collaboration
* Projects and work tracking
* Documents and knowledge
* Permissions and access control

This structure allows teams to collaborate in a way that reflects real-world boundaries and responsibilities.

## Permissions and Access

Access in Syncpad is designed to be fine-grained and consistent.

Users only see and interact with the information they are allowed to access. This applies across:

* Projects
* Tasks
* Documents
* AI interactions

AI assistance respects the same boundaries as users, ensuring that information remains secure and appropriately scoped.

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

## Current Status

Syncpad is in early development.

The current focus is defining the core workspace model, collaboration experience, and AI-native workflows.

## Long-Term Direction

Syncpad aims to become a shared operating layer for teams.

In this system:

* Humans collaborate through structured work and documents
* AI understands and reasons over workspace data
* Agents can assist and eventually act within defined boundaries

The long-term vision is a workspace where teams and AI work together over the same system, with shared context, clear structure, and consistent access control.

## Quick start

```bash
cp .env.example .env
cp api/.env.example api/.env
cp web/.env.example web/.env
cp embedding/.env.example embedding/.env
docker compose -f docker-compose.dev.yml up -d
pnpm db:bootstrap:test
pnpm install
pnpm dev
```
