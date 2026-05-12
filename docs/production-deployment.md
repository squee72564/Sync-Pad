# Production Deployment

This document outlines how to deploy Syncpad from the production artifacts in
this repository. It avoids assuming a specific host, domain, process manager, or
web server.

## Runtime Shape

The production Compose stack provides:

* `postgres`: application database
* `permify`: authorization service
* `api`: HTTP API on container port `3001`
* `websocket`: collaboration websocket service on container port `1234`
* `web-build`: one-off Vite static build service behind the `build` profile
* `embedding`: optional worker behind the `workers` profile

The default Compose configuration binds service ports to loopback on the host:

* API: `127.0.0.1:3001`
* Collaboration websocket: `127.0.0.1:1234`
* Postgres: `127.0.0.1:${POSTGRES_PORT}`
* Permify HTTP: `127.0.0.1:3476`
* Permify gRPC: `127.0.0.1:3478`

The web app is static after `vite build`. The `web-build` service writes the
build output to `deploy/web-dist`.

## Environment Files

Create production env files from the examples:

```bash
cp .env.prod.example .env.prod
cp api/.env.prod.example api/.env.prod
cp websocket/.env.prod.example websocket/.env.prod
cp embedding/.env.prod.example embedding/.env.prod
```

`.env.prod` is for Compose interpolation and infrastructure values. The
service-specific env files are injected into only their matching service.

Inside Compose, API and websocket should address infrastructure by service name:

```bash
DATABASE_URL=postgres://syncpad:replace-me@postgres:5432/syncpad-prod
PERMIFY_HTTP_URL=http://permify:3476
PERMIFY_GRPC_URL=permify:3478
PERMIFY_GRPC_INSECURE=true
PERMIFY_REQUEST_TIMEOUT_MS=5000
```

Set `BETTER_AUTH_URL` to the public origin that browsers will use for the app,
for example `https://app.example.com`. Use the same `BETTER_AUTH_SECRET` in the
API and websocket env files.

`PERMIFY_GRPC_INSECURE=true` is the expected setting when the app talks to the
Compose-managed Permify gRPC service over the private Docker network without
TLS. Set it to `false` only when connecting to a TLS-enabled Permify gRPC
endpoint.

`PERMIFY_REQUEST_TIMEOUT_MS` keeps API requests from hanging indefinitely when
Permify accepts a connection but does not return a response.

## Build

Build the shared application image:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml build
```

## Bootstrap Infrastructure

Start Postgres and Permify:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d postgres permify
```

Run the production bootstrap:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm api pnpm infra:bootstrap:prod
```

This applies database migrations and writes the Permify authorization schema.
The Permify bootstrap prints a `PERMIFY_SCHEMA_VERSION=...` value. Set that
value in both `api/.env.prod` and `websocket/.env.prod`.

## Start Services

Start the long-running services:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d api websocket
```

Start the optional embedding worker only when it does useful work for your
deployment:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile workers up -d embedding
```

## Build Static Web Assets

Build the web app:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile build run --rm web-build
```

Publish the contents of `deploy/web-dist` with the static file server or
deployment mechanism used by your environment.

The web server should serve `index.html` as the fallback for browser routes,
because the frontend is a single-page app.

## Reverse Proxy Requirements

In production, the reverse proxy or edge router should provide the same routing
that `web/vite.config.ts` provides during development:

* `/api/*` -> API service at `127.0.0.1:3001`
* `/health` -> API service at `127.0.0.1:3001`
* `/ready` -> API service at `127.0.0.1:3001`
* `/live` -> API service at `127.0.0.1:3001`
* `/collaboration*` -> websocket service at `127.0.0.1:1234`
* all other paths -> static web assets with `index.html` fallback

The `/collaboration*` route must support websocket upgrades.

For example, a Caddy site can express those routes like this:

```caddy
example.com {
	handle /api/* {
		reverse_proxy 127.0.0.1:3001
	}

	handle /health {
		reverse_proxy 127.0.0.1:3001
	}

	handle /ready {
		reverse_proxy 127.0.0.1:3001
	}

	handle /live {
		reverse_proxy 127.0.0.1:3001
	}

	handle /collaboration* {
		reverse_proxy 127.0.0.1:1234
	}

	handle {
		root * /path/to/static/web-dist
		try_files {path} /index.html
		file_server
	}
}
```

Use equivalent routing in Nginx, Traefik, a platform ingress, or another edge
router if Caddy is not part of your deployment.

## Checks

Check container state:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Check API health through the public origin or directly through the loopback port
on the host:

```bash
curl -fsS https://app.example.com/health
curl -fsS https://app.example.com/ready
```

The `/ready` endpoint verifies database connectivity.
