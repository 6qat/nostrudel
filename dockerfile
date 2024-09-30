# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY ./package*.json .
COPY ./pnpm-lock.yaml .

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

ENV VITE_COMMIT_HASH=""
ENV VITE_APP_VERSION="Custom"

COPY tsconfig.json .
COPY index.html .
COPY public ./public
COPY src ./src
RUN pnpm build

FROM nginx:stable-alpine-slim AS main

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# setup entrypoint
ADD ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod a+x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
