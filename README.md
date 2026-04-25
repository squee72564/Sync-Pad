# SyncPad

Monorepo bootstrap for the API, web app, and embedding worker.

## Quick start

```bash
cp .env.example .env
cp api/.env.example api/.env
cp web/.env.example web/.env
cp embedding/.env.example embedding/.env
docker compose -f docker-compose.dev.yml up -d
pnpm install
pnpm dev
```
