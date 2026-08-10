FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker-engine ./apps/worker-engine
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter db-prisma run build
RUN pnpm --filter worker-engine run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker-engine ./apps/worker-engine
CMD ["node", "apps/worker-engine/dist/index.js"]
