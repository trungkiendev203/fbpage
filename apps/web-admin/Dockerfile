FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web-admin ./apps/web-admin
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter web-admin run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web-admin ./apps/web-admin
EXPOSE 3000
CMD ["node", "apps/web-admin/node_modules/next/dist/bin/next", "start", "apps/web-admin"]
