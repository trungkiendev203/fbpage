FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api-server ./apps/api-server
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter api-server... run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api-server ./apps/api-server
EXPOSE 4000
CMD ["node", "apps/api-server/dist/index.js"]
