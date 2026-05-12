FROM node:24-bookworm-slim

WORKDIR /app

ENV HUSKY=0

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig*.json ./
COPY api/package.json ./api/package.json
COPY embedding/package.json ./embedding/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/errors/package.json ./packages/errors/package.json
COPY packages/permify/package.json ./packages/permify/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY web/package.json ./web/package.json
COPY websocket/package.json ./websocket/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV=production

EXPOSE 3001 1234

CMD ["pnpm", "--filter", "@syncpad/api", "start"]
