FROM node:22-bookworm-slim AS builder

WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production \
    PORT=8080 \
    LEARNERS_FILE=/app/config/learners.json \
    DATA_DIRECTORY=/data

COPY --from=builder /app /app
RUN chmod +x /app/docker/entrypoint.sh

VOLUME ["/data"]
EXPOSE 8080

ENTRYPOINT ["/app/docker/entrypoint.sh"]
