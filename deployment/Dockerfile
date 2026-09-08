ARG BASE_IMAGE=nbsbayu/insurance-cms-base:latest
FROM ${BASE_IMAGE} AS builder

ARG APP_VERSION=0.1.0
ARG GIT_HASH=dev

WORKDIR /src

ENV NEXT_TELEMETRY_DISABLED=1
ENV APP_VERSION=${APP_VERSION}
ENV GIT_HASH=${GIT_HASH}

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache libc6-compat \
    && addgroup -S -g 1001 app \
    && adduser -S -u 1001 app -G app

COPY --from=builder /src/public ./public
COPY --from=builder --chown=app:app /src/.next/standalone ./
COPY --from=builder --chown=app:app /src/.next/static ./.next/static

USER app

EXPOSE 3000

CMD ["node", "server.js"]
